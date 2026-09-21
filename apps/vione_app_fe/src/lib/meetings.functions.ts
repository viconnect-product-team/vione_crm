import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type Meeting = {
  id: string;
  title: string;
  type: "board" | "committee" | "general";
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: "upcoming" | "completed" | "cancelled";
  department?: string;
  targetMembers?: any[];
  zoomUrl?: string;
  cancelReason?: string | null;
};

type Row = Record<string, unknown>;

function mapMeeting(m: Row): Meeting {
  return {
    id: m.code as string,
    title: m.title as string,
    type: m.type as Meeting["type"],
    date: m.date ? (m.date instanceof Date ? m.date.toISOString().slice(0, 10) : String(m.date).slice(0, 10)) : "",
    time: (m.time as string) ?? "",
    location: (m.location as string) ?? "",
    attendees: Number(m.attendees ?? 0),
    status: m.status as Meeting["status"],
    department: (m.department as string) ?? "",
    targetMembers: (m.target_members as any[]) ?? [],
    zoomUrl: (m.zoom_url as string) ?? "",
    cancelReason: (m.cancel_reason as string) ?? null,
  };
}

export const listMeetingsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Meeting[]> => {
    const { data, error } = await getDb(context)
      .from("meetings")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapMeeting(r as Row));
  });

const meetingInput = z.object({
  title: z.string().min(1).max(300),
  type: z.enum(["board", "committee", "general"]),
  date: z.string().min(1).max(40),
  time: z.string().max(40).default(""),
  location: z.string().max(200).default(""),
  attendees: z.number().int().min(0).max(100000).default(0),
  status: z.enum(["upcoming", "completed", "cancelled"]),
  department: z.string().default(""),
  targetMembers: z.array(z.any()).default([]),
  zoomUrl: z.string().default(""),
  cancelReason: z.string().nullable().optional(),
});

export const createMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => meetingInput.parse(d))
  .handler(async ({ data, context }): Promise<Meeting> => {
    const { genCode, logActivity } = await import("./crud.server");
    const code = genCode("MT");
    const dbPayload = {
      code,
      title: data.title,
      type: data.type,
      date: data.date,
      time: data.time,
      location: data.location,
      attendees: data.attendees,
      status: data.status,
      department: data.department,
      target_members: data.targetMembers,
      zoom_url: data.zoomUrl,
      cancel_reason: data.cancelReason,
    };
    const { data: row, error } = await getDb(context)
      .from("meetings")
      .insert(dbPayload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Tạo cuộc họp ban",
      target: code,
      category: "meeting",
    });
    return mapMeeting(row);
  });

export const updateMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => meetingInput.extend({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<Meeting> => {
    const { logActivity } = await import("./crud.server");
    const { id, targetMembers, zoomUrl, cancelReason, ...rest } = data;
    const dbUpdate = {
      ...rest,
      target_members: targetMembers,
      zoom_url: zoomUrl,
      cancel_reason: cancelReason,
    };
    const { data: row, error } = await getDb(context)
      .from("meetings")
      .update(dbUpdate)
      .eq("code", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Cập nhật cuộc họp",
      target: id,
      category: "meeting",
    });
    return mapMeeting(row);
  });

export const cancelMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator(
    (d: unknown) =>
      z
        .object({
          id: z.string().min(1).max(128),
          reason: z.string().min(1).max(500),
        })
        .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { logActivity } = await import("./crud.server");
    const { error } = await getDb(context)
      .from("meetings")
      .update({
        status: "cancelled",
        cancel_reason: data.reason,
      })
      .eq("code", data.id);
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Hủy cuộc họp và phát thông báo",
      target: data.id,
      category: "meeting",
    });
    return { ok: true };
  });

export const deleteMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { logActivity } = await import("./crud.server");
    const { error } = await getDb(context).from("meetings").delete().eq("code", data.id);
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Xóa cuộc họp",
      target: data.id,
      category: "meeting",
    });
    return { ok: true };
  });
