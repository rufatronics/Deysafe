# DeySafe — High-performance on-device AI for low-RAM devices

DeySafe is a small, fast web AI suite optimized to run on low-RAM devices (target: ~2GB). It combines on-device TFLite vision models and an MLC-based WASM/worker chat engine, with offline model caching in IndexedDB and Service Worker support so the app can run reliably on constrained phones and intermittent networks.

- Built for mobile-first, privacy-friendly inference (models run in the browser).
- Focus on RAM isolation and model lifecycle (see src/lib/model-manager.ts).
- Offline-first: big model files stored in IndexedDB (not the HTTP cache).

---

Quick links
- Live AI Studio preview (if provided in your environment): https://ai.studio/apps/6375ef05-ffc4-437e-8a36-d200fab585b4
- Repo: https://github.com/rufatronics/Deysafe

Features
- Vision inference via TFLite Web (public/tflite/*.wasm + .js)
- Chat LLM via @mlc-ai/web-llm running inside a Web Worker
- Model caching with IndexedDB (idb)
- Service Worker app shell + offline fetch strategy
- Tailwind + React + Vite; small, focused UI

Tech / Stack
- Languages: TypeScript + React
- Runtime / Bundler: Vite (ES modules)
- Key libraries:
  - @tensorflow/tfjs & @tensorflow/tfjs-tflite (vision)
  - @mlc-ai/web-llm (chat engine, worker)
  - idb (IndexedDB model cache)
  - tailwindcss, lucide-react, motion

Why this repo exists
DeySafe lets you run lightweight vision and chat models entirely in-browser with careful memory handling so low-end devices can run useful AI without offloading everything to the cloud.

---

Repository layout (top-level)

```
public/              Static assets and TFLite runtime + wasm (tflite/contains .wasm/.js)
src/
  App.tsx            Main React app & UI
  main.tsx           React entry
  index.css          Global styles (Tailwind + theme)
  lib/
    model-manager.ts  Central model lifecycle manager (load/unload/predict/cleanup)
    offline.ts        IndexedDB helpers + service worker registration
    chat-worker.ts    WebWorker handler bootstrap for @mlc-ai/web-llm
index.html
package.json
vite.config.ts       Vite config (injects GEMINI_API_KEY via define)
vercel.json          Rewrites -> index.html (single page app)
.env.example         Example env vars (GEMINI_API_KEY, APP_URL)
```

How it fits together (runtime summary)
- UI (src/App.tsx) triggers model loads via modelManager.
- Vision models are TFLite binaries loaded from /public/tflite or from a remote URL; large models are cached into IndexedDB via src/lib/offline.ts.
- Chat model runs in a Web Worker (src/lib/chat-worker.ts) using @mlc-ai/web-llm; ModelManager loads/unloads the engine to free RAM.
- Service Worker (public/sw.js) provides app-shell caching and a network-first / cache fallback navigation strategy.

---

Getting started (shortest path)

Prerequisites
- Node.js (recommended v18+)
- A modern browser supporting WASM and WebGL (for tfjs optimizations)

Install & run
```bash
# 1. install
npm install

# 2. copy env example and set keys
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY and APP_URL (if needed)

# 3. run dev server (port 3000)
npm run dev
```

Build & preview
```bash
npm run build
npm run preview
```

Environment variables
- GEMINI_API_KEY — used by any server-call integrations (set in .env.local). Vite injects this as process.env.GEMINI_API_KEY via vite.config.ts.
- APP_URL — app base URL (used for links / callbacks).

Files worth reading
- src/lib/model-manager.ts — RAM isolation, loadVisionModel, loadChatEngine, predictVision, cleanup. Important for understanding lifecycle and memory hints.
- src/lib/offline.ts — IndexedDB caching: cacheModel, getCachedModel, deleteCachedModel, and service worker registration logic.
- public/tflite/ — TFLite runtime assets (.js and .wasm). Required for vision inference.
- public/sw.js — Service worker behavior (app shell caching and fetch strategy).
- vite.config.ts — env injection and worker format (ES).

Offline & model caching notes
- Large model downloads are saved to IndexedDB (DB name: "model-cache", store: "models") to avoid Cache API size limits.
- To drop cached models manually (dev / troubleshooting), run in browser console:
  - indexedDB.deleteDatabase('model-cache')
- If the browser/network blocks fetches, offline.ts surfaces clear errors (e.g., "Connection Blocked").

Service Worker
- The app installs a SW that pre-caches the app shell and provides navigation fallback.
- For development or debugging: open DevTools → Application → Service Workers, and unregister/update as needed.

Deployment
- vercel.json rewrites all requests to /index.html for SPA hosting.
- Any static host that serves /public and supports SPA rewrites will work (Vercel/Netlify/Cloudflare Pages, etc.).

Troubleshooting & tips
- If a vision model fails to load, check console for "Invalid TFLite model data" — ensure the file is a valid .tflite and that public/tflite is reachable.
- If chat model load fails on low-end devices, ModelManager intentionally forces "wasm" device_type for compatibility; try smaller models or ensure browser supports WASM threads (if available).
- If tensors aren't freeing memory, ModelManager calls tf.disposeVariables() and uses a WebGL lose-context fallback.
- HMR is toggled by DISABLE_HMR—AI Studio may turn off file watching; for local dev HMR is on by default.

Contributing
- Open issues for bugs or feature requests.
- Small PRs welcome: code style follows TypeScript + Tailwind. Run TypeScript checks with:
  npm run lint

License
- No LICENSE file detected in repo. Add a LICENSE file to make the project's license explicit.

Contact / acknowledgements
- Uses models and libs from TensorFlow.js, MLC-AI web-llm, and other open-source projects. Check package.json for full dependency list.

---

If you want, I can:
- Draft a concise repo description (short paragraph) for the GitHub repository page.
- Produce a short CONTRIBUTING.md with recommended local workflows.
- Update the README further (add badges, screenshots) or commit additional files (CONTRIBUTING.md, LICENSE) — tell me which branch to use.
