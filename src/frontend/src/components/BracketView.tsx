import { MatchRound, MatchStatus } from "../backend.d";
import type { Match, Team } from "../backend.d";

interface BracketViewProps {
  matches: Match[];
  teamMap: Map<string, Team>;
}

const ROUND_ORDER = [
  MatchRound.QuarterFinal,
  MatchRound.SemiFinal,
  MatchRound.Final,
];
const ROUND_LABELS: Record<string, string> = {
  [MatchRound.QuarterFinal]: "Quarter Final",
  [MatchRound.SemiFinal]: "Semi Final",
  [MatchRound.Final]: "Final",
};

function TeamRow({
  teamName,
  isWinner,
  score,
  hasBorder,
}: {
  teamName: string;
  isWinner: boolean;
  score?: string;
  hasBorder?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 ${
        hasBorder ? "border-b border-border" : ""
      } ${isWinner ? "bg-primary/10" : ""}`}
    >
      {isWinner && <span className="text-primary text-xs">✓</span>}
      <span
        className={`text-sm font-semibold truncate flex-1 ${
          isWinner ? "text-primary" : "text-foreground"
        }`}
      >
        {teamName}
      </span>
      {score && (
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({
  match,
  teamMap,
}: {
  match: Match;
  teamMap: Map<string, Team>;
}) {
  const teamA = teamMap.get(String(match.teamAId));
  const teamB = teamMap.get(String(match.teamBId));
  const isAWinner = match.winnerId != null && match.winnerId === match.teamAId;
  const isBWinner = match.winnerId != null && match.winnerId === match.teamBId;
  const isCompleted = match.status === MatchStatus.Completed;
  const isLive = match.status === MatchStatus.InProgress;

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden min-w-[160px] transition-all ${
        isLive
          ? "border-primary shadow-md bg-primary/10 animate-pulse"
          : isCompleted
            ? "border-primary/50 bg-primary/5"
            : "border-border bg-card"
      }`}
    >
      {isLive && (
        <div className="bg-primary text-primary-foreground text-[10px] font-bold text-center py-0.5 tracking-widest">
          LIVE
        </div>
      )}
      <TeamRow
        teamName={
          teamA
            ? teamA.player2
              ? `${teamA.player1} & ${teamA.player2}`
              : teamA.player1
            : "TBD"
        }
        isWinner={isAWinner}
        score={
          isCompleted ? `${match.set1ScoreA}-${match.set1ScoreB}` : undefined
        }
        hasBorder
      />
      <TeamRow
        teamName={
          teamB
            ? teamB.player2
              ? `${teamB.player1} & ${teamB.player2}`
              : teamB.player1
            : "TBD"
        }
        isWinner={isBWinner}
        score={
          isCompleted ? `${match.set1ScoreB}-${match.set1ScoreA}` : undefined
        }
      />
    </div>
  );
}

export default function BracketView({ matches, teamMap }: BracketViewProps) {
  const roundsPresent = ROUND_ORDER.filter((r) =>
    matches.some((m) => m.round === r),
  );

  const finalMatch = matches.find((m) => m.round === MatchRound.Final);
  const champion =
    finalMatch?.winnerId != null
      ? teamMap.get(String(finalMatch.winnerId))
      : null;

  return (
    <div className="card-sport p-6 overflow-x-auto" data-ocid="bracket.panel">
      <div className="flex gap-8 items-start min-w-fit">
        {roundsPresent.map((round) => {
          const roundMatches = matches
            .filter((m) => m.round === round)
            .sort(
              (a, b) => Number(a.bracketSlot ?? 0) - Number(b.bracketSlot ?? 0),
            );
          return (
            <div key={round} className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-center text-muted-foreground uppercase tracking-wide mb-3">
                {ROUND_LABELS[round]}
              </h3>
              <div
                className={`flex flex-col ${
                  round === MatchRound.QuarterFinal
                    ? "gap-4"
                    : round === MatchRound.SemiFinal
                      ? "gap-16"
                      : "gap-32"
                }`}
              >
                {roundMatches.map((match) => (
                  <MatchCard
                    key={String(match.id)}
                    match={match}
                    teamMap={teamMap}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {champion && (
          <div className="flex flex-col items-center justify-center gap-2 mt-8">
            <h3 className="text-sm font-bold text-center text-muted-foreground uppercase tracking-wide mb-3">
              Champion
            </h3>
            <div className="rounded-xl border-2 border-yellow-400 bg-yellow-400/10 px-6 py-4 text-center shadow-md">
              <span className="text-3xl block mb-1">🏆</span>
              <span className="font-bold text-lg text-foreground">
                {champion.player2
                  ? `${champion.player1} & ${champion.player2}`
                  : champion.player1}
              </span>
            </div>
          </div>
        )}
      </div>

      {matches.length === 0 && (
        <div
          className="text-center py-8 text-muted-foreground"
          data-ocid="bracket.empty_state"
        >
          <span className="text-4xl block mb-2">🎖️</span>
          <p>Bracket will appear when bracket matches are created.</p>
        </div>
      )}
    </div>
  );
}
