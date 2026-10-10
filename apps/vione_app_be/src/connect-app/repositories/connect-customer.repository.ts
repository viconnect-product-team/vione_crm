import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ConnectCustomerRepository — Data Access Layer for B2B Customers, Tags, Logs, Needs, AI suggestions, and Card Scans.
 * Encapsulates 100% of raw SQL and database interactions.
 */
@Injectable()
export class ConnectCustomerRepository {
  private readonly logger = new Logger(ConnectCustomerRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findCustomers(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.bc_customers
      WHERE owner_user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `.catch(() => []);
  }

  async findCustomerTagLinks(customerIds: string[]): Promise<any[]> {
    if (customerIds.length === 0) return [];
    return this.prisma.$queryRaw<any[]>`
      SELECT customer_id, tag_id FROM public.bc_customer_tag_links
      WHERE customer_id::uuid = ANY(${customerIds}::uuid[])
    `.catch(() => []);
  }

  async findExistingCustomer(userId: string, kind: string, targetId: string): Promise<any | null> {
    let rows: any[] = [];
    if (kind === 'connection') {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.bc_customers
        WHERE owner_user_id = ${userId}::uuid AND target_user_id = ${targetId}::uuid
        LIMIT 1
      `.catch(() => []);
    } else if (kind === 'saved_card') {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.bc_customers
        WHERE owner_user_id = ${userId}::uuid AND target_card_id = ${targetId}::uuid
        LIMIT 1
      `.catch(() => []);
    } else if (kind === 'guest_contact') {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.bc_customers
        WHERE owner_user_id = ${userId}::uuid AND target_guest_id = ${targetId}::uuid
        LIMIT 1
      `.catch(() => []);
    }
    return rows[0] || null;
  }

  async insertCustomer(data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customers (
        id, owner_user_id, target_kind, target_user_id, target_card_id, target_guest_id,
        display_name, company_name, stage, expected_value, currency, source_label, note,
        next_action_at, created_at, updated_at
      ) VALUES (
        ${data.id}::uuid,
        ${data.ownerUserId}::uuid,
        ${data.targetKind}::public.bc_customer_target_kind,
        ${data.targetUserId ? data.targetUserId : null}::uuid,
        ${data.targetCardId ? data.targetCardId : null}::uuid,
        ${data.targetGuestId ? data.targetGuestId : null}::uuid,
        ${data.displayName || null},
        ${data.companyName || null},
        ${data.stage}::public.bc_customer_stage,
        ${data.expectedValue || null},
        ${data.currency || 'VND'},
        ${data.sourceLabel || null},
        ${data.note || null},
        ${data.nextActionAt},
        now(),
        now()
      )
    `;
  }

  async findCustomerById(customerId: string, userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.bc_customers
      WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async updateCustomer(customerId: string, userId: string, data: any): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.bc_customers
      SET display_name = COALESCE(${data.displayName}, display_name),
          company_name = COALESCE(${data.companyName}, company_name),
          stage = COALESCE(${data.stage}::public.bc_customer_stage, stage),
          expected_value = COALESCE(${data.expectedValue}, expected_value),
          currency = COALESCE(${data.currency}, currency),
          source_label = COALESCE(${data.sourceLabel}, source_label),
          note = COALESCE(${data.note}, note),
          next_action_at = ${data.nextActionAt},
          last_contact_at = ${data.lastContactAt},
          updated_at = now()
      WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
    `;
  }

  async deleteCustomerCascade(customerId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`DELETE FROM public.bc_customer_tag_links WHERE customer_id = ${customerId}::uuid`.catch(() => {});
    await this.prisma.$executeRaw`DELETE FROM public.bc_customer_logs WHERE customer_id = ${customerId}::uuid`.catch(() => {});
    await this.prisma.$executeRaw`DELETE FROM public.bc_customer_needs WHERE customer_id = ${customerId}::uuid`.catch(() => {});
    await this.prisma.$executeRaw`DELETE FROM public.bc_customers WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid`;
  }

