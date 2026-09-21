import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { NewsArticle } from "@/lib/extra-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNestApiFromServer } from "@/lib/api-client";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

type Row = Record<string, unknown>;

function mapNews(n: Row): NewsArticle {
  return {
    id: (n.code || n.id) as string,
    title: n.title as string,
    category: n.category as string,
    author: n.author as string,
    publishedAt: (n.published_at as string) || (n.publishedAt as string) || "—",
    views: (n.views as number) ?? 0,
    status: n.status as NewsArticle["status"],
    excerpt: (n.excerpt as string) ?? "",
    image: (n.cover_image as string) || (n.coverImage as string) || (n.image as string) || "",
  };
}

export const listNewsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<NewsArticle[]> => {
    const token = (context as any)?.token;
    try {
      const nestNews = await fetchNestApiFromServer<any[]>("/content/admin/news", token);
      if (Array.isArray(nestNews) && nestNews.length > 0) {
        return nestNews.map((n: any) => ({
          id: n.code || n.id,
          title: n.title,
          category: n.category ?? "",
          author: n.author ?? "",
          publishedAt: n.publishedAt || n.published_at || "—",
          views: Number(n.views ?? 0),
          status: (n.status as NewsArticle["status"]) ?? "published",
          excerpt: n.excerpt ?? "",
          image: n.image || n.coverImage || n.cover_image || "",
        }));
      }
    } catch (e) {
      console.warn("Fallback to db for listNews:", e);
    }

    const { getActiveAssociationId } = await import("./assoc-scope.server");
    const activeId = await getActiveAssociationId(getDb(context));
    let query = getDb(context).from("news").select("*").order("created_at", { ascending: true });
    if (activeId) query = query.eq("association_id", activeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r: any) => mapNews(r as Row));
  });

const newsInput = z.object({
  title: z.string().min(1).max(300),
  category: z.string().min(1).max(100),
  author: z.string().min(1).max(120),
  publishedAt: z.string().max(40).default("—"),
  status: z.enum(["published", "draft", "scheduled"]),
  excerpt: z.string().max(2000).default(""),
  image: z.string().optional().default(""),
});

export const createNewsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => newsInput.parse(d))
  .handler(async ({ data, context }): Promise<NewsArticle> => {
    const token = (context as any)?.token;
    try {
      const created = await fetchNestApiFromServer<any>("/content/admin/news", token, {
        method: "POST",
        body: JSON.stringify({
          ...data,
          cover_image: data.image || null,
          coverImage: data.image || null,
        }),
      });
      if (created && (created.id || created.code)) {
        return {
          id: created.code || created.id,
          title: created.title,
          category: created.category ?? data.category,
          author: created.author ?? data.author,
          publishedAt: created.publishedAt || data.publishedAt,
          views: 0,
          status: created.status ?? data.status,
          excerpt: created.excerpt ?? data.excerpt,
          image: created.image || created.coverImage || created.cover_image || data.image || "",
        };
      }
    } catch (e) {
      console.warn("Fallback to db for createNews:", e);
    }

    const { genCode, logActivity } = await import("./crud.server");
    const code = genCode("NEWS");
    const { data: row, error } = await getDb(context)
      .from("news")
      .insert({
        code,
        title: data.title,
        category: data.category,
        author: data.author,
        published_at: data.publishedAt,
        status: data.status,
        excerpt: data.excerpt,
        cover_image: data.image || null,
        views: 0,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Tạo tin tức",
      target: data.title,
      category: "system",
    });
    return mapNews(row);
  });

export const updateNewsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => newsInput.extend({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<NewsArticle> => {
    const token = (context as any)?.token;
    try {
      const updated = await fetchNestApiFromServer<any>(`/content/admin/news/${data.id}`, token, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          cover_image: data.image || null,
          coverImage: data.image || null,
        }),
      });
      if (updated && (updated.id || updated.code)) {
        return {
          id: updated.code || updated.id,
          title: updated.title,
          category: updated.category ?? data.category,
          author: updated.author ?? data.author,
          publishedAt: updated.publishedAt || data.publishedAt,
          views: Number(updated.views ?? 0),
          status: updated.status ?? data.status,
          excerpt: updated.excerpt ?? data.excerpt,
          image: updated.image || updated.coverImage || updated.cover_image || data.image || "",
        };
      }
    } catch (e) {
      console.warn("Fallback to db for updateNews:", e);
    }

    const { logActivity } = await import("./crud.server");
    const { data: row, error } = await getDb(context)
      .from("news")
      .update({
        title: data.title,
        category: data.category,
        author: data.author,
        published_at: data.publishedAt,
        status: data.status,
        excerpt: data.excerpt,
        cover_image: data.image || null,
      })
      .eq("code", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Cập nhật tin tức",
      target: data.title,
      category: "system",
    });
    return mapNews(row);
  });

export const deleteNewsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const token = (context as any)?.token;
    try {
      await fetchNestApiFromServer<any>(`/content/admin/news/${data.id}`, token, {
        method: "DELETE",
      });
      return { ok: true };
    } catch (e) {
      console.warn("Fallback to db for deleteNews:", e);
    }

    const { logActivity } = await import("./crud.server");
    const found = await getDb(context)
      .from("news")
      .select("title")
      .eq("code", data.id)
      .maybeSingle();
    const { error } = await getDb(context).from("news").delete().eq("code", data.id);
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Xóa tin tức",
      target: (found.data?.title as string) ?? data.id,
      category: "system",
    });
    return { ok: true };
  });
