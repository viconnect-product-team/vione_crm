import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

export type Document = {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  type: "pdf" | "docx" | "xlsx" | "pptx";
};

export const listDocumentsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Document[]> => {
    const { token } = context as any;
    const data = await fetchNestApiFromServer("/documents", token);
    return data ?? [];
  });

const docInput = z.object({
  name: z.string().min(1).max(300),
  category: z.string().min(1).max(100),
  size: z.string().max(40).default(""),
  uploadedBy: z.string().max(120).default(""),
  type: z.enum(["pdf", "docx", "xlsx", "pptx"]),
  filePath: z.string().max(500).default(""),
});

export const createDocumentFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => docInput.parse(d))
  .handler(async ({ data, context }): Promise<Document> => {
    const { token } = context as any;
    return fetchNestApiFromServer("/documents", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updateDocumentFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => docInput.extend({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<Document> => {
    const { token } = context as any;
    const { id, ...body } = data;
    return fetchNestApiFromServer(`/documents/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  });

/** Issues a short-lived URL for the document's attached file. */
export const getDocumentUrlFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<string | null> => {
    const { token } = context as any;
    const res = await fetchNestApiFromServer(`/documents/${data.id}/url`, token);
    if (!res || !res.url) return null;
    
    const apiHost = process.env.VITE_API_URL || "http://localhost:3000";
    return res.url.startsWith("http") ? res.url : `${apiHost}${res.url}`;
  });

export const deleteDocumentFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/documents/${data.id}`, token, {
      method: "DELETE",
    });
  });
