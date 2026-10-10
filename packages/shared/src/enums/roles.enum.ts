/**
 * ViOne Platform - User & Member Roles
 */

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  LEADER = "leader",
  STAFF = "staff",
  MEMBER = "member",
  PARTNER = "partner",
  GUEST = "guest",
}

export enum RoleGroup {
  EXECUTIVE_BOARD = "executive_board",       // Ban Điều Hành / Lãnh Đạo C-Level
  OFFICE_MANAGEMENT = "office_management",   // Ban Thư Ký / Quản Lý Văn Phòng
  OPERATION_STAFF = "operation_staff",       // Nhân Sự Vận Hành
  SPECIAL_AUDITOR = "special_auditor",       // Ban Kiểm Soát & Giám Sát
  STANDARD_MEMBER = "standard_member",       // Hội Viên Doanh Nghiệp
}

export enum CommunityRole {
  OWNER = "owner",
  ADMIN = "admin",
  MODERATOR = "moderator",
  MEMBER = "member",
}
