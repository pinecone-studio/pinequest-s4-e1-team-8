import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/react";
import type { Extensions } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import type { Doc } from "yjs";
import { Markdown } from "tiptap-markdown";
import type { HocuspocusProvider } from "@hocuspocus/provider";

const lowlight = createLowlight(common);

type BuildTddEditorExtensionsOptions = {
  placeholder?: string;
  ydoc?: Doc | null;
  collabProvider?: HocuspocusProvider | null;
};

export function buildTddEditorExtensions({
  placeholder = "Click to edit this section…",
  ydoc = null,
  collabProvider = null,
}: BuildTddEditorExtensionsOptions = {}): Extensions {
  const collaborative = Boolean(ydoc);

  return [
    StarterKit.configure({
      undoRedo: collaborative ? false : undefined,
      codeBlock: false,
      heading: { levels: [1, 2, 3, 4] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({ placeholder }),
    Markdown.configure({
      html: false,
      transformPastedText: true,
      transformCopiedText: true,
    }),
    ...(ydoc
      ? [
          Collaboration.configure({ document: ydoc }),
          ...(collabProvider
            ? [
                CollaborationCaret.configure({
                  provider: collabProvider,
                  user: { name: "You" },
                }),
              ]
            : []),
        ]
      : []),
  ];
}

export function getEditorMarkdown(editor: Editor): string {
  const storage = editor.storage as { markdown?: { getMarkdown?: () => string } };
  return storage.markdown?.getMarkdown?.()?.trim() ?? "";
}
