import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { useMemo } from "react";
import { MatchStatus } from "../backend.d";
import type { Match } from "../backend.d";
import BracketView from "../components/BracketView";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import {
  useAllMatches,
  useAllTeams,
  useLeaderboard,
  useTournamentInfo,
} from "../hooks/useQueries";

function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === MatchStatus.InProgress) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary animate-pulse">
        <span className="w-2 h-2 rounded-full bg-primary inline-block" />
        LIVE
      </span>
    );
  }
  if (status === MatchStatus.Completed) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
        ✓ Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
      Scheduled
    </span>
  );
}

function ScoreDisplay({ match }: { match: Match }) {
  const sets = [
    `${match.set1ScoreA}-${match.set1ScoreB}`,
    `${match.set2ScoreA}-${match.set2ScoreB}`,
  ];
  if (match.set3ScoreA != null && match.set3ScoreB != null) {
    sets.push(`${match.set3ScoreA}-${match.set3ScoreB}`);
  }
  return (
    <span className="font-mono text-sm text-muted-foreground">
      {sets.join(" | ")}
    </span>
  );
}

export default function Dashboard() {
  const { data: tournamentInfo, isLoading: infoLoading } = useTournamentInfo();
  const { data: matches = [], isLoading: matchesLoading } = useAllMatches();
  const { data: teams = [], isLoading: teamsLoading } = useAllTeams();
  const { data: leaderboard = [], isLoading: lbLoading } = useLeaderboard();

  const teamMap = useMemo(() => {
    const m = new Map<string, import("../backend.d").Team>();
    for (const t of teams) {
      m.set(String(t.id), t);
    }
    return m;
  }, [teams]);

  const getTeamDisplayName = (id: bigint) => {
    const team = teamMap.get(String(id));
    if (!team) return `Team ${id}`;
    return team.player2 ? `${team.player1} & ${team.player2}` : team.player1;
  };

  const liveMatches = matches.filter(
    (m) => m.status === MatchStatus.InProgress,
  );
  const completedMatches = matches.filter(
    (m) => m.status === MatchStatus.Completed,
  );
  const bracketMatches = matches.filter((m) => m.round != null);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const diff = Number(b.points) - Number(a.points);
    return diff !== 0 ? diff : Number(b.wins) - Number(a.wins);
  });

  const isLoading = infoLoading || matchesLoading || teamsLoading;

  return (
    <div className="space-y-8">
      {/* Hero / Tournament Info */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-ocid="dashboard.section"
      >
        <div className="card-sport p-6 bg-gradient-to-br from-primary/5 to-primary/10">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🏸</span>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground leading-tight">
                    {tournamentInfo?.name ??
                      "Tekdi-AIMS Sports Day – Badminton Tournament"}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {tournamentInfo?.date && (
                    <span className="flex items-center gap-1">
                      📅 {tournamentInfo.date}
                    </span>
                  )}
                  {tournamentInfo?.venue && (
                    <span className="flex items-center gap-1">
                      📍 {tournamentInfo.venue}
                    </span>
                  )}
                  {tournamentInfo?.format && (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      {tournamentInfo.format}
                    </Badge>
                  )}
                </div>
                {liveMatches.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white font-bold text-sm animate-pulse shadow-md">
                      🔴 LIVE — {liveMatches.length} Match
                      {liveMatches.length > 1 ? "es" : ""} in Progress
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 p-3 bg-card rounded-xl border border-border shadow-xs">
                <QRCodeDisplay value={window.location.href} size={120} />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Scan to view
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Live Matches Alert */}
      {liveMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
          data-ocid="live.section"
        >
          <h2 className="section-heading">
            <span className="animate-pulse">🔴</span> Live Matches
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveMatches.map((match, i) => (
              <div
                key={String(match.id)}
                data-ocid={`live.item.${i + 1}`}
                className="card-sport p-4 border-l-4 border-l-primary bg-primary/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Court {match.court}
                  </span>
                  <StatusBadge status={match.status} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-lg text-foreground flex-1">
                    {getTeamDisplayName(match.teamAId)}
                  </span>
                  <span className="text-xl font-black text-primary">VS</span>
                  <span className="font-bold text-lg text-foreground flex-1 text-right">
                    {getTeamDisplayName(match.teamBId)}
                  </span>
                </div>
                {match.round && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {match.round}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Match Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        data-ocid="schedule.section"
      >
        <h2 className="section-heading mb-4">🏸 Match Schedule</h2>
        {matchesLoading ? (
          <div
            className="card-sport p-4 space-y-3"
            data-ocid="schedule.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div
            className="card-sport p-10 text-center"
            data-ocid="schedule.empty_state"
          >
            <span className="text-5xl block mb-3">🏸</span>
            <p className="text-muted-foreground font-medium">
              No matches scheduled yet.
            </p>
          </div>
        ) : (
          <div className="card-sport overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm" data-ocid="schedule.table">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      #
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Teams
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Court
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Round
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, i) => (
                    <tr
                      key={String(match.id)}
                      data-ocid={`schedule.row.${i + 1}`}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${
                        match.status === MatchStatus.InProgress
                          ? "bg-primary/10"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {getTeamDisplayName(match.teamAId)}
                          </span>
                          <span className="text-muted-foreground text-xs font-medium">
                            vs
                          </span>
                          <span className="font-semibold text-base">
                            {getTeamDisplayName(match.teamBId)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {match.court}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {match.matchTime}
                      </td>
                      <td className="px-4 py-3">
                        {match.round ? (
                          <Badge variant="outline" className="text-xs">
                            {match.round}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={match.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {matches.map((match, i) => (
                <div
                  key={String(match.id)}
                  data-ocid={`schedule.item.${i + 1}`}
                  className="p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{i + 1}
                    </span>
                    <StatusBadge status={match.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-base">
                      {getTeamDisplayName(match.teamAId)}
                    </span>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <span className="font-bold text-base">
                      {getTeamDisplayName(match.teamBId)}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Court: {match.court}</span>
                    <span>{match.matchTime}</span>
                    {match.round && <span>{match.round}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Live Results */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        data-ocid="results.section"
      >
        <h2 className="section-heading mb-4">🏆 Live Results</h2>
        {completedMatches.length === 0 ? (
          <div
            className="card-sport p-8 text-center"
            data-ocid="results.empty_state"
          >
            <span className="text-4xl block mb-2">⏳</span>
            <p className="text-muted-foreground">No completed matches yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedMatches.map((match, i) => {
              const isAWinner =
                match.winnerId != null && match.winnerId === match.teamAId;
              const isBWinner =
                match.winnerId != null && match.winnerId === match.teamBId;
              return (
                <div
                  key={String(match.id)}
                  data-ocid={`results.item.${i + 1}`}
                  className="card-sport p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">
                      Match #{i + 1}
                    </span>
                    {match.round && (
                      <Badge variant="outline" className="text-xs">
                        {match.round}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div
                      className={`flex items-center p-2 rounded-lg gap-2 ${
                        isAWinner
                          ? "bg-primary/10 border border-primary/30"
                          : ""
                      }`}
                    >
                      {isAWinner && (
                        <span className="text-primary font-bold">🥇</span>
                      )}
                      <span
                        className={`font-semibold text-base ${
                          isAWinner ? "text-primary" : ""
                        }`}
                      >
                        {getTeamDisplayName(match.teamAId)}
                      </span>
                    </div>
                    <div
                      className={`flex items-center p-2 rounded-lg gap-2 ${
                        isBWinner
                          ? "bg-primary/10 border border-primary/30"
                          : ""
                      }`}
                    >
                      {isBWinner && (
                        <span className="text-primary font-bold">🥇</span>
                      )}
                      <span
                        className={`font-semibold text-base ${
                          isBWinner ? "text-primary" : ""
                        }`}
                      >
                        {getTeamDisplayName(match.teamBId)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-2">
                    <ScoreDisplay match={match} />
                  </div>
                  {match.winnerId != null && (
                    <div className="text-center text-sm font-bold text-primary">
                      Winner: {getTeamDisplayName(match.winnerId)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Tournament Bracket */}
      {bracketMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          data-ocid="bracket.section"
        >
          <h2 className="section-heading mb-4">🎖️ Tournament Bracket</h2>
          <BracketView matches={bracketMatches} teamMap={teamMap} />
        </motion.div>
      )}

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        data-ocid="leaderboard.section"
      >
        <h2 className="section-heading mb-4">📊 Leaderboard</h2>
        {lbLoading ? (
          <div
            className="card-sport p-4 space-y-3"
            data-ocid="leaderboard.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sortedLeaderboard.length === 0 ? (
          <div
            className="card-sport p-8 text-center"
            data-ocid="leaderboard.empty_state"
          >
            <p className="text-muted-foreground">
              Leaderboard will update as matches complete.
            </p>
          </div>
        ) : (
          <div
            className="card-sport overflow-hidden"
            data-ocid="leaderboard.table"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
                    <th className="px-4 py-3 text-left font-bold text-foreground">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-foreground">
                      Team / Player
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">
                      Played
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">
                      Wins
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">
                      Losses
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((entry, i) => (
                    <tr
                      key={String(entry.teamId)}
                      data-ocid={`leaderboard.row.${i + 1}`}
                      className={`border-b border-border last:border-0 ${
                        i === 0
                          ? "bg-yellow-400/10"
                          : i === 1
                            ? "bg-muted/20"
                            : i === 2
                              ? "bg-primary/5"
                              : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-lg">
                          {i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : `#${i + 1}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-base">
                          {(() => {
                            const t = teamMap.get(String(entry.teamId));
                            return t
                              ? t.player2
                                ? `${t.player1} & ${t.player2}`
                                : t.player1
                              : entry.teamName;
                          })()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {String(entry.matchesPlayed)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-primary font-bold">
                        {String(entry.wins)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-destructive">
                        {String(entry.losses)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                          {String(entry.points)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
