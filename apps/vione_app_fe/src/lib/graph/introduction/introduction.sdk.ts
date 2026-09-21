// BC-6.0 — SmartIntroductionSDK (client-safe façade).
// Only entry point UI/hook code uses. No React, no Supabase, no repository,
// no authority-bearing inputs. Delegates to the server-fn RPC stub.

import { graphFindIntroductionPathsFn } from "./introduction.functions";
import type { SmartIntroductionPageDTO, SmartIntroductionQuery } from "./types";

export const SmartIntroductionSDK = {
  findPaths: (query: SmartIntroductionQuery): Promise<SmartIntroductionPageDTO> =>
    graphFindIntroductionPathsFn({
      data: {
        targetPersonNodeId: query.targetPersonNodeId,
        limit: query.limit,
        maxDepth: query.maxDepth,
        includeAlternatives: query.includeAlternatives,
        cursor: query.cursor ?? null,
      },
    }),
};

export type SmartIntroductionSDKType = typeof SmartIntroductionSDK;
