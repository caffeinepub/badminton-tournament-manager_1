import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LeaderboardEntry {
    teamName: string;
    wins: bigint;
    losses: bigint;
    matchesPlayed: bigint;
    teamId: bigint;
    points: bigint;
}
export interface TournamentInfo {
    venue: string;
    date: string;
    name: string;
    format: Format;
}
export interface Match {
    id: bigint;
    matchTime: string;
    status: MatchStatus;
    set2ScoreA: bigint;
    set2ScoreB: bigint;
    winnerId?: bigint;
    set3ScoreA?: bigint;
    set3ScoreB?: bigint;
    court: string;
    teamAId: bigint;
    teamBId: bigint;
    bracketSlot?: bigint;
    round?: MatchRound;
    set1ScoreA: bigint;
    set1ScoreB: bigint;
}
export interface Team {
    id: bigint;
    teamName: string;
    player1: string;
    player2?: string;
}
export enum Format {
    Doubles = "Doubles",
    Singles = "Singles"
}
export enum MatchRound {
    LeagueRound1 = "LeagueRound1",
    LeagueRound2 = "LeagueRound2",
    SemiFinal = "SemiFinal",
    Final = "Final",
    QuarterFinal = "QuarterFinal"
}
export enum MatchStatus {
    Scheduled = "Scheduled",
    InProgress = "InProgress",
    Completed = "Completed"
}
export interface backendInterface {
    createMatch(teamAId: bigint, teamBId: bigint, matchTime: string, court: string, round: MatchRound | null, bracketSlot: bigint | null): Promise<bigint>;
    createTeam(teamName: string, player1: string, player2: string | null): Promise<bigint>;
    deleteMatch(id: bigint): Promise<void>;
    deleteTeam(id: bigint): Promise<void>;
    getAllMatches(): Promise<Array<Match>>;
    getAllTeams(): Promise<Array<Team>>;
    getBracketProgression(): Promise<Array<[bigint, bigint | null]>>;
    getLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getMatch(id: bigint): Promise<Match | null>;
    getTeam(id: bigint): Promise<Team | null>;
    getTournamentInfo(): Promise<TournamentInfo | null>;
    saveMatchScores(matchId: bigint, set1ScoreA: bigint, set1ScoreB: bigint, set2ScoreA: bigint, set2ScoreB: bigint, set3ScoreA: bigint | null, set3ScoreB: bigint | null, manualWinnerId: bigint | null): Promise<void>;
    updateAdminPassword(oldPassword: string, newPassword: string): Promise<boolean>;
    updateMatch(match: Match): Promise<void>;
    updateTeam(id: bigint, teamName: string, player1: string, player2: string | null): Promise<void>;
    updateTournamentInfo(info: TournamentInfo): Promise<void>;
    verifyAdminPassword(password: string): Promise<boolean>;
}
