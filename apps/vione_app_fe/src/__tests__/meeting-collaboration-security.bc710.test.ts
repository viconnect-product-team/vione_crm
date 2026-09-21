// BC-7.10F — Meeting Collaboration security contract tests.
//
// Structural / static-analysis assertions that guard the invariants stated
// in the domain spec. These tests read source files directly rather than
// exercising RPCs; they catch regressions that would silently break the
// privacy or authority model.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";

async function read(rel: string): Promise<string> {
  return fs.readFile(path.join(process.cwd(), rel), "utf8");
}

const UI_FILES = [
  "src/components/business-connect/meeting/collaboration/AgendaSection.tsx",
  "src/components/business-connect/meeting/collaboration/PrivateNotesSection.tsx",
  "src/components/business-connect/meeting/collaboration/SharedNotesSection.tsx",
];

describe("UI ↔ SDK boundary", () => {
  it("UI imports hooks / SDK only — no direct supabase table access", async () => {
    for (const f of UI_FILES) {
      const src = await read(f);
      expect(src, `${f} must not import supabase client`).not.toMatch(
        /from ["']@\/integrations\/supabase\//,
      );
      expect(src, `${f} must not call .from('business_meeting_')`).not.toMatch(
        /\.from\(['"]business_meeting_/,
      );
      // Must go through hooks module.
      expect(src).toMatch(/from ["']@\/hooks\/use-meeting-collaboration["']/);
    }
  });

  it("UI does not pass userId for private-note reads or writes", async () => {
    const priv = await read(
      "src/components/business-connect/meeting/collaboration/PrivateNotesSection.tsx",
    );
    // No userId prop is passed on Private note component surface.
    expect(priv).not.toMatch(/userId\s*[:=]/);
    // upsert mutation call must not include a userId field.
    expect(priv).not.toMatch(/userId\s*:/);
  });

  it("private-note hook and upsert input do not accept a viewer/user id", async () => {
    const hooks = await read("src/hooks/use-meeting-collaboration.ts");
    // Signatures are (meetingId: string) — no viewer override.
    expect(hooks).toMatch(/usePrivateNote\s*\(\s*meetingId\s*:\s*string\s*\)/);
    expect(hooks).toMatch(/useUpsertPrivateNote\s*\(\s*meetingId\s*:\s*string\s*\)/);

    const types = await read("src/lib/meeting/collaboration/types.ts");
    const m = types.match(/export interface UpsertPrivateNoteInput\s*\{[\s\S]*?\}/);
    expect(m, "UpsertPrivateNoteInput must exist").toBeTruthy();
    // The upsert input never carries a user id — server derives it from auth.uid().
    expect(m![0]).not.toMatch(/userId/);
  });

  it("organizer cannot select another participant's private note (no selector in UI or SDK)", async () => {
    const priv = await read(
      "src/components/business-connect/meeting/collaboration/PrivateNotesSection.tsx",
    );
    expect(priv).not.toMatch(/participant/i);
    expect(priv).not.toMatch(/select.*user/i);
    const sdk = await read("src/lib/meeting/collaboration/sdk.ts");
    expect(sdk).toMatch(/getMyNote\s*\(\s*meetingId\s*:\s*string\s*\)/);
    // No "getNoteForUser" or "listPrivateNotes" — the surface only exposes "getMyNote".
    expect(sdk).not.toMatch(/getNoteForUser/);
    expect(sdk).not.toMatch(/listPrivateNotes/);
  });
});

describe("Query key + invalidation scope", () => {
  it("collab query keys contain meetingId only (no viewer id)", async () => {
    const hooks = await read("src/hooks/use-meeting-collaboration.ts");
    const m = hooks.match(/meetingCollaborationKeys\s*=\s*\{[\s\S]*?\}\s*;/);
    expect(m).toBeTruthy();
    const block = m![0];
    // Each key is [<name>, meetingId] — no extra segments.
    expect(block).toMatch(/agenda:\s*\(meetingId:\s*string\)\s*=>\s*\[.*meetingId\]/);
    expect(block).toMatch(/privateNote:\s*\(meetingId:\s*string\)\s*=>\s*\[.*meetingId\]/);
    expect(block).toMatch(/sharedNote:\s*\(meetingId:\s*string\)\s*=>\s*\[.*meetingId\]/);
  });
});

describe("Timeline privacy", () => {
  it("note content is never placed into timeline event metadata (schema/RPC contract)", async () => {
    // Search migrations for private-note timeline emission or shared-note
    // metadata that would leak the content field.
    const migDir = "supabase/migrations";
    const files = await fs.readdir(migDir).catch(() => []);
    const offenders: string[] = [];
    for (const f of files) {
      const src = await read(path.join(migDir, f));
      // Private notes must not emit any timeline outbox row.
      if (
        /business_meeting_private_notes/.test(src) &&
        /business_meeting_events_outbox|business_meeting_events\s*\(/i.test(src)
      ) {
        // Only fail if the same statement references both tables.
        const stmts = src.split(";");
        for (const s of stmts) {
          if (/business_meeting_private_notes/.test(s) && /business_meeting_events/i.test(s)) {
            offenders.push(`${f}: private-note timeline emission`);
          }
        }
      }
      // Shared-note publish emission must not carry content in metadata.
      const publishBlocks = src.match(/shared_notes_published[\s\S]{0,600}/g);
      if (publishBlocks) {
        for (const b of publishBlocks) {
          if (/\bcontent\b/i.test(b)) {
            offenders.push(`${f}: shared-note publish metadata contains 'content'`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("MeetingTimeline renderer never accesses event.metadata or note content", async () => {
    const src = await read("src/components/business-connect/meeting/MeetingTimeline.tsx");
    expect(src).not.toMatch(/event\.metadata/);
    expect(src).not.toMatch(/\.content/);
  });
});

describe("Participant surface (shared notes)", () => {
  it("SharedNotesSection gates mutation controls behind isOrganizer && !published", async () => {
    const src = await read(
      "src/components/business-connect/meeting/collaboration/SharedNotesSection.tsx",
    );
    // canEdit must depend on both isOrganizer and non-published status.
    expect(src).toMatch(/canEdit\s*=\s*isOrganizer\s*&&\s*note\s*&&\s*!isPublished/);
    // publish/save controls appear only under `canEdit`.
    expect(src).toMatch(/canEdit\s*\?\s*\(/);
  });
});
