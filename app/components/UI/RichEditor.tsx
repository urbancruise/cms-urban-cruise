"use client";

import { useEffect, useRef, useState } from "react";
import type EditorJS from "@editorjs/editorjs";

interface RichEditorProps {
  value: any;
  onChange: (data: any) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
}

function normalizeValue(value: any) {
  if (!value) return undefined;

  if (
    typeof value === "object" &&
    Array.isArray(value.blocks) &&
    typeof value.time === "number"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return {
      time: Date.now(),
      blocks: [{ type: "paragraph", data: { text: value } }],
      version: "2.28.0",
    };
  }

  return {
    time: Date.now(),
    blocks: [
      { type: "paragraph", data: { text: JSON.stringify(value, null, 2) } },
    ],
    version: "2.28.0",
  };
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  minHeight = 280,
}: RichEditorProps) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorJS | null>(null);
  const [ready, setReady] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let destroyed = false;

    async function init() {
      if (!holderRef.current) return;

      const [
        { default: EditorJS },
        { default: Header },
        { default: List },
        { default: Paragraph },
        { default: Checklist },
        { default: Quote },
        { default: Delimiter },
        { default: Embed },
        { default: ImageTool },
        { default: Table },
        { default: CodeTool },
        { default: Marker },
        { default: InlineCode },
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/paragraph"),
        import("@editorjs/checklist"),
        import("@editorjs/quote"),
        import("@editorjs/delimiter"),
        import("@editorjs/embed"),
        import("@editorjs/image"),
        import("@editorjs/table"),
        import("@editorjs/code"),
        import("@editorjs/marker"),
        import("@editorjs/inline-code"),
      ]);

      if (destroyed || !holderRef.current) return;

      const editor = new EditorJS({
        holder: holderRef.current,
        placeholder,
        readOnly,
        minHeight,
        data: normalizeValue(value),
        inlineToolbar: true,
        autofocus: false,

        tools: {
          header: {
            class: Header as any,
            inlineToolbar: true,
            config: { levels: [1, 2, 3, 4, 5, 6], defaultLevel: 2 },
          },
          list: {
            class: List as any,
            inlineToolbar: true,
          },
          paragraph: {
            class: Paragraph as any,
            inlineToolbar: true,
          },
          checklist: {
            class: Checklist as any,
            inlineToolbar: true,
          },
          quote: {
            class: Quote as any,
            inlineToolbar: true,
          },
          delimiter: Delimiter as any,
          embed: {
            class: Embed as any,
            config: {
              services: {
                youtube: true,
                vimeo: true,
                coub: true,
              },
            },
          },
          image: {
            class: ImageTool as any,
            config: {
              uploader: {
                uploadByFile: async (file: File) => {
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/upload/editor-image", {
                    method: "POST",
                    body: formData,
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    return {
                      success: 0,
                      message: data.error || "Upload failed",
                    };
                  }
                  return {
                    success: 1,
                    file: { url: data.url },
                  };
                },
              },
            },
          },
          table: {
            class: Table as any,
            inlineToolbar: true,
          },
          code: CodeTool as any,
          Marker: {
            class: Marker as any,
            shortcut: "CMD+SHIFT+M",
          },
          inlineCode: {
            class: InlineCode as any,
            shortcut: "CMD+SHIFT+C",
          },
        },

        onChange: async () => {
          if (!editorRef.current) return;
          const data = await editorRef.current.save();
          onChangeRef.current(data);
        },
      });

      editorRef.current = editor;

      editor.isReady
        .then(() => {
          if (!destroyed) setReady(true);
        })
        .catch((err) => {
          console.error("[RichEditor] init error:", err);
        });
    }

    init();

    return () => {
      destroyed = true;

      if (
        editorRef.current &&
        typeof editorRef.current.destroy === "function"
      ) {
        try {
          editorRef.current.destroy();
        } catch {
          // ignore destroy errors during unmount
        }
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !ready) return;

    editor
      .save()
      .then((current) => {
        const normalized = normalizeValue(value);
        if (JSON.stringify(current) === JSON.stringify(normalized || current)) {
          return;
        }
        return editor.render(normalized);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {!ready && (
        <div className="p-6 text-sm text-slate-400">Loading editor…</div>
      )}
      <div
        ref={holderRef}
        className="rich-editor-body px-4 py-3"
        style={{ minHeight }}
      />

      <style jsx global>{`
        .rich-editor-body .ce-block__content,
        .rich-editor-body .ce-toolbar__content {
          max-width: 100%;
        }
        .rich-editor-body .ce-paragraph {
          font-size: 14px;
          line-height: 1.65;
          color: #0f172a;
        }
        .rich-editor-body .ce-header {
          font-weight: 800;
          color: #0f172a;
          margin: 0.6em 0 0.3em;
        }
        .rich-editor-body .cdx-block {
          padding: 4px 0;
        }
        .rich-editor-body .ce-toolbar__plus,
        .rich-editor-body .ce-toolbar__settings-btn {
          color: #0e7c7b;
        }
        .rich-editor-body .ce-toolbar__plus:hover,
        .rich-editor-body .ce-toolbar__settings-btn:hover {
          background: #e6f5f5;
        }
        .rich-editor-body .cdx-search-field {
          border-radius: 8px;
        }
        .rich-editor-body .ce-inline-toolbar {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}