export const TIPTAP_DOCUMENT_SERVER_ID =
  process.env.NEXT_PUBLIC_TIPTAP_DOCUMENT_SERVER_ID ?? "y9d0ddjm";

export const TIPTAP_COLLAB_WS_URL = `wss://${TIPTAP_DOCUMENT_SERVER_ID}.collab.tiptap.cloud`;

export function tiptapDocumentName(sessionKey: string, blockId: string) {
  return `tdd/${sessionKey}/${blockId}`;
}
