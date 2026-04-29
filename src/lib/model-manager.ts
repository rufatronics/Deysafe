import { CreateWebWorkerMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";
import { getCachedModel } from './offline';

// Using global tf and tflite from CDN to optimize bundle size and RAM
declare global {
  interface Window {
    tflite: any;
    tf: any;
  }
}

const tf = typeof window !== 'undefined' ? window.tf : null;

class ModelManager {
  private static instance: ModelManager;
  private currentModelType: 'vision' | 'chat' | null = null;
  private visionModel: any | null = null;
  private chatEngine: MLCEngineInterface | null = null;
  private tfliteInitialized = false;

  private constructor() {
    this.initTFLite();
  }

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  /**
   * RAM ISOLATION: Wipe everything clean before new loads.
   */
  public async cleanup(): Promise<void> {
    console.log('[ModelManager] RAM Isolation: Cleaning up...');
    
    // 1. Dispose Vision Model
    if (this.visionModel) {
      this.visionModel = null;
    }

    // 2. Unload Chat Engine
    if (this.chatEngine) {
      try {
        await this.chatEngine.unload();
      } catch (e) {
        console.warn('Chat engine unload failed', e);
      }
      this.chatEngine = null;
    }

    // 3. Clear TFJS Tensors and Internal Cache
    tf.disposeVariables();
    const numTensors = tf.memory().numTensors;
    if (numTensors > 0) {
      tf.dispose(); 
    }

    // 4. Force texture release (Hack for low-end GPUs)
    const gl = document.createElement('canvas').getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }

    this.currentModelType = null;
    console.log(`[ModelManager] Cleanup complete. Tensors left: ${tf.memory().numTensors}`);
  }

  /**
   * CRITICAL ENGINE CONFIG: Verify _malloc before resolving.
   */
  private async initTFLite(retries = 10): Promise<void> {
    if (this.tfliteInitialized) return;

    for (let i = 0; i < retries; i++) {
      try {
        if (typeof window !== 'undefined' && window.tflite) {
          // Set path
          if (window.tflite.setWasmPath) {
            window.tflite.setWasmPath('/tflite/');
          }

          // Check for internal Module and _malloc
          // This is the specific fix for "Cannot read properties of undefined (reading '_malloc')"
          const isReady = await this.waitForWasm(window.tflite);
          
          if (isReady) {
            this.tfliteInitialized = true;
            console.log('[ModelManager] TFLite WASM Engine Ready (_malloc detected)');
            return;
          }
        }
      } catch (e) {
        console.warn(`[ModelManager] Wasm Init attempt ${i+1} failed`, e);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('TFLite WASM loader timed out. Check /public/tflite/ folder.');
  }

  private async waitForWasm(tflite: any): Promise<boolean> {
    // We try to access the internal module if possible, or just wait for a test load/eval
    // The alpha.10 exposes several internals. 
    return new Promise((resolve) => {
      const check = () => {
        try {
          // In some versions, it's tflite._module or a similar getter
          // If we can't find it, we try to see if a simple dummy call works
          if (tflite && (tflite._module && tflite._module._malloc || tflite.loadTFLiteModel)) {
             resolve(true);
             return;
          }
        } catch (e) {}
        setTimeout(check, 200);
      };
      check();
      // Timeout after 5s
      setTimeout(() => resolve(false), 5000);
    });
  }

  private async checkSignature(buffer: ArrayBuffer): Promise<boolean> {
    if (!buffer || buffer.byteLength < 8) return false;
    const view = new Uint8Array(buffer, 4, 4);
    const signature = String.fromCharCode(...view);
    return signature === 'TFL3';
  }

  public async loadVisionModel(modelId: string, fallbackUrl: string): Promise<any> {
    await this.cleanup();
    
    console.log(`[ModelManager] Preparing ${modelId}...`);
    
    if (!this.tfliteInitialized) {
      await this.initTFLite();
    }

    if (!window.tflite) {
       throw new Error('TFLite runtime not loaded.');
    }

    let modelBuffer: ArrayBuffer | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        if (!modelBuffer) {
          const cachedBlob = await getCachedModel(modelId);
          if (cachedBlob) {
            console.log(`[ModelManager] Load from IndexedDB: ${modelId}`);
            modelBuffer = await cachedBlob.arrayBuffer();
          } else {
            console.log(`[ModelManager] Downloading to cache: ${modelId}`);
            const response = await fetch(fallbackUrl);
            modelBuffer = await response.arrayBuffer();
          }
        }

        if (!(await this.checkSignature(modelBuffer))) {
          throw new Error('Invalid TFLite model data (Signature mismatch)');
        }

        this.visionModel = await window.tflite.loadTFLiteModel(modelBuffer);
        console.log(`[ModelManager] ${modelId} activated.`);
        break; 

      } catch (err: any) {
        attempts++;
        console.error(`[ModelManager] Load failed (Attempt ${attempts}):`, err.message);
        
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
    await this.cleanup();

    console.log(`[ModelManager] Loading Chat: ${modelId}`);
    this.chatEngine = await CreateWebWorkerMLCEngine(
      new Worker(new URL('./chat-worker.ts', import.meta.url), { type: 'module' }),
      modelId,
      { 
        initProgressCallback: onProgress,
        appConfig: {
          context_window_size: 512
        }
      } as any
    );
    
    this.currentModelType = 'chat';
    return this.chatEngine;
  }

  public async predictVision(input: ImageData | HTMLVideoElement | HTMLCanvasElement): Promise<any> {
    if (!this.visionModel) {
      throw new Error('No vision model loaded.');
    }

    // Convert input to tensor
    // Most TFLite classification models expect 224x224x3 or similar
    // we use tf.browser.fromPixels and resize
    const tensor = tf.tidy(() => {
      let img = tf.browser.fromPixels(input);
      // Resize to model expected input - we try to infer from model or default to 224
      img = tf.image.resizeBilinear(img, [224, 224]);
      // Normalize if needed (most TFLite models expect 0-255 or 0-1)
      // For now we pass as is, or normalize to 0-1 if it's float model
      return img.expandDims(0);
    });

    try {
      const output = await this.visionModel.predict(tensor);
      return output;
    } finally {
      tensor.dispose();
    }
  }

  public getChatEngine(): MLCEngineInterface | null {
    return this.chatEngine;
  }

  public async disposeCurrent(): Promise<void> {
    await this.cleanup();
  }
}

export const modelManager = ModelManager.getInstance();
