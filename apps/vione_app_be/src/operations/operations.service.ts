import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CheckInDto,
  CreateLeaveDto,
  CreateApprovalDto,
} from './operations.dto';

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  assignee: string;
  assigneeAvatar?: string;
  department: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  isOverdue: boolean;
  progress: number;
  checklist: { id: string; text: string; done: boolean }[];
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  checkInTime: string;
  distance: number;
  isGpsValid: boolean;
  faceScore: number;
  isFaceValid: boolean;
  status: 'on_time' | 'late' | 'invalid';
  date: string;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface PaymentApproval {
  id: string;
  code: string;
  title: string;
  amount: number;
  recipient: string;
  department: string;
  bankName: string;
  accountNumber: string;
  tier: 'dept_head' | 'cfo' | 'ceo';
  status: 'pending_checker' | 'pending_approver' | 'approved' | 'rejected';
  maker: string;
  checker?: string;
  approver?: string;
  createdAt: string;
  invoiceNumber?: string;
}

@Injectable()
export class OperationsService {
  // In-memory data store with live state synchronization
  private tasks: TaskItem[] = [
    {
      id: 'task-1',
      code: 'TSK-2026-081',
      title: 'Triển khai hợp đồng ViOne Cloud ERP cho Tập đoàn SunGroup',
      description: 'Cấu hình hạ tầng dedicated tenant, migration dữ liệu 450 nhân sự.',
      assignee: 'Trần Minh Hoàng',
      department: 'Kỹ thuật & Công nghệ',
      status: 'in_progress',
      priority: 'high',
      deadline: '2026-10-05',
      isOverdue: false,
      progress: 65,
      checklist: [
        { id: 'c1', text: 'Khởi tạo cụm Docker & PostgreSQL', done: true },
        { id: 'c2', text: 'Cấu hình SSL Reverse Proxy Nginx', done: true },
        { id: 'c3', text: 'Kiểm thử tải đồng thời 1.000 users', done: false },
      ],
      createdAt: '2026-09-28T08:00:00Z',
    },
    {
      id: 'task-2',
      code: 'TSK-2026-079',
      title: 'Soát xét biên bản nghiệm thu B2B - Công ty CP Thép Nam Sơn',
      description: 'Hồ sơ quyết toán quý 3/2026, đối soát chứng từ thanh toán.',
      assignee: 'Phạm Thị Thảo',
      department: 'Kế toán & Tài chính',
      status: 'review',
      priority: 'high',
      deadline: '2026-10-01',
      isOverdue: true, // BR-WRK-02: Glowing red pulse
      progress: 90,
      checklist: [
        { id: 'c1', text: 'Soát xét hóa đơn GTGT', done: true },
        { id: 'c2', text: 'Biên bản bàn giao phần mềm', done: true },
        { id: 'c3', text: 'Chữ ký số Kế toán trưởng', done: false },
      ],
      createdAt: '2026-09-25T09:30:00Z',
    },
    {
      id: 'task-3',
      code: 'TSK-2026-085',
      title: 'Khảo sát nhu cầu thiết lập mạng lưới đối tác C-Level Q4/2026',
      description: 'Phỏng vấn 30 Tổng Giám Đốc các doanh nghiệp sản xuất FDI.',
      assignee: 'Lê Hoàng Nam',
      department: 'Kinh doanh & B2B',
      status: 'todo',
      priority: 'medium',
      deadline: '2026-10-10',
      isOverdue: false,
      progress: 0,
      checklist: [
        { id: 'c1', text: 'Lập bảng câu hỏi khảo sát 15 tiêu chí', done: false },
        { id: 'c2', text: 'Gửi thư mời C-Level qua App ViOne', done: false },
      ],
      createdAt: '2026-09-30T14:00:00Z',
    },
    {
      id: 'task-4',
      code: 'TSK-2026-072',
      title: 'Bảo trì định kỳ máy chủ MinIO Storage & Tối ưu hóa Database',
      description: 'Dọn dẹp rác, reindex 32 bảng cơ sở dữ liệu quan trọng.',
      assignee: 'Nguyễn Văn Hùng',
      department: 'Hạ tầng & Devops',
      status: 'done',
      priority: 'medium',
      deadline: '2026-09-30',
      isOverdue: false,
      progress: 100,
      checklist: [
        { id: 'c1', text: 'Sao lưu snapshot backup an toàn', done: true },
        { id: 'c2', text: 'Reindex bảng members & transactions', done: true },
        { id: 'c3', text: 'Kiểm tra tốc độ truy vấn < 50ms', done: true },
      ],
      createdAt: '2026-09-24T10:00:00Z',
    },
  ];

