import * as tf from '@tensorflow/tfjs';
import { CreateWebWorkerMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";
import { getCachedModel, deleteCachedModel } from './offline';

// Using global tflite from CDN
declare global {
  interface Window {
    tflite: any;
  }
}

class ModelManager {
  private static instance: ModelManager;
  private currentModelType: 'vision' | 'chat' | null = null;
  private visionModel: any | null = null;
  private chatEngine: MLCEngineInterface | null = null;

  private constructor() {
    this.initTFLite();
  }

  private tfliteInitialized = false;

  private async initTFLite(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        if (typeof window !== 'undefined' && window.tflite) {
          // Path is already set in index.html, but we ensure it's locked in
          if (window.tflite.setWasmPath) {
            window.tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/');
          }
          
          // Wait for the library to be truly "ready" (some versions have an internal state)
          await new Promise(r => setTimeout(r, 1000 + (i * 1000)));
          this.tfliteInitialized = true;
          return;
        }
      } catch (e) {
        console.warn(`[ModelManager] Init attempt ${i+1} failed`, e);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  private async checkSignature(buffer: ArrayBuffer): Promise<boolean> {
    if (!buffer || buffer.byteLength < 8) return false;
    const view = new Uint8Array(buffer, 4, 4);
    const signature = String.fromCharCode(...view);
    return signature === 'TFL3';
  }

  public async loadVisionModel(modelId: string, fallbackUrl: string): Promise<any> {
    await this.disposeCurrent();
    
    console.log(`[ModelManager] Initializing ${modelId}...`);
    
    // Ensure initialized
    if (!this.tfliteInitialized) {
      await this.initTFLite();
    }

    if (!window.tflite) {
       throw new Error('TFLite runtime not loaded. Please refresh or check network.');
    }

    let modelBuffer: ArrayBuffer | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // 1. Get Buffer
        if (!modelBuffer) {
          const cachedBlob = await getCachedModel(modelId);
          if (cachedBlob) {
            console.log(`[ModelManager] Loading from cache: ${modelId}`);
            modelBuffer = await cachedBlob.arrayBuffer();
          } else {
            console.log(`[ModelManager] Downloading: ${modelId}`);
            const response = await fetch(fallbackUrl);
            modelBuffer = await response.arrayBuffer();
          }
        }

        // 2. Validate Signature
        if (!(await this.checkSignature(modelBuffer))) {
          const text = new TextDecoder().decode(modelBuffer.slice(0, 100));
          if (text.includes('git-lfs')) {
            throw new Error('Download failed: Git LFS pointer detected.');
          }
          throw new Error('Invalid TFLite model data (Signature mismatch)');
        }

        // 3. Load Model
        // This is where _malloc usually fails if WASM isn't ready
        this.visionModel = await window.tflite.loadTFLiteModel(modelBuffer);
        console.log(`[ModelManager] ${modelId} activated.`);
        break; 

      } catch (err: any) {
        attempts++;
        const isWasmError = err.message && (err.message.includes('_malloc') || err.message.includes('undefined'));
        
        console.error(`[ModelManager] Load attempt ${attempts} failed:`, err.message);
        
        if (isWasmError) {
          console.warn('[ModelManager] WASM Memory Error. Attempting reset...');
          this.tfliteInitialized = false;
          await this.initTFLite(1); 
          await new Promise(r => setTimeout(r, 2000));
        } else {
          // If it's not a WASM error, it might be a bad cache
          await deleteCachedModel(modelId);
          modelBuffer = null;
        }

        if (attempts >= maxAttempts) {
          throw new Error(`Failed to load ${modelId}. ${err.message}`);
        }
        
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    this.currentModelType = 'vision';
    return this.visionModel;
  }

  public async loadChatEngine(modelId: string, onProgress?: (p: any) => void): Promise<MLCEngineInterface> {
    await this.disposeCurrent();

    console.log(`Loading Chat Engine: ${modelId}`);
    // WebLLM uses WebGPU if available, otherwise Wasm
    this.chatEngine = await CreateWebWorkerMLCEngine(
      new Worker(new URL('./chat-worker.ts', import.meta.url), { type: 'module' }),
      modelId,
      { initProgressCallback: onProgress }
    );
    
    this.currentModelType = 'chat';
    return this.chatEngine;
  }

  public async disposeCurrent(): Promise<void> {
    if (this.currentModelType === 'vision' && this.visionModel) {
      console.log('Disposing Vision Model');
      // TFLite models usually need to be cleared from Wasm memory
      // Unfortunately tfjs-tflite doesn't have a simple .dispose() on the model itself 
      // but we can try to trigger GC or rely on the wrapper
      this.visionModel = null;
    }

    if (this.currentModelType === 'chat' && this.chatEngine) {
      console.log('Disposing Chat Engine');
      await this.chatEngine.unload();
      this.chatEngine = null;
    }

    this.currentModelType = null;
    // Explicitly call TFJS dispose if used
    tf.disposeVariables();
  }
}

export const modelManager = ModelManager.getInstance();
