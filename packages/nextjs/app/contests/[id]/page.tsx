"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MOCK_CONTEST = {
  id: "1",
  prompt: "Which feature should we prioritize next?",
  description: "Help us decide what to build next by voting on your preferred feature",
  assemblyName: "Protocol Governance",
  assemblyId: "1",
  status: "ACTIVE" as const,
  createdAt: "2025-01-10",
  endsAt: "2025-01-20T14:30:00Z",
  totalVotes: 234,
  totalVoters: 198,
  gated: true,
  requiredPassports: ["Member"],
  userHasPassport: true,
  userVoted: false,
};

const MOCK_OPTIONS = [
  {
    id: "1",
    title: "Advanced Analytics Dashboard",
    votes: 89,
    percentage: 38,
    userVoted: false,
  },
  {
    id: "2",
    title: "Mobile App",
    votes: 67,
    percentage: 29,
    userVoted: false,
  },
  {
    id: "3",
    title: "API v2 with Webhooks",
    votes: 78,
    percentage: 33,
    userVoted: false,
  },
];

const MOCK_ENDED_CONTEST = {
  id: "2",
  prompt: "Should we migrate to v2?",
  description: "Vote on whether we should proceed with the major version upgrade",
  assemblyName: "Protocol Governance",
  assemblyId: "1",
  status: "ENDED" as const,
  createdAt: "2025-01-05",
  endedAt: "2025-01-15T10:00:00Z",
  totalVotes: 145,
  totalVoters: 132,
  gated: false,
};

const MOCK_ENDED_OPTIONS = [
  {
    id: "1",
    title: "Yes",
    votes: 97,
    percentage: 67,
    isWinner: true,
  },
  {
    id: "2",
    title: "No",
    votes: 48,
    percentage: 33,
    isWinner: false,
  },
];

export default function ContestPage() {
  const params = useParams();
  const { id } = params;
  const isEnded = id === "2";
  const contest = isEnded ? MOCK_ENDED_CONTEST : MOCK_CONTEST;
  const options = isEnded ? MOCK_ENDED_OPTIONS : MOCK_OPTIONS;
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async () => {
    if (!selectedOption) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
  };

  const timeRemaining = () => {
    if (isEnded && "endedAt" in contest) {
      return `Ended on ${new Date(contest.endedAt).toLocaleDateString()}`;
    }
    if (!isEnded && "endsAt" in contest) {
      const now = new Date();
      const end = new Date(contest.endsAt);
      const diffMs = end.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `${diffDays}d ${diffHours}h remaining`;
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="mb-8 text-sm font-mono text-muted-foreground">
          <Link href="/assemblies" className="hover:text-foreground transition-colors">
            Assemblies
          </Link>
          {" / "}
          <Link href={`/assemblies/${contest.assemblyId}`} className="hover:text-foreground transition-colors">
            {contest.assemblyName}
          </Link>
          {" / "}
          <span className="text-foreground">Contest</span>
        </div>

        <div className="mb-12 pb-8 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-xs font-mono px-3 py-1 border ${
                contest.status === "ACTIVE" ? "border-green-500 text-green-600" : "border-border text-muted-foreground"
              }`}
            >
              {contest.status}
            </span>
            {contest.gated && <span className="text-sm">🔒 Passport Gated</span>}
          </div>

          <h1 className="text-4xl font-mono font-bold mb-3">{contest.prompt}</h1>
          <p className="text-muted-foreground mb-6">{contest.description}</p>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-mono text-xs">TOTAL VOTES</p>
              <p className="font-mono font-bold text-lg">{contest.totalVotes}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono text-xs">VOTERS</p>
              <p className="font-mono font-bold text-lg">{contest.totalVoters}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono text-xs">TIME</p>
              <p className="font-mono font-bold text-lg">{timeRemaining()}</p>
            </div>
          </div>
        </div>

        {contest.status === "ACTIVE" && !contest.userVoted && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-mono font-bold">CAST YOUR VOTE</h2>
              {!contest.userHasPassport && (
                <span className="text-xs font-mono bg-destructive text-destructive-foreground px-2 py-1">
                  NO REQUIRED PASSPORT
                </span>
              )}
            </div>

            {contest.userHasPassport ? (
              <>
                <div className="space-y-3 mb-6">
                  {options.map(option => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedOption(option.id)}
                      className={`cursor-pointer border-2 p-4 rounded transition-colors ${
                        selectedOption === option.id
                          ? "border-foreground bg-muted"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                            selectedOption === option.id ? "border-foreground bg-foreground" : "border-border"
                          }`}
                        >
                          {selectedOption === option.id && <div className="w-2 h-2 bg-background rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-mono font-semibold">{option.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {option.votes} votes · {option.percentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full font-mono" onClick={handleVote} disabled={!selectedOption || isSubmitting}>
                  {isSubmitting ? "SUBMITTING VOTE..." : "SUBMIT VOTE"}
                </Button>
              </>
            ) : (
              <Card className="p-6 border border-border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground font-mono mb-4">
                  You need a {contest.requiredPassports.join(" or ")} passport to vote
                </p>
                <Button className="font-mono">MINT PASSPORT</Button>
              </Card>
            )}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-mono font-bold mb-6">RESULTS</h2>
          <div className="space-y-6">
            {options.map(option => (
              <div key={option.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono font-semibold flex items-center gap-2">
                    {option.title}
                    {(option as any).isWinner && (
                      <span className="text-xs font-mono bg-foreground text-background px-2 py-0.5">WINNER</span>
                    )}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    {option.votes} votes · {option.percentage}%
                  </p>
                </div>
                <div className="w-full bg-muted border border-border rounded h-8 overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-all duration-500"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <Button variant="outline" className="font-mono bg-transparent">
            BACK TO ASSEMBLY
          </Button>
        </div>
      </main>
    </div>
  );
}