  private attendanceRecords: AttendanceRecord[] = [
    {
      id: 'att-1',
      employeeId: 'EMP-001',
      employeeName: 'Nguyễn Tuấn Anh',
      department: 'Ban Giám Đốc',
      checkInTime: '08:12:45',
      distance: 18,
      isGpsValid: true,
      faceScore: 98.4,
      isFaceValid: true,
      status: 'on_time',
      date: '2026-10-02',
    },
    {
      id: 'att-2',
      employeeId: 'EMP-014',
      employeeName: 'Trần Minh Hoàng',
      department: 'Kỹ thuật & Công nghệ',
      checkInTime: '08:24:10',
      distance: 25,
      isGpsValid: true,
      faceScore: 96.1,
      isFaceValid: true,
      status: 'on_time',
      date: '2026-10-02',
    },
    {
      id: 'att-3',
      employeeId: 'EMP-029',
      employeeName: 'Phạm Thị Thảo',
      department: 'Kế toán & Tài chính',
      checkInTime: '08:48:30',
      distance: 34,
      isGpsValid: true,
      faceScore: 94.2,
      isFaceValid: true,
      status: 'late',
      date: '2026-10-02',
    },
  ];

  private leaveRequests: LeaveRequest[] = [
    {
      id: 'lev-1',
      employeeName: 'Vũ Quốc Bảo',
      department: 'Kinh doanh & B2B',
      type: 'Nghỉ phép năm',
      startDate: '2026-10-06',
      endDate: '2026-10-07',
      reason: 'Giải quyết công việc gia đình.',
      status: 'pending',
      submittedAt: '2026-10-01T15:20:00Z',
    },
  ];

  private paymentApprovals: PaymentApproval[] = [
    {
      id: 'appr-1',
      code: 'REQ-2026-042',
      title: 'Thanh toán phí thuê hạ tầng máy chủ Cloud Dedicated Tháng 10/2026',
      amount: 45000000,
      recipient: 'Công ty TNHH Viettel IDC',
      department: 'Kỹ thuật & Hạ tầng',
      bankName: 'MBBank - Ngân hàng Quân Đội',
      accountNumber: '0389283948888',
      tier: 'ceo', // > 20M: Thẩm quyền CEO duyệt (BR-FIN-02)
      status: 'pending_approver',
      maker: 'Trần Minh Hoàng',
      checker: 'Phạm Thị Thảo (Kế toán trưởng)',
      createdAt: '2026-10-01T14:30:00Z',
      invoiceNumber: 'HD-2026-VT-00921',
    },
    {
      id: 'appr-2',
      code: 'REQ-2026-043',
      title: 'Tạm ứng kinh phí tổ chức Hội thảo Xúc tiến Thương mại B2B Khóa 2',
      amount: 18500000,
      recipient: 'Khách sạn Daewoo Hà Nội',
      department: 'Truyền thông & Sự kiện',
      bankName: 'Vietcombank',
      accountNumber: '0011004928172',
      tier: 'cfo', // 5M - 20M: CFO duyệt (BR-FIN-02)
      status: 'pending_checker',
      maker: 'Lê Hoàng Nam',
      createdAt: '2026-10-02T09:15:00Z',
      invoiceNumber: 'HD-DW-2026-44',
    },
    {
      id: 'appr-3',
      code: 'REQ-2026-040',
      title: 'Mua bổ sung vật tư văn phòng & Thẻ danh thiếp thông minh Titanium',
      amount: 3800000,
      recipient: 'Công ty TNHH In ấn & Công nghệ Nam Việt',
      department: 'Hành chính - Nhân sự',
      bankName: 'Techcombank',
      accountNumber: '19038291029019',
      tier: 'dept_head', // < 5M: Trưởng bộ phận duyệt
      status: 'approved',
      maker: 'Nguyễn Bích Ngọc',
      checker: 'Phạm Thị Thảo',
      approver: 'Trần Minh Hoàng',
      createdAt: '2026-09-29T11:00:00Z',
      invoiceNumber: 'NV-2026-081',
    },
  ];

