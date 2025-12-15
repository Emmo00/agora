"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CreateAssemblyModal from "@/components/create-assembly-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAssemblyCount, useRecentAssemblies, useTotalContestCount, useTotalVoteCount, useTotalMemberCount } from "@/hooks/useAssemblyData";

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch assembly data from smart contracts
  const { count: assemblyCount } = useAssemblyCount();
  const { data: recentAssemblies, isLoading: assembliesLoading } = useRecentAssemblies(5);
  const { count: totalContests } = useTotalContestCount();
  const { count: totalMembers } = useTotalMemberCount();
  const { count: totalVotes } = useTotalVoteCount();

  // Skeleton loader for recent assemblies
  const AssemblySkeleton = () => (
    <Card className="p-4 border border-border animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 border border-border bg-muted rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            <h1 className="text-5xl md:text-6xl font-mono font-bold mb-6 text-balance">
              DECENTRALIZED GOVERNANCE AT SCALE
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
              Agora enables communities to govern collectively. Create assemblies, run contests, and make decisions with
              direct participation from your members.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/assemblies">
                <Button className="font-mono w-full sm:w-auto">EXPLORE ASSEMBLIES</Button>
              </Link>
              <Button
                variant="outline"
                className="font-mono w-full sm:w-auto bg-transparent"
                onClick={() => setShowCreateModal(true)}
              >
                CREATE ASSEMBLY
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-3xl font-mono font-bold">{assemblyCount}</p>
                <p className="text-sm text-muted-foreground font-mono mt-2">Total Assemblies</p>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold">{totalContests}</p>
                <p className="text-sm text-muted-foreground font-mono mt-2">Total Contests</p>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold">{totalMembers}</p>
                <p className="text-sm text-muted-foreground font-mono mt-2">Total Members</p>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold">{totalVotes}</p>
                <p className="text-sm text-muted-foreground font-mono mt-2">Total Votes Cast</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Assemblies Section */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-mono font-bold mb-8">RECENT ASSEMBLIES</h2>
            <div className="space-y-3">
              {assembliesLoading ? (
                <>
                  <AssemblySkeleton />
                  <AssemblySkeleton />
                  <AssemblySkeleton />
                </>
              ) : recentAssemblies.length > 0 ? (
                recentAssemblies.map((assembly) => (
                  <Card
                    key={assembly.address}
                    className="p-4 border border-border hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Link href={`/assemblies/${assembly.address}`}>
                      <div className="flex gap-4">
                        <Image
                          src={assembly.imageUrl || "/placeholder.svg?height=64&width=64"}
                          alt={assembly.name}
                          width={64}
                          height={64}
                          className="border border-border object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-mono font-semibold text-lg">{assembly.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono mt-2">
                            {assembly.adminCount} admins · {assembly.contestCount} contests
                          </p>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))
              ) : (
                <Card className="p-8 border border-border text-center">
                  <p className="text-sm text-muted-foreground font-mono">No assemblies found. Be the first to create one!</p>
                </Card>
              )}
            </div>
            <div className="text-center mt-8">
              <Link href="/assemblies">
                <Button variant="outline" className="font-mono bg-transparent">
                  VIEW ALL ASSEMBLIES
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <CreateAssemblyModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
