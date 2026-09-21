import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNestApiFromServer } from "./api-client";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type VoteOption = {
  id: string;
  title: string;
  votesCount: number;
  vioneVotes?: number;
  associationVotes?: number;
  crmVotes?: number;
  percentage: number;
  isLeading: boolean;
};

export type VoteSourceStats = {
  vioneApp: number;
  associationApp: number;
  crm: number;
};

export type Vote = {
  id: string;
  title: string;
  type: "policy" | "election" | "amendment";
  startsAt: string;
  endsAt: string;
  eligible: number;
  voted: number;
  status: "open" | "scheduled" | "closed";
  options: string[];
  optionDetails: VoteOption[];
  myVote?: string | null;
  myVoteSource?: string | null;
  sourceStats?: VoteSourceStats;
};

export const listVotesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Vote[]> => {
    try {
      const res: any = await fetchNestApiFromServer("/voting/polls", context.token);
      if (Array.isArray(res)) {
        return res.map((r: any) => {
          const rawOpts = Array.isArray(r.options) ? r.options : [];
          const optionDetails: VoteOption[] = rawOpts.map((o: any) => ({
            id: typeof o === "string" ? o : String(o.id || ""),
            title: typeof o === "string" ? o : String(o.title || ""),
            votesCount: typeof o === "string" ? 0 : Number(o.votesCount ?? o.votes_count ?? 0),
            vioneVotes: typeof o === "string" ? 0 : Number(o.vioneVotes ?? o.vione_votes ?? 0),
            associationVotes: typeof o === "string" ? 0 : Number(o.associationVotes ?? o.association_votes ?? 0),
            crmVotes: typeof o === "string" ? 0 : Number(o.crmVotes ?? o.crm_votes ?? 0),
            percentage: typeof o === "string" ? 0 : Number(o.percentage ?? 0),
            isLeading: typeof o === "string" ? false : Boolean(o.isLeading),
          }));

          const sourceStats: VoteSourceStats = r.sourceStats || {
            vioneApp: optionDetails.reduce((sum, o) => sum + (o.vioneVotes || 0), 0),
            associationApp: optionDetails.reduce((sum, o) => sum + (o.associationVotes || 0), 0),
            crm: optionDetails.reduce((sum, o) => sum + (o.crmVotes || 0), 0),
          };

          return {
            id: r.id,
            title: r.title,
            type: r.type || "policy",
            startsAt: r.startsAt || r.startDate || r.createdAt || new Date().toISOString(),
            endsAt: r.endsAt || r.endDate || new Date().toISOString(),
            eligible: Number(r.eligible || 100),
            voted: Number(r.totalVotes || r.voted || 0),
            status: r.status || "open",
            options: optionDetails.map((o) => o.title),
            optionDetails,
            myVote: r.myVote || null,
            myVoteSource: r.myVoteSource || null,
            sourceStats,
          };
        });
      }
    } catch (err) {
      console.warn("[listVotesFn] Error calling Nest API, falling back to db:", err);
    }

    // DB Fallback
    try {
      const { data: polls } = await getDb(context)
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });
      if (!polls || polls.length === 0) return [];
      return polls.map((p: any) => ({
        id: p.id,
        title: p.title,
        type: "policy",
        startsAt: p.start_date || p.created_at || new Date().toISOString(),
        endsAt: p.end_date || new Date().toISOString(),
        eligible: 100,
        voted: Number(p.total_votes || 0),
        status: p.status || "open",
        options: [],
        optionDetails: [],
        myVote: null,
        myVoteSource: null,
        sourceStats: { vioneApp: 0, associationApp: 0, crm: 0 },
      }));
    } catch {
      return [];
    }
  });

export const castVoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => {
    const d = data as Record<string, unknown>;
    const pollId = String(d.pollId ?? "").trim();
    const optionId = String(d.optionId ?? "").trim();
    const sourceApp = d.sourceApp ? String(d.sourceApp).trim() : "crm";
    if (!pollId || !optionId) throw new Error("Thiếu mã bình chọn hoặc phương án");
    return { pollId, optionId, sourceApp };
  })
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer(`/voting/polls/${data.pollId}/vote`, context.token, {
      method: "POST",
      body: JSON.stringify({ optionId: data.optionId, sourceApp: data.sourceApp }),
    });
  });

export const createVoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => {
    const d = data as Record<string, unknown>;
    const title = String(d.title ?? "").trim();
    const type = String(d.type ?? "policy");
    const targetAudience = String(d.targetAudience ?? "all");
    const startsAt = String(d.startsAt ?? "").trim();
    const endsAt = String(d.endsAt ?? "").trim();
    const options = Array.isArray(d.options)
      ? (d.options as unknown[]).map((o: any) => String(o).trim()).filter(Boolean)
      : [];
    if (!title) throw new Error("Vui lòng nhập câu hỏi bình chọn");
    if (title.length > 300) throw new Error("Câu hỏi quá dài");
    if (!startsAt || !endsAt) throw new Error("Vui lòng chọn thời gian");
    if (endsAt < startsAt) throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
    if (options.length < 2) throw new Error("Cần ít nhất 2 lựa chọn");
    if (options.length > 20) throw new Error("Tối đa 20 lựa chọn");
    if (!["policy", "election", "amendment"].includes(type)) throw new Error("Loại không hợp lệ");
    return { title, type, targetAudience, startsAt, endsAt, options };
  })
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer("/voting/polls", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updateVoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => {
    const d = data as Record<string, unknown>;
    const id = String(d.id ?? "").trim();
    const title = String(d.title ?? "").trim();
    const type = String(d.type ?? "policy");
    const startsAt = String(d.startsAt ?? "").trim();
    const endsAt = String(d.endsAt ?? "").trim();
    const options = Array.isArray(d.options)
      ? (d.options as unknown[]).map((o: any) => String(o).trim()).filter(Boolean)
      : [];
    if (!id) throw new Error("Thiếu mã bình chọn");
    return { id, title, type, startsAt, endsAt, options };
  })
  .handler(async ({ data, context }) => {
    const { id, ...body } = data;
    return fetchNestApiFromServer(`/voting/polls/${id}`, context.token, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  });

export const closeVoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => {
    const id = String((data as Record<string, unknown>).id ?? "").trim();
    if (!id) throw new Error("Thiếu mã bình chọn");
    return { id };
  })
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer(`/voting/polls/${data.id}/close`, context.token, {
      method: "POST",
    });
  });

export const deleteVoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => {
    const id = String((data as Record<string, unknown>).id ?? "").trim();
    if (!id) throw new Error("Thiếu mã bình chọn");
    return { id };
  })
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer(`/voting/polls/${data.id}`, context.token, {
      method: "DELETE",
    });
  });
