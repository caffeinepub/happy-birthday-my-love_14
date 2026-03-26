import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SlotInfo } from "../backend.d";
import { useActor } from "./useActor";

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSlots() {
  const { actor, isFetching } = useActor();
  return useQuery<SlotInfo[]>({
    queryKey: ["slots"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSlotInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSlot() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      index,
      blobId,
    }: { index: number; blobId: Uint8Array }) => {
      if (!actor) throw new Error("No actor");
      await actor.createSlot(BigInt(index), blobId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["slots"] }),
  });
}

export function useRemoveSlot() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (index: number) => {
      if (!actor) throw new Error("No actor");
      await actor.removeSlot(BigInt(index));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["slots"] }),
  });
}
