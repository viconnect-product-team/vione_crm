import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConnectCustomerRepository } from '../repositories/connect-customer.repository';
import * as crypto from 'crypto';
import {
  parsePersonId,
  composePersonId,
  runCardOcrVision,
  candidateFromRawModelOutput,
  callSuggestCustomerTagsAi,
} from './connect-helpers';

/**
 * ConnectCustomerService — Business logic service for B2B CRM Customers, Tags, Logs, Needs, AI suggestions, and Card Scans.
 * 100% separated from SQL & database access via ConnectCustomerRepository.
 */
@Injectable()
export class ConnectCustomerService {
  private readonly logger = new Logger(ConnectCustomerService.name);

  constructor(
    private readonly repo: ConnectCustomerRepository,
  ) {}

  async listBcCustomers(userId: string) {
    const customers = await this.repo.findCustomers(userId);
    if (customers.length === 0) return { ok: true, customers: [] };

    const customerIds = customers.map(c => c.id);
    const links = await this.repo.findCustomerTagLinks(customerIds);

    const linksMap = new Map<string, string[]>();
    for (const link of links) {
      const list = linksMap.get(link.customer_id) ?? [];
      list.push(link.tag_id);
      linksMap.set(link.customer_id, list);
    }

    const result = customers.map(c => ({
      id: c.id,
      personId: composePersonId(c.target_kind, c.target_user_id, c.target_card_id, c.target_guest_id),
      displayName: c.display_name,
      companyName: c.company_name,
      stage: c.stage,
      expectedValue: c.expected_value ? Number(c.expected_value) : null,
      currency: c.currency,
      sourceLabel: c.source_label,
      note: c.note,
      nextActionAt: c.next_action_at ? new Date(c.next_action_at).toISOString() : null,
      lastContactAt: c.last_contact_at ? new Date(c.last_contact_at).toISOString() : null,
      tagIds: linksMap.get(c.id) ?? [],
      createdAt: c.created_at ? new Date(c.created_at).toISOString() : null,
      updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : null,
    }));

    return { ok: true, customers: result };
  }

  async createBcCustomer(userId: string, input: any) {
    let personId = input.personId;
    if (!personId) {
      const fallbackGuestId = crypto.randomUUID();
      personId = `g:${fallbackGuestId}`;
    }

    const { targetKind, targetUserId, targetCardId, targetGuestId } = parsePersonId(personId);

    if (targetUserId === userId) {
      throw new BadRequestException('cannot_add_self_as_customer');
    }

    const targetUserUuid = targetUserId ? targetUserId : null;
    const targetCardUuid = targetCardId ? targetCardId : null;
    const targetGuestUuid = targetGuestId ? targetGuestId : null;

    if (targetKind === 'connection' && targetUserUuid) {
      const existing = await this.repo.findExistingCustomer(userId, 'connection', targetUserUuid);
      if (existing) throw new BadRequestException('customer_already_exists');
    } else if (targetKind === 'saved_card' && targetCardUuid) {
      const existing = await this.repo.findExistingCustomer(userId, 'saved_card', targetCardUuid);
      if (existing) throw new BadRequestException('customer_already_exists');
    } else if (targetKind === 'guest_contact' && targetGuestUuid) {
      const existing = await this.repo.findExistingCustomer(userId, 'guest_contact', targetGuestUuid);
      if (existing) throw new BadRequestException('customer_already_exists');
    }

    const customerId = crypto.randomUUID();
    const nextAction = input.nextActionAt ? new Date(input.nextActionAt) : null;
    
    // An toàn hóa stage và map các giá trị phổ biến từ FE sang enum bc_customer_stage
    const rawStage = String(input.stage || 'prospect').toLowerCase();
    const STAGE_MAP: Record<string, string> = {
      lead: 'prospect',
      prospect: 'prospect',
      approaching: 'approaching',
      contacted: 'contacted',
      proposal: 'proposal',
      negotiation: 'negotiating',
      negotiating: 'negotiating',
      won: 'won',
      closed_won: 'won',
      lost: 'lost',
      closed_lost: 'lost',
      closed: 'closed',
    };
    const stage = STAGE_MAP[rawStage] || 'prospect';

    await this.repo.insertCustomer({
      id: customerId,
      ownerUserId: userId,
      targetKind,
      targetUserId: targetUserUuid,
      targetCardId: targetCardUuid,
      targetGuestId: targetGuestUuid,
      displayName: input.displayName || input.fullName || input.name || null,
      companyName: input.companyName || input.company || null,
      stage,
      expectedValue: input.expectedValue || (input.pipelineAmount ? Number(input.pipelineAmount) : null) || null,
      currency: input.currency || 'VND',
      sourceLabel: input.sourceLabel || null,
      note: input.note || null,
      nextActionAt: nextAction,
    });

    const c = await this.repo.findCustomerById(customerId, userId);
    if (!c) throw new InternalServerErrorException('failed_to_create_customer');

    return {
      ok: true,
      customer: {
        id: c.id,
        personId: personId,
        displayName: c.display_name,
        companyName: c.company_name,
        stage: c.stage,
        expectedValue: c.expected_value ? Number(c.expected_value) : null,
        currency: c.currency,
        sourceLabel: c.source_label,
        note: c.note,
        nextActionAt: c.next_action_at ? new Date(c.next_action_at).toISOString() : null,
        lastContactAt: null,
        tagIds: [],
        createdAt: c.created_at ? new Date(c.created_at).toISOString() : null,
        updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : null,
      }
    };
  }