  async findCustomerLogs(customerId: string, userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT l.* FROM public.bc_customer_logs l
      JOIN public.bc_customers c ON c.id = l.customer_id
      WHERE l.customer_id = ${customerId}::uuid AND c.owner_user_id = ${userId}::uuid
      ORDER BY l.occurred_at DESC
    `.catch(() => []);
  }

  async insertCustomerLog(data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customer_logs (
        id, customer_id, kind, body, occurred_at, created_at, updated_at
      ) VALUES (
        ${data.id}::uuid, ${data.customerId}::uuid, ${data.kind}::public.bc_customer_log_kind,
        ${data.body}, ${data.occurredAt}, now(), now()
      )
    `;
    if (data.updateCustomerLastContact) {
      await this.prisma.$executeRaw`
        UPDATE public.bc_customers
        SET last_contact_at = ${data.occurredAt}, updated_at = now()
        WHERE id = ${data.customerId}::uuid
      `.catch(() => {});
    }
  }

  async deleteCustomerLog(logId: string, customerId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_logs
      WHERE id = ${logId}::uuid AND customer_id = ${customerId}::uuid
    `;
  }

  async findCustomerTags(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.bc_customer_tags
      WHERE owner_user_id = ${userId}::uuid
      ORDER BY name ASC
    `.catch(() => []);
  }

  async findTagByName(userId: string, name: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customer_tags
      WHERE owner_user_id = ${userId}::uuid AND LOWER(name) = LOWER(${name})
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async insertCustomerTag(data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customer_tags (id, owner_user_id, name, color_hex, category, created_at, updated_at)
      VALUES (${data.id}::uuid, ${data.ownerUserId}::uuid, ${data.name}, ${data.colorHex}, ${data.category}, now(), now())
    `;
  }

  async updateCustomerTag(tagId: string, userId: string, data: any): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.bc_customer_tags
      SET name = COALESCE(${data.name}, name),
          color_hex = COALESCE(${data.colorHex}, color_hex),
          category = COALESCE(${data.category}, category),
          updated_at = now()
      WHERE id = ${tagId}::uuid AND owner_user_id = ${userId}::uuid
    `;
  }

  async deleteCustomerTag(tagId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`DELETE FROM public.bc_customer_tag_links WHERE tag_id = ${tagId}::uuid`.catch(() => {});
    await this.prisma.$executeRaw`DELETE FROM public.bc_customer_tags WHERE id = ${tagId}::uuid AND owner_user_id = ${userId}::uuid`;
  }

  async setCustomerTags(customerId: string, tagIds: string[]): Promise<void> {
    await this.prisma.$executeRaw`DELETE FROM public.bc_customer_tag_links WHERE customer_id = ${customerId}::uuid`.catch(() => {});
    for (const tagId of tagIds) {
      await this.prisma.$executeRaw`
        INSERT INTO public.bc_customer_tag_links (customer_id, tag_id, created_at)
        VALUES (${customerId}::uuid, ${tagId}::uuid, now())
        ON CONFLICT DO NOTHING
      `.catch(() => {});
    }
  }

  async findCustomerNeeds(customerId: string, userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT n.* FROM public.bc_customer_needs n
      JOIN public.bc_customers c ON c.id = n.customer_id
      WHERE n.customer_id = ${customerId}::uuid AND c.owner_user_id = ${userId}::uuid
      ORDER BY n.created_at DESC
    `.catch(() => []);
  }

  async insertCustomerNeed(data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customer_needs (
        id, customer_id, kind, body, status, priority, created_at, updated_at
      ) VALUES (
        ${data.id}::uuid, ${data.customerId}::uuid, ${data.kind}::public.bc_customer_need_kind,
        ${data.body}, ${data.status}::public.bc_customer_need_status,
        ${data.priority}::public.bc_customer_need_priority, now(), now()
      )
    `;
  }

  async updateCustomerNeed(needId: string, customerId: string, data: any): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.bc_customer_needs
      SET kind = COALESCE(${data.kind}::public.bc_customer_need_kind, kind),
          body = COALESCE(${data.body}, body),
          status = COALESCE(${data.status}::public.bc_customer_need_status, status),
          priority = COALESCE(${data.priority}::public.bc_customer_need_priority, priority),
          updated_at = now()
      WHERE id = ${needId}::uuid AND customer_id = ${customerId}::uuid
    `;
  }

  async checkNeedOwnership(needId: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT n.id FROM public.bc_customer_needs n
      JOIN public.bc_customers c ON n.customer_id = c.id
      WHERE n.id = ${needId}::uuid AND c.owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);
    return existing.length > 0;
  }

  async deleteCustomerNeed(needId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_needs WHERE id = ${needId}::uuid
    `;
  }

