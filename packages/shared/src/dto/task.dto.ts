import { z } from "zod";
import { TaskPriority, TaskStatus } from "../enums/status.enum.js";

export const AssignTaskSchema = z.object({
  communityId: z.string().uuid("Community ID không hợp lệ"),
  assigneeId: z.string().uuid("Assignee ID không hợp lệ"),
  title: z.string().min(3, "Tiêu đề công việc phải có ít nhất 3 ký tự"),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().optional(),
});

export type AssignTaskDto = z.infer<typeof AssignTaskSchema>;

export const UpdateTaskProgressSchema = z.object({
  taskId: z.string().uuid("Task ID không hợp lệ"),
  status: z.nativeEnum(TaskStatus).optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  reportNote: z.string().optional(),
});

export type UpdateTaskProgressDto = z.infer<typeof UpdateTaskProgressSchema>;
