// Type definitions for missing modules
declare module '@toast-ui/editor' {
  export default class Editor {
    constructor(options: any);
    getMarkdown(): string;
    setMarkdown(content: string): void;
    getHTML(): string;
    destroy(): void;
  }
}

declare module '@toast-ui/editor/dist/toastui-editor.css';

// Global Tauri types
declare global {
  interface Window {
    __TAURI__: {
      convertFileSrc: (src: string, protocol?: string) => string;
      tauri?: {
        invoke: (cmd: string, args?: any) => Promise<any>;
      };
    };
  }
}