  // ==========================================
  // 1. WORKFLOW & BPMN TASKS (BR-WRK-01..15)
  // ==========================================
  getTasks(query?: { status?: string; department?: string; assignee?: string }) {
    let result = [...this.tasks];

    // Cập nhật trạng thái quá hạn động theo thời gian thực (BR-WRK-02)
    const today = new Date().toISOString().split('T')[0];
    result = result.map((t) => ({
      ...t,
      isOverdue: t.status !== 'done' && t.deadline < today,
    }));

    if (query?.status) {
      result = result.filter((t) => t.status === query.status);
    }
    if (query?.department) {
      result = result.filter((t) => t.department === query.department);
    }
    if (query?.assignee) {
      result = result.filter((t) =>
        t.assignee.toLowerCase().includes(query.assignee!.toLowerCase()),
      );
    }

    return result;
  }

  getTaskById(id: string): TaskItem {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException(`Không tìm thấy công việc với ID: ${id}`);
    }
    return task;
  }

  createTask(dto: CreateTaskDto): TaskItem {
    // BR-WRK-01: Bắt buộc Assignee & Deadline
    if (!dto.assignee || !dto.deadline) {
      throw new BadRequestException(
        'Quy tắc BR-WRK-01: Công việc bắt buộc phải có Người phụ trách và Thời hạn hoàn thành.',
      );
    }

    // BR-WRK-06: Kiểm tra WIP Limit <= 5
    const currentWip = this.tasks.filter(
      (t) => t.assignee === dto.assignee && t.status === 'in_progress',
    ).length;

    if (currentWip >= 5) {
      throw new BadRequestException(
        `Quy tắc BR-WRK-06: Nhân sự ${dto.assignee} đã đạt giới hạn tối đa 5 việc đang xử lý (WIP Limit <= 5). Hãy hoàn thành việc trước khi nhận thêm!`,
      );
    }

    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      code: 'TSK-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      title: dto.title,
      description: dto.description || '',
      assignee: dto.assignee,
      department: dto.department || 'Vận hành chung',
      status: 'todo',
      priority: dto.priority || 'medium',
      deadline: dto.deadline,
      isOverdue: false,
      progress: 0,
      checklist: dto.checklist || [
        { id: 'chk-1', text: 'Khảo sát yêu cầu', done: false },
        { id: 'chk-2', text: 'Thực hiện đầu việc', done: false },
        { id: 'chk-3', text: 'Báo cáo nghiệm thu', done: false },
      ],
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(newTask);
    return newTask;
  }

  updateTask(id: string, dto: UpdateTaskDto): TaskItem {
    const task = this.getTaskById(id);

    // BR-WRK-07: Bắt buộc 100% checklist hoàn thành trước khi chuyển sang Done
    if (dto.status === 'done') {
      const checklist = dto.checklist || task.checklist;
      const allDone = checklist.length === 0 || checklist.every((c) => c.done);
      if (!allDone) {
        throw new BadRequestException(
          'Quy tắc BR-WRK-07: Bắt buộc hoàn thành 100% các tiêu chí Checklist trước khi nghiệm thu Done!',
        );
      }
      task.progress = 100;
    }

    if (dto.status) task.status = dto.status;
    if (dto.progress !== undefined) task.progress = dto.progress;
    if (dto.checklist) task.checklist = dto.checklist;
    if (dto.assignee) task.assignee = dto.assignee;
    if (dto.deadline) task.deadline = dto.deadline;
    if (dto.priority) task.priority = dto.priority;

    return task;
  }

  deleteTask(id: string): { success: boolean; message: string } {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Không tìm thấy công việc với ID: ${id}`);
    }
    this.tasks.splice(idx, 1);
    return { success: true, message: `Đã xóa thành công công việc ${id}` };
  }

  // ==========================================
  // 2. WORKLOAD HEATMAP & KPI (BR-WRK-14..15)
  // ==========================================
  getWorkloadOverview() {
    const employees = [
      {
        id: 'EMP-014',
        name: 'Trần Minh Hoàng',
        department: 'Kỹ thuật & Công nghệ',
        weeklyHours: 48.5, // > 45h: BR-WRK-14 Overload
        isOverloaded: true,
        activeTasks: 4,
        completedTasks: 18,
        kpiRate: 94.5,
        dailyHours: [8.5, 9.5, 10, 8.5, 8.0, 4.0, 0],
      },
      {
        id: 'EMP-029',
        name: 'Phạm Thị Thảo',
        department: 'Kế toán & Tài chính',
        weeklyHours: 41.0,
        isOverloaded: false,
        activeTasks: 3,
        completedTasks: 22,
        kpiRate: 98.0,
        dailyHours: [8.0, 8.5, 8.0, 8.5, 8.0, 0, 0],
      },
      {
        id: 'EMP-033',
        name: 'Lê Hoàng Nam',
        department: 'Kinh doanh & B2B',
        weeklyHours: 38.5,
        isOverloaded: false,
        activeTasks: 2,
        completedTasks: 15,
        kpiRate: 92.0,
        dailyHours: [7.5, 8.0, 8.0, 7.5, 7.5, 0, 0],
      },
      {
        id: 'EMP-007',
        name: 'Nguyễn Văn Hùng',
        department: 'Hạ tầng & Devops',
        weeklyHours: 40.0,
        isOverloaded: false,
        activeTasks: 1,
        completedTasks: 20,
        kpiRate: 96.0,
        dailyHours: [8.0, 8.0, 8.0, 8.0, 8.0, 0, 0],
      },
    ];

    const totalEmployees = 45;
    const activeStaff = 42;
    const overloadedCount = employees.filter((e) => e.isOverloaded).length;
    const averageKpi = 95.1;

    return {
      summary: {
        totalEmployees,
        activeStaff,
        overloadedCount,
        averageKpi,
        wipLimit: 5,
        maxWeeklyHoursThreshold: 45,
      },
      employees,
    };
  }

  // ==========================================
  // 3. ATTENDANCE & AI FACEID (BR-HRM-01..15)
  // ==========================================
  getAttendanceLogs() {
    return {
      today: new Date().toISOString().split('T')[0],
      presentCount: 42,
      totalCount: 45,
      attendanceRate: 93.3,
      records: this.attendanceRecords,
      leaves: this.leaveRequests,
    };
  }

  recordCheckIn(dto: CheckInDto): AttendanceRecord {
    // BR-HRM-01: Bán kính GPS <= 50m
    const isGpsValid = dto.distance <= 50;
    if (!isGpsValid) {
      throw new BadRequestException(
        `Quy tắc BR-HRM-01 vi phạm: Vị trí hiện tại cách văn phòng ${dto.distance}m (Vượt quá bán kính cho phép <= 50m). Vui lòng di chuyển vào văn phòng!`,
      );
    }

    // BR-HRM-02: Liveness FaceID >= 92%
    const isFaceValid = dto.faceScore >= 92;
    if (!isFaceValid) {
      throw new BadRequestException(
        `Quy tắc BR-HRM-02 vi phạm: Độ khớp nhận diện khuôn mặt đạt ${dto.faceScore}% (Yêu cầu tối thiểu >= 92%). Vui lòng quét lại trong điều kiện đủ sáng!`,
      );
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now(),
      employeeId: dto.employeeId,
      employeeName: dto.employeeName,
      department: 'Vận hành ViOne',
      checkInTime: timeStr,
      distance: dto.distance,
      isGpsValid: true,
      faceScore: dto.faceScore,
      isFaceValid: true,
      status: isLate ? 'late' : 'on_time',
      date: now.toISOString().split('T')[0],
    };

    this.attendanceRecords.unshift(newRecord);
    return newRecord;
  }

  createLeave(dto: CreateLeaveDto): LeaveRequest {
    const newLeave: LeaveRequest = {
      id: 'lev-' + Date.now(),
      employeeName: dto.employeeName,
      department: 'Vận hành ViOne',
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    this.leaveRequests.unshift(newLeave);
    return newLeave;
  }

  approveLeave(id: string, approved: boolean): LeaveRequest {
    const req = this.leaveRequests.find((l) => l.id === id);
    if (!req) {
      throw new NotFoundException(`Không tìm thấy đơn xin nghỉ với ID: ${id}`);
    }
    req.status = approved ? 'approved' : 'rejected';
    return req;
  }

  // ==========================================
  // 4. FINANCIAL APPROVALS 3-TIER (BR-FIN-01..15)
  // ==========================================
  getPaymentApprovals() {
    return this.paymentApprovals;
  }

  createPaymentApproval(dto: CreateApprovalDto): PaymentApproval {
    // BR-FIN-07: Kiểm tra trùng lặp số hóa đơn
    if (dto.invoiceNumber) {
      const existing = this.paymentApprovals.find(
        (p) => p.invoiceNumber === dto.invoiceNumber,
      );
      if (existing) {
        throw new BadRequestException(
          `Quy tắc BR-FIN-07 vi phạm: Số hóa đơn ${dto.invoiceNumber} đã tồn tại trong tờ trình ${existing.code}!`,
        );
      }
    }

    // BR-FIN-02: Phân định thẩm quyền theo số tiền
    let tier: 'dept_head' | 'cfo' | 'ceo' = 'dept_head';
    if (dto.amount > 20000000) {
      tier = 'ceo';
    } else if (dto.amount >= 5000000) {
      tier = 'cfo';
    }

    const newApproval: PaymentApproval = {
      id: 'appr-' + Date.now(),
      code: 'REQ-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      title: dto.title,
      amount: dto.amount,
      recipient: dto.recipient,
      department: dto.department || 'Kinh doanh',
      bankName: dto.bankName || 'Vietcombank',
      accountNumber: dto.accountNumber || '1029384756',
      tier,
      status: 'pending_checker',
      maker: 'Nguyễn Văn A',
      createdAt: new Date().toISOString(),
      invoiceNumber: dto.invoiceNumber,
    };

    this.paymentApprovals.unshift(newApproval);
    return newApproval;
  }

  approvePayment(id: string, userRole: 'checker' | 'approver', signerName = 'Lãnh đạo') {
    const item = this.paymentApprovals.find((p) => p.id === id);
    if (!item) {
      throw new NotFoundException(`Không tìm thấy tờ trình phê duyệt với ID: ${id}`);
    }

    if (userRole === 'checker') {
      item.checker = signerName;
      item.status = 'pending_approver';
    } else if (userRole === 'approver') {
      item.approver = signerName;
      item.status = 'approved';
    }

    return item;
  }

  rejectPayment(id: string, reason?: string) {
    const item = this.paymentApprovals.find((p) => p.id === id);
    if (!item) {
      throw new NotFoundException(`Không tìm thấy tờ trình phê duyệt với ID: ${id}`);
    }
    item.status = 'rejected';
    return { success: true, message: `Tờ trình ${item.code} đã bị từ chối: ${reason || 'Không duyệt'}` };
  }

  getNapasVietQr(id: string) {
    const item = this.paymentApprovals.find((p) => p.id === id);
    if (!item) {
      throw new NotFoundException(`Không tìm thấy tờ trình phê duyệt với ID: ${id}`);
    }

    // BR-FIN-06: Sinh mã VietQR Napas 24/7 gạch nợ 1s
    const bankCode = 'ICB'; // VietinBank / VCB
    const acc = item.accountNumber || '1029384756';
    const amount = item.amount;
    const memo = encodeURIComponent(`${item.code} ${item.recipient}`);
    const qrUrl = `https://img.vietqr.io/image/${bankCode}-${acc}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${encodeURIComponent(item.recipient)}`;

    return {
      orderId: item.code,
      amount: item.amount,
      recipient: item.recipient,
      bankName: item.bankName,
      accountNumber: item.accountNumber,
      vietqrUrl: qrUrl,
      quickPaymentNapas247: true,
      clearingTime: '1s (BR-FIN-06)',
    };
  }
}
