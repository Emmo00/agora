"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const MOCK_ASSEMBLIES = [
  {
    id: "1",
    name: "Protocol Governance",
    description: "Core governance decisions for the protocol",
    members: 234,
    contests: 12,
    activeVotes: 3,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "2",
    name: "Community Treasury",
    description: "Collective fund management and allocation decisions",
    members: 145,
    contests: 8,
    activeVotes: 1,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "3",
    name: "Feature Voting",
    description: "Decide which features should be prioritized",
    members: 89,
    contests: 5,
    activeVotes: 2,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "4",
    name: "DAO Coordination",
    description: "Cross-team coordination and strategic planning",
    members: 156,
    contests: 15,
    activeVotes: 0,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "5",
    name: "Research Initiative",
    description: "Community research proposals and voting",
    members: 67,
    contests: 3,
    activeVotes: 1,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "6",
    name: "Grants Program",
    description: "Fund allocation for community projects",
    members: 112,
    contests: 9,
    activeVotes: 2,
    image: "/placeholder.svg?height=80&width=80",
  },
];

type SortOption = "newest" | "members" | "active";
type FilterOption = "all" | "my" | "activeVotes";

export default function AssembliesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = MOCK_ASSEMBLIES;

    // Search filter
    if (search) {
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Tab filter
    if (filter === "activeVotes") {
      result = result.filter(a => a.activeVotes > 0);
    }

    // Sort
    if (sort === "newest") {
      result = [...result].reverse();
    } else if (sort === "members") {
      result = [...result].sort((a, b) => b.members - a.members);
    } else if (sort === "active") {
      result = [...result].sort((a, b) => b.contests - a.contests);
    }

    return result;
  }, [search, filter, sort]);

  const itemsPerPage = 10;
  const paginatedAssemblies = filtered.slice(0, page * itemsPerPage);
  const hasMore = paginatedAssemblies.length < filtered.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold mb-6">ASSEMBLIES</h1>
          <Input
            placeholder="Search assemblies..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="font-mono"
          />
        </div>

        <div className="mb-8 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground font-mono mb-2">FILTERS</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "my", "activeVotes"] as const).map(opt => (
                <Button
                  key={opt}
                  variant={filter === opt ? "default" : "outline"}
                  className="font-mono text-xs"
                  onClick={() => {
                    setFilter(opt);
                    setPage(1);
                  }}
                >
                  {opt === "all" ? "All" : opt === "my" ? "My Assemblies" : "Active Votes"}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground font-mono mb-2">SORT BY</p>
            <div className="flex flex-wrap gap-2">
              {(["newest", "members", "active"] as const).map(opt => (
                <Button
                  key={opt}
                  variant={sort === opt ? "default" : "outline"}
                  className="font-mono text-xs"
                  onClick={() => {
                    setSort(opt);
                    setPage(1);
                  }}
                >
                  {opt === "newest" ? "Newest" : opt === "members" ? "Most Members" : "Most Active"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {paginatedAssemblies.map(assembly => (
            <Link key={assembly.id} href={`/assemblies/${assembly.id}`}>
              <Card className="p-4 border border-border hover:bg-muted cursor-pointer transition-colors">
                <div className="flex gap-4">
                  <img
                    src={assembly.image || "/placeholder.svg"}
                    alt={assembly.name}
                    className="w-20 h-20 border border-border"
                  />
                  <div className="flex-1">
                    <h3 className="font-mono font-semibold text-lg">{assembly.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{assembly.description}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {assembly.members} members · {assembly.contests} contests · {assembly.activeVotes} active votes
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <Button variant="outline" className="font-mono bg-transparent" onClick={() => setPage(p => p + 1)}>
              LOAD MORE
            </Button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-mono">No assemblies found</p>
          </div>
        )}
      </main>
    </div>
  );
}
