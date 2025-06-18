declare module '@toast-ui/editor' {
  class Editor {
    constructor(options: any);
    getHTML(): string;
    getMarkdown(): string;
    setMarkdown(markdown: string): void;
    setHTML(html: string): void;
    destroy(): void;
    on(event: string, callback: () => void): void;
    changeMode(mode: string): void;
  }
  export default Editor;
}

declare module '@toast-ui/editor/dist/toastui-editor.css';
