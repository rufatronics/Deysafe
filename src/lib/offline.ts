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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  await db.put(MODEL_STORE_NAME, blob, name);
  return blob;
}

export async function getCachedModel(name: string): Promise<Blob | null> {
  const db = await getDB();
  return db.get(MODEL_STORE_NAME, name);
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
