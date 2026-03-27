import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  LeaderboardEntry,
  Match,
  Team,
  TournamentInfo,
} from "../backend.d";
import { Format, MatchStatus } from "../backend.d";
import { useActor } from "./useActor";

export function useTournamentInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<TournamentInfo | null>({
    queryKey: ["tournamentInfo"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTournamentInfo();
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

export function useAllTeams() {
  const { actor, isFetching } = useActor();
  return useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeams();
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

export function useAllMatches() {
  const { actor, isFetching } = useActor();
  return useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMatches();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useBracketProgression() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, bigint | null]>>({
    queryKey: ["bracket"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBracketProgression();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateTeam() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      teamName: string;
      player1: string;
      player2?: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createTeam(
        data.teamName,
        data.player1,
        data.player2 ?? null,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useUpdateTeam() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      teamName: string;
      player1: string;
      player2?: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateTeam(
        data.id,
        data.teamName,
        data.player1,
        data.player2 ?? null,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useDeleteTeam() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteTeam(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useCreateMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      teamAId: bigint;
      teamBId: bigint;
      matchTime: string;
      court: string;
      round?: string;
      bracketSlot?: number;
    }) => {
      if (!actor) throw new Error("No actor");
      const round = data.round
        ? (data.round as import("../backend.d").MatchRound)
        : null;
      const slot = data.bracketSlot != null ? BigInt(data.bracketSlot) : null;
      return actor.createMatch(
        data.teamAId,
        data.teamBId,
        data.matchTime,
        data.court,
        round,
        slot,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches"] }),
  });
}

export function useUpdateMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (match: Match) => {
      if (!actor) throw new Error("No actor");
      return actor.updateMatch(match);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches"] }),
  });
}

export function useDeleteMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteMatch(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches"] }),
  });
}

export function useSaveMatchScores() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      match: Match;
      set1A: number;
      set1B: number;
      set2A: number;
      set2B: number;
      set3A?: number;
      set3B?: number;
      manualWinnerId?: number;
    }) => {
      if (!actor) throw new Error("No actor");
      const s3A = data.set3A != null ? BigInt(data.set3A) : null;
      const s3B = data.set3B != null ? BigInt(data.set3B) : null;
      const manualWinnerId =
        data.manualWinnerId != null ? BigInt(data.manualWinnerId) : null;
      await actor.saveMatchScores(
        data.match.id,
        BigInt(data.set1A),
        BigInt(data.set1B),
        BigInt(data.set2A),
        BigInt(data.set2B),
        s3A,
        s3B,
        manualWinnerId,
      );
      // Update match status to Completed
      const updatedMatch: Match = {
        ...data.match,
        status: MatchStatus.Completed,
        set1ScoreA: BigInt(data.set1A),
        set1ScoreB: BigInt(data.set1B),
        set2ScoreA: BigInt(data.set2A),
        set2ScoreB: BigInt(data.set2B),
        set3ScoreA: s3A ?? undefined,
        set3ScoreB: s3B ?? undefined,
      };
      await actor.updateMatch(updatedMatch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["bracket"] });
    },
  });
}

export function useUpdateTournamentInfo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (info: TournamentInfo) => {
      if (!actor) throw new Error("No actor");
      return actor.updateTournamentInfo(info);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tournamentInfo"] }),
  });
}

export function useVerifyAdminPassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error("No actor");
      return actor.verifyAdminPassword(password);
    },
  });
}

export function useUpdateAdminPassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateAdminPassword(data.oldPassword, data.newPassword);
    },
  });
}

export { Format };
