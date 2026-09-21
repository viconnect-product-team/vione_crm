// BC-6.2 — IntroductionRequestSDK (client-safe façade).
// No React, no Supabase, no repository or service imports. Product code MUST
// call through this SDK — never the server-fn stubs directly.

import {
  acceptIntroductionRequestFn,
  cancelIntroductionRequestFn,
  declineIntroductionRequestFn,
  getIntroductionRequestFn,
  listIncomingIntroductionRequestsFn,
  listOutgoingIntroductionRequestsFn,
  sendIntroductionRequestFn,
} from "./request.functions";
import type {
  IntroductionRequestDTO,
  IntroductionRequestPageDTO,
  ListRequestsOptions,
  SendIntroductionRequestInput,
} from "./types";

export const IntroductionRequestSDK = {
  sendRequest: (i: SendIntroductionRequestInput): Promise<IntroductionRequestDTO> =>
    sendIntroductionRequestFn({ data: i }),
  acceptRequest: (requestId: string): Promise<IntroductionRequestDTO> =>
    acceptIntroductionRequestFn({ data: { requestId } }),
  declineRequest: (requestId: string): Promise<IntroductionRequestDTO> =>
    declineIntroductionRequestFn({ data: { requestId } }),
  cancelRequest: (requestId: string): Promise<IntroductionRequestDTO> =>
    cancelIntroductionRequestFn({ data: { requestId } }),
  getRequest: (requestId: string): Promise<IntroductionRequestDTO> =>
    getIntroductionRequestFn({ data: { requestId } }),
  listIncoming: (opts?: ListRequestsOptions): Promise<IntroductionRequestPageDTO> =>
    listIncomingIntroductionRequestsFn({ data: opts ?? {} }),
  listOutgoing: (opts?: ListRequestsOptions): Promise<IntroductionRequestPageDTO> =>
    listOutgoingIntroductionRequestsFn({ data: opts ?? {} }),
};

export type IntroductionRequestSDKType = typeof IntroductionRequestSDK;
