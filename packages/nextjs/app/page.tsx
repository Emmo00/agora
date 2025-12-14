"use client";

import { useState } from "react";
import Link from "next/link";
import CreateAssemblyModal from "@/components/create-assembly-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const recentAssemblies = [
    {
      id: "1",
      name: "Protocol Governance",
      members: 234,
      activeVotes: 3,
      image: "/placeholder.svg?height=64&width=64",
    },
    {
      id: "2",
      name: "Community Treasury",
      members: 145,
      activeVotes: 1,
      image: "/placeholder.svg?height=64&width=64",
    },
    {
      id: "3",
      name: "Feature Voting",
      members: 89,
      activeVotes: 2,
      image: "/placeholder.svg?height=64&width=64",
    },
  ];

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
                <p className="text-3xl font-mono font-bold">24</p>
                <p className="text-sm text-muted-foreground font-mono mt-2">Active Assemblies</p>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold">156</p>
                <p className="text-sm text-muted-foreground font-mono mt-2">Total Contests</p>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold">8.2K</p>
                <p className="text-sm text-muted-foreground font-mono mt-2">Total Members</p>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold">42.3M</p>
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
              {recentAssemblies.map(assembly => (
                <Card
                  key={assembly.id}
                  className="p-4 border border-border hover:bg-muted cursor-pointer transition-colors"
                >
                  <Link href={`/assemblies/${assembly.id}`}>
                    <div className="flex gap-4">
                      <img
                        src={assembly.image || "/placeholder.svg"}
                        alt={assembly.name}
                        className="w-16 h-16 border border-border"
                      />
                      <div className="flex-1">
                        <h3 className="font-mono font-semibold text-lg">{assembly.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-2">
                          {assembly.members} members · {assembly.activeVotes} active votes
                        </p>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
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
