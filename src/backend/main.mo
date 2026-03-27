import Text "mo:core/Text";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import { migration } "Migration";

(with migration)
actor {
  type TournamentInfo = {
    name : Text;
    date : Text;
    venue : Text;
    format : Format;
  };

  type Format = {
    #Singles;
    #Doubles;
  };

  type Team = {
    id : Nat;
    teamName : Text;
    player1 : Text;
    player2 : ?Text;
  };

  type MatchStatus = {
    #Scheduled;
    #InProgress;
    #Completed;
  };

  type MatchRound = {
    #LeagueRound1;
    #LeagueRound2;
    #QuarterFinal;
    #SemiFinal;
    #Final;
  };

  type Match = {
    id : Nat;
    teamAId : Nat;
    teamBId : Nat;
    matchTime : Text;
    court : Text;
    status : MatchStatus;
    set1ScoreA : Nat;
    set1ScoreB : Nat;
    set2ScoreA : Nat;
    set2ScoreB : Nat;
    set3ScoreA : ?Nat;
    set3ScoreB : ?Nat;
    winnerId : ?Nat;
    round : ?MatchRound;
    bracketSlot : ?Nat;
  };

  type LeaderboardEntry = {
    teamId : Nat;
    teamName : Text;
    matchesPlayed : Nat;
    wins : Nat;
    losses : Nat;
    points : Nat;
  };

  module LeaderboardEntry {
    public func compare(entry1 : LeaderboardEntry, entry2 : LeaderboardEntry) : Order.Order {
      Nat.compare(entry2.points, entry1.points);
    };
  };

  var tournamentInfo : ?TournamentInfo = null;
  let teams = Map.empty<Nat, Team>();
  let matches = Map.empty<Nat, Match>();
  var nextTeamId = 1;
  var nextMatchId = 1;
  stable var adminPasswordHash : Text = "admin123";
  stable var passwordResetVersion : Nat = 0;
  let TARGET_RESET_VERSION : Nat = 3;

  system func postupgrade() {
    if (passwordResetVersion < TARGET_RESET_VERSION) {
      adminPasswordHash := "admin123";
      passwordResetVersion := TARGET_RESET_VERSION;
    };
  };

  public query func getTournamentInfo() : async ?TournamentInfo {
    tournamentInfo;
  };

  public shared func updateTournamentInfo(info : TournamentInfo) : async () {
    tournamentInfo := ?info;
  };

  public shared func createTeam(teamName : Text, player1 : Text, player2 : ?Text) : async Nat {
    let id = nextTeamId;
    let team : Team = { id; teamName; player1; player2 };
    teams.add(id, team);
    nextTeamId += 1;
    id;
  };

  public query func getTeam(id : Nat) : async ?Team {
    teams.get(id);
  };

  public shared func updateTeam(id : Nat, teamName : Text, player1 : Text, player2 : ?Text) : async () {
    let team : Team = { id; teamName; player1; player2 };
    teams.add(id, team);
  };

  public shared func deleteTeam(id : Nat) : async () {
    teams.remove(id);
  };

  public query func getAllTeams() : async [Team] {
    teams.values().toArray();
  };

  public shared func createMatch(teamAId : Nat, teamBId : Nat, matchTime : Text, court : Text, round : ?MatchRound, bracketSlot : ?Nat) : async Nat {
    let id = nextMatchId;
    let match : Match = {
      id; teamAId; teamBId; matchTime; court;
      status = #Scheduled;
      set1ScoreA = 0; set1ScoreB = 0;
      set2ScoreA = 0; set2ScoreB = 0;
      set3ScoreA = null; set3ScoreB = null;
      winnerId = null; round; bracketSlot;
    };
    matches.add(id, match);
    nextMatchId += 1;
    id;
  };

  public query func getMatch(id : Nat) : async ?Match {
    matches.get(id);
  };

  public shared func updateMatch(match : Match) : async () {
    matches.add(match.id, match);
  };

  public shared func deleteMatch(id : Nat) : async () {
    matches.remove(id);
  };

  public query func getAllMatches() : async [Match] {
    matches.values().toArray();
  };

  public shared func saveMatchScores(
    matchId : Nat,
    set1ScoreA : Nat, set1ScoreB : Nat,
    set2ScoreA : Nat, set2ScoreB : Nat,
    set3ScoreA : ?Nat, set3ScoreB : ?Nat,
    manualWinnerId : ?Nat
  ) : async () {
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match does not exist") };
      case (?existingMatch) {
        let winnerId = switch (manualWinnerId) {
          case (?id) { ?id };
          case (null) {
            calculateWinner(
              existingMatch.teamAId, existingMatch.teamBId,
              set1ScoreA, set1ScoreB, set2ScoreA, set2ScoreB, set3ScoreA, set3ScoreB,
            );
          };
        };
        let updatedMatch : Match = {
          id = existingMatch.id;
          teamAId = existingMatch.teamAId;
          teamBId = existingMatch.teamBId;
          matchTime = existingMatch.matchTime;
          court = existingMatch.court;
          status = #Completed;
          set1ScoreA; set1ScoreB; set2ScoreA; set2ScoreB;
          set3ScoreA; set3ScoreB; winnerId;
          round = existingMatch.round;
          bracketSlot = existingMatch.bracketSlot;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  func calculateWinner(
    teamAId : Nat, teamBId : Nat,
    set1ScoreA : Nat, set1ScoreB : Nat,
    set2ScoreA : Nat, set2ScoreB : Nat,
    set3ScoreA : ?Nat, set3ScoreB : ?Nat,
  ) : ?Nat {
    var setsWonA = 0;
    var setsWonB = 0;
    if (set1ScoreA > set1ScoreB) { setsWonA += 1 } else { setsWonB += 1 };
    if (set2ScoreA > set2ScoreB) { setsWonA += 1 } else { setsWonB += 1 };
    switch (set3ScoreA, set3ScoreB) {
      case (?scoreA, ?scoreB) {
        if (scoreA > scoreB) { setsWonA += 1 } else { setsWonB += 1 };
      };
      case (_) {};
    };
    if (setsWonA > setsWonB) { ?teamAId }
    else if (setsWonB > setsWonA) { ?teamBId }
    else { null };
  };

  public query func getLeaderboard() : async [LeaderboardEntry] {
    var leaderboard : [LeaderboardEntry] = [];
    for (team in teams.values()) {
      let stats = calculateTeamStats(team.id);
      let entry : LeaderboardEntry = {
        teamId = team.id;
        teamName = team.teamName;
        matchesPlayed = stats.0;
        wins = stats.1;
        losses = stats.2;
        points = calculatePoints(stats.0, stats.1, stats.2);
      };
      leaderboard := leaderboard.concat([entry]);
    };
    leaderboard.sort();
  };

  func calculateTeamStats(teamId : Nat) : (Nat, Nat, Nat) {
    var matchesPlayed = 0;
    var wins = 0;
    var losses = 0;
    for (match in matches.values()) {
      switch (match.status) {
        case (#Completed) {
          if (match.teamAId == teamId or match.teamBId == teamId) {
            matchesPlayed += 1;
          };
          switch (match.winnerId) {
            case (?winner) {
              if (winner == teamId) { wins += 1 } else { losses += 1 };
            };
            case (null) {};
          };
        };
        case (_) {};
      };
    };
    (matchesPlayed, wins, losses);
  };

  func calculatePoints(_ : Nat, wins : Nat, losses : Nat) : Nat {
    (wins * 2) + losses;
  };

  public query func getBracketProgression() : async [(Nat, ?Nat)] {
    let matchesArray = matches.values().toArray();
    matchesArray.map(func(m) { (m.id, m.winnerId) });
  };

  public shared func verifyAdminPassword(password : Text) : async Bool {
    password == adminPasswordHash;
  };

  public shared func updateAdminPassword(oldPassword : Text, newPassword : Text) : async Bool {
    if (oldPassword == adminPasswordHash) {
      adminPasswordHash := newPassword;
      true;
    } else {
      false;
    };
  };
};
