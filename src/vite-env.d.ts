/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INTERSWITCH_MERCHANT_CODE: string
  readonly VITE_INTERSWITCH_PAYABLE_CODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
