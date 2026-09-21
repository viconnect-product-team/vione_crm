// BC-9.1 Turn A + B2c — Public Relationship Memory SDK.
// Read-only surface. UI/hook code MUST only import from this module.

import type {
  RelationshipMemoryDTO,
  RelationshipMemoryListDTO,
  RelationshipMemoryListFilters,
} from "./types";
import type {
  RelationshipMemorySearchFilters,
  RelationshipMemorySemanticFilters,
  RelationshipMemorySearchPageDTO,
  RelationshipMemoryGraphContextDTO,
} from "./search-dto";
import { getRelationshipMemoryByIdFn, listRelationshipMemoriesFn } from "./functions";
import {
  searchRelationshipMemoriesFn,
  listRelevantRelationshipMemoriesFn,
  getRelationshipMemoryGraphContextFn,
} from "./search.functions";

export interface RelationshipMemorySDKType {
  list(filters?: RelationshipMemoryListFilters): Promise<RelationshipMemoryListDTO>;
  getById(id: string): Promise<RelationshipMemoryDTO | null>;
  searchMemories(
    filters: RelationshipMemorySearchFilters | RelationshipMemorySemanticFilters,
  ): Promise<RelationshipMemorySearchPageDTO>;
  listRelevantMemories(
    filters: RelationshipMemorySearchFilters,
  ): Promise<RelationshipMemorySearchPageDTO>;
  getMemoryGraphContext(
    memoryId: string,
    opts?: { maxDepth?: number; maxNodes?: number },
  ): Promise<RelationshipMemoryGraphContextDTO>;
}

export const RelationshipMemorySDK: RelationshipMemorySDKType = Object.freeze({
  list: (filters?: RelationshipMemoryListFilters) =>
    listRelationshipMemoriesFn({
      data: (filters ?? {}) as never,
    }) as Promise<RelationshipMemoryListDTO>,
  getById: (id: string) =>
    getRelationshipMemoryByIdFn({ data: { id } }) as Promise<RelationshipMemoryDTO | null>,
  searchMemories: (filters: RelationshipMemorySearchFilters | RelationshipMemorySemanticFilters) =>
    searchRelationshipMemoriesFn({
      data: filters as never,
    }) as Promise<RelationshipMemorySearchPageDTO>,
  listRelevantMemories: (filters: RelationshipMemorySearchFilters) =>
    listRelevantRelationshipMemoriesFn({
      data: filters as never,
    }) as Promise<RelationshipMemorySearchPageDTO>,
  getMemoryGraphContext: (memoryId: string, opts?: { maxDepth?: number; maxNodes?: number }) =>
    getRelationshipMemoryGraphContextFn({
      data: {
        memoryId,
        maxDepth: opts?.maxDepth ?? null,
        maxNodes: opts?.maxNodes ?? null,
      } as never,
    }) as Promise<RelationshipMemoryGraphContextDTO>,
});

/** Whitelisted method names — used by the SDK-freeze contract test. */
export const RELATIONSHIP_MEMORY_SDK_METHODS = Object.freeze([
  "list",
  "getById",
  "searchMemories",
  "listRelevantMemories",
  "getMemoryGraphContext",
] as const);
