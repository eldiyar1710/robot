/// <reference types="vite/client" />

declare module "monaco-editor" {
  export namespace editor {
    type IStandaloneCodeEditor = any;
    type IStandaloneEditorConstructionOptions = any;
    type IDisposable = any;
    type IModel = any;
  }
}