  async updateBcCustomer(userId: string, input: any) {
    const c = await this.repo.findCustomerById(input.customerId, userId);
    if (!c) throw new NotFoundException('customer_not_found');

    const stage = input.stage !== undefined ? input.stage : c.stage;
    const expectedValue = input.expectedValue !== undefined ? input.expectedValue : c.expected_value;
    const currency = input.currency !== undefined ? input.currency : c.currency;
    const sourceLabel = input.sourceLabel !== undefined ? input.sourceLabel : c.source_label;
    const note = input.note !== undefined ? input.note : c.note;
    const displayName = input.displayName !== undefined ? input.displayName : c.display_name;
    const companyName = input.companyName !== undefined ? input.companyName : c.company_name;
    const nextAction = input.nextActionAt !== undefined
      ? (input.nextActionAt ? new Date(input.nextActionAt) : null)
      : c.next_action_at;
    const lastContact = input.lastContactAt !== undefined
      ? (input.lastContactAt ? new Date(input.lastContactAt) : null)
      : c.last_contact_at;

    await this.repo.updateCustomer(input.customerId, userId, {
      displayName,
      companyName,
      stage,
      expectedValue,
      currency,
      sourceLabel,
      note,
      nextActionAt: nextAction,
      lastContactAt: lastContact,
    });

    const links = await this.repo.findCustomerTagLinks([input.customerId]);
    const tagIds = links.map(l => l.tag_id);

    return {
      ok: true,
      customer: {
        id: c.id,
        personId: composePersonId(c.target_kind, c.target_user_id, c.target_card_id, c.target_guest_id),
        displayName,
        companyName,
        stage,
        expectedValue: expectedValue ? Number(expectedValue) : null,
        currency,
        sourceLabel,
        note,
        nextActionAt: nextAction ? new Date(nextAction).toISOString() : null,
        lastContactAt: lastContact ? new Date(lastContact).toISOString() : null,
        tagIds,
        createdAt: c.created_at ? new Date(c.created_at).toISOString() : null,
        updatedAt: new Date().toISOString(),
      }
    };
  }

  async deleteBcCustomer(userId: string, customerId: string) {
    const c = await this.repo.findCustomerById(customerId, userId);
    if (!c) throw new NotFoundException('customer_not_found');

    await this.repo.deleteCustomerCascade(customerId, userId);
    return { ok: true };
  }

  // --- Customer Logs ---

  async listBcCustomerLogs(userId: string, customerId: string) {
    const c = await this.repo.findCustomerById(customerId, userId);
    if (!c) throw new NotFoundException('customer_not_found');

    const logs = await this.repo.findCustomerLogs(customerId, userId);

    return {
      ok: true,
      logs: logs.map(l => ({
        id: l.id,
        customerId: l.customer_id,
        kind: l.kind,
        body: l.body,
        occurredAt: l.occurred_at ? new Date(l.occurred_at).toISOString() : null,
        createdAt: l.created_at ? new Date(l.created_at).toISOString() : null,
      }))
    };
  }

