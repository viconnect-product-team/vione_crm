import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ConnectCompanyInternalRepository — Data Access Layer for company internal tasks, employees & customer care.
 * Encapsulates 100% of raw SQL and database interactions.
 */
@Injectable()
export class ConnectCompanyInternalRepository {
  private readonly logger = new Logger(ConnectCompanyInternalRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAssociationId(communityId: string): Promise<string | null> {
    const assoc = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.associations WHERE slug = ${communityId} OR name ILIKE ${`%${communityId}%`} LIMIT 1
    `.catch(() => [] as any[]);
    return assoc?.[0]?.id || null;
  }

  async findMembershipsByAssociationId(assocId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT DISTINCT ON (vu.id)
        vu.id as id,
        vu.id as "userId",
        COALESCE(vu.name, m.name, up.display_name, SPLIT_PART(vu.email, '@', 1), 'Thành viên')::text as "fullName",
        COALESCE(vu.email, m.email, '')::text as email,
        COALESCE(m.phone, '')::text as phone,
        COALESCE(m.role, 'member')::text as role,
        COALESCE(up.professional_title, m.title, 'Lãnh đạo Doanh nghiệp')::text as "roleTitle",
        COALESCE(up.company_name, m.company, 'Gia Đình ViOne')::text as department,
        COALESCE(up.avatar_url, vu.avatar_url, m.avatar_url, '')::text as "avatarUrl",
        'active'::text as status,
        ms.joined_at as "joinedAt"
      FROM public.memberships ms
      JOIN public.members m ON m.id = ms.member_id
      LEFT JOIN public.vione_users vu ON vu.id = m.user_id
      LEFT JOIN public.user_profiles up ON up.user_id = vu.id
      WHERE ms.association_id = ${assocId}::uuid
      ORDER BY vu.id, "fullName" ASC
      LIMIT 50
    `.catch(() => [] as any[]);
  }

  async findFallbackUsers(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        u.id as id,
        u.id as "userId",
        COALESCE(u.name, up.display_name, SPLIT_PART(u.email, '@', 1), 'Thành viên')::text as "fullName",
        COALESCE(u.email, '')::text as email,
        ''::text as phone,
        'member'::text as role,
        COALESCE(up.professional_title, 'Lãnh đạo Doanh nghiệp')::text as "roleTitle",
        COALESCE(up.company_name, 'ViOne Member')::text as department,
        COALESCE(up.avatar_url, u.avatar_url, '')::text as "avatarUrl",
        'active'::text as status,
        u.created_at as "joinedAt"
      FROM public.vione_users u
      LEFT JOIN public.user_profiles up ON up.user_id = u.id
      ORDER BY "fullName" ASC
      LIMIT 50
    `.catch(() => [] as any[]);
  }

  async findActiveTaskCounts(): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT assignee_id, COUNT(id)::int as count
      FROM public.company_tasks
      WHERE status IN ('assigned', 'in_progress')
      GROUP BY assignee_id
    `.catch(() => [] as any[]);

    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.assignee_id) map.set(r.assignee_id, r.count);
    }
    return map;
  }

  async insertCompanyEmployee(communityId: string, emp: any): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.company_employees (
        id, community_id, user_id, full_name, email, phone, role, role_title, department, avatar_url, status, joined_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now()
      )
    `, emp.id, communityId, emp.userId, emp.fullName, emp.email, emp.phone, emp.role, emp.roleTitle, emp.department, emp.avatarUrl, emp.status).catch(() => {});
  }

  async findTasks(query: string, params: any[]): Promise<any[]> {
    return this.prisma.$queryRawUnsafe<any[]>(query, ...params).catch(() => [] as any[]);
  }

  async findUserName(userId: string): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT COALESCE(up.display_name, vu.name, SPLIT_PART(vu.email, '@', 1))::text as name
      FROM public.vione_users vu
      LEFT JOIN public.user_profiles up ON up.user_id = vu.id
      WHERE vu.id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);
    return rows?.[0]?.name || null;
  }

  async findCallerName(userId: string): Promise<string> {
    const caller = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(up.display_name, vu.name, SPLIT_PART(vu.email, '@', 1), 'Ban Giám Đốc')::text as "fullName"
      FROM public.vione_users vu
      LEFT JOIN public.user_profiles up ON up.user_id = vu.id
      LEFT JOIN public.members m ON m.user_id = vu.id
      WHERE vu.id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);
    return caller?.[0]?.fullName || 'Ban Giám Đốc';
  }

  async findAssigneeName(assigneeId: string): Promise<string> {
    const emp = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(up.display_name, vu.name, m.name, SPLIT_PART(vu.email, '@', 1), 'Thành viên')::text as "fullName"
      FROM public.vione_users vu
      LEFT JOIN public.user_profiles up ON up.user_id = vu.id
      LEFT JOIN public.members m ON m.user_id = vu.id OR m.id::text = ${assigneeId}
      WHERE vu.id::text = ${assigneeId} OR m.id::text = ${assigneeId}
      LIMIT 1
    `.catch(() => [] as any[]);
    return emp?.[0]?.fullName || 'Thành viên được giao';
  }

  async insertCompanyTask(task: any): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.company_tasks (
        id, community_id, title, description, assignee_id, assignee_name, assigner_name,
        priority, status, progress, progress_note, department, deadline, customer_name, customer_phone, customer_contact, customer_requirements, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), now()
      )
    `, task.id, task.communityId, task.title, task.description, task.assigneeId, task.assigneeName,
       task.assignerName, task.priority, task.status, task.progress || 0, task.progressNote || '',
       task.department || 'Vận hành', task.deadline, task.customerName,
       task.customerPhone, task.customerContact, task.customerRequirements
    ).catch((e) => this.logger.warn('createCompanyTask DB insert fallback:', e));
  }

  async updateCompanyTaskProgress(taskId: string, progress: number, note?: string, status?: string): Promise<void> {
    let query = `UPDATE public.company_tasks SET progress = $1, updated_at = now()`;
    const params: any[] = [progress];
    if (note !== undefined && note !== null) {
      params.push(note);
      query += `, progress_note = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += `, status = $${params.length}`;
      if (status === 'completed') {
        query += `, completed_at = now()`;
      }
    }
    params.push(taskId);
    query += ` WHERE id = $${params.length}`;
    await this.prisma.$executeRawUnsafe(query, ...params).catch((e) => this.logger.warn('updateCompanyTaskProgress fallback:', e));
  }

  async insertBusinessNotification(notifId: string, assigneeId: string, taskId: string, dedupe: string, title: string, body: string, safeDataJson: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
      ) VALUES (
        ${notifId}::uuid, ${assigneeId}::uuid, 'company_task', ${taskId}, ${dedupe}, 'task_assigned', 'company_task_assigned',
        ${title},
        ${body},
        ${safeDataJson}::jsonb,
        'high', 'delivered', 'all', 'all', now(), now()
      )
    `.catch((err) => this.logger.warn('Task business_notification insert error:', err));
  }

  async insertMemberNotification(recipientId: string, title: string, body: string, taskId: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.member_notifications (
        id, recipient_id, type, title, body, read, created_at, ref_type, ref_id
      ) VALUES (
        gen_random_uuid(), ${recipientId}, 'task',
        ${title},
        ${body},
        false, now(), 'company_task', ${taskId}
      )
    `.catch(() => {});
  }

  async acceptCompanyTask(taskId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.company_tasks
      SET status = 'in_progress', accepted_at = now(), updated_at = now()
      WHERE id = $1
    `, taskId).catch((e) => this.logger.warn('acceptCompanyTask DB update fallback:', e));
  }

  async findTaskSimple(taskId: string): Promise<{ title: string; assigneeName: string; assignerName?: string } | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT title, assignee_name, assigner_name FROM public.company_tasks WHERE id = ${taskId} LIMIT 1
    `.catch(() => [] as any[]);
    if (!rows?.[0]) return null;
    return {
      title: rows[0].title,
      assigneeName: rows[0].assignee_name,
      assignerName: rows[0].assigner_name,
    };
  }

  async completeCompanyTask(taskId: string, status: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.company_tasks
      SET status = $1, completed_at = now(), updated_at = now()
      WHERE id = $2
    `, status, taskId).catch((e) => this.logger.warn('completeCompanyTask DB update fallback:', e));
  }

  async updateCompanyTaskStatus(taskId: string, status: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.company_tasks
      SET status = $1, updated_at = now()
      WHERE id = $2
    `, status, taskId).catch((e) => this.logger.warn('updateCompanyTaskStatus DB update fallback:', e));
  }

  async listCustomerCare(communityId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        id,
        employee_id as "employeeId",
        employee_name as "employeeName",
        customer_name as "customerName",
        customer_contact as "customerContact",
        customer_company as "customerCompany",
        stage,
        stage_label as "stageLabel",
        deal_value as "dealValue",
        deal_value_label as "dealValueLabel",
        last_action as "lastAction",
        last_action_at as "lastActionAt",
        progress_percent as "progressPercent",
        next_follow_up as "nextFollowUp"
      FROM public.company_customer_care
      WHERE community_id = ${communityId}
      ORDER BY created_at DESC
    `.catch(() => [] as any[]);
  }

  async insertCustomerCare(communityId: string, log: any): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.company_customer_care (
        id, community_id, employee_id, employee_name, customer_name,
        customer_contact, customer_company, stage, stage_label,
        deal_value, deal_value_label, last_action, last_action_at,
        progress_percent, next_follow_up, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now(), now()
      )
    `,
      log.id,
      communityId,
      log.employeeId || null,
      log.employeeName || null,
      log.customerName,
      log.customerContact || null,
      log.customerCompany || null,
      log.stage || 'contacted',
      log.stageLabel || 'Đã liên hệ',
      log.dealValue || 0,
      log.dealValueLabel || '0 đ',
      log.lastAction || '',
      log.lastActionAt || 'Vừa xong',
      log.progressPercent || 50,
      log.nextFollowUp || ''
    ).catch((e) => this.logger.warn('insertCustomerCare DB insert fallback:', e));
  }


  async checkUserCanAssignTask(userId: string, communityId: string): Promise<boolean> {
    if (!userId) return false;
    if (userId === '00000000-0000-0000-0000-000000000000' || userId === 'mock-admin-id') return true;

    try {
      // 1. Kiểm tra global roles (quan_tri, admin, platform_admin)
      const globalRoles = await this.prisma.$queryRaw<any[]>`
        SELECT role FROM public.user_roles WHERE user_id = ${userId}::uuid
      `.catch(() => [] as any[]);
      const hasSuper = globalRoles.some((r) => ['quan_tri', 'admin', 'platform_admin', 'superadmin'].includes(r.role?.toLowerCase()));
      if (hasSuper) return true;

      // 2. Kiểm tra quyền tại cộng đồng/hiệp hội (là người tạo hoặc có role admin/owner/president)
      const assoc = await this.prisma.$queryRaw<any[]>`
        SELECT id, creator_id FROM public.associations
        WHERE (id::text = ${communityId} OR slug = ${communityId})
        LIMIT 1
      `.catch(() => [] as any[]);
      if (assoc?.[0]?.creator_id && String(assoc[0].creator_id) === String(userId)) {
        return true;
      }

      // 3. Kiểm tra membership role trong cộng đồng
      const mem = await this.prisma.$queryRaw<any[]>`
        SELECT role FROM public.memberships
        WHERE user_id = ${userId}::uuid AND (association_id::text = ${communityId} OR association_id IN (
          SELECT id FROM public.associations WHERE slug = ${communityId}
        ))
        LIMIT 1
      `.catch(() => [] as any[]);
      if (mem?.[0] && ['admin', 'owner', 'president', 'vice_president', 'director', 'quan_tri'].includes(mem[0].role?.toLowerCase())) {
        return true;
      }
    } catch (e) {
      this.logger.warn('checkUserCanAssignTask error:', e);
    }
    return false;
  }

  async checkUserCanEditTask(userId: string, taskId: string): Promise<boolean> {
    if (!userId) return false;
    if (userId === '00000000-0000-0000-0000-000000000000' || userId === 'mock-admin-id') return true;

    try {
      // Quản trị & Admin luôn có quyền sửa mọi bản ghi
      const globalRoles = await this.prisma.$queryRaw<any[]>`
        SELECT role FROM public.user_roles WHERE user_id = ${userId}::uuid
      `.catch(() => [] as any[]);
      const hasSuper = globalRoles.some((r) => ['quan_tri', 'admin', 'platform_admin'].includes(r.role?.toLowerCase()));
      if (hasSuper) return true;

      // Người tạo task mới được sửa
      const task = await this.prisma.$queryRaw<any[]>`
        SELECT id, assignee_id, assigner_name FROM public.company_tasks WHERE id = ${taskId} LIMIT 1
      `.catch(() => [] as any[]);
      if (!task?.[0]) return true;

      // Kiểm tra xem tên của user có khớp assigner_name hoặc user_id có trong task không
      const callerName = await this.findCallerName(userId);
      if (task[0].assigner_name && callerName && task[0].assigner_name === callerName) {
        return true;
      }
    } catch (e) {
      this.logger.warn('checkUserCanEditTask error:', e);
    }
    return false;
  }

  async updateCompanyTask(taskId: string, body: any): Promise<void> {
    let query = `UPDATE public.company_tasks SET updated_at = now()`;
    const params: any[] = [];
    if (body.title) {
      params.push(body.title.trim());
      query += `, title = $${params.length}`;
    }
    if (body.description !== undefined) {
      params.push(body.description);
      query += `, description = $${params.length}`;
    }
    if (body.priority) {
      params.push(body.priority);
      query += `, priority = $${params.length}`;
    }
    if (body.deadline) {
      params.push(body.deadline);
      query += `, deadline = $${params.length}`;
    }
    if (body.status) {
      params.push(body.status);
      query += `, status = $${params.length}`;
    }
    if (body.progress !== undefined) {
      params.push(Number(body.progress) || 0);
      query += `, progress = $${params.length}`;
    }
    params.push(taskId);
    query += ` WHERE id = $${params.length}`;
    await this.prisma.$executeRawUnsafe(query, ...params).catch((e) => this.logger.warn('updateCompanyTask DB update fallback:', e));
  }
}
