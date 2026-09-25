/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BG_SESSION_KEY?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
