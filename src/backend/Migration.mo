import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldMatchRound = { #QuarterFinal; #SemiFinal; #Final };

  type OldMatch = {
    id : Nat;
    teamAId : Nat;
    teamBId : Nat;
    matchTime : Text;
    court : Text;
    status : { #Scheduled; #InProgress; #Completed };
    set1ScoreA : Nat;
    set1ScoreB : Nat;
    set2ScoreA : Nat;
    set2ScoreB : Nat;
    set3ScoreA : ?Nat;
    set3ScoreB : ?Nat;
    winnerId : ?Nat;
    round : ?OldMatchRound;
    bracketSlot : ?Nat;
  };

  type NewMatchRound = { #LeagueRound1; #LeagueRound2; #QuarterFinal; #SemiFinal; #Final };

  type NewMatch = {
    id : Nat;
    teamAId : Nat;
    teamBId : Nat;
    matchTime : Text;
    court : Text;
    status : { #Scheduled; #InProgress; #Completed };
    set1ScoreA : Nat;
    set1ScoreB : Nat;
    set2ScoreA : Nat;
    set2ScoreB : Nat;
    set3ScoreA : ?Nat;
    set3ScoreB : ?Nat;
    winnerId : ?Nat;
    round : ?NewMatchRound;
    bracketSlot : ?Nat;
  };

  func convertRound(r : ?OldMatchRound) : ?NewMatchRound {
    switch r {
      case null null;
      case (?#QuarterFinal) ?#QuarterFinal;
      case (?#SemiFinal) ?#SemiFinal;
      case (?#Final) ?#Final;
    }
  };

  func convertMatch(m : OldMatch) : NewMatch = {
    id = m.id;
    teamAId = m.teamAId;
    teamBId = m.teamBId;
    matchTime = m.matchTime;
    court = m.court;
    status = m.status;
    set1ScoreA = m.set1ScoreA;
    set1ScoreB = m.set1ScoreB;
    set2ScoreA = m.set2ScoreA;
    set2ScoreB = m.set2ScoreB;
    set3ScoreA = m.set3ScoreA;
    set3ScoreB = m.set3ScoreB;
    winnerId = m.winnerId;
    round = convertRound(m.round);
    bracketSlot = m.bracketSlot;
  };

  public func migration(
    old : { matches : Map.Map<Nat, OldMatch> }
  ) : { matches : Map.Map<Nat, NewMatch> } {
    let newMatches = Map.empty<Nat, NewMatch>();
    for (m in old.matches.values()) {
      newMatches.add(m.id, convertMatch(m));
    };
    { matches = newMatches }
  };
}
