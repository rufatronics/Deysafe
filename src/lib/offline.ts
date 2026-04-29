import { openDB } from 'idb';

const MODEL_DB_NAME = 'model-cache';
const MODEL_STORE_NAME = 'models';

async function getDB() {
  return openDB(MODEL_DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(MODEL_STORE_NAME);
    },
  });
}

export async function cacheModel(name: string, url: string) {
  const db = await getDB();
  console.log(`[Offline] Fetching asset: ${name} from ${url}`);
  
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
       console.error(`[Offline] 404/Error at URL: ${url}`);
       throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    const blob = await response.blob();
    console.log(`[Offline] Saving ${name} (${blob.size} bytes) to IndexedDB`);
    await db.put(MODEL_STORE_NAME, blob, name);
    return blob;
  } catch (fetchErr: any) {
    console.error(`[Offline] Critical Fetch Failure for ${name} at ${url}`);
    if (fetchErr.message && fetchErr.message.includes('Failed to fetch')) {
      throw new Error("Connection Blocked: Your browser or network is blocking the AI download. Check your data or VPN.");
    }
    throw fetchErr;
  }
}

export async function getCachedModel(name: string): Promise<Blob | null> {
  const db = await getDB();
  return db.get(MODEL_STORE_NAME, name);
}

export async function listCachedModels(): Promise<string[]> {
  const db = await getDB();
  return db.getAllKeys(MODEL_STORE_NAME) as Promise<string[]>;
}

export async function deleteCachedModel(name: string) {
  const db = await getDB();
  await db.delete(MODEL_STORE_NAME, name);
}

// Service worker interaction
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }
}
