// BC-6.4 — Introduction Outcome React Query bindings.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IntroductionOutcomeSDK,
  introductionOutcomeKeys,
  toIntroductionOutcomeError,
  type IntroductionOutcomeDTO,
  type IntroductionOutcomePageDTO,
  type ListOutcomesOptions,
  type MarkProgressedInput,
} from "@/lib/graph/introduction/outcome";

export { introductionOutcomeKeys };

export function useRequesterIntroductionOutcomes(opts?: ListOutcomesOptions) {
  return useQuery<IntroductionOutcomePageDTO>({
    queryKey: introductionOutcomeKeys.requester(opts),
    queryFn: () => IntroductionOutcomeSDK.listRequesterOutcomes(opts),
    staleTime: 30_000,
  });
}

export function useIntermediaryIntroductionOutcomes(opts?: ListOutcomesOptions) {
  return useQuery<IntroductionOutcomePageDTO>({
    queryKey: introductionOutcomeKeys.intermediary(opts),
    queryFn: () => IntroductionOutcomeSDK.listIntermediaryOutcomes(opts),
    staleTime: 30_000,
  });
}

export function useIntermediaryIntroductionImpact() {
  return useQuery({
    queryKey: introductionOutcomeKeys.impact(),
    queryFn: () => IntroductionOutcomeSDK.getIntermediaryImpact(),
    staleTime: 60_000,
  });
}

export function useIntroductionOutcome(id: string | null | undefined) {
  return useQuery<IntroductionOutcomeDTO>({
    queryKey: introductionOutcomeKeys.detail(id ?? ""),
    queryFn: () => IntroductionOutcomeSDK.getOutcome(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: introductionOutcomeKeys.root });
}

export function useMarkOutcomeProgressed() {
  const qc = useQueryClient();
  return useMutation<IntroductionOutcomeDTO, Error, MarkProgressedInput>({
    mutationFn: async (input) => {
      try {
        return await IntroductionOutcomeSDK.markProgressed(input);
      } catch (e) {
        throw toIntroductionOutcomeError(e);
      }
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMarkOutcomeNoOutcome() {
  const qc = useQueryClient();
  return useMutation<IntroductionOutcomeDTO, Error, string>({
    mutationFn: async (outcomeId) => {
      try {
        return await IntroductionOutcomeSDK.markNoOutcome(outcomeId);
      } catch (e) {
        throw toIntroductionOutcomeError(e);
      }
    },
    onSuccess: () => invalidateAll(qc),
  });
}