  async findAiContextForCustomer(customerId: string, userId: string): Promise<{
    customer: any | null;
    logs: any[];
    needs: any[];
    existingTags: any[];
    currentTags: any[];
    feedback: any[];
  }> {
    const [customers, logs, needs, existingTags, currentTags, feedback] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT display_name, company_name, stage, note FROM public.bc_customers
        WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid LIMIT 1
      `.catch(() => [] as any[]),
      this.prisma.$queryRaw<any[]>`
        SELECT kind, body, occurred_at FROM public.bc_customer_logs
        WHERE customer_id = ${customerId}::uuid ORDER BY occurred_at DESC LIMIT 20
      `.catch(() => [] as any[]),
      this.prisma.$queryRaw<any[]>`
        SELECT kind, body, status, priority FROM public.bc_customer_needs
        WHERE customer_id = ${customerId}::uuid ORDER BY created_at DESC LIMIT 20
      `.catch(() => [] as any[]),
      this.prisma.$queryRaw<any[]>`
        SELECT name FROM public.bc_customer_tags WHERE owner_user_id = ${userId}::uuid
      `.catch(() => [] as any[]),
      this.prisma.$queryRaw<any[]>`
        SELECT t.name FROM public.bc_customer_tags t
        JOIN public.bc_customer_tag_links l ON t.id = l.tag_id
        WHERE l.customer_id = ${customerId}::uuid
      `.catch(() => [] as any[]),
      this.prisma.$queryRaw<any[]>`
        SELECT tag_name, verdict FROM public.bc_customer_tag_suggestion_feedback
        WHERE customer_id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
      `.catch(() => [] as any[]),
    ]);

    return {
      customer: customers[0] || null,
      logs,
      needs,
      existingTags,
      currentTags,
      feedback,
    };
  }

  async insertTagSuggestionRun(runId: string, customerId: string, userId: string, suggestionsJson: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customer_tag_suggestion_runs (
        id, customer_id, owner_user_id, suggestions, created_at
      ) VALUES (
        ${runId}::uuid, ${customerId}::uuid, ${userId}::uuid, ${suggestionsJson}::jsonb, now()
      )
    `;
  }

