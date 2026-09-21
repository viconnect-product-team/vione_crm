import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── CURRENT USER ACCOUNT ───────────────────────────────────────────────────

  @Get('me')
  async getMyAccount(@Request() req: any) {
    return this.usersService.getAccountDetails(req.user.id);
  }

  @Put('me')
  async updateMyAccount(@Request() req: any, @Body() body: any) {
    return this.usersService.updateAccountProfile(req.user.id, body);
  }

  @Post('change-password')
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword?: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      req.user.id,
      body.currentPassword || '',
      body.newPassword,
    );
  }

  @Post('deactivate')
  async deactivateAccount(@Request() req: any, @Body() body: { password?: string }) {
    return this.usersService.deactivateAccount(req.user.id, body?.password);
  }

  // ── ADMIN USER MANAGEMENT ──────────────────────────────────────────────────

  @Get()
  async listUsers(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isAdmin = await this.usersService.checkIsAdmin(req.user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền truy cập danh sách người dùng');
    }
    return this.usersService.listUsers({
      search,
      role,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(':id')
  async getUserById(@Request() req: any, @Param('id') id: string) {
    const isAdmin = await this.usersService.checkIsAdmin(req.user.id);
    if (!isAdmin && req.user.id !== id) {
      throw new ForbiddenException('Không có quyền xem thông tin tài khoản này');
    }
    return this.usersService.getAccountDetails(id);
  }

  @Post()
  async createUser(@Request() req: any, @Body() body: any) {
    const isAdmin = await this.usersService.checkIsAdmin(req.user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền tạo tài khoản mới');
    }
    return this.usersService.adminCreateUser(body);
  }

  @Put(':id')
  async updateUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const isAdmin = await this.usersService.checkIsAdmin(req.user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa tài khoản này');
    }
    return this.usersService.adminUpdateUser(id, body);
  }

  @Patch(':id/status')
  async toggleStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status?: string,
  ) {
    const isAdmin = await this.usersService.checkIsAdmin(req.user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền thay đổi trạng thái tài khoản');
    }
    return this.usersService.adminToggleStatus(id, status);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Request() req: any,
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
  ) {
    const isAdmin = await this.usersService.checkIsAdmin(req.user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền đặt lại mật khẩu tài khoản này');
    }
    return this.usersService.adminResetPassword(id, newPassword);
  }

  @Delete(':id')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    const isAdmin = await this.usersService.checkIsAdmin(req.user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa tài khoản người dùng');
    }
    return this.usersService.adminDeleteUser(req.user.id, id);
  }
}
