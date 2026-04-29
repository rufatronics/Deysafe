import * as tf from '@tensorflow/tfjs';
import { CreateWebWorkerMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";
import { getCachedModel } from './offline';

// Global TFLite from /public/tflite/
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
    console.log('[ModelManager] RAM Isolation: Kill Switch Triggered');
    
    // 1. Kill Vision Model
    this.visionModel = null;

    // 2. Unload Chat Engine (Critical for RAM release)
    if (this.chatEngine) {
      try {
        await this.chatEngine.unload();
      } catch (e) {
        console.warn('[ModelManager] Unload fail:', e);
      }
      this.chatEngine = null;
    }

    // 3. Force TFJS Disposal
    try {
      tf.disposeVariables();
      // Scrutinize memory
      if (tf.memory().numTensors > 0) {
        // Fallback for leaked tensors
        (tf as any).engine().startScope();
        (tf as any).engine().endScope();
      }
    } catch (e) {
      console.warn('[ModelManager] TF cleanup error:', e);
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

  private async initTFLite(retries = 10): Promise<void> {
    if (this.tfliteInitialized) return;

    for (let i = 0; i < retries; i++) {
      try {
        if (typeof window !== 'undefined' && window.tflite) {
          window.tflite.setWasmPath('/tflite/');
          const isReady = await this.waitForWasm(window.tflite);
          if (isReady) {
            this.tfliteInitialized = true;
            return;
          }
        }
      } catch (e) {
        console.warn(`[ModelManager] Wasm Init attempt ${i+1} failed`, e);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  private async waitForWasm(tfliteObj: any): Promise<boolean> {
    return new Promise((resolve) => {
      const check = () => {
        try {
          if (tfliteObj && (tfliteObj.loadTFLiteModel)) {
             resolve(true);
             return;
          }
        } catch (e) {}
        setTimeout(check, 200);
      };
      check();
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
    
    if (!this.tfliteInitialized) {
      await this.initTFLite();
    }

    if (!window.tflite) throw new Error('TFLite runtime not found.');

    let modelBuffer: ArrayBuffer | null = null;
    const cachedBlob = await getCachedModel(modelId);
    if (cachedBlob) {
      modelBuffer = await cachedBlob.arrayBuffer();
    } else {
      const response = await fetch(fallbackUrl);
      modelBuffer = await response.arrayBuffer();
    }

    if (!(await this.checkSignature(modelBuffer))) {
      throw new Error('Invalid TFLite model data');
    }

    this.visionModel = await window.tflite.loadTFLiteModel(modelBuffer);
    this.currentModelType = 'vision';
    return this.visionModel;
  }

  public async loadChatEngine(modelId: string, onProgress?: (p: any) => void): Promise<MLCEngineInterface> {
    await this.cleanup();

    console.log(`[ModelManager] Loading SmolLM2 (CPU/WASM) for 2GB RAM: ${modelId}`);
    
    this.chatEngine = await CreateWebWorkerMLCEngine(
      new Worker(new URL('./chat-worker.ts', import.meta.url), { type: 'module' }),
      modelId,
      { 
        initProgressCallback: onProgress,
        appConfig: {
          model_list: [
            {
              model: "https://huggingface.co/mlc-ai/SmolLM2-135M-Instruct-q4f16_1-MLC/resolve/main/",
              model_id: modelId,
              model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-dist/SmolLM2-135M-Instruct-q4f16_1-MLC-wasm.wasm",
              low_resource_required: true,
            }
          ]
        },
        chatConfig: {
          context_window_size: 256,
        },
        device_type: "wasm" // Force CPU mode for Tecno Spark 4 compatibility
      } as any
    );
    
    this.currentModelType = 'chat';
    return this.chatEngine;
  }

  public async predictVision(input: ImageData | HTMLVideoElement | HTMLCanvasElement): Promise<any> {
    if (!this.visionModel) throw new Error('No vision model loaded.');

    const tensor = tf.tidy(() => {
      let img = tf.browser.fromPixels(input);
      img = tf.image.resizeBilinear(img, [224, 224]);
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


