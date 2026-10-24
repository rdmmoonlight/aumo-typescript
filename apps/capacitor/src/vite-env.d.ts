/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Alamat backend (hanya scheme + host, tanpa path). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
