import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Shuffle,
  Trash2,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Format as FormatEnum, MatchRound, MatchStatus } from "../backend.d";
import type { Match, Team, TournamentInfo } from "../backend.d";
import {
  Format,
  useAllMatches,
  useAllTeams,
  useCreateMatch,
  useCreateTeam,
  useDeleteMatch,
  useDeleteTeam,
  useSaveMatchScores,
  useTournamentInfo,
  useUpdateMatch,
  useUpdateTeam,
  useUpdateTournamentInfo,
  useVerifyAdminPassword,
} from "../hooks/useQueries";

class TabErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          Something went wrong loading this tab. Please refresh.
        </div>
      );
    }
    return this.props.children;
  }
}

// ---- Password Gate ----
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const verify = useVerifyAdminPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ok = await verify.mutateAsync(password);
      if (ok) {
        onSuccess();
      } else {
        toast.error("Incorrect password. Please try again.");
      }
    } catch (_err) {
      toast.error("Login failed. Please wait a moment and try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-sport p-8 w-full max-w-sm space-y-6"
        data-ocid="admin.panel"
      >
        <div className="text-center space-y-2">
          <span className="text-5xl block">🔐</span>
          <h2 className="font-display font-bold text-2xl">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">
            Enter password to continue
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              data-ocid="admin.input"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button
            data-ocid="admin.submit_button"
            type="submit"
            className="w-full bg-sport-blue hover:bg-sport-blue/90 text-white"
            disabled={verify.isPending || !password}
          >
            {verify.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ---- Teams Tab ----
function TeamsTab() {
  const { data: teams = [], isLoading } = useAllTeams();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const [form, setForm] = useState({ teamName: "", player1: "", player2: "" });
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editForm, setEditForm] = useState({
    teamName: "",
    player1: "",
    player2: "",
  });
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamName || !form.player1) return;
    await createTeam.mutateAsync({
      teamName: form.teamName,
      player1: form.player1,
      player2: form.player2 || undefined,
    });
    setForm({ teamName: "", player1: "", player2: "" });
    toast.success("Team created!");
  };

  const openEdit = (team: Team) => {
    setEditTeam(team);
    setEditForm({
      teamName: team.teamName,
      player1: team.player1,
      player2: team.player2 ?? "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeam) return;
    await updateTeam.mutateAsync({
      id: editTeam.id,
      teamName: editForm.teamName,
      player1: editForm.player1,
      player2: editForm.player2 || undefined,
    });
    setEditTeam(null);
    toast.success("Team updated!");
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    await deleteTeam.mutateAsync(deleteId);
    setDeleteId(null);
    toast.success("Team deleted.");
  };

  return (
    <div className="space-y-6">
      {/* Add Team Form */}
      <div className="card-sport p-5 space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Plus className="w-4 h-4 text-sport-green" /> Add Team
        </h3>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Team / Player Name *</Label>
            <Input
              data-ocid="team.input"
              placeholder="e.g. Eagles"
              value={form.teamName}
              onChange={(e) =>
                setForm((f) => ({ ...f, teamName: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Player 1 *</Label>
            <Input
              placeholder="Player 1 name"
              value={form.player1}
              onChange={(e) =>
                setForm((f) => ({ ...f, player1: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Player 2 (optional)</Label>
            <Input
              placeholder="Player 2 name"
              value={form.player2}
              onChange={(e) =>
                setForm((f) => ({ ...f, player2: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              data-ocid="team.submit_button"
              type="submit"
              className="bg-sport-green hover:bg-sport-green/90 text-white"
              disabled={createTeam.isPending}
            >
              {createTeam.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Team
            </Button>
          </div>
        </form>
      </div>

      {/* Teams List */}
      <div className="card-sport overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-bold text-lg">Teams ({teams.length})</h3>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3" data-ocid="teams.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div
            className="p-8 text-center text-muted-foreground"
            data-ocid="teams.empty_state"
          >
            No teams yet. Add one above.
          </div>
        ) : (
          <div className="divide-y divide-border" data-ocid="teams.list">
            {teams.map((team, i) => (
              <div
                key={String(team.id)}
                data-ocid={`teams.item.${i + 1}`}
                className="flex items-center gap-3 px-5 py-4"
              >
                <span className="text-xl">🏸</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">
                    {team.teamName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {team.player1}
                    {team.player2 ? ` & ${team.player2}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-ocid={`teams.edit_button.${i + 1}`}
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(team)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    data-ocid={`teams.delete_button.${i + 1}`}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => setDeleteId(team.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTeam} onOpenChange={(o) => !o && setEditTeam(null)}>
        <DialogContent data-ocid="teams.dialog">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name *</Label>
              <Input
                value={editForm.teamName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, teamName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Player 1 *</Label>
              <Input
                value={editForm.player1}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, player1: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Player 2 (optional)</Label>
              <Input
                value={editForm.player2}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, player2: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                data-ocid="teams.cancel_button"
                type="button"
                variant="outline"
                onClick={() => setEditTeam(null)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="teams.save_button"
                type="submit"
                className="bg-sport-green hover:bg-sport-green/90 text-white"
                disabled={updateTeam.isPending}
              >
                {updateTeam.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}{" "}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteId != null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <DialogContent data-ocid="teams.modal">
          <DialogHeader>
            <DialogTitle>Delete Team?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              data-ocid="teams.cancel_button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="teams.confirm_button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTeam.isPending}
            >
              {deleteTeam.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}{" "}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Matches Tab ----
function MatchesTab() {
  const { data: teams = [] } = useAllTeams();
  const { data: matches = [], isLoading } = useAllMatches();
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const deleteMatch = useDeleteMatch();

  const teamMap = new Map(teams.map((t) => [String(t.id), t]));
  const getTeamName = (id: bigint) => {
    const team = teamMap.get(String(id));
    if (!team) return `Team ${id}`;
    const players = team.player2
      ? `${team.player1} & ${team.player2}`
      : team.player1;
    return `${team.teamName} (${players})`;
  };

  const [form, setForm] = useState({
    teamAId: "",
    teamBId: "",
    matchTime: "",
    court: "",
    round: "none",
    bracketSlot: "",
  });
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    matchTime: "",
    court: "",
  });
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamAId || !form.teamBId) return;
    await createMatch.mutateAsync({
      teamAId: BigInt(form.teamAId),
      teamBId: BigInt(form.teamBId),
      matchTime: form.matchTime,
      court: form.court,
      round: form.round && form.round !== "none" ? form.round : undefined,
      bracketSlot: form.bracketSlot
        ? Number.parseInt(form.bracketSlot)
        : undefined,
    });
    setForm({
      teamAId: "",
      teamBId: "",
      matchTime: "",
      court: "",
      round: "none",
      bracketSlot: "",
    });
    toast.success("Match created!");
  };

  const openEdit = (match: Match) => {
    setEditMatch(match);
    setEditForm({
      status: match.status,
      matchTime: match.matchTime,
      court: match.court,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMatch) return;
    await updateMatch.mutateAsync({
      ...editMatch,
      status: editForm.status as MatchStatus,
      matchTime: editForm.matchTime,
      court: editForm.court,
    });
    setEditMatch(null);
    toast.success("Match updated!");
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    await deleteMatch.mutateAsync(deleteId);
    setDeleteId(null);
    toast.success("Match deleted.");
  };

  return (
    <div className="space-y-6">
      {/* Create Match Form */}
      <div className="card-sport p-5 space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Plus className="w-4 h-4 text-sport-blue" /> Create Match
        </h3>
        <form
          onSubmit={handleCreate}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <div className="space-y-1">
            <Label>Team A *</Label>
            <Select
              value={form.teamAId}
              onValueChange={(v) => setForm((f) => ({ ...f, teamAId: v }))}
            >
              <SelectTrigger data-ocid="match.select">
                <SelectValue placeholder="Select Team A" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={String(t.id)} value={String(t.id)}>
                    {t.player2 ? `${t.player1} & ${t.player2}` : t.player1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Team B *</Label>
            <Select
              value={form.teamBId}
              onValueChange={(v) => setForm((f) => ({ ...f, teamBId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Team B" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={String(t.id)} value={String(t.id)}>
                    {t.player2 ? `${t.player1} & ${t.player2}` : t.player1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Match Time *</Label>
            <Input
              data-ocid="match.input"
              placeholder="e.g. 10:00 AM"
              value={form.matchTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, matchTime: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Court *</Label>
            <Input
              placeholder="e.g. Court 1"
              value={form.court}
              onChange={(e) =>
                setForm((f) => ({ ...f, court: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Round (optional)</Label>
            <Select
              value={form.round}
              onValueChange={(v) => setForm((f) => ({ ...f, round: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value={MatchRound.LeagueRound1}>
                  League Round 1
                </SelectItem>
                <SelectItem value={MatchRound.LeagueRound2}>
                  League Round 2
                </SelectItem>
                <SelectItem value={MatchRound.QuarterFinal}>
                  Quarter Final
                </SelectItem>
                <SelectItem value={MatchRound.SemiFinal}>Semi Final</SelectItem>
                <SelectItem value={MatchRound.Final}>Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Bracket Slot (optional)</Label>
            <Input
              type="number"
              placeholder="e.g. 1"
              value={form.bracketSlot}
              onChange={(e) =>
                setForm((f) => ({ ...f, bracketSlot: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button
              data-ocid="match.submit_button"
              type="submit"
              className="bg-sport-blue hover:bg-sport-blue/90 text-white"
              disabled={createMatch.isPending || !form.teamAId || !form.teamBId}
            >
              {createMatch.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Match
            </Button>
          </div>
        </form>
      </div>

      {/* Match List */}
      <div className="card-sport overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-bold text-lg">Matches ({matches.length})</h3>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3" data-ocid="matches.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div
            className="p-8 text-center text-muted-foreground"
            data-ocid="matches.empty_state"
          >
            No matches yet.
          </div>
        ) : (
          <div className="divide-y divide-border" data-ocid="matches.list">
            {matches.map((match, i) => (
              <div
                key={String(match.id)}
                data-ocid={`matches.item.${i + 1}`}
                className="flex flex-wrap items-center gap-3 px-5 py-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    {getTeamName(match.teamAId)}{" "}
                    <span className="text-muted-foreground text-sm">vs</span>{" "}
                    {getTeamName(match.teamBId)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Court: {match.court} · {match.matchTime}
                    {match.round ? ` · ${match.round}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={match.status} />
                  <Button
                    data-ocid={`matches.edit_button.${i + 1}`}
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(match)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    data-ocid={`matches.delete_button.${i + 1}`}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => setDeleteId(match.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Match Dialog */}
      <Dialog open={!!editMatch} onOpenChange={(o) => !o && setEditMatch(null)}>
        <DialogContent data-ocid="matches.dialog">
          <DialogHeader>
            <DialogTitle>Edit Match</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger data-ocid="matches.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MatchStatus.Scheduled}>
                    Scheduled
                  </SelectItem>
                  <SelectItem value={MatchStatus.InProgress}>
                    In Progress
                  </SelectItem>
                  <SelectItem value={MatchStatus.Completed}>
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Match Time</Label>
              <Input
                value={editForm.matchTime}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, matchTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Court</Label>
              <Input
                value={editForm.court}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, court: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                data-ocid="matches.cancel_button"
                type="button"
                variant="outline"
                onClick={() => setEditMatch(null)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="matches.save_button"
                type="submit"
                className="bg-sport-blue hover:bg-sport-blue/90 text-white"
                disabled={updateMatch.isPending}
              >
                {updateMatch.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}{" "}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={deleteId != null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <DialogContent data-ocid="matches.modal">
          <DialogHeader>
            <DialogTitle>Delete Match?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              data-ocid="matches.cancel_button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="matches.confirm_button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMatch.isPending}
            >
              {deleteMatch.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}{" "}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === MatchStatus.InProgress) {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse">
        🔴 LIVE
      </Badge>
    );
  }
  if (status === MatchStatus.Completed) {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30">
        ✓ Done
      </Badge>
    );
  }
  return <Badge variant="secondary">Scheduled</Badge>;
}

// ---- Scores Tab ----
function ScoresTab() {
  const { data: matches = [], isLoading } = useAllMatches();
  const { data: teams = [] } = useAllTeams();
  const saveScores = useSaveMatchScores();

  const teamMap = new Map(teams.map((t) => [String(t.id), t]));
  const getTeamName = (id: bigint) => {
    const team = teamMap.get(String(id));
    if (!team) return `Team ${id}`;
    const players = team.player2
      ? `${team.player1} & ${team.player2}`
      : team.player1;
    return `${team.teamName} (${players})`;
  };

  const [expanded, setExpanded] = useState<string | null>(null);
  const [scores, setScores] = useState<
    Record<
      string,
      {
        set1A: string;
        set1B: string;
        set2A: string;
        set2B: string;
        set3A: string;
        set3B: string;
        winner: string;
      }
    >
  >({});

  const initScores = (match: Match) => {
    const key = String(match.id);
    if (!scores[key]) {
      setScores((s) => ({
        ...s,
        [key]: {
          set1A: String(match.set1ScoreA),
          set1B: String(match.set1ScoreB),
          set2A: String(match.set2ScoreA),
          set2B: String(match.set2ScoreB),
          set3A: match.set3ScoreA != null ? String(match.set3ScoreA) : "",
          set3B: match.set3ScoreB != null ? String(match.set3ScoreB) : "",
          winner: match.winnerId != null ? String(match.winnerId) : "",
        },
      }));
    }
  };

  const toggleExpand = (match: Match) => {
    const key = String(match.id);
    initScores(match);
    setExpanded(expanded === key ? null : key);
  };

  const handleSave = async (match: Match) => {
    const key = String(match.id);
    const s = scores[key];
    if (!s) return;
    await saveScores.mutateAsync({
      match,
      set1A: Number.parseInt(s.set1A) || 0,
      set1B: Number.parseInt(s.set1B) || 0,
      set2A: Number.parseInt(s.set2A) || 0,
      set2B: Number.parseInt(s.set2B) || 0,
      set3A: s.set3A ? Number.parseInt(s.set3A) : undefined,
      set3B: s.set3B ? Number.parseInt(s.set3B) : undefined,
      manualWinnerId: s.winner ? Number.parseInt(s.winner) : undefined,
    });
    toast.success("Scores saved!");
    setScores((prev) => ({ ...prev, [key]: { ...prev[key], winner: "" } }));
    setExpanded(null);
  };

  const setScore = (matchId: string, field: string, value: string) => {
    setScores((s) => ({ ...s, [matchId]: { ...s[matchId], [field]: value } }));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Click a match to enter or update scores.
      </p>
      {isLoading ? (
        <div className="space-y-3" data-ocid="scores.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div
          className="card-sport p-8 text-center text-muted-foreground"
          data-ocid="scores.empty_state"
        >
          No matches to score.
        </div>
      ) : (
        <div className="space-y-3" data-ocid="scores.list">
          {matches.map((match, i) => {
            const key = String(match.id);
            const isOpen = expanded === key;
            const s = scores[key];
            return (
              <div
                key={key}
                data-ocid={`scores.item.${i + 1}`}
                className="card-sport overflow-hidden"
              >
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                  type="button"
                  onClick={() => toggleExpand(match)}
                >
                  <span className="flex-1">
                    <span className="font-semibold">
                      {getTeamName(match.teamAId)}
                    </span>
                    <span className="text-muted-foreground text-sm mx-2">
                      vs
                    </span>
                    <span className="font-semibold">
                      {getTeamName(match.teamBId)}
                    </span>
                  </span>
                  <StatusBadge status={match.status} />
                  {match.status === MatchStatus.Completed && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {match.set1ScoreA}-{match.set1ScoreB} | {match.set2ScoreA}
                      -{match.set2ScoreB}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && s && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Set 1 */}
                          <div className="space-y-2">
                            <Label className="text-sport-green font-bold">
                              Set 1 — {getTeamName(match.teamAId)}
                            </Label>
                            <Input
                              data-ocid="scores.input"
                              type="number"
                              min="0"
                              max="30"
                              value={s.set1A}
                              onChange={(e) =>
                                setScore(key, "set1A", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sport-blue font-bold">
                              Set 1 — {getTeamName(match.teamBId)}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              value={s.set1B}
                              onChange={(e) =>
                                setScore(key, "set1B", e.target.value)
                              }
                            />
                          </div>
                          {/* Set 2 */}
                          <div className="space-y-2">
                            <Label className="text-sport-green font-bold">
                              Set 2 — {getTeamName(match.teamAId)}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              value={s.set2A}
                              onChange={(e) =>
                                setScore(key, "set2A", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sport-blue font-bold">
                              Set 2 — {getTeamName(match.teamBId)}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              value={s.set2B}
                              onChange={(e) =>
                                setScore(key, "set2B", e.target.value)
                              }
                            />
                          </div>
                          {/* Set 3 */}
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Set 3 (optional) — {getTeamName(match.teamAId)}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              value={s.set3A}
                              onChange={(e) =>
                                setScore(key, "set3A", e.target.value)
                              }
                              placeholder="—"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Set 3 (optional) — {getTeamName(match.teamBId)}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              value={s.set3B}
                              onChange={(e) =>
                                setScore(key, "set3B", e.target.value)
                              }
                              placeholder="—"
                            />
                          </div>
                        </div>
                        {/* Mark Winner Section */}
                        <div className="space-y-2">
                          <Label className="font-semibold text-sm">
                            Mark Winner{" "}
                            <span className="text-muted-foreground font-normal">
                              (optional — auto-calculated if not set)
                            </span>
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              data-ocid={`scores.winner_a_button.${i + 1}`}
                              onClick={() =>
                                setScores((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    winner:
                                      prev[key].winner === String(match.teamAId)
                                        ? ""
                                        : String(match.teamAId),
                                  },
                                }))
                              }
                              className={`rounded-xl border-2 px-4 py-3 font-semibold transition-all flex items-center justify-center gap-2 ${
                                s.winner === String(match.teamAId)
                                  ? "border-sport-green bg-sport-green/10 text-sport-green"
                                  : "border-border text-muted-foreground hover:border-sport-green/50"
                              }`}
                            >
                              {s.winner === String(match.teamAId) && (
                                <span>🏆</span>
                              )}
                              {getTeamName(match.teamAId)}
                            </button>
                            <button
                              type="button"
                              data-ocid={`scores.winner_b_button.${i + 1}`}
                              onClick={() =>
                                setScores((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    winner:
                                      prev[key].winner === String(match.teamBId)
                                        ? ""
                                        : String(match.teamBId),
                                  },
                                }))
                              }
                              className={`rounded-xl border-2 px-4 py-3 font-semibold transition-all flex items-center justify-center gap-2 ${
                                s.winner === String(match.teamBId)
                                  ? "border-sport-green bg-sport-green/10 text-sport-green"
                                  : "border-border text-muted-foreground hover:border-sport-green/50"
                              }`}
                            >
                              {s.winner === String(match.teamBId) && (
                                <span>🏆</span>
                              )}
                              {getTeamName(match.teamBId)}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            data-ocid={`scores.save_button.${i + 1}`}
                            className="bg-sport-green hover:bg-sport-green/90 text-white"
                            onClick={() => handleSave(match)}
                            disabled={saveScores.isPending}
                          >
                            {saveScores.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trophy className="mr-2 h-4 w-4" />
                            )}
                            Save Scores
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setExpanded(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Draw Tab ----
type SlotAssignment = { teamAId: string; teamBId: string };

type DrawMode = "leagueRound1" | "leagueRound2" | "quarterFinal" | "semiFinal";

const DRAW_MODE_CONFIG: Record<
  DrawMode,
  { label: string; round: MatchRound; count: number; isLeague: boolean }[]
> = {
  leagueRound1: [
    {
      label: "League Round 1",
      round: MatchRound.LeagueRound1,
      count: 25,
      isLeague: true,
    },
  ],
  leagueRound2: [
    {
      label: "League Round 2",
      round: MatchRound.LeagueRound2,
      count: 13,
      isLeague: true,
    },
  ],
  quarterFinal: [
    {
      label: "Quarter Finals",
      round: MatchRound.QuarterFinal,
      count: 4,
      isLeague: false,
    },
    {
      label: "Semi Finals",
      round: MatchRound.SemiFinal,
      count: 2,
      isLeague: false,
    },
    { label: "Final", round: MatchRound.Final, count: 1, isLeague: false },
  ],
  semiFinal: [
    {
      label: "Semi Finals",
      round: MatchRound.SemiFinal,
      count: 2,
      isLeague: false,
    },
    { label: "Final", round: MatchRound.Final, count: 1, isLeague: false },
  ],
};

function DrawTab() {
  const { data: teams = [], isLoading } = useAllTeams();
  const createMatch = useCreateMatch();

  const [drawMode, setDrawMode] = useState<DrawMode>("leagueRound1");
  const [slots, setSlots] = useState<SlotAssignment[]>([]);
  const [defaultTime, setDefaultTime] = useState("");
  const [defaultCourt, setDefaultCourt] = useState("");

  const rounds = DRAW_MODE_CONFIG[drawMode];
  const totalSlots = rounds.reduce((s, r) => s + r.count, 0);
  const isLeagueMode = rounds[0]?.isLeague ?? false;

  if (slots.length !== totalSlots) {
    setSlots(
      Array.from({ length: totalSlots }, () => ({ teamAId: "", teamBId: "" })),
    );
  }

  const initSlots = (mode: DrawMode) => {
    const total = DRAW_MODE_CONFIG[mode].reduce((s, r) => s + r.count, 0);
    setSlots(
      Array.from({ length: total }, () => ({ teamAId: "", teamBId: "" })),
    );
  };

  const updateSlot = (
    index: number,
    field: "teamAId" | "teamBId",
    value: string,
  ) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const handleRandomDraw = () => {
    if (teams.length < 2) {
      toast.error("Not enough teams for a draw. Add teams first.");
      return;
    }
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const needed = Math.min(shuffled.length, rounds[0].count * 2);
    const picked = shuffled.slice(0, needed);
    const newSlots: SlotAssignment[] = slots.map(() => ({
      teamAId: "",
      teamBId: "",
    }));
    for (let i = 0; i < Math.floor(picked.length / 2); i++) {
      newSlots[i] = {
        teamAId: picked[i * 2]?.id.toString() ?? "",
        teamBId: picked[i * 2 + 1]?.id.toString() ?? "",
      };
    }
    setSlots(newSlots);
    toast.success("Random draw complete!");
  };

  const handleGenerateMatches = async () => {
    const filledSlots = slots.filter((s) => s.teamAId && s.teamBId);
    if (filledSlots.length === 0) {
      toast.error("Assign teams to at least one slot first.");
      return;
    }
    for (const s of filledSlots) {
      if (s.teamAId === s.teamBId) {
        toast.error("A team cannot play against itself.");
        return;
      }
    }

    let slotIndex = 0;
    const promises: Promise<bigint>[] = [];
    for (const r of rounds) {
      for (let i = 0; i < r.count; i++) {
        const slot = slots[slotIndex];
        slotIndex++;
        if (slot?.teamAId && slot?.teamBId) {
          promises.push(
            createMatch.mutateAsync({
              teamAId: BigInt(slot.teamAId),
              teamBId: BigInt(slot.teamBId),
              round: r.round,
              bracketSlot: i + 1,
              matchTime: defaultTime,
              court: defaultCourt,
            }),
          );
        }
      }
    }

    try {
      await Promise.all(promises);
      toast.success(`${promises.length} match(es) generated successfully!`);
      initSlots(drawMode);
      setDefaultTime("");
      setDefaultCourt("");
    } catch {
      toast.error("Failed to generate some matches. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-sport p-5">
        <h2 className="font-display font-bold text-xl mb-1">
          🎯 Prepare the Draw
        </h2>
        <p className="text-sm text-muted-foreground">
          Select a stage, assign teams to match slots, then generate matches.
        </p>
      </div>

      {/* Draw type + defaults */}
      <div className="card-sport p-5 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Draw Stage</Label>
            <Select
              value={drawMode}
              onValueChange={(v) => {
                const mode = v as DrawMode;
                setDrawMode(mode);
                initSlots(mode);
              }}
            >
              <SelectTrigger data-ocid="draw.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leagueRound1">
                  League Round 1 (25 matches)
                </SelectItem>
                <SelectItem value="leagueRound2">
                  League Round 2 (13 matches)
                </SelectItem>
                <SelectItem value="quarterFinal">
                  Quarter Finals (8 teams)
                </SelectItem>
                <SelectItem value="semiFinal">Semi Finals (4 teams)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default Match Time</Label>
            <Input
              data-ocid="draw.input"
              placeholder="e.g. 10:00 AM"
              value={defaultTime}
              onChange={(e) => setDefaultTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Default Court</Label>
            <Input
              placeholder="e.g. Court 1"
              value={defaultCourt}
              onChange={(e) => setDefaultCourt(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          {!isLeagueMode && (
            <Button
              data-ocid="draw.secondary_button"
              variant="outline"
              onClick={handleRandomDraw}
              disabled={isLoading || teams.length < 2}
              className="gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Random Draw
            </Button>
          )}
          <Button
            data-ocid="draw.primary_button"
            className="gap-2 bg-sport-green hover:bg-sport-green/90 text-white"
            onClick={handleGenerateMatches}
            disabled={createMatch.isPending}
          >
            {createMatch.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "⚡"
            )}
            Generate Matches
          </Button>
        </div>
      </div>

      {/* Match Slots Grid */}
      <div className="space-y-6">
        {(() => {
          let slotIndex = 0;
          return rounds.map((r) => (
            <div key={r.label} className="card-sport p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-sport-blue text-white">{r.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {r.count} match(es)
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: r.count }).map((_, i) => {
                  const idx = slotIndex++;
                  const slot = slots[idx] ?? { teamAId: "", teamBId: "" };
                  return (
                    <div
                      key={idx}
                      data-ocid={`draw.item.${idx + 1}`}
                      className="border border-border rounded-lg p-4 space-y-3 bg-card"
                    >
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Match {i + 1}
                      </p>
                      <div className="space-y-2">
                        <Label className="text-xs">Team A</Label>
                        <Select
                          value={slot.teamAId}
                          onValueChange={(v) => updateSlot(idx, "teamAId", v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((t) => (
                              <SelectItem
                                key={t.id.toString()}
                                value={t.id.toString()}
                              >
                                {t.teamName}
                                {t.player1
                                  ? ` (${t.player1}${t.player2 ? ` & ${t.player2}` : ""})`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Team B</Label>
                        <Select
                          value={slot.teamBId}
                          onValueChange={(v) => updateSlot(idx, "teamBId", v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((t) => (
                              <SelectItem
                                key={t.id.toString()}
                                value={t.id.toString()}
                              >
                                {t.teamName}
                                {t.player1
                                  ? ` (${t.player1}${t.player2 ? ` & ${t.player2}` : ""})`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
// ---- Tournament Info Tab ----
function TournamentInfoTab() {
  const { data: info, isLoading } = useTournamentInfo();
  const updateInfo = useUpdateTournamentInfo();

  const [form, setForm] = useState<{
    name: string;
    date: string;
    venue: string;
    format: string;
  } | null>(null);

  // Initialize form when info loads
  if (info && !form) {
    // We'll use a useEffect-like pattern but via lazy init
  }

  const currentForm = form ?? {
    name: info?.name ?? "",
    date: info?.date ?? "",
    venue: info?.venue ?? "",
    format: info?.format ?? FormatEnum.Singles,
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateInfo.mutateAsync({
      name: currentForm.name,
      date: currentForm.date,
      venue: currentForm.venue,
      format: currentForm.format as FormatEnum,
    });
    toast.success("Tournament info updated!");
  };

  if (isLoading) {
    return (
      <div
        className="card-sport p-6 space-y-4"
        data-ocid="tournament.loading_state"
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="card-sport p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        🏸 Tournament Information
      </h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label>Tournament Name</Label>
            <Input
              data-ocid="tournament.input"
              value={currentForm.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...(f ?? currentForm),
                  name: e.target.value,
                }))
              }
              placeholder="e.g. Organization Sports Day – Badminton"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              value={currentForm.date}
              onChange={(e) =>
                setForm((f) => ({
                  ...(f ?? currentForm),
                  date: e.target.value,
                }))
              }
              placeholder="e.g. March 20, 2026"
            />
          </div>
          <div className="space-y-2">
            <Label>Venue</Label>
            <Input
              value={currentForm.venue}
              onChange={(e) =>
                setForm((f) => ({
                  ...(f ?? currentForm),
                  venue: e.target.value,
                }))
              }
              placeholder="e.g. Main Hall, Court 1-4"
            />
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={currentForm.format}
              onValueChange={(v) =>
                setForm((f) => ({ ...(f ?? currentForm), format: v }))
              }
            >
              <SelectTrigger data-ocid="tournament.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FormatEnum.Singles}>Singles</SelectItem>
                <SelectItem value={FormatEnum.Doubles}>Doubles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          data-ocid="tournament.submit_button"
          type="submit"
          className="bg-sport-green hover:bg-sport-green/90 text-white"
          disabled={updateInfo.isPending}
        >
          {updateInfo.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save Tournament Info
        </Button>
      </form>
    </div>
  );
}

// ---- Admin Panel Root ----
export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <PasswordGate onSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          <h1 className="font-display font-bold text-2xl">Admin Panel</h1>
        </div>
        <Button
          data-ocid="admin.logout_button"
          variant="outline"
          size="sm"
          onClick={() => setIsLoggedIn(false)}
          className="text-muted-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="teams">
        <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:flex gap-1">
          <TabsTrigger data-ocid="admin.teams.tab" value="teams">
            👥 Teams
          </TabsTrigger>
          <TabsTrigger data-ocid="admin.matches.tab" value="matches">
            🏸 Matches
          </TabsTrigger>
          <TabsTrigger data-ocid="admin.scores.tab" value="scores">
            🏆 Scores
          </TabsTrigger>
          <TabsTrigger data-ocid="admin.info.tab" value="info">
            📋 Info
          </TabsTrigger>
          <TabsTrigger data-ocid="admin.draw.tab" value="draw">
            🎯 Draw
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="mt-6">
          <TabErrorBoundary>
            <TeamsTab />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="matches" className="mt-6">
          <TabErrorBoundary>
            <MatchesTab />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="scores" className="mt-6">
          <TabErrorBoundary>
            <ScoresTab />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="info" className="mt-6">
          <TabErrorBoundary>
            <TournamentInfoTab />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="draw" className="mt-6">
          <TabErrorBoundary>
            <DrawTab />
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
