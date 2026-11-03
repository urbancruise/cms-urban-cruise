"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import {
  MdFormatAlignCenter,
  MdFormatAlignJustify,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatColorText,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatStrikethrough,
  MdFormatUnderlined,
  MdImage,
  MdLink,
  MdRedo,
  MdSubscript,
  MdSuperscript,
  MdUndo,
  MdCode,
} from "react-icons/md";
import { api } from "@/lib/api";

interface BlogRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-teal-50 text-teal-700" : ""
      }`}
    >
      {children}
    </button>
  );
}

export default function BlogRichTextEditor({
  value,
  onChange,
}: BlogRichTextEditorProps) {
  const imageInput = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
        },
      }),
      Highlight,
      ImageExtension.configure({
        allowBase64: false,
        HTMLAttributes: { class: "my-3 h-auto max-w-full rounded-lg" },
      }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] px-4 py-3 text-sm text-slate-800 outline-none [&_p]:my-2 [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:my-2 [&_h4]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-slate-100 [&_pre]:p-3 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_a]:text-teal-700 [&_a]:underline [&_mark]:bg-yellow-200",
      },
    },
  });

  const addImage = async (file?: File) => {
    if (!file || !editor) return;
    setUploadingImage(true);
    setUploadError("");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("scope", "general");
      const uploaded = await api<{ url: string }>("/api/upload/website-image", {
        method: "POST",
        body,
        formData: true,
      });
      editor.chain().focus().setImage({ src: uploaded.url, alt: file.name }).run();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not upload the image."
      );
    } finally {
      setUploadingImage(false);
      if (imageInput.current) imageInput.current.value = "";
    }
  };

  if (!editor) {
    return (
      <div className="min-h-[260px] rounded-lg border border-slate-200 bg-white" />
    );
  }

  const addLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const url = window.prompt("Enter the link URL");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const headingValue = [2, 3, 4].find((level) =>
    editor.isActive("heading", { level })
  );

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div
        role="toolbar"
        aria-label="Paragraph formatting"
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2"
      >
        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <MdUndo className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <MdRedo className="h-5 w-5" />
        </ToolbarButton>
        <span className="mx-1 h-5 border-l border-slate-300" />
        <select
          aria-label="Text style"
          value={headingValue ? String(headingValue) : "paragraph"}
          onChange={(event) => {
            const level = Number(event.target.value);
            if (level) editor.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run();
            else editor.chain().focus().setParagraph().run();
          }}
          className="h-8 rounded border-0 bg-transparent px-1 text-sm text-slate-700 outline-none focus:bg-white"
        >
          <option value="paragraph">Paragraph</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>
        <ToolbarButton
          label="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <MdFormatListBulleted className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <MdFormatListNumbered className="h-5 w-5" />
        </ToolbarButton>
        <span className="mx-1 h-5 border-l border-slate-300" />
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <MdFormatBold className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <MdFormatItalic className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <MdFormatStrikethrough className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <MdCode className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <MdFormatUnderlined className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Highlight"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <MdFormatColorText className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={addLink}
        >
          <MdLink className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Superscript"
          active={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <MdSuperscript className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Subscript"
          active={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <MdSubscript className="h-5 w-5" />
        </ToolbarButton>
        <span className="mx-1 h-5 border-l border-slate-300" />
        <ToolbarButton
          label="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <MdFormatAlignLeft className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <MdFormatAlignCenter className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <MdFormatAlignRight className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          label="Justify"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <MdFormatAlignJustify className="h-5 w-5" />
        </ToolbarButton>
        <span className="mx-1 h-5 border-l border-slate-300" />
        <ToolbarButton
          label={uploadingImage ? "Uploading image" : "Add image"}
          disabled={uploadingImage}
          onClick={() => imageInput.current?.click()}
        >
          <MdImage className="h-5 w-5" />
          <span className="ml-1 text-xs">Add image</span>
        </ToolbarButton>
        <input
          ref={imageInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => void addImage(event.target.files?.[0])}
        />
      </div>
      {uploadError && (
        <p role="alert" className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {uploadError}
        </p>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
