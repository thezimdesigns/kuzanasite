"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Placeholder } from "@tiptap/extensions";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2, Unlink } from "lucide-react";
import { cn } from "@/components/ui";

/** Ask a rich text field to insert text at its cursor (used by "Insert" on story images). */
export const INSERT_EVENT = "kz:insert-text";
export type InsertDetail = { target: string; text: string };

/**
 * Word-processor style editor for long text. It stores Markdown, so everything
 * the public site already renders keeps working. The value lives in a hidden
 * field named `name` (with `id`), so it posts with the form like a textarea and
 * fires "input" events for anything listening to it.
 */
export function RichText({
  name,
  id,
  defaultValue = "",
  placeholder,
  minRows = 8,
  disabled = false,
}: {
  name: string;
  id?: string;
  defaultValue?: string | null;
  placeholder?: string;
  minRows?: number;
  disabled?: boolean;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Markdown on the site has no underline, strikethrough or code styling.
        underline: false,
        strike: false,
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Markdown,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: defaultValue ?? "",
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "prose-kuzana rich-text-body focus:outline-none",
        style: `min-height:${minRows * 1.65}rem`,
        ...(id ? { "aria-labelledby": `${id}-label` } : {}),
      },
    },
    onUpdate: ({ editor }) => setValue(editor.getMarkdown()),
  });

  // Keep the hidden field in step and let listeners (image warnings) know.
  useEffect(() => {
    field.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [value]);

  // Text inserted from elsewhere on the page goes in at the cursor, as its own paragraph.
  useEffect(() => {
    if (!id || !editor) return;
    const onInsert = (e: Event) => {
      const { target, text } = (e as CustomEvent<InsertDetail>).detail;
      if (target !== id) return;
      editor
        .chain()
        .focus()
        .insertContent({ type: "paragraph", content: [{ type: "text", text }] })
        .run();
    };
    document.addEventListener(INSERT_EVENT, onInsert);
    return () => document.removeEventListener(INSERT_EVENT, onInsert);
  }, [editor, id]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-control)] border border-line bg-white focus-within:border-green-800 focus-within:ring-2 focus-within:ring-green-800/15",
        disabled && "opacity-70",
      )}
    >
      <textarea ref={field} id={id} name={name} value={value} readOnly hidden />
      {editor && !disabled && <Toolbar editor={editor} />}
      <div className="px-3.5 py-3">
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="prose-kuzana whitespace-pre-wrap text-muted" style={{ minHeight: `${minRows * 1.65}rem` }}>
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const setLink = () => {
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (https://… or a page on this site such as /programme)", current ?? "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const btn = (label: string, active: boolean, onClick: () => void, Icon: typeof Bold, disabled = false) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-[var(--radius-control)] transition-colors disabled:opacity-35",
        active ? "bg-green-900 text-white" : "text-ink hover:bg-cream-dark",
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
  const sep = (k: string) => <span key={k} className="mx-1 h-5 w-px bg-line" aria-hidden />;

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-line bg-cream/60 px-1.5 py-1">
      {btn("Bold", s.bold, () => editor.chain().focus().toggleBold().run(), Bold)}
      {btn("Italic", s.italic, () => editor.chain().focus().toggleItalic().run(), Italic)}
      {sep("a")}
      {btn("Heading", s.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2)}
      {btn("Subheading", s.h3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), Heading3)}
      {sep("b")}
      {btn("Bulleted list", s.bullet, () => editor.chain().focus().toggleBulletList().run(), List)}
      {btn("Numbered list", s.ordered, () => editor.chain().focus().toggleOrderedList().run(), ListOrdered)}
      {btn("Quote", s.quote, () => editor.chain().focus().toggleBlockquote().run(), Quote)}
      {sep("c")}
      {btn(s.link ? "Edit link" : "Add link", s.link, setLink, Link2)}
      {s.link && btn("Remove link", false, () => editor.chain().focus().extendMarkRange("link").unsetLink().run(), Unlink)}
      <span className="ml-auto flex">
        {btn("Undo", false, () => editor.chain().focus().undo().run(), Undo2, !s.canUndo)}
        {btn("Redo", false, () => editor.chain().focus().redo().run(), Redo2, !s.canRedo)}
      </span>
    </div>
  );
}

/**
 * Label + editor + hint/error, matching <Field>. Not a <label> element: a click
 * inside a label would trigger the first toolbar button.
 */
export function RichField({
  label,
  hint,
  error,
  required,
  className,
  ...editor
}: Parameters<typeof RichText>[0] & { label: string; hint?: string; error?: string; required?: boolean; className?: string }) {
  const labelId = editor.id ? `${editor.id}-label` : undefined;
  return (
    <div className={className} role="group" aria-labelledby={labelId}>
      <span id={labelId} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-orange"> *</span>}
      </span>
      <RichText {...editor} />
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
    </div>
  );
}
