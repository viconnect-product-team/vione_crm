// Automated test script to verify RESTful API endpoints on localhost:4001/api
const BASE_URL = 'http://127.0.0.1:4001/api';

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  let json = null;
  try {
    json = await res.json();
  } catch (err) {
    json = await res.text();
  }
  return { status: res.status, ok: res.ok, data: json };
}

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`\x1b[31m✘ FAIL:\x1b[0m ${message}`);
    if (details) console.error('   Details:', details);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 TESTING LOCALHOST RESTFUL APIS - VIONE OPERATIONS');
  console.log(`   Target: ${BASE_URL}`);
  console.log('====================================================\n');

  // Test 1: GET /operations/workflow/tasks
  console.log('[1. WORKFLOW TASKS]');
  const getTasks = await request('GET', '/operations/workflow/tasks');
  assert(getTasks.status === 200, 'GET /operations/workflow/tasks returns HTTP 200', getTasks);
  assert(getTasks.data?.success === true, 'Response contains standard success: true');
  assert(Array.isArray(getTasks.data?.data) && getTasks.data.data.length > 0, 'Returns list of tasks with data array');
  const initialTaskCount = getTasks.data?.data?.length || 0;

  // Test 2: POST /operations/workflow/tasks (Valid task)
  const newTaskPayload = {
    title: 'Kiểm thử tích hợp hệ thống chấm công GPS và VietQR',
    assignee: 'Trần Minh Hoàng',
    deadline: '2026-10-15',
    department: 'Kỹ thuật & Công nghệ',
    priority: 'high',
    description: 'Chạy kiểm thử e2e tự động trên môi trường staging.',
  };
  const postTask = await request('POST', '/operations/workflow/tasks', newTaskPayload);
  assert(postTask.status === 201, 'POST /operations/workflow/tasks returns HTTP 201 Created (RESTful convention)', postTask);
  assert(postTask.data?.data?.code?.startsWith('TSK-'), 'Created task has standard code (TSK-YYYY-XXX)');
  const createdTaskId = postTask.data?.data?.id;

  // Test 3: POST /operations/workflow/tasks (Invalid task - Missing assignee/deadline per BR-WRK-01)
  const invalidTask = await request('POST', '/operations/workflow/tasks', {
    title: 'Thiếu người phụ trách',
  });
  assert(invalidTask.status === 400, 'POST /operations/workflow/tasks returns HTTP 400 Bad Request when missing assignee/deadline (BR-WRK-01)');
  assert(invalidTask.data?.success === false, 'Error response envelope has success: false');

  // Test 4: PUT /operations/workflow/tasks/:id (Update task progress)
  const putTask = await request('PUT', `/operations/workflow/tasks/${createdTaskId}`, {
    progress: 50,
    status: 'in_progress',
  });
  assert(putTask.status === 200, 'PUT /operations/workflow/tasks/:id returns HTTP 200 OK', putTask);
  assert(putTask.data?.data?.progress === 50, 'Task progress updated to 50%');

  // Test 5: PUT /operations/workflow/tasks/:id (Rule BR-WRK-07: Cannot move to Done if checklist < 100%)
  const prematureDone = await request('PUT', `/operations/workflow/tasks/${createdTaskId}`, {
    status: 'done',
    checklist: [
      { id: 'chk-1', text: 'Tiêu chí 1', done: true },
      { id: 'chk-2', text: 'Tiêu chí 2', done: false }, // Incomplete!
    ],
  });
  assert(prematureDone.status === 400, 'PUT with status=done returns HTTP 400 Bad Request if checklist < 100% (BR-WRK-07)');

  // Test 6: DELETE /operations/workflow/tasks/:id
  const delTask = await request('DELETE', `/operations/workflow/tasks/${createdTaskId}`);
  assert(delTask.status === 200, 'DELETE /operations/workflow/tasks/:id returns HTTP 200 OK', delTask);

  // Test 7: GET /operations/workload
  console.log('\n[2. WORKLOAD HEATMAP & KPI]');
  const getWorkload = await request('GET', '/operations/workload');
  assert(getWorkload.status === 200, 'GET /operations/workload returns HTTP 200 OK', getWorkload);
  assert(getWorkload.data?.data?.summary?.maxWeeklyHoursThreshold === 45, 'Workload includes threshold 45h/week (BR-WRK-14)');
  assert(Array.isArray(getWorkload.data?.data?.employees), 'Workload contains employee workload analytics');

  // Test 8: ATTENDANCE & AI FACEID
  console.log('\n[3. ATTENDANCE & AI FACEID]');
  const getAtt = await request('GET', '/operations/attendance');
  assert(getAtt.status === 200, 'GET /operations/attendance returns HTTP 200 OK', getAtt);
  assert(getAtt.data?.data?.records?.length > 0, 'Returns attendance check-in records');

  // Test 9: Check-in valid (distance <= 50m, faceScore >= 92%)
  const validCheckIn = await request('POST', '/operations/attendance/check-in', {
    employeeId: 'EMP-999',
    employeeName: 'Nguyễn Văn Test',
    distance: 22, // <= 50m OK
    faceScore: 95.8, // >= 92% OK
  });
  assert(validCheckIn.status === 201, 'POST /operations/attendance/check-in returns HTTP 201 Created for valid GPS & FaceID', validCheckIn);
  assert(validCheckIn.data?.data?.isGpsValid === true && validCheckIn.data?.data?.isFaceValid === true, 'Attendance record verified with GPS & FaceID valid flags');

  // Test 10: Check-in invalid GPS (distance > 50m per BR-HRM-01)
  const invalidGpsCheckIn = await request('POST', '/operations/attendance/check-in', {
    employeeId: 'EMP-999',
    employeeName: 'Nguyễn Văn Test',
    distance: 120, // > 50m VIOLATION
    faceScore: 96.0,
  });
  assert(invalidGpsCheckIn.status === 400, 'POST check-in returns HTTP 400 Bad Request when distance > 50m (BR-HRM-01)');

  // Test 11: Check-in invalid FaceID (faceScore < 92% per BR-HRM-02)
  const invalidFaceCheckIn = await request('POST', '/operations/attendance/check-in', {
    employeeId: 'EMP-999',
    employeeName: 'Nguyễn Văn Test',
    distance: 15,
    faceScore: 78.5, // < 92% VIOLATION
  });
  assert(invalidFaceCheckIn.status === 400, 'POST check-in returns HTTP 400 Bad Request when faceScore < 92% (BR-HRM-02)');

  // Test 12: Leaves & Approvals
  const postLeave = await request('POST', '/operations/attendance/leaves', {
    employeeName: 'Nguyễn Văn Test',
    type: 'Nghỉ phép năm',
    startDate: '2026-10-12',
    endDate: '2026-10-13',
    reason: 'Việc cá nhân',
  });
  assert(postLeave.status === 201, 'POST /operations/attendance/leaves returns HTTP 201 Created', postLeave);
  const leaveId = postLeave.data?.data?.id;

  const approveLeave = await request('PUT', `/operations/attendance/leaves/${leaveId}/approve`, {
    approved: true,
  });
  assert(approveLeave.status === 200, 'PUT /operations/attendance/leaves/:id/approve returns HTTP 200 OK', approveLeave);
  assert(approveLeave.data?.data?.status === 'approved', 'Leave request marked as approved');

  // Test 13: FINANCIAL APPROVALS 3-TIER
  console.log('\n[4. FINANCIAL APPROVALS & NAPAS VIETQR]');
  const getApprovals = await request('GET', '/operations/finance/approvals');
  assert(getApprovals.status === 200, 'GET /operations/finance/approvals returns HTTP 200 OK', getApprovals);

  // Test 14: Tier resolution (< 5M -> Dept Head, 5-20M -> CFO, > 20M -> CEO per BR-FIN-02)
  const postCeoProposal = await request('POST', '/operations/finance/approvals', {
    title: 'Nâng cấp cụm server GPU AI H100 chạy LLM On-Premise',
    amount: 150000000, // > 20M
    recipient: 'Công ty CP Công nghệ Dữ liệu Số',
    department: 'R&D AI',
    bankName: 'VietinBank',
    accountNumber: '112003928172',
    invoiceNumber: `HD-GPU-${Date.now()}`,
  });
  assert(postCeoProposal.status === 201, 'POST /operations/finance/approvals returns HTTP 201 Created', postCeoProposal);
  assert(postCeoProposal.data?.data?.tier === 'ceo', 'Amount > 20M correctly routes to tier: ceo (BR-FIN-02)');
  const proposalId = postCeoProposal.data?.data?.id;

  // Test 15: Approve payment proposal (Checker stage)
  const approveChecker = await request('PUT', `/operations/finance/approvals/${proposalId}/approve`, {
    role: 'checker',
    signerName: 'Kế toán trưởng Nguyễn Thị Lan',
  });
  assert(approveChecker.status === 200, 'PUT /operations/finance/approvals/:id/approve (checker) returns HTTP 200 OK', approveChecker);
  assert(approveChecker.data?.data?.status === 'pending_approver', 'Status transitions to pending_approver after checker approval');

  // Test 16: Approve payment proposal (Approver stage)
  const approveFinal = await request('PUT', `/operations/finance/approvals/${proposalId}/approve`, {
    role: 'approver',
    signerName: 'Tổng Giám Đốc Trần Trọng Vũ',
  });
  assert(approveFinal.status === 200, 'PUT /operations/finance/approvals/:id/approve (approver) returns HTTP 200 OK', approveFinal);
  assert(approveFinal.data?.data?.status === 'approved', 'Status transitions to approved after CEO approval');

  // Test 17: Napas VietQR 24/7 payload generation (BR-FIN-06)
  const getQr = await request('GET', `/operations/finance/approvals/${proposalId}/qr`);
  assert(getQr.status === 200, 'GET /operations/finance/approvals/:id/qr returns HTTP 200 OK', getQr);
  assert(getQr.data?.data?.vietqrUrl?.includes('img.vietqr.io'), 'Generates valid Napas VietQR 24/7 URL');
  assert(getQr.data?.data?.quickPaymentNapas247 === true, 'Confirms Napas 24/7 instant clearing');

  // Test 18: Duplicate invoice number error (BR-FIN-07)
  const dupInvoiceProposal = await request('POST', '/operations/finance/approvals', {
    title: 'Tờ trình trùng hóa đơn',
    amount: 10000000,
    recipient: 'Công ty CP Thép',
    invoiceNumber: postCeoProposal.data?.data?.invoiceNumber, // duplicate!
  });
  assert(dupInvoiceProposal.status === 400, 'POST returns HTTP 400 Bad Request on duplicate invoice number (BR-FIN-07)');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