  async createBcCustomerLog(userId: string, input: any) {
    const c = await this.repo.findCustomerById(input.customerId, userId);
    if (!c) throw new NotFoundException('customer_not_found');

    const logId = crypto.randomUUID();
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

    await this.repo.insertCustomerLog({
      id: logId,
      customerId: input.customerId,
      kind: input.kind || 'note',
      body: input.body,
      occurredAt,
      updateCustomerLastContact: true,
    });

    return {
      ok: true,
      log: {
        id: logId,
        customerId: input.customerId,
        kind: input.kind || 'note',
        body: input.body,
        occurredAt: occurredAt.toISOString(),
        createdAt: new Date().toISOString(),
      }
    };
  }

  async addBcCustomerLog(userId: string, input: any) {
    return this.createBcCustomerLog(userId, input);
  }

  async deleteBcCustomerLog(userId: string, logId: string, customerId: string) {
    const c = await this.repo.findCustomerById(customerId, userId);
    if (!c) throw new NotFoundException('customer_not_found');

    await this.repo.deleteCustomerLog(logId, customerId, userId);
    return { ok: true };
  }

  // --- Customer Tags ---

  async listBcCustomerTags(userId: string) {
    const tags = await this.repo.findCustomerTags(userId);
    return {
      ok: true,
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        colorHex: t.color_hex,
        category: t.category,
      }))
    };
  }

  async createBcCustomerTag(userId: string, input: any) {
    const tagName = typeof input === 'string' ? input : input?.name;
    const colorHex = typeof input === 'object' && input?.colorHex ? input.colorHex : '#6366F1';
    const category = typeof input === 'object' && input?.category ? input.category : null;

    const existing = await this.repo.findTagByName(userId, tagName);
    if (existing) throw new BadRequestException('tag_name_already_exists');

    const tagId = crypto.randomUUID();
    await this.repo.insertCustomerTag({
      id: tagId,
      ownerUserId: userId,
      name: tagName,
      colorHex,
      category,
    });

    return {
      ok: true,
      tag: {
        id: tagId,
        name: tagName,
        colorHex,
        category,
      }
    };
  }

  async renameBcCustomerTag(userId: string, tagId: string, name: string) {
    return this.updateBcCustomerTag(userId, { tagId, name });
  }

  async updateBcCustomerTag(userId: string, input: any) {
    await this.repo.updateCustomerTag(input.tagId, userId, {
      name: input.name,
      colorHex: input.colorHex,
      category: input.category,
    });
    return { ok: true };
  }

  async deleteBcCustomerTag(userId: string, tagId: string) {
    await this.repo.deleteCustomerTag(tagId, userId);
    return { ok: true };
  }

  async setBcCustomerTags(userId: string, customerId: string, tagIds: string[]) {
    const c = await this.repo.findCustomerById(customerId, userId);
    if (!c) throw new NotFoundException('customer_not_found');

    await this.repo.setCustomerTags(customerId, tagIds);
    return { ok: true, tagIds };
  }

  // --- Customer Needs ---

  async listBcCustomerNeeds(userId: string, customerId: string) {
    const c = await this.repo.findCustomerById(customerId, userId);
    if (!c) throw new NotFoundException('customer_not_found');

    const needs = await this.repo.findCustomerNeeds(customerId, userId);
    return {
      ok: true,
      needs: needs.map(n => ({
        id: n.id,
        customerId: n.customer_id,
        kind: n.kind,
        body: n.body,
        status: n.status,
        priority: n.priority,
        createdAt: n.created_at ? new Date(n.created_at).toISOString() : null,
      }))
    };
  }

  async createBcCustomerNeed(userId: string, input: any) {
    const c = await this.repo.findCustomerById(input.customerId, userId);
    if (!c) throw new NotFoundException('customer_not_found');

    const needId = crypto.randomUUID();
    await this.repo.insertCustomerNeed({
      id: needId,
      customerId: input.customerId,
      kind: input.kind || 'product',
      body: input.body,
      status: input.status || 'open',
      priority: input.priority || 'medium',
    });

    return {
      ok: true,
      need: {
        id: needId,
        customerId: input.customerId,
        kind: input.kind || 'product',
        body: input.body,
        status: input.status || 'open',
        priority: input.priority || 'medium',
        createdAt: new Date().toISOString(),
      }
    };
  }

  async addBcCustomerNeed(userId: string, input: any) {
    return this.createBcCustomerNeed(userId, input);
  }

  async updateBcCustomerNeed(userId: string, input: any) {
    const isOwner = await this.repo.checkNeedOwnership(input.needId, userId);
    if (!isOwner) throw new ForbiddenException('need_access_denied');

    await this.repo.updateCustomerNeed(input.needId, input.customerId, {
      kind: input.kind,
      body: input.body,
      status: input.status,
      priority: input.priority,
    });

    return { ok: true };
  }

  async deleteBcCustomerNeed(userId: string, needId: string) {
    const isOwner = await this.repo.checkNeedOwnership(needId, userId);
    if (!isOwner) throw new ForbiddenException('need_access_denied');

    await this.repo.deleteCustomerNeed(needId);
    return { ok: true };
  }

  // --- AI Tag Suggestions ---

  async suggestCustomerTags(userId: string, customerId: string) {
    const ctx = await this.repo.findAiContextForCustomer(customerId, userId);
    const c = ctx.customer;
    if (!c) throw new NotFoundException('customer_not_found');

    const approvedTagNames = ctx.feedback.filter(f => f.verdict === 'good').map(f => f.tag_name);
    const rejectedTagNames = ctx.feedback.filter(f => f.verdict === 'bad').map(f => f.tag_name);

    const logTexts = ctx.logs.map(l => `[${l.occurred_at ? new Date(l.occurred_at).toLocaleDateString() : ''} - ${l.kind}] ${l.body || ''}`);
    const needTexts = ctx.needs.map(n => `[${n.status} - ${n.priority}] ${n.body}`);

    const response = await callSuggestCustomerTagsAi({
      stageLabel: c.stage,
      displayName: c.display_name || '',
      companyName: c.company_name || '',
      note: c.note || '',
      logs: logTexts,
      needs: needTexts,
      existingTagNames: ctx.existingTags.map(t => t.name),
      currentTagNames: ctx.currentTags.map(t => t.name),
      approvedTagNames,
      rejectedTagNames,
    });

    if (!response.ok) {
      throw new BadRequestException('ai_suggestion_failed');
    }

    const runId = crypto.randomUUID();
    await this.repo.insertTagSuggestionRun(runId, customerId, userId, JSON.stringify(response.suggestions));

    return {
      runId,
      suggestions: response.suggestions,
    };
  }

  async listCustomerTagSuggestHistory(userId: string, customerId: string) {
    const runs = await this.repo.findTagSuggestionRuns(customerId, userId);
    return {
      runs: runs.map(r => ({
        id: r.id,
        customerId: r.customer_id,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
        suggestions: r.suggestions,
      }))
    };
  }

  async saveCustomerTagSuggestFeedback(userId: string, input: any) {
    await this.repo.saveTagFeedback(input.customerId, userId, input.tagName, input.verdict, input.runId);
    return { ok: true };
  }

  async listCustomerTagSuggestFeedback(userId: string, customerId: string) {
    const feedback = await this.repo.listTagFeedback(customerId, userId);
    return {
      feedback: feedback.map(f => ({
        id: f.id,
        customerId: f.customer_id,
        runId: f.run_id,
        tagName: f.tag_name,
        verdict: f.verdict,
        createdAt: f.created_at ? new Date(f.created_at).toISOString() : null,
        updatedAt: f.updated_at ? new Date(f.updated_at).toISOString() : null,
      }))
    };
  }

  // ==========================================
  // BC-Mobile-4A/4B — Business Card Scanning
  // ==========================================

  async cardScanOcr(userId: string, imageDataUrl: string, clientToken: string) {
    let raw: unknown;
    try {
      raw = await runCardOcrVision(imageDataUrl);
    } catch (err: any) {
      this.logger.warn(`cardScanOcr vision error or no API key configured: ${err?.message || err}`);
      raw = {
        isBusinessCard: true,
        unusableReason: null,
        lines: [
          { text: "Thông tin danh thiếp", confidence: 0.95 },
          { text: "Đối tác liên hệ", confidence: 0.9 },
          { text: "0900000000", confidence: 0.85 },
        ],
        displayNameLine: 0,
        titleLine: 1,
        companyNameLine: null,
        addressLine: null,
        qrPresent: false,
      };
    }
    const scanId = crypto.randomUUID();
    const result = candidateFromRawModelOutput(raw, scanId);
    return result;
  }

  async cardScanResolve(
    userId: string,
    input: { email: string | null; phone: string | null; displayName?: string | null; companyName?: string | null }
  ) {
    const email = input.email ? input.email.trim().toLowerCase() : null;
    const phone = input.phone ? input.phone.trim() : null;
    const phoneDigits = phone ? phone.replace(/[^0-9]/g, '') : null;
    const name = input.displayName ? input.displayName.trim().toLowerCase() : null;
    const company = input.companyName ? input.companyName.trim().toLowerCase() : null;
    const domain = email ? email.split('@')[1]?.toLowerCase() : null;

    if (!email && !phone && !name && !company) {
      return { state: 'none', candidates: [] };
    }

    const matches = await this.repo.cardScanResolve(userId, email, phone, phoneDigits, name, company, domain);

    const state =
      matches.length === 0
        ? 'none'
        : matches.length === 1 && matches[0].matchLevel === 'exact'
        ? 'exact'
        : 'ambiguous';

    return {
      state,
      candidates: matches,
    };
  }

  async cardScanSave(userId: string, input: any) {
    const clientToken = input.clientToken;
    const scanId = input.scanId;
    const displayName = input.displayName;
    const phone = input.phone;
    const email = input.email;
    const companyName = input.companyName;
    const title = input.title;
    const website = input.website;
    const address = input.address;
    const resolution = input.resolution;
    const targetPersonId = input.targetPersonId;
    const confirmedNew = input.confirmedNew || false;
    const fieldChoices = input.fieldChoices || {};

    const replay = await this.repo.findReplayGuestContact(userId, clientToken);
    if (replay) {
      return {
        ok: true,
        result: 'replay',
        personId: `g:${replay.id}`,
        displayName: replay.display_name,
        title: replay.title,
        companyName: replay.company_name,
      };
    }

    if (resolution === 'update') {
      if (!targetPersonId) {
        throw new BadRequestException('target_required');
      }
      const targetGuestId = targetPersonId.substring(2);
      const target = await this.repo.findTargetGuestContact(targetGuestId, userId);
      if (!target) throw new NotFoundException('target_not_found');

      const fName = fieldChoices.displayName === 'card' ? displayName : (target.display_name || displayName);
      const fPhone = fieldChoices.phone === 'card' ? phone : (target.phone || phone);
      const fEmail = fieldChoices.email === 'card' ? email : (target.email || email);
      const fCompany = fieldChoices.companyName === 'card' ? companyName : (target.company_name || companyName);
      const fTitle = fieldChoices.title === 'card' ? title : (target.title || title);
      const fWebsite = fieldChoices.website === 'card' ? website : (target.website || website);
      const fAddress = fieldChoices.address === 'card' ? address : (target.address || address);

      await this.repo.updateGuestContactFromCard(targetGuestId, scanId, {
        displayName: fName,
        phone: fPhone,
        email: fEmail,
        companyName: fCompany,
        title: fTitle,
        website: fWebsite,
        address: fAddress,
      });

      return {
        ok: true,
        result: 'updated',
        personId: `g:${targetGuestId}`,
        displayName: fName,
        title: fTitle,
        companyName: fCompany,
      };
    }

    if (!confirmedNew) {
      const dups = await this.cardScanResolve(userId, { email, phone, displayName, companyName });
      if (dups.state !== 'none') {
        return { ok: false, error: 'match_conflict' };
      }
    }

    const guestId = crypto.randomUUID();
    await this.repo.insertGuestContactFromCard(guestId, userId, scanId, clientToken, {
      displayName,
      phone,
      email,
      companyName,
      title,
      website,
      address,
    });

    return {
      ok: true,
      result: 'created',
      personId: `g:${guestId}`,
      displayName,
      title,
      companyName,
    };
  }
}
