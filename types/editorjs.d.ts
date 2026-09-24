// ============================================================
// Ambient type declarations for @editorjs/* packages
// that don't ship proper .d.ts files or have broken
// "exports" maps under bundler moduleResolution.
// ============================================================

declare module "@editorjs/checklist" {
  const Checklist: any;
  export default Checklist;
}

declare module "@editorjs/embed" {
  const Embed: any;
  export default Embed;
}

declare module "@editorjs/marker" {
  const Marker: any;
  export default Marker;
}

declare module "@editorjs/inline-code" {
  const InlineCode: any;
  export default InlineCode;
}

declare module "@editorjs/table" {
  const Table: any;
  export default Table;
}

declare module "@editorjs/code" {
  const CodeTool: any;
  export default CodeTool;
}

declare module "@editorjs/delimiter" {
  const Delimiter: any;
  export default Delimiter;
}

declare module "@editorjs/quote" {
  const Quote: any;
  export default Quote;
}

declare module "@editorjs/list" {
  const List: any;
  export default List;
}

declare module "@editorjs/header" {
  const Header: any;
  export default Header;
}

declare module "@editorjs/paragraph" {
  const Paragraph: any;
  export default Paragraph;
}

declare module "@editorjs/image" {
  const ImageTool: any;
  export default ImageTool;
}