  async findTagSuggestionRuns(customerId: string, userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, customer_id, created_at, suggestions FROM public.bc_customer_tag_suggestion_runs
      WHERE customer_id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT 10
    `.catch(() => [] as any[]);
  }

  async saveTagFeedback(customerId: string, userId: string, tagName: string, verdict: string, runId?: string): Promise<void> {
    const now = new Date();
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customer_tag_suggestion_feedback
      WHERE customer_id = ${customerId}::uuid
        AND owner_user_id = ${userId}::uuid
        AND tag_name = ${tagName}
      LIMIT 1
    `.catch(() => [] as any[]);

    if (existing.length > 0) {
      await this.prisma.$executeRaw`
        UPDATE public.bc_customer_tag_suggestion_feedback
        SET verdict = ${verdict},
            run_id = ${runId || null}::uuid,
            updated_at = ${now}
        WHERE id = ${existing[0].id}::uuid
      `;
    } else {
      const feedbackId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.bc_customer_tag_suggestion_feedback (
          id, customer_id, owner_user_id, run_id, tag_name, verdict, created_at, updated_at
        ) VALUES (
          ${feedbackId}::uuid, ${customerId}::uuid, ${userId}::uuid, ${runId || null}::uuid, ${tagName}, ${verdict}, ${now}, ${now}
        )
      `;
    }
  }

  async listTagFeedback(customerId: string, userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, customer_id, run_id, tag_name, verdict, created_at, updated_at
      FROM public.bc_customer_tag_suggestion_feedback
      WHERE customer_id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
      ORDER BY updated_at DESC
    `.catch(() => [] as any[]);
  }

  async cardScanResolve(
    userId: string,
    email: string | null,
    phone: string | null,
    phoneDigits: string | null,
    name: string | null,
    company: string | null,
    domain: string | null,
  ): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      WITH matches AS (
        SELECT
          'g:' || g.id::text AS person_id,
          'guest'::text AS kind,
          g.display_name AS display_name,
          g.title AS title,
          g.company_name AS company_name,
          (${email} IS NOT NULL AND g.email = ${email}) AS email_hit,
          (${phoneDigits} IS NOT NULL AND g.phone IS NOT NULL
            AND regexp_replace(g.phone, '[^0-9]', '', 'g') = ${phoneDigits}) AS phone_hit,
          (${name} IS NOT NULL AND g.display_name IS NOT NULL
            AND lower(regexp_replace(btrim(g.display_name), '\\s+', ' ', 'g')) = ${name}) AS name_hit,
          (${company} IS NOT NULL AND g.company_name IS NOT NULL
            AND lower(regexp_replace(btrim(g.company_name), '\\s+', ' ', 'g')) = ${company}) AS company_hit,
          (${domain} IS NOT NULL AND g.email IS NOT NULL
            AND lower(split_part(g.email, '@', 2)) = ${domain}) AS domain_hit
        FROM public.guest_contacts g
        WHERE g.owner_user_id = ${userId}::uuid
          AND (
            (${email} IS NOT NULL AND g.email = ${email})
            OR (${phoneDigits} IS NOT NULL AND g.phone IS NOT NULL
                AND regexp_replace(g.phone, '[^0-9]', '', 'g') = ${phoneDigits})
            OR (${name} IS NOT NULL AND g.display_name IS NOT NULL
                AND lower(regexp_replace(btrim(g.display_name), '\\s+', ' ', 'g')) = ${name})
            OR (${company} IS NOT NULL AND g.company_name IS NOT NULL
                AND lower(regexp_replace(btrim(g.company_name), '\\s+', ' ', 'g')) = ${company})
          )

        UNION ALL

        SELECT
          'c:' || c.id::text,
          'saved_card'::text,
          c.display_name,
          c.professional_title,
          c.company_name,
          (${email} IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = ${email}),
          (${phoneDigits} IS NOT NULL AND c.work_phone IS NOT NULL
            AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = ${phoneDigits}),
          (${name} IS NOT NULL AND c.display_name IS NOT NULL
            AND lower(regexp_replace(btrim(c.display_name), '\\s+', ' ', 'g')) = ${name}),
          (${company} IS NOT NULL AND c.company_name IS NOT NULL
            AND lower(regexp_replace(btrim(c.company_name), '\\s+', ' ', 'g')) = ${company}),
          (${domain} IS NOT NULL AND c.work_email IS NOT NULL
            AND lower(split_part(btrim(c.work_email), '@', 2)) = ${domain})
        FROM public.saved_business_cards s
        JOIN public.member_business_cards c ON c.id = s.target_card_id
        WHERE s.owner_user_id = ${userId}::uuid
          AND s.archived = false
          AND (
            (${email} IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = ${email})
            OR (${phoneDigits} IS NOT NULL AND c.work_phone IS NOT NULL
                AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = ${phoneDigits})
            OR (${name} IS NOT NULL AND c.display_name IS NOT NULL
                AND lower(regexp_replace(btrim(c.display_name), '\\s+', ' ', 'g')) = ${name})
            OR (${company} IS NOT NULL AND c.company_name IS NOT NULL
                AND lower(regexp_replace(btrim(c.company_name), '\\s+', ' ', 'g')) = ${company})
          )

        UNION ALL

        SELECT
          'u:' || cp.counterpart::text,
          'connection'::text,
          c.display_name,
          c.professional_title,
          c.company_name,
          (${email} IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = ${email}),
          (${phoneDigits} IS NOT NULL AND c.work_phone IS NOT NULL
            AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = ${phoneDigits}),
          (${name} IS NOT NULL AND c.display_name IS NOT NULL
            AND lower(regexp_replace(btrim(c.display_name), '\\s+', ' ', 'g')) = ${name}),
          (${company} IS NOT NULL AND c.company_name IS NOT NULL
            AND lower(regexp_replace(btrim(c.company_name), '\\s+', ' ', 'g')) = ${company}),
          (${domain} IS NOT NULL AND c.work_email IS NOT NULL
            AND lower(split_part(btrim(c.work_email), '@', 2)) = ${domain})
        FROM (
          SELECT DISTINCT
            CASE WHEN uc.pair_user_low = ${userId}::uuid THEN uc.pair_user_high ELSE uc.pair_user_low END AS counterpart
          FROM public.user_connections uc
          WHERE uc.status = 'accepted'
            AND uc.blocked_by_user_id IS NULL
            AND (uc.pair_user_low = ${userId}::uuid OR uc.pair_user_high = ${userId}::uuid)
        ) cp
        JOIN public.member_business_cards c
          ON c.owner_user_id = cp.counterpart AND c.status = 'published'
        WHERE (
          (${email} IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = ${email})
          OR (${phoneDigits} IS NOT NULL AND c.work_phone IS NOT NULL
              AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = ${phoneDigits})
          OR (${name} IS NOT NULL AND c.display_name IS NOT NULL
              AND lower(regexp_replace(btrim(c.display_name), '\\s+', ' ', 'g')) = ${name})
          OR (${company} IS NOT NULL AND c.company_name IS NOT NULL
              AND lower(regexp_replace(btrim(c.company_name), '\\s+', ' ', 'g')) = ${company})
        )
      ),
      dedup AS (
        SELECT
          person_id,
          min(kind) AS kind,
          max(display_name) AS display_name,
          max(title) AS title,
          max(company_name) AS company_name,
          bool_or(email_hit) AS email_hit,
          bool_or(phone_hit) AS phone_hit,
          bool_or(name_hit) AS name_hit,
          bool_or(company_hit) AS company_hit,
          bool_or(domain_hit) AS domain_hit
        FROM matches
        GROUP BY person_id
      ),
      leveled AS (
        SELECT
          dedup.*,
          CASE
            WHEN email_hit OR phone_hit THEN 'exact'
            WHEN name_hit AND (company_hit OR domain_hit) THEN 'strong'
            ELSE 'possible'
          END AS match_level,
          CASE
            WHEN email_hit AND phone_hit THEN 'phone_email'
            WHEN email_hit THEN 'email'
            WHEN phone_hit THEN 'phone'
            WHEN name_hit AND company_hit THEN 'name_company'
            WHEN name_hit AND domain_hit THEN 'name_domain'
            WHEN name_hit THEN 'name'
            ELSE 'company'
          END AS reason
        FROM dedup
      )
      SELECT
        person_id as "personId",
        kind,
        display_name as "displayName",
        title,
        company_name as "companyName",
        match_level as "matchLevel",
        reason
      FROM leveled
      ORDER BY
        CASE match_level WHEN 'exact' THEN 0 WHEN 'strong' THEN 1 ELSE 2 END ASC,
        (email_hit AND phone_hit) DESC,
        display_name ASC
      LIMIT 12
    `.catch(() => [] as any[]);
  }

  async findReplayGuestContact(userId: string, clientToken: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, display_name, title, company_name FROM public.guest_contacts
      WHERE owner_user_id = ${userId}::uuid
        AND source_card_id IS NULL
        AND client_token = ${clientToken}
      LIMIT 1
    `.catch(() => [] as any[]);
    return rows[0] || null;
  }

