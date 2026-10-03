import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  // ATTENDANCE & AI FACEID (RESTful: /api/operations/attendance)
  // ==========================================
  @Get('attendance')
  getAttendanceLogs() {
    const data = this.opsService.getAttendanceLogs();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Post('attendance/check-in')
  @HttpCode(HttpStatus.CREATED)
  recordCheckIn(@Body() dto: CheckInDto) {
    const data = this.opsService.recordCheckIn(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Điểm danh GPS và AI FaceID thành công (Khớp BR-HRM-01 & BR-HRM-02)',
      data,
    };
  }

  @Get('attendance/leaves')
  getLeaves() {
    const data = this.opsService.getAttendanceLogs().leaves;
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
  getPaymentApprovals() {
    const data = this.opsService.getPaymentApprovals();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      count: data.length,
    };
  }

  @Post('finance/approvals')
  @HttpCode(HttpStatus.CREATED)
  createPaymentApproval(@Body() dto: CreateApprovalDto) {
    const data = this.opsService.createPaymentApproval(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Khởi tạo tờ trình thanh toán thành công (Phân định cấp duyệt BR-FIN-01/02)',
      data,
    };
  }

  @Put('finance/approvals/:id/approve')
  approvePayment(
    @Param('id') id: string,
    @Body('role') role: 'checker' | 'approver',
    @Body('signerName') signerName?: string,
  ) {
    const data = this.opsService.approvePayment(id, role || 'approver', signerName);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Phê duyệt tờ trình chi thành công',
      data,
    };
  }

  @Put('finance/approvals/:id/reject')
  rejectPayment(@Param('id') id: string, @Body('reason') reason?: string) {
    const res = this.opsService.rejectPayment(id, reason);
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
