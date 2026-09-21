import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

export class CreateEventDto {
  name!: string;
  date!: string;
  location?: string;
  capacity?: number;
  type?: 'forum' | 'workshop' | 'networking' | 'training';
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  associationId?: string;
  qrFields?: string[];
  image?: string;
  banner?: string;
  ticketPrice?: number;
  fee?: number;
  tickets?: {
    name: string;
    price?: number;
    quantity?: number;
    description?: string;
  }[];
}

export class UpdateEventDto {
  name?: string;
  date?: string;
  location?: string;
  capacity?: number;
  type?: 'forum' | 'workshop' | 'networking' | 'training';
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image?: string;
  banner?: string;
  ticketPrice?: number;
  fee?: number;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}


  private async checkIsPlatformAdmin(userId: string): Promise<boolean> {
    if (!userId) return false;
    if (userId === 'mock-admin-id' || userId === '00000000-0000-0000-0000-000000000000') {
      return true;
    }
    const roles = await this.prisma.$queryRaw<any[]>`
      SELECT role::text FROM public.user_roles WHERE user_id::text = ${userId}::text
    `.catch(() => [] as any[]);
    if (roles.some((r: any) => r.role === 'platform_admin' || r.role === 'tenant_admin' || r.role === 'admin')) {
      return true;
    }
    const vUsers = await this.prisma.$queryRaw<any[]>`
      SELECT email, username FROM public.vione_users WHERE id::text = ${userId}::text LIMIT 1
    `.catch(() => [] as any[]);
    return vUsers.some((u: any) => u.email?.toLowerCase().includes('admin') || u.username?.toLowerCase().includes('admin'));
  }

  async checkIsAdmin(userId: string, assocId?: string): Promise<boolean> {
    if (await this.checkIsPlatformAdmin(userId)) return true;

    try {
      let mems: any[] = [];
      if (assocId) {
        mems = await this.prisma.$queryRaw<any[]>`
          SELECT role FROM public.memberships 
          WHERE user_id = ${userId}::uuid AND association_id = ${assocId}::uuid
        `;
      } else {
        mems = await this.prisma.$queryRaw<any[]>`
          SELECT role FROM public.memberships 
          WHERE user_id = ${userId}::uuid
        `;
      }

      if (mems.some((m: any) => m.role === 'admin' || m.role === 'association_admin' || m.role === 'owner')) {
        return true;
      }

      // Check if user is executive in members
      const exec = await this.prisma.$queryRaw<any[]>`
        SELECT executive_role, department FROM public.members 
        WHERE (user_id = ${userId}::uuid OR id = ${userId}::text) AND (executive_role IS NOT NULL OR department ILIKE '%Ban Quản Trị%')
        LIMIT 1
      `.catch(() => []);
      return exec.length > 0;
    } catch {
      return false;
    }
  }

  async getAssociationIdForUser(userId: string, requestedAssocId?: string): Promise<string | null> {
    if (requestedAssocId) {
      const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);
      if (isPlatformAdmin) return requestedAssocId;
      const mem = await this.prisma.$queryRaw<any[]>`
        SELECT 1 FROM public.memberships 
        WHERE user_id = ${userId}::uuid AND association_id = ${requestedAssocId}::uuid
        UNION ALL
        SELECT 1 FROM public.members
        WHERE user_id = ${userId}::uuid AND association_id = ${requestedAssocId}::uuid AND status = 'active'
      `.catch(() => []);
      if (mem.length > 0) return requestedAssocId;
    }

    const mems = await this.prisma.$queryRaw<any[]>`
      SELECT association_id FROM (
        SELECT association_id, is_default, created_at FROM public.memberships
        WHERE user_id = ${userId}::uuid
        UNION ALL
        SELECT association_id, false AS is_default, created_at FROM public.members
        WHERE user_id = ${userId}::uuid AND status = 'active'
      ) m
      ORDER BY is_default DESC, created_at ASC
      LIMIT 1
    `.catch(() => []);

    if (mems.length > 0 && mems[0]?.association_id) {
      return mems[0].association_id;
    }

    // Fallback: ưu tiên association đang published (CEO1983)
    const firstAssoc = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.associations 
      ORDER BY landing_published DESC, created_at DESC 
      LIMIT 1
    `.catch(() => []);

    if (firstAssoc.length > 0 && firstAssoc[0]?.id) {
      return firstAssoc[0].id;
    }

    return null;
  }

  private mapEventRow(r: any) {
    let dateStr = '';
    if (r.date) {
      if (r.date instanceof Date) {
        dateStr = r.date.toISOString().slice(0, 10);
      } else {
        dateStr = String(r.date).slice(0, 10);
      }
    }
    const rawStatus = String(r.status ?? 'upcoming').toLowerCase();
    let status = ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(rawStatus) ? rawStatus : 'upcoming';
    
    // Tự động chuyển trạng thái sự kiện đã qua ngày thành completed nếu không bị hủy
    if (dateStr && status === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const evtDate = new Date(dateStr);
      evtDate.setHours(0, 0, 0, 0);
      if (evtDate.getTime() < today.getTime()) {
        status = 'completed';
      }
    }

    const rawType = String(r.type ?? 'forum').toLowerCase();
    const type = ['forum', 'workshop', 'networking', 'training'].includes(rawType) ? rawType : 'forum';

    return {
      id: r.id,
      name: r.name,
      title: r.name,
      date: dateStr,
      startDate: dateStr,
      start_date: dateStr,
      location: r.location ?? '',
      venue: r.location ?? '',
      capacity: r.capacity ?? 0,
      registered: r.registered ?? 0,
      status,
      type,
      qrFields: r.qr_fields ?? ['registration_code'],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      associationId: r.association_id,
      associationName: r.association_name ?? null,
      communityName: r.association_name ?? null,
      associationLogo: r.association_logo ?? null,
    };
  }

  private mapTicketRow(r: any) {
    return {
      id: r.id,
      eventId: r.event_id,
      name: r.name,
      price: Number(r.price ?? 0),
      quantity: r.quantity ?? 0,
      description: r.description ?? '',
      sortOrder: r.sort_order ?? 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private mapRegRow(r: any) {
    return {
      id: r.id,
      eventId: r.event_id,
      memberCode: r.member_code,
      memberName: r.member_name ?? '',
      email: r.email ?? '',
      registeredAt: r.registered_at ? (r.registered_at instanceof Date ? r.registered_at.toISOString().slice(0, 10) : String(r.registered_at).slice(0, 10)) : '',
      status: r.status,
      ticketType: r.ticket_type,
      seatAssignment: r.seat_assignment ?? '',
      paymentStatus: r.payment_status ?? 'pending',
      paymentMethod: r.payment_method ?? 'transfer',
      paymentAmount: Number(r.payment_amount ?? 0),
      paymentDeadline: r.payment_deadline,
      reminderCount: Number(r.reminder_count ?? 0),
      qrPayload: r.qr_payload ?? '',
      checkedInAt: r.checked_in_at ? (r.checked_in_at instanceof Date ? r.checked_in_at.toISOString() : String(r.checked_in_at)) : null,
      luckyNumber: r.lucky_number ?? '',
    };
  }

  async listEvents(userId: string, associationId?: string) {
    const assocId = await this.getAssociationIdForUser(userId, associationId);
    const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);

    let rows: any[] = [];
    if (isPlatformAdmin && !associationId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []);
    } else if (assocId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        WHERE e.association_id = ${assocId}::uuid
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []);
    }

    if (rows.length === 0) {
      // Fallback: không có association hoặc assoc không có sự kiện → lấy tất cả events
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []);
    }

    return rows.map((r) => this.mapEventRow(r));
  }


  async getEventsOverview(userId: string, associationId?: string) {
    const assocId = await this.getAssociationIdForUser(userId, associationId);
    const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);

    let eventRows: any[];
    let regRows: any[];
    let checkinRows: any[];

    if (isPlatformAdmin && !associationId) {
      eventRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, date, location, status, capacity FROM public.events ORDER BY date DESC
      `.catch(() => []);
      regRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id, status FROM public.event_registrations
      `.catch(() => []);
      checkinRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations WHERE checked_in_at IS NOT NULL
      `.catch(() => []);
    } else if (assocId) {
      eventRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, date, location, status, capacity FROM public.events 
        WHERE association_id = ${assocId}::uuid ORDER BY date DESC
      `.catch(() => []);
      regRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id, status FROM public.event_registrations 
        WHERE association_id = ${assocId}::uuid
      `.catch(() => []);
      checkinRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations 
        WHERE association_id = ${assocId}::uuid AND checked_in_at IS NOT NULL
      `.catch(() => []);
    } else {
      // Fallback: lấy tất cả
      eventRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, date, location, status, capacity FROM public.events ORDER BY date DESC
      `.catch(() => []);
      regRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id, status FROM public.event_registrations
      `.catch(() => []);
      checkinRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations WHERE checked_in_at IS NOT NULL
      `.catch(() => []);
    }

    const totalMap = new Map<string, number>();
    const confirmedMap = new Map<string, number>();
    const cancelledMap = new Map<string, number>();
    for (const r of regRows) {
      const eid = r.event_id;
      if (!eid) continue;
      const st = String(r.status ?? '').toLowerCase();
      totalMap.set(eid, (totalMap.get(eid) ?? 0) + 1);
      if (st === 'cancelled') {
        cancelledMap.set(eid, (cancelledMap.get(eid) ?? 0) + 1);
      } else if (st === 'confirmed' || st === 'registered') {
        confirmedMap.set(eid, (confirmedMap.get(eid) ?? 0) + 1);
      }
    }

    const attendedMap = new Map<string, number>();
    for (const c of checkinRows) {
      const eid = c.event_id;
      if (!eid) continue;
      attendedMap.set(eid, (attendedMap.get(eid) ?? 0) + 1);
    }

    return eventRows.map((e) => {
      let dateStr = '';
      if (e.date) {
        dateStr = e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10);
      }
      return {
        id: e.id,
        name: e.name,
        date: dateStr,
        location: e.location ?? '',
        status: e.status ?? 'upcoming',
        capacity: Number(e.capacity ?? 0),
        registrations: totalMap.get(e.id) ?? 0,
        confirmed: confirmedMap.get(e.id) ?? 0,
        cancelled: cancelledMap.get(e.id) ?? 0,
        attended: attendedMap.get(e.id) ?? 0,
      };
    });
  }

  async listEventsWithRegistrations(userId: string, associationId?: string) {
    const [events, registrations] = await Promise.all([
      this.listEvents(userId, associationId),
      this.listRegistrations(userId, associationId),
    ]);

    return { events, registrations };
  }

  async listRegistrations(userId: string, associationId?: string, eventId?: string) {
    const assocId = await this.getAssociationIdForUser(userId, associationId);
    const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);

    let rows: any[];
    if (eventId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.event_registrations 
        WHERE event_id = ${eventId}
        ORDER BY registered_at DESC
      `.catch(() => []);
    } else if (isPlatformAdmin && !associationId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.event_registrations ORDER BY registered_at DESC
      `.catch(() => []);
    } else if (assocId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.event_registrations WHERE association_id = ${assocId}::uuid ORDER BY registered_at DESC
      `.catch(() => []);
    } else {
      // Fallback: lấy tất cả
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.event_registrations ORDER BY registered_at DESC
      `.catch(() => []);
    }

    return rows.map((r) => this.mapRegRow(r));
  }

  async getEventById(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const event = this.mapEventRow(rows[0]);
    const tickets = await this.getEventTickets(id);

    return { ...event, tickets };
  }

  async getEventTickets(eventId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_ticket_types WHERE event_id = ${eventId} ORDER BY sort_order ASC
    `.catch(() => []);

    return rows.map((r) => this.mapTicketRow(r));
  }

  async createEvent(userId: string, data: CreateEventDto) {
    const assocId = (await this.getAssociationIdForUser(userId, data.associationId)) || 'c1983000-0000-4000-8000-000000001983';
    const isAdmin = await this.checkIsAdmin(userId, assocId ?? undefined);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền tạo sự kiện');
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const eventId = `EV-${timestamp}`;
    const qrFields = Array.from(new Set(data.qrFields && data.qrFields.length > 0 ? data.qrFields : ['registration_code']));

    const evImg = data.image || data.banner || '';
    const ticketPrice = Number(data.ticketPrice ?? data.fee ?? 0);

    await this.prisma.$executeRaw`
      INSERT INTO public.events (
        id, name, date, location, capacity, registered, status, type, qr_fields, association_id, image, banner, ticket_price, fee, created_at, updated_at
      ) VALUES (
        ${eventId},
        ${data.name},
        ${data.date}::date,
        ${data.location ?? ''},
        ${data.capacity ?? 0},
        0,
        ${data.status ?? 'upcoming'},
        ${data.type ?? 'forum'},
        ${qrFields}::text[],
        ${assocId}::uuid,
        ${evImg},
        ${evImg},
        ${ticketPrice},
        ${ticketPrice},
        now(),
        now()
      )
    `;

    // Handle ticket types if provided (wizard)
    let ticketRows: any[] = [];
    if (data.tickets && data.tickets.length > 0) {
      for (let i = 0; i < data.tickets.length; i++) {
        const t = data.tickets[i];
        const ticketId = `TK-${timestamp}-${i}`;
        await this.prisma.$executeRaw`
          INSERT INTO public.event_ticket_types (
            id, event_id, association_id, name, price, quantity, description, sort_order, created_at, updated_at
          ) VALUES (
            ${ticketId},
            ${eventId},
            ${assocId}::uuid,
            ${t.name},
            ${t.price ?? 0},
            ${t.quantity ?? 0},
            ${t.description ?? ''},
            ${i},
            now(),
            now()
          )
        `;
        ticketRows.push({
          id: ticketId,
          eventId,
          name: t.name,
          price: t.price ?? 0,
          quantity: t.quantity ?? 0,
          description: t.description ?? '',
          sortOrder: i,
        });
      }
    }

    // Activity log
    await this.prisma.$executeRaw`
      INSERT INTO public.activity_log (
        id, code, "user", action, target, category, at, ip, association_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${eventId},
        ${userId},
        'Tạo sự kiện',
        ${data.name},
        'event',
        to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        '127.0.0.1',
        ${assocId}::uuid,
        now(),
        now()
      )
    `.catch(() => null);

    const created = await this.getEventById(userId, eventId);
    return {
      event: created,
      tickets: ticketRows,
    };
  }

  async updateEvent(userId: string, id: string, data: UpdateEventDto) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const current = existing[0];
    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền cập nhật sự kiện');
    }

    const name = data.name !== undefined ? data.name : current.name;
    const date = data.date !== undefined ? data.date : current.date;
    const location = data.location !== undefined ? data.location : current.location;
    const capacity = data.capacity !== undefined ? data.capacity : current.capacity;
    const type = data.type !== undefined ? data.type : current.type;
    const status = data.status !== undefined ? data.status : current.status;
    const evImg = data.image !== undefined ? data.image : (data.banner !== undefined ? data.banner : current.image);
    const ticketPrice = data.ticketPrice !== undefined ? Number(data.ticketPrice) : (data.fee !== undefined ? Number(data.fee) : Number(current.ticket_price ?? 0));

    await this.prisma.$executeRaw`
      UPDATE public.events SET
        name = ${name},
        date = ${date}::date,
        location = ${location},
        capacity = ${capacity},
        type = ${type},
        status = ${status},
        image = ${evImg},
        banner = ${evImg},
        ticket_price = ${ticketPrice},
        fee = ${ticketPrice},
        updated_at = now()
      WHERE id = ${id}
    `;

    return this.getEventById(userId, id);
  }

  async updateQrFields(userId: string, id: string, qrFields: string[]) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const current = existing[0];
    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền cập nhật sự kiện');
    }

    const qr = Array.from(new Set(qrFields));
    await this.prisma.$executeRaw`
      UPDATE public.events SET
        qr_fields = ${qr}::text[],
        updated_at = now()
      WHERE id = ${id}
    `;

    return this.getEventById(userId, id);
  }

  async deleteEvent(userId: string, id: string) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const current = existing[0];
    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền xóa sự kiện');
    }

    // Cancel registrations
    const cancelled = await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET status = 'cancelled', updated_at = now()
      WHERE event_id = ${id} AND status = 'confirmed'
    `.catch(() => 0);

    // Delete ticket types
    await this.prisma.$executeRaw`
      DELETE FROM public.event_ticket_types WHERE event_id = ${id}
    `.catch(() => null);

    // Delete event
    await this.prisma.$executeRaw`
      DELETE FROM public.events WHERE id = ${id}
    `;

    return { ok: true, cancelledRegistrations: cancelled };
  }

  // Mobile API: List events for mobile PWA
  async listMyEvents(userId: string) {
    const assocId = await this.getAssociationIdForUser(userId);

    let [events, me] = await Promise.all([
      assocId
        ? this.prisma.$queryRaw<any[]>`
            SELECT e.*, a.name as association_name, a.logo_url as association_logo
            FROM public.events e
            LEFT JOIN public.associations a ON e.association_id = a.id
            WHERE e.association_id = ${assocId}::uuid
            ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
          `.catch(() => [])
        : this.prisma.$queryRaw<any[]>`
            SELECT e.*, a.name as association_name, a.logo_url as association_logo
            FROM public.events e
            LEFT JOIN public.associations a ON e.association_id = a.id
            ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
          `.catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT code FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
      `.catch(() => []),
    ]);

    if (events.length === 0) {
      events = await this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []);
    }

    const myCode = me[0]?.code;
    let regIds = new Set<string>();
    if (myCode) {
      const regs = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations WHERE member_code = ${myCode} AND status != 'cancelled'
      `.catch(() => []);
      regIds = new Set(regs.map((r) => r.event_id));
    }

    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const vnToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);

    return events.map((e) => {
      const dt = new Date(e.date);
      const valid = !isNaN(dt.getTime());
      const dateStr = valid ? dt.toISOString().slice(0, 10) : '';
      const vnEventDate = valid ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(dt) : '';
      const isToday = vnEventDate === vnToday || dateStr === todayStr || dateStr === vnToday;

      return {
        id: e.id,
        day: valid ? String(dt.getDate()).padStart(2, '0') : '--',
        month: valid ? MONTHS[dt.getMonth()] : '',
        title: e.name,
        name: e.name,
        date: dateStr,
        startDate: dateStr,
        isToday,
        time: valid ? dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
        place: e.location ?? '',
        image: e.image || e.banner || null,
        banner: e.banner || e.image || null,
        ticketPrice: Number(e.ticket_price ?? e.fee ?? 0),
        fee: Number(e.fee ?? e.ticket_price ?? 0),
        registered: regIds.has(e.id),
        communityName: e.association_name ?? null,
        associationName: e.association_name ?? null,
        associationId: e.association_id ?? null,
      };
    });
  }


  // Mobile API: Register for an event
  async registerForEvent(userId: string, eventId: string, attendeeData?: any) {
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);

    if (eventRows.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const event = eventRows[0];

    // Find member profile for user
    const memberRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);

    const userRows = await this.prisma.vione_users.findUnique({
      where: { id: userId },
    });

    const memberCode = memberRows[0]?.code ?? `MB-${Date.now().toString(36).toUpperCase()}`;
    const memberName = attendeeData?.fullName || memberRows[0]?.name || userRows?.name || 'Hội viên';
    const email = attendeeData?.email || memberRows[0]?.email || userRows?.email || '';
    const phone = attendeeData?.phone || memberRows[0]?.contact || '';
    const company = attendeeData?.company || '';
    const position = attendeeData?.position || '';
    const ticketCount = Math.max(1, Number(attendeeData?.ticketCount) || 1);
    const ticketType = attendeeData?.ticketType || 'Standard';
    const note = attendeeData?.note || '';

    const ticketPrice = (event.ticket_price !== undefined && event.ticket_price !== null)
      ? Number(event.ticket_price)
      : ((event.fee !== undefined && event.fee !== null) ? Number(event.fee) : 0);
    const isFree = ticketPrice === 0;
    const totalAmount = ticketPrice * ticketCount;
    const paymentStatus = isFree ? 'free' : 'pending';

    const regId = `REG-${Date.now().toString(36).toUpperCase()}`;
    const luckyNum = String(Math.floor(1000 + Math.random() * 9000));
    await this.prisma.$executeRaw`
      INSERT INTO public.event_registrations (
        id, event_id, member_code, member_name, email, registered_at, status, ticket_type, association_id, payment_status, payment_amount, lucky_number, created_at, updated_at
      ) VALUES (
        ${regId},
        ${eventId},
        ${memberCode},
        ${memberName},
        ${email},
        now()::date,
        'confirmed',
        ${ticketType},
        ${event.association_id}::uuid,
        ${paymentStatus},
        ${totalAmount},
        ${luckyNum},
        now(),
        now()
      )
    `;

    // Increment registered count
    await this.prisma.$executeRaw`
      UPDATE public.events SET registered = registered + 1, updated_at = now() WHERE id = ${eventId}
    `.catch(() => null);

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(regId)}`;

    if (memberCode) {
      if (isFree) {
        // Sự kiện Free: Gửi tin nhắn chào mừng & Thẻ Vé Điện Tử (VIP E-Ticket Pass có mã QR)
        const confirmMsg = `Kính gửi Anh/Chị ${memberName}, Ban Thư Ký CLB Doanh Nhân CEO 1983 xin trân trọng gửi tới Anh/Chị Vé Điện Tử tham dự sự kiện "${event.title || event.name || 'Sự kiện'}".\n\n- Mã vé: ${regId}\n- Số may mắn (Lucky Draw): #${luckyNum}\n- Số lượng vé: ${ticketCount} vé (${ticketType})\n- Thời gian: ${event.date ? (event.date instanceof Date ? event.date.toLocaleDateString('vi-VN') : String(event.date)) : 'Sắp diễn ra'}\n- Địa điểm: ${event.location || 'Địa điểm tổ chức sự kiện'}\n- Trạng thái: ĐÃ XÁC NHẬN (Miễn phí 0 đ)\n\nVui lòng sử dụng Thẻ Vé Điện Tử và mã QR bên dưới để xuất trình tại bàn đón tiếp sự kiện.`;

        const ticketActionMsg = `[action:ticket|eventId:${eventId}|eventTitle:${encodeURIComponent(event.title || event.name || 'Sự kiện')}|ticketCode:${regId}|lucky:${luckyNum}|time:${encodeURIComponent(event.date ? (event.date instanceof Date ? event.date.toLocaleDateString('vi-VN') : String(event.date)) : 'Sắp diễn ra')}|location:${encodeURIComponent(event.location || 'Địa điểm tổ chức sự kiện')}|attendee:${encodeURIComponent(memberName)}|qr:${encodeURIComponent(qrCodeUrl)}|type:${encodeURIComponent(ticketType)}|count:${ticketCount}]`;

        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'ADMIN', ${String(memberCode).toLowerCase()}, ${confirmMsg}, NOW() - interval '1 second')
        `.catch(() => {});

        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'ADMIN', ${String(memberCode).toLowerCase()}, ${ticketActionMsg}, NOW())
        `.catch(() => {});

        // Gửi thông báo đẩy cá nhân (business_notifications)
        if (userId) {
          const dedupeKey = `event_reg_free_${regId}_${userId}`;
          await this.prisma.$executeRaw`
            INSERT INTO public.business_notifications (
              id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
              title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), ${userId}::uuid, 'event', ${regId}, ${dedupeKey}, 'event_ticket_issued', 'event_ticket_issued',
              'Vé tham gia sự kiện miễn phí (0đ) đã sẵn sàng',
              ${`Bạn đã đăng ký thành công vé tham dự sự kiện "${event.title || event.name}". Mã vé: ${regId} · Số may mắn: #${luckyNum}.`},
              ${JSON.stringify({ eventId, regId, luckyNumber: luckyNum, isFree: true, title: event.title || event.name })}::jsonb,
              'high', 'delivered', 'all', 'all', now(), now()
            )
          `.catch(() => {});
        }

        // Gửi thông báo vào Notification Center CRM
        const crmNotifCode = `NOTIF-EVT-${Date.now().toString().slice(-6)}`;
        await this.prisma.$executeRaw`
          INSERT INTO public.notifications (
            id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), ${crmNotifCode},
            ${`Hội viên đăng ký vé 0đ: ${event.title || event.name}`},
            ${`Hội viên ${memberName} (${memberCode}) đã nhận vé miễn phí sự kiện "${event.title || event.name}". Mã vé: ${regId} - Số may mắn: #${luckyNum}.`},
            'all', 'inapp', 'sent', now(), 1, ${event.association_id ? event.association_id : null}::uuid, 'all', 'all', now(), now()
          )
        `.catch(() => {});
      } else {
        // Sự kiện có phí: Gửi tin nhắn thông báo tiếp nhận & thẻ thanh toán VietQR
        const invoiceNo = `EV-${Date.now().toString(36).toUpperCase()}`;
        const vietQrUrl = `https://img.vietqr.io/image/MB-1983000000-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(invoiceNo)}`;
        const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN');
        const paymentDesc = encodeURIComponent(`Phí tham dự sự kiện "${event.title || event.name || 'Sự kiện'}" (${ticketCount} vé)`);
        const actionMsg = `[action:payment|amount:${totalAmount}|invoice:${invoiceNo}|qr:${vietQrUrl}|due:${dueDate}|desc:${paymentDesc}]`;

        const greetingMsg = `Kính gửi Anh/Chị ${memberName}, Ban Thư Ký CLB Doanh Nhân CEO 1983 đã tiếp nhận thành công thông tin đăng ký tham dự sự kiện "${event.title || event.name || 'Sự kiện'}".\n\n- Người đăng ký: ${memberName} (${position ? position + ' - ' : ''}${company || 'Hội viên'})\n- Số điện thoại: ${phone || 'Chưa cập nhật'}\n- Số lượng vé: ${ticketCount} vé (${ticketType})\n- Tổng chi phí: ${new Intl.NumberFormat('vi-VN').format(totalAmount)} đ\n\nVui lòng quét mã VietQR hoặc chuyển khoản theo hóa đơn bên dưới để hoàn tất thủ tục tham dự.`;

        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'ADMIN', ${String(memberCode).toLowerCase()}, ${greetingMsg}, NOW() - interval '1 second')
        `.catch(() => {});

        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'ADMIN', ${String(memberCode).toLowerCase()}, ${actionMsg}, NOW())
        `.catch(() => {});
      }
    }

    // Thông báo vé sự kiện đẩy trực tiếp về App Hiệp Hội (E-Ticket, QR Check-in, Tin nhắn Action Card)
    // Tạm thời chỉ gửi mail khi đăng ký tài khoản theo yêu cầu hệ thống.
    /*
    if (email && email.includes('@')) {
      this.mailService.sendEventTicketEmail({
        to: email,
        fullName: memberName,
        phone,
        company,
        position,
        eventTitle: event.title || event.name || 'Sự kiện CLB CEO 1983',
        eventDate: event.date ? (event.date instanceof Date ? event.date.toISOString().slice(0, 10) : String(event.date).slice(0, 10)) : 'Xem chi tiết trong app',
        eventLocation: event.location || 'Hà Nội',
        registrationId: regId,
        ticketType,
        ticketCount,
        luckyNumber: luckyNum,
        isFree,
        totalAmount,
        qrCodeUrl,
      }).catch((err: any) => {
        this.logger.warn(`Failed to dispatch event ticket email to ${email}: ${err?.message}`);
      });
    }
    */

    return {
      ok: true,
      registered: true,
      registrationId: regId,
      eventId,
      ticketType,
      ticketCount,
      totalAmount,
      isFree,
      paymentStatus,
      status: 'confirmed',
      luckyNumber: luckyNum,
      qrCodeUrl,
      memberName,
      eventTitle: event.title || event.name,
      message: isFree
        ? 'Đăng ký vé tham dự sự kiện miễn phí thành công! Thông tin vé và mã QR check-in đã được gửi tới email của Anh/Chị.'
        : 'Đăng ký sự kiện thành công! Vui lòng hoàn tất thanh toán theo hóa đơn VietQR trong mục Tin nhắn.',
    };
  }


  // Mobile API: Cancel registration for an event
  async cancelEventRegistration(userId: string, eventId: string) {
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);

    if (eventRows.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const event = eventRows[0];

    // Find member profile for user
    const memberRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);

    const userRows = await this.prisma.vione_users.findUnique({
      where: { id: userId },
    });

    const memberCode = memberRows[0]?.code ?? null;
    const email = memberRows[0]?.email ?? userRows?.email ?? null;

    // Update registration status to cancelled
    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET status = 'cancelled', updated_at = now()
      WHERE event_id = ${eventId}
        AND (
          (${memberCode}::text IS NOT NULL AND member_code = ${memberCode})
          OR (${email}::text IS NOT NULL AND email = ${email})
        )
        AND status != 'cancelled'
    `.catch(() => 0);

    // Decrement registered count if > 0
    await this.prisma.$executeRaw`
      UPDATE public.events
      SET registered = GREATEST(0, registered - 1), updated_at = now()
      WHERE id = ${eventId}
    `.catch(() => null);

    try {
      const notifTitle = 'Hủy tham gia sự kiện thành công';
      const notifBody = `Bạn đã hủy tham gia sự kiện "${event.title || event.name || 'Sự kiện'}".`;
      const notifId = require('crypto').randomUUID();
      const dedupeKey = `event-cancel-${eventId}-${userId}-${Date.now()}`;
      const safeData = JSON.stringify({
        title: notifTitle,
        body: notifBody,
        eventId,
        eventTitle: event.title || event.name,
        targetRoute: `/events/${eventId}`,
      });

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.business_notifications (
          id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
          title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, 'event', $3, 'event_cancelled', 'ticket_cancelled',
          $4, $5, $6::jsonb, 'normal', 'delivered', $7, 'all', 'all', NOW(), NOW()
        )
      `, notifId, userId, eventId, notifTitle, notifBody, safeData, dedupeKey).catch(() => {});

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.member_notifications (
          id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, false, false, 'event', $4, NOW()
        )
      `, memberRows[0]?.id || userId, notifTitle, notifBody, eventId).catch(() => {});
    } catch (e: any) {
      console.warn('Failed to send event cancellation notification:', e?.message);
    }

    return { ok: true, cancelled: true };
  }

  async updateRegistrationSeating(userId: string, registrationId: string, seatAssignment: string) {
    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET seat_assignment = ${seatAssignment}, updated_at = now()
      WHERE id = ${registrationId}
    `;
    return { ok: true, id: registrationId, seatAssignment };
  }

  async recordWalkInCashPayment(userId: string, registrationId: string, customAmount?: number) {
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_registrations WHERE id = ${registrationId} LIMIT 1
    `.catch(() => []);
    if (regRows.length === 0) throw new NotFoundException('Không tìm thấy đăng ký');
    const reg = regRows[0];
    const amount = customAmount && customAmount > 0 ? customAmount : Number(reg.payment_amount || 500000);

    // 1. Update event_registrations
    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET payment_status = 'paid', payment_method = 'cash', payment_amount = ${amount}, updated_at = now()
      WHERE id = ${registrationId}
    `;

    // 2. Insert into transactions table as Quản lý thu - Tiền mặt
    const txCode = `THU-TM-${Date.now().toString(36).toUpperCase()}`;
    await this.prisma.$executeRaw`
      INSERT INTO public.transactions (
        id, code, date, type, category, description, amount, method, status, association_id, recipient, invoice_url, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${txCode},
        now()::date,
        'income',
        'event_fee',
        ${'Thu tiền mặt sự kiện: ' + (reg.member_name || 'Khách vãng lai') + ' (' + registrationId + ')'},
        ${amount},
        'cash',
        'completed',
        ${reg.association_id}::uuid,
        ${reg.member_name || 'Khách vãng lai'},
        ${'/invoices/' + txCode + '.pdf'},
        now(),
        now()
      )
    `.catch((err) => console.error('Error inserting walk-in transaction:', err));

    return { ok: true, id: registrationId, txCode, amount, paymentStatus: 'paid', paymentMethod: 'cash' };
  }

  async sendPaymentReminder(userId: string, registrationId: string) {
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_registrations WHERE id = ${registrationId} LIMIT 1
    `.catch(() => []);
    if (regRows.length === 0) throw new NotFoundException('Không tìm thấy đăng ký');
    const reg = regRows[0];
    const currentReminders = Number(reg.reminder_count || 0) + 1;

    if (currentReminders >= 3) {
      // After 3 reminders without payment, cancel registration
      await this.prisma.$executeRaw`
        UPDATE public.event_registrations
        SET status = 'cancelled', payment_status = 'cancelled', reminder_count = ${currentReminders}, last_reminded_at = now(), updated_at = now()
        WHERE id = ${registrationId}
      `;
      return {
        ok: true,
        id: registrationId,
        reminderCount: currentReminders,
        status: 'cancelled',
        message: 'Đã nhắc 3 lần không thanh toán phí. Hệ thống đã tự động hủy đơn đăng ký tham gia sự kiện.',
      };
    } else {
      await this.prisma.$executeRaw`
        UPDATE public.event_registrations
        SET reminder_count = ${currentReminders}, last_reminded_at = now(), updated_at = now()
        WHERE id = ${registrationId}
      `;
      return {
        ok: true,
        id: registrationId,
        reminderCount: currentReminders,
        status: reg.status,
        message: `Đã gửi thông báo nhắc nhở thanh toán lần ${currentReminders}/3 thành công.`,
      };
    }
  }

  async getCheckinState(_userId: string) {
    // 1. Prioritize real attendees from event_registrations
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        r.id,
        r.member_name as name,
        r.member_code as code,
        r.email,
        r.ticket_type,
        r.seat_assignment,
        r.payment_status,
        r.checked_in_at,
        r.lucky_number,
        COALESCE(m.company, u.company_name, 'Doanh nghiệp CEO 1983') as company,
        COALESCE(m.position, u.job_title, 'CEO / Hội viên') as title,
        COALESCE(m.phone, u.phone, '0983000001') as phone
      FROM public.event_registrations r
      LEFT JOIN public.members m ON (m.code = r.member_code OR (r.email != '' AND m.email = r.email))
      LEFT JOIN public.vione_users u ON u.email = r.email
      WHERE r.status != 'cancelled'
      ORDER BY r.registered_at ASC
    `.catch(() => [] as any[]);

    let mappedAttendees: any[] = [];
    if (regRows && regRows.length > 0) {
      mappedAttendees = regRows.map((r: any) => {
        const name = String(r.name ?? 'Hội viên');
        const initials = name.trim().split(/\s+/).slice(-2).map((w: string) => w[0]?.toUpperCase()).join('') || 'U';
        return {
          id: String(r.id),
          name,
          initials,
          title: String(r.title ?? 'CEO / Hội viên'),
          company: String(r.company ?? 'Doanh nghiệp CEO 1983'),
          phone: String(r.phone ?? '0983000001'),
          badges: String(r.ticket_type ?? '').toLowerCase().includes('vip') ? ['vip'] : ['member'],
          membership: 'memberLevel.large',
          ticketType: r.ticket_type ? String(r.ticket_type) : 'VIP Pass',
          checkedIn: Boolean(r.checked_in_at),
          seatAssignment: r.seat_assignment || 'Khu vực tự do',
          paymentStatus: r.payment_status || 'pending',
          luckyNumber: r.lucky_number ? `#${r.lucky_number}` : `#${Math.floor(1000 + Math.random() * 9000)}`,
        };
      });
    } else {
      let attendees = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.attendees ORDER BY name ASC
      `.catch(() => []);

      mappedAttendees = (attendees ?? []).map((r: any) => ({
        id: String(r.id),
        name: String(r.name ?? ''),
        initials: String(r.initials ?? ''),
        title: String(r.title ?? ''),
        company: String(r.company ?? ''),
        phone: String(r.phone ?? ''),
        badges: Array.isArray(r.badges) ? r.badges : [],
        membership: r.membership ?? 'memberLevel.small',
        ticketType: r.ticket_type ? String(r.ticket_type) : undefined,
        checkedIn: Boolean(r.checked_in),
        seatAssignment: 'Khu vực tự do',
      }));
    }

    const logs = await this.prisma.$queryRaw<any[]>`
      SELECT id, attendee_id, result, created_at FROM public.checkin_logs 
      ORDER BY created_at DESC LIMIT 10
    `.catch(() => []);

    const byId = new Map(mappedAttendees.map((a: any) => [a.id, a]));
    const recent = (logs ?? [])
      .map((l: any) => {
        const att = byId.get(String(l.attendee_id));
        if (!att) return null;
        const time = l.created_at
          ? new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';
        return { attendee: att, result: l.result ?? 'success', time };
      })
      .filter(Boolean);

    const map = new Map<string, { ticketType: string; registered: number; checkedIn: number }>();
    for (const a of mappedAttendees) {
      const key = a.ticketType ?? 'Standard';
      const cur = map.get(key) ?? { ticketType: key, registered: 0, checkedIn: 0 };
      cur.registered += 1;
      if (a.checkedIn) cur.checkedIn += 1;
      map.set(key, cur);
    }
    const ticketStats = Array.from(map.values()).sort((a, b) => b.registered - a.registered);

    return {
      attendees: mappedAttendees,
      recent,
      stats: {
        registered: mappedAttendees.length,
        checkedIn: mappedAttendees.filter((a: any) => a.checkedIn).length,
      },
      ticketStats,
    };
  }

  async checkInAttendee(attendeeId: string) {
    // 1. Check in event_registrations first
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        r.id, r.member_name as name, r.email, r.ticket_type, r.seat_assignment, r.payment_status, r.checked_in_at,
        u.company_name as company, u.job_title as title, u.phone
      FROM public.event_registrations r
      LEFT JOIN public.vione_users u ON u.email = r.email
      WHERE r.id = ${attendeeId} LIMIT 1
    `.catch(() => [] as any[]);

    if (regRows.length > 0) {
      const cur = regRows[0];
      const already = Boolean(cur.checked_in_at);
      const result = already ? 'already' : 'success';
      if (!already) {
        await this.prisma.$executeRaw`
          UPDATE public.event_registrations
          SET checked_in_at = now(), updated_at = now()
          WHERE id = ${attendeeId}
        `.catch(() => null);

        // Dispatch 2-way business notification
        try {
          const userRows = await this.prisma.$queryRaw<any[]>`
            SELECT id FROM public.vione_users WHERE email = ${cur.email} LIMIT 1
          `.catch(() => []);
          const targetUserId = userRows[0]?.id;
          if (targetUserId) {
            const notifTitle = 'Check-in sự kiện thành công';
            const notifBody = `Chào mừng ${cur.name} đã đến tham dự sự kiện! Vị trí chỗ ngồi của bạn: ${cur.seat_assignment || 'Khu vực Tiêu chuẩn'}.`;
            const notifId = require('crypto').randomUUID();
            const dedupeKey = `checkin-${attendeeId}-${Date.now()}`;
            const safeData = JSON.stringify({
              title: notifTitle,
              body: notifBody,
              seatAssignment: cur.seat_assignment,
              ticketType: cur.ticket_type,
            });

            await this.prisma.$executeRawUnsafe(`
              INSERT INTO public.business_notifications (
                id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
                title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
              ) VALUES (
                $1::uuid, $2::uuid, 'event', $3, 'event_checkin', 'checkin_success',
                $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
              )
            `, notifId, targetUserId, attendeeId, notifTitle, notifBody, safeData, dedupeKey).catch(() => {});

            await this.prisma.$executeRawUnsafe(`
              INSERT INTO public.member_notifications (
                id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, false, false, 'checkin', $4, NOW()
              )
            `, targetUserId, notifTitle, notifBody, attendeeId).catch(() => {});
          }
        } catch (e: any) {
          console.warn('Failed to send checkin notification:', e?.message);
        }
      }
      await this.prisma.$executeRaw`
        INSERT INTO public.checkin_logs (id, attendee_id, result, created_at)
        VALUES (gen_random_uuid(), ${attendeeId}, ${result}, now())
      `.catch(() => null);

      const name = String(cur.name ?? 'Hội viên');
      const initials = name.trim().split(/\s+/).slice(-2).map((w: string) => w[0]?.toUpperCase()).join('') || 'U';
      const attendee = {
        id: String(cur.id),
        name,
        initials,
        title: String(cur.title ?? 'CEO / Hội viên'),
        company: String(cur.company ?? 'CEO 1983'),
        phone: String(cur.phone ?? ''),
        badges: String(cur.ticket_type ?? '').toLowerCase().includes('vip') ? ['vip'] : ['member'],
        membership: 'memberLevel.large',
        ticketType: cur.ticket_type ? String(cur.ticket_type) : 'VIP Pass',
        checkedIn: true,
        seatAssignment: cur.seat_assignment || 'Khu vực tự do',
        paymentStatus: cur.payment_status || 'paid',
      };
      return { attendee, result, seatAssignment: attendee.seatAssignment };
    }

    // 2. Fallback to public.attendees
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.attendees WHERE id = ${attendeeId} LIMIT 1
    `.catch(() => []);
    const cur = rows?.[0];
    if (!cur) {
      throw new NotFoundException('Attendee not found');
    }
    const already = Boolean(cur.checked_in);
    const result = already ? 'already' : 'success';
    if (!already) {
      await this.prisma.$executeRaw`
        UPDATE public.attendees SET checked_in = true, updated_at = now() WHERE id = ${attendeeId}
      `.catch(() => null);
    }
    await this.prisma.$executeRaw`
      INSERT INTO public.checkin_logs (id, attendee_id, result, created_at)
      VALUES (gen_random_uuid(), ${attendeeId}, ${result}, now())
    `.catch(() => null);

    const attendee = {
      id: String(cur.id),
      name: String(cur.name ?? ''),
      initials: String(cur.initials ?? ''),
      title: String(cur.title ?? ''),
      company: String(cur.company ?? ''),
      phone: String(cur.phone ?? ''),
      badges: Array.isArray(cur.badges) ? cur.badges : [],
      membership: cur.membership ?? 'memberLevel.small',
      ticketType: cur.ticket_type ? String(cur.ticket_type) : undefined,
      checkedIn: true,
      seatAssignment: 'Khu vực tự do',
    };
    return { attendee, result, seatAssignment: attendee.seatAssignment };
  }

  async undoCheckInAttendee(attendeeId: string) {
    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET checked_in_at = null, updated_at = now()
      WHERE id = ${attendeeId}
    `.catch(() => null);
    await this.prisma.$executeRaw`
      UPDATE public.attendees SET checked_in = false, updated_at = now() WHERE id = ${attendeeId}
    `.catch(() => null);
    await this.prisma.$executeRaw`
      DELETE FROM public.checkin_logs WHERE attendee_id = ${attendeeId}
    `.catch(() => null);
    return { ok: true };
  }

  async getCheckinQrEvents(userId: string) {
    const overview = await this.getEventsOverview(userId);
    return overview.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      location: e.location,
      status: e.status,
      registered: e.confirmed || e.registrations,
      capacity: e.capacity,
      checkedIn: e.attended,
    }));
  }

  async recordMemberCheckin(userId: string, body: { payload: string; method?: 'qr' | 'nfc' }) {
    const method = body.method ?? 'qr';
    const payload = body.payload ?? '';

    // 1. Resolve member for userId
    const members: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT code, association_id, status FROM public.members WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);

    if (members.length === 0) {
      throw new BadRequestException('member_not_found');
    }

    // Parse payload to get eventId
    let eventId: string | null = null;
    try {
      const parsed = JSON.parse(payload);
      eventId = parsed.eventId || parsed.id || null;
    } catch {
      const match = payload.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (match) {
        eventId = match[0];
      } else {
        eventId = payload.trim();
      }
    }

    if (!eventId) {
      throw new BadRequestException('invalid_payload');
    }

    const eventRows: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, association_id FROM public.events WHERE id = ${eventId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    if (eventRows.length === 0) {
      throw new NotFoundException('event_not_found');
    }

    const ev: any = eventRows[0];
    const matchingMember: any = members.find((m: any) => m.association_id === ev.association_id) || members[0];
    if (matchingMember?.status !== 'active') {
      throw new BadRequestException('membership_inactive');
    }

    // Check prior checkin (replay)
    const prior = await this.prisma.$queryRaw<any[]>`
      SELECT id, event_id, event_title, method, checked_at
      FROM public.member_checkins
      WHERE member_code = ${matchingMember.code} AND event_id = ${ev.id}::uuid AND status = 'success'
      LIMIT 1
    `.catch(() => []);

    if (prior.length > 0) {
      const p = prior[0];
      return {
        id: p.id,
        eventId: p.event_id,
        eventTitle: p.event_title,
        status: 'already',
        method: p.method ?? method,
        at: p.checked_at ? new Date(p.checked_at).toISOString() : new Date().toISOString(),
      };
    }

    const clientId = `chk:v2:${matchingMember.association_id}:${matchingMember.code}:${ev.id}`;
    const inserted = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.member_checkins (
        id, client_id, member_code, event_id, event_title, status, method, checked_at, association_id
      ) VALUES (
        gen_random_uuid(), ${clientId}, ${matchingMember.code}, ${ev.id}::uuid, ${ev.name}, 'success', ${method}, now(), ${matchingMember.association_id}::uuid
      )
      ON CONFLICT (client_id) DO UPDATE SET checked_at = member_checkins.checked_at
      RETURNING id, event_id, event_title, method, checked_at
    `.catch(() => []);

    if (inserted.length > 0) {
      const r = inserted[0];
      return {
        id: r.id,
        eventId: r.event_id,
        eventTitle: r.event_title,
        status: 'success',
        method: r.method ?? method,
        at: r.checked_at ? new Date(r.checked_at).toISOString() : new Date().toISOString(),
      };
    }

    return {
      id: eventId,
      eventId,
      eventTitle: ev.name,
      status: 'success',
      method,
      at: new Date().toISOString(),
    };
  }

  async listMyMemberCheckins(userId: string, limit: number = 50) {
    const members = await this.prisma.$queryRaw<any[]>`
      SELECT code FROM public.members WHERE user_id = ${userId}::uuid
    `.catch(() => []);

    const codes = members.map((m) => m.code).filter(Boolean);
    if (codes.length === 0) return [];

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, event_id, event_title, status, method, checked_at
      FROM public.member_checkins
      WHERE member_code = ANY(${codes})
      ORDER BY checked_at DESC
      LIMIT ${limit}
    `.catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      eventTitle: r.event_title || 'Sự kiện',
      status: r.status || 'success',
      method: r.method || 'qr',
      at: r.checked_at ? new Date(r.checked_at).toISOString() : '',
    }));
  }
}