  async findTargetGuestContact(targetGuestId: string, userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, display_name, phone, email, company_name, title, website, address FROM public.guest_contacts
      WHERE id = ${targetGuestId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);
    return rows[0] || null;
  }

  async updateGuestContactFromCard(targetGuestId: string, scanId: string, fields: any): Promise<void> {
    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.guest_contacts SET
        display_name = ${fields.displayName},
        phone = ${fields.phone},
        email = ${fields.email},
        company_name = ${fields.companyName},
        title = ${fields.title},
        website = ${fields.website},
        address = ${fields.address},
        capture_scan_id = ${scanId}::uuid,
        last_shared_at = ${now},
        updated_at = ${now}
      WHERE id = ${targetGuestId}::uuid
    `;
  }

  async insertGuestContactFromCard(guestId: string, userId: string, scanId: string, clientToken: string, fields: any): Promise<void> {
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.guest_contacts (
        id, owner_user_id, source_card_id, display_name, phone, email, company_name, title,
        website, address, source, client_token, first_captured_at, capture_scan_id, created_at, updated_at,
        first_shared_at, last_shared_at
      ) VALUES (
        ${guestId}::uuid, ${userId}::uuid, NULL, ${fields.displayName}, ${fields.phone}, ${fields.email}, ${fields.companyName}, ${fields.title},
        ${fields.website}, ${fields.address}, 'business_card_scan', ${clientToken}, ${now}, ${scanId}::uuid, ${now}, ${now},
        ${now}, ${now}
      )
    `;
  }
}
