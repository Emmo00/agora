"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MOCK_CONTESTS = [
  {
    id: "1",
    prompt: "Which feature should we prioritize next?",
    assemblyName: "Protocol Governance",
    assemblyId: "1",
    status: "ACTIVE" as const,
    endsAt: "2025-01-20T14:30:00Z",
    totalVotes: 234,
    requiredPassports: ["Member"],
  },
  {
    id: "2",
    prompt: "Should we migrate to v2?",
    assemblyName: "Community Treasury",
    assemblyId: "2",
    status: "ENDED" as const,
    endsAt: "2025-01-15T10:00:00Z",
    totalVotes: 145,
    requiredPassports: [],
  },
  {
    id: "3",
    prompt: "Best use case for treasury funds?",
    assemblyName: "Feature Voting",
    assemblyId: "3",
    status: "ACTIVE" as const,
    endsAt: "2025-01-25T18:00:00Z",
    totalVotes: 89,
    requiredPassports: ["Contributor"],
  },
  {
    id: "4",
    prompt: "Increase staking rewards?",
    assemblyName: "Protocol Governance",
    assemblyId: "1",
    status: "ACTIVE" as const,
    endsAt: "2025-01-22T12:00:00Z",
    totalVotes: 312,
    requiredPassports: ["Member"],
  },
  {
    id: "5",
    prompt: "New partnership approval",
    assemblyName: "Community Treasury",
    assemblyId: "2",
    status: "ENDED" as const,
    endsAt: "2025-01-10T08:00:00Z",
    totalVotes: 67,
    requiredPassports: ["Core Team"],
  },
];

export default function ContestsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");
  const [sortBy, setSortBy] = useState<"newest" | "votes">("newest");

  const filteredContests = MOCK_CONTESTS.filter(contest => {
    if (filter === "active") return contest.status === "ACTIVE";
    if (filter === "ended") return contest.status === "ENDED";
    return true;
  }).sort((a, b) => {
    if (sortBy === "votes") {
      return b.totalVotes - a.totalVotes;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="text-4xl md:text-5xl font-mono font-bold mb-2">ALL CONTESTS</h1>
            <p className="text-muted-foreground mb-8">Browse all active and ended votes across the protocol</p>

            {/* Filters */}
            <div className="flex flex-col gap-6 mb-8">
              <div>
                <p className="text-sm font-mono font-semibold mb-3">FILTER</p>
                <div className="flex flex-wrap gap-2">
                  {(["all", "active", "ended"] as const).map(f => (
                    <Button
                      key={f}
                      variant={filter === f ? "default" : "outline"}
                      className="font-mono text-xs"
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" ? "All Contests" : f === "active" ? "Active" : "Ended"}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-mono font-semibold mb-3">SORT BY</p>
                <div className="flex flex-wrap gap-2">
                  {(["newest", "votes"] as const).map(s => (
                    <Button
                      key={s}
                      variant={sortBy === s ? "default" : "outline"}
                      className="font-mono text-xs"
                      onClick={() => setSortBy(s)}
                    >
                      {s === "newest" ? "Newest" : "Most Votes"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contests List */}
            <div className="space-y-3">
              {filteredContests.map(contest => (
                <Link key={contest.id} href={`/contests/${contest.id}`}>
                  <Card className="p-4 border border-border hover:bg-muted cursor-pointer transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-mono font-semibold">{contest.prompt}</h3>
                          <span
                            className={`text-xs font-mono px-2 py-1 border ${
                              contest.status === "ACTIVE"
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {contest.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono mb-2">{contest.assemblyName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {contest.totalVotes} votes {contest.requiredPassports.length > 0 && "🔒"}
                        </p>
                      </div>
                      <Button variant="outline" className="font-mono text-xs bg-transparent shrink-0">
                        VIEW
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
