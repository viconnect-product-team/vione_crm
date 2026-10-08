import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OperationsService } from './operations.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CheckInDto,
  CreateLeaveDto,
  CreateApprovalDto,
  CreateExecutiveTaskDto,
  OptimizeScheduleDto,
} from './operations.dto';

// Standard RESTful Controller under /api/operations
@Controller('operations')
export class OperationsController {
  constructor(private readonly opsService: OperationsService) {}

  // ==========================================
  // WORKFLOW & BPMN TASKS (RESTful: /api/operations/workflow/tasks)
  // ==========================================
  @Get(['workflow', 'workflow/tasks'])
  getTasks(
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('assignee') assignee?: string,
  ) {
    const data = this.opsService.getTasks({ status, department, assignee });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      count: data.length,
    };
  }

  @Get('workflow/tasks/:id')
  getTaskById(@Param('id') id: string) {
    const data = this.opsService.getTaskById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Post('workflow/tasks')
  @HttpCode(HttpStatus.CREATED)
  createTask(@Body() dto: CreateTaskDto) {
    const data = this.opsService.createTask(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Tạo công việc BPMN thành công (Tuân thủ BR-WRK-01)',
      data,
    };
  }

  @Put('workflow/tasks/:id')
  updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    const data = this.opsService.updateTask(id, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Cập nhật tiến độ công việc thành công',
      data,
    };
  }

  @Delete('workflow/tasks/:id')
  deleteTask(@Param('id') id: string) {
    const res = this.opsService.deleteTask(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: res.message,
    };
  }

  // ==========================================
  // EXECUTIVE SCHEDULE & SMART WORKFLOWS (RESTful: /api/operations/tasks/executive-schedule)
  // Tự động gói toàn bộ công việc, lịch họp, nhắc nhở & phân tích sức khỏe dồn dập của CEO
  // ==========================================
  @Get('tasks/executive-schedule')
  async getExecutiveSchedule(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = req?.user?.id || queryUserId || 'a0000000-0000-4000-8000-000000000002';
    const data = await this.opsService.getExecutiveSchedule(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Post('tasks/ai-optimize-schedule')
  @HttpCode(HttpStatus.OK)
  async aiOptimizeSchedule(@Req() req: any, @Body() body: OptimizeScheduleDto) {
    const userId = req?.user?.id || 'a0000000-0000-4000-8000-000000000002';
    const data = await this.opsService.aiOptimizeSchedule(userId, body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Thư ký AI đã sắp xếp lại lịch trình công việc tối ưu và giải tỏa dồn dập',
      data,
    };
  }

  @Post('tasks/create-remind')
  @HttpCode(HttpStatus.CREATED)
  async createExecutiveTask(@Body() dto: CreateExecutiveTaskDto) {
    const data = await this.opsService.createExecutiveTask(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Thư ký AI đã ghi nhận công việc và thiết lập nhắc nhở tự động',
      data,
    };
  }

  // ==========================================
  // WORKLOAD HEATMAP & KPI (RESTful: /api/operations/workload)
  // ==========================================
  @Get('workload')
  getWorkload() {
    const data = this.opsService.getWorkloadOverview();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ==========================================
  // STAFF DAILY ACTIVITY (RESTful: /api/operations/staff/daily-activities)
  // Giám sát hoạt động nhân sự trong ngày: lịch gặp khách hàng, công việc, GPS Check-in
  // ==========================================
  @Get('staff/daily-activities')
  getStaffDailyActivities() {
    return this.opsService.getStaffDailyActivities();
  }

  // ==========================================
  // COMPANY ATTENDANCE & PUNCTUALITY TRACKER (RESTful: /api/operations/attendance/company-summary)
  // Dành riêng cho Doanh nhân / Lãnh đạo có cộng đồng công ty & nhân sự
  // ==========================================
  @Get('attendance/company-summary')
  async getCompanyAttendanceSummary(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = req?.user?.id || queryUserId || 'a0000000-0000-4000-8000-000000000002';
    const data = await this.opsService.getCompanyAttendanceSummary(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ==========================================
  // ATTENDANCE & AI FACEID (RESTful: /api/operations/attendance)
  // ==========================================
  @Get('attendance')
  async getAttendanceLogs() {
    const data = await this.opsService.getAttendanceLogs();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Post('attendance/check-in')
  @HttpCode(HttpStatus.CREATED)
  async recordCheckIn(@Body() dto: CheckInDto) {
    const data = await this.opsService.recordCheckIn(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Điểm danh GPS và AI FaceID thành công (Khớp BR-HRM-01 & BR-HRM-02)',
      data,
    };
  }

  @Get('attendance/leaves')
  async getLeaves() {
    const logs = await this.opsService.getAttendanceLogs();
    const data = logs.leaves;
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Post('attendance/leaves')
  @HttpCode(HttpStatus.CREATED)
  createLeave(@Body() dto: CreateLeaveDto) {
    const data = this.opsService.createLeave(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Gửi đơn xin nghỉ phép/OT thành công',
      data,
    };
  }

  @Put('attendance/leaves/:id/approve')
  approveLeave(@Param('id') id: string, @Body('approved') approved: boolean) {
    const data = this.opsService.approveLeave(id, approved);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: approved ? 'Đã duyệt đơn nghỉ phép' : 'Đã từ chối đơn nghỉ phép',
      data,
    };
  }

  // ==========================================
  // FINANCIAL APPROVALS 3-TIER (RESTful: /api/operations/finance/approvals)
  // ==========================================
  @Get(['approvals', 'finance/approvals'])
  async getPaymentApprovals() {
    const data = await this.opsService.getPaymentApprovals();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      count: data.length,
    };
  }

  @Post('finance/approvals')
  @HttpCode(HttpStatus.CREATED)
  async createPaymentApproval(@Body() dto: CreateApprovalDto) {
    const data = await this.opsService.createPaymentApproval(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Khởi tạo tờ trình thanh toán thành công (Phân định cấp duyệt BR-FIN-01/02)',
      data,
    };
  }

  @Put('finance/approvals/:id/approve')
  async approvePayment(
    @Param('id') id: string,
    @Body('role') role: 'checker' | 'approver',
    @Body('signerName') signerName?: string,
  ) {
    const data = await this.opsService.approvePayment(id, role || 'approver', signerName);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Phê duyệt tờ trình chi thành công',
      data,
    };
  }

  @Put('finance/approvals/:id/reject')
  async rejectPayment(@Param('id') id: string, @Body('reason') reason?: string) {
    const res = await this.opsService.rejectPayment(id, reason);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: res.message,
    };
  }

  @Get('finance/approvals/:id/qr')
  getNapasVietQr(@Param('id') id: string) {
    const data = this.opsService.getNapasVietQr(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
