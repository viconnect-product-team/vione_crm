// Platform Shared-Service capability registry (ADR-BC-010).
//
// A tiny, behavior-free registry that lets shared business services declare
// themselves and the SDK entrypoint through which other product surfaces
// consume them. This is documentation-as-code: it does NOT wire runtime
// dependencies or change any behavior — it makes the service boundary explicit
// and gives consumers a single discovery point.

export type ServiceCapability = {
  /** Stable id, e.g. "business-card". */
  id: string;
  /** Human label. */
  name: string;
  /** Layer per ADR-BC-007 (shared services sit above Core, below products). */
  layer: "core" | "shared" | "product";
  /** Service contract version (bump on breaking SDK changes). */
  version?: number;
  /** Verbs the service SDK exposes. */
  capabilities: string[];
  /** The SDK object consumers must go through. */
  sdk: unknown;
  /** Product surfaces expected to consume this service. */
  consumers: string[];
};

const registry = new Map<string, ServiceCapability>();

export function registerCapability(cap: ServiceCapability): ServiceCapability {
  registry.set(cap.id, cap);
  return cap;
}

export function getCapability(id: string): ServiceCapability | undefined {
  return registry.get(id);
}

export function listCapabilities(): ServiceCapability[] {
  return Array.from(registry.values());
}
