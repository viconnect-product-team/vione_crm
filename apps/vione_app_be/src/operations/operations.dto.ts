export class CreateTaskDto {
  title!: string;
  assignee!: string;
  deadline!: string;
  department?: string;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
  checklist?: { id: string; text: string; done: boolean }[];
}

export class UpdateTaskDto {
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  progress?: number;
  checklist?: { id: string; text: string; done: boolean }[];
  assignee?: string;
  deadline?: string;
  priority?: 'high' | 'medium' | 'low';
}

export class CheckInDto {
  employeeId!: string;
  employeeName!: string;
  distance!: number; // mét so với trụ sở (BR-HRM-01: <= 50m)
  faceScore!: number; // % khớp AI FaceID (BR-HRM-02: >= 92%)
  latitude?: number;
  longitude?: number;
}

export class CreateLeaveDto {
  employeeName!: string;
  type!: string; // 'phep_nam' | 'ot' | 'viec_rieng'
  startDate!: string;
  endDate!: string;
  reason!: string;
}

export class CreateApprovalDto {
  title!: string;
  amount!: number;
  recipient!: string;
  department?: string;
  bankName?: string;
  accountNumber?: string;
  description?: string;
  invoiceNumber?: string;
}
