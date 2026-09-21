import { describe, it, expect } from "vitest";
import {
  AI_WORKFLOWS,
  getWorkflow,
  workflowsForCapability,
  stepRequiresConfirmation,
  CONFIRMATION_STEP_TYPES,
  AUTOMATIC_STEP_TYPES,
  initWorkflowRun,
  advanceRun,
  confirmStep,
  skipStep,
  retryStep,
  cancelRun,
  totalEstimatedDuration,
  type WorkflowRunContext,
} from "@/lib/ai-workflows";
import { matchWorkflows, planWorkflow } from "@/lib/ai-workflow-planner";

const ADMIN: WorkflowRunContext = { rank: 2, hasAssociation: true };
const MEMBER: WorkflowRunContext = { rank: 0, hasAssociation: true };

describe("workflow registry", () => {
  it("has valid, ordered steps and confirmation policy", () => {
    for (const wf of AI_WORKFLOWS) {
      expect(wf.steps.length).toBeGreaterThan(0);
      expect(wf.supportedCapabilities.length).toBeGreaterThan(0);
      for (const s of wf.steps) {
        expect(s.requiresConfirmation).toBe(stepRequiresConfirmation(s.type));
        expect(s.estimatedDuration).toBeGreaterThan(0);
      }
    }
  });

  it("contains no destructive step types (read-only MVP)", () => {
    const destructive = ["SEND", "DELETE", "APPROVE"];
    for (const wf of AI_WORKFLOWS) {
      for (const s of wf.steps) {
        expect(destructive).not.toContain(s.type);
      }
    }
  });

  it("classifies automatic vs confirmation step types correctly", () => {
    expect(AUTOMATIC_STEP_TYPES).toContain("SEARCH");
    expect(CONFIRMATION_STEP_TYPES).toContain("EXPORT");
    expect(stepRequiresConfirmation("EXPORT")).toBe(true);
    expect(stepRequiresConfirmation("SEARCH")).toBe(false);
  });

  it("resolves workflows by id and capability", () => {
    expect(getWorkflow("fee-reminder")?.supportedCapabilities).toContain("fee");
    expect(workflowsForCapability("member").length).toBeGreaterThan(0);
    expect(totalEstimatedDuration(getWorkflow("member-list")!)).toBeGreaterThan(0);
  });
});

describe("workflow planner", () => {
  it("selects the fee reminder workflow for an unpaid-fee request", () => {
    const plan = planWorkflow("Hãy nhắc những hội viên chưa đóng hội phí", "fee");
    expect(plan.workflow?.id).toBe("fee-reminder");
  });

  it("returns matches sorted by score", () => {
    const matches = matchWorkflows("xuất hội viên ra file csv", "member");
    expect(matches[0].workflow.id).toBe("member-export");
  });

  it("suggests capability workflows when nothing explicitly matches", () => {
    const plan = planWorkflow("giúp tôi việc này", "document");
    expect(plan.workflow?.supportedCapabilities).toContain("document");
  });
});

describe("run state machine", () => {
  it("auto-runs safe steps and pauses at protected steps", () => {
    const wf = getWorkflow("member-export")!;
    let run = initWorkflowRun(wf, ADMIN, "r1");
    run = advanceRun(run);
    // search (SEARCH) + preview (GENERATE) auto; export (EXPORT) awaits confirm.
    expect(run.steps[0].status).toBe("succeeded");
    expect(run.steps[1].status).toBe("succeeded");
    expect(run.steps[2].status).toBe("awaiting-confirmation");
    expect(run.outcome).toBe("paused");

    run = confirmStep(run, "export");
    expect(run.steps[2].status).toBe("succeeded");
    expect(run.outcome).toBe("completed");
  });

  it("fails a step when permission is insufficient and can be skipped", () => {
    const wf = getWorkflow("member-export")!; // requires moderator
    let run = initWorkflowRun(wf, MEMBER, "r2");
    run = advanceRun(run);
    expect(run.steps[0].status).toBe("failed");
    expect(run.outcome).toBe("paused");

    run = skipStep(run, run.steps[0].step.id);
    expect(run.steps[0].status).toBe("skipped");
  });

  it("retry re-evaluates a failed step", () => {
    const wf = getWorkflow("executive-report")!; // admin
    let run = initWorkflowRun(wf, MEMBER, "r3");
    run = advanceRun(run);
    expect(run.steps[0].status).toBe("failed");
    run = retryStep(run, run.steps[0].step.id);
    // still member → fails again (deterministic)
    expect(run.steps[0].status).toBe("failed");
  });

  it("cancel marks pending steps cancelled", () => {
    const wf = getWorkflow("member-export")!;
    let run = initWorkflowRun(wf, ADMIN, "r4");
    run = advanceRun(run);
    run = cancelRun(run);
    expect(run.outcome).toBe("cancelled");
    expect(run.steps[2].status).toBe("cancelled");
  });

  it("completes a fully automatic workflow with permission", () => {
    const wf = getWorkflow("document-summary")!; // member, all auto
    let run = initWorkflowRun(wf, MEMBER, "r5");
    run = advanceRun(run);
    expect(run.outcome).toBe("completed");
    expect(run.steps.every((s) => s.status === "succeeded")).toBe(true);
  });
});
