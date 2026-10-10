import { CommunityType } from "../enums/categories.enum.js";
import { CommunityRole } from "../enums/roles.enum.js";
import { TaskPriority, TaskStatus } from "../enums/status.enum.js";

export interface SharedCommunity {
  id: string;
  name: string;
  slug?: string;
  description: string;
  type: CommunityType;
  ownerId: string;
  ownerName: string;
  avatarUrl?: string;
  coverUrl?: string;
  membersCount: number;
  eventsCount: number;
  opportunitiesCount: number;
  tasksCount?: number;
  isJoined?: boolean;
  myRole?: CommunityRole;
  createdAt: string;
  updatedAt: string;
}

export interface SharedCompanyTask {
  id: string;
  communityId: string;
  assignerId: string;
  assignerName: string;
  assigneeId: string;
  assigneeName: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercent: number;
  dueDate?: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
