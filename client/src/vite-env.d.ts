/// <reference types="vite/client" />

// (optional) strongly type your env vars
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
