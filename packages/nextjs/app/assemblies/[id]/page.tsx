"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOCK_ASSEMBLY = {
  id: "1",
  name: "Protocol Governance",
  description:
    "Core governance decisions for the protocol. Community-driven decisions on protocol upgrades, parameter changes, and strategic direction.",
  image: "/placeholder.svg?height=200&width=200",
  members: 234,
  admins: ["0x1234...5678", "0xabcd...ef01", "0x9876...5432"],
  isAdmin: false,
};

const MOCK_CONTESTS = [
  {
    id: "1",
    prompt: "Which feature should we prioritize next?",
    status: "ACTIVE",
    endsIn: "2d 14h",
    votes: 234,
    options: 3,
    gated: true,
  },
  {
    id: "2",
    prompt: "Should we migrate to v2?",
    status: "ENDED",
    endedAgo: "5 days ago",
    votes: 145,
    winner: "Yes (67%)",
    gated: false,
  },
  {
    id: "3",
    prompt: "Treasury allocation for Q2",
    status: "ACTIVE",
    endsIn: "1d 6h",
    votes: 89,
    options: 4,
    gated: true,
  },
];

const MOCK_PASSPORTS = [
  {
    id: "1",
    name: "MEMBER",
    mode: "Open minting",
    holders: 234,
    userHolds: true,
  },
  {
    id: "2",
    name: "CONTRIBUTOR",
    mode: "Allowlist only",
    holders: 45,
    userEligible: false,
  },
  {
    id: "3",
    name: "CORE TEAM",
    mode: "Admin only",
    holders: 5,
    userEligible: false,
  },
];

const MOCK_MEMBERS = Array.from({ length: 234 }, (_, i) => ({
  id: i + 1,
  address: `0x${Math.random().toString(16).slice(2)}...${Math.random().toString(16).slice(2)}`,
  passports: ["Member", ...(i % 3 === 0 ? ["Contributor"] : [])],
})).slice(0, 12);

export default function AssemblyDetailPage() {
  const [activeTab, setActiveTab] = useState("contests");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        {/* Header Section */}
        <div className="mb-12 pb-12 border-b border-border">
          <div className="flex gap-8 mb-8">
            <img
              src={MOCK_ASSEMBLY.image || "/placeholder.svg"}
              alt={MOCK_ASSEMBLY.name}
              className="w-32 h-32 border border-border"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-mono font-bold mb-3">{MOCK_ASSEMBLY.name}</h1>
              <p className="text-muted-foreground mb-6">{MOCK_ASSEMBLY.description}</p>
              {MOCK_ASSEMBLY.isAdmin && (
                <div className="inline-block">
                  <Button className="font-mono text-sm">ADMIN PANEL ▼</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="font-mono grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="contests">CONTESTS</TabsTrigger>
            <TabsTrigger value="passports">PASSPORTS</TabsTrigger>
            <TabsTrigger value="members">MEMBERS</TabsTrigger>
          </TabsList>

          {/* Contests Tab */}
          <TabsContent value="contests" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground font-mono">
                {MOCK_CONTESTS.length} total, {MOCK_CONTESTS.filter(c => c.status === "ACTIVE").length} active
              </p>
              <Button className="font-mono text-sm">+ CREATE CONTEST</Button>
            </div>
            <div className="space-y-3">
              {MOCK_CONTESTS.map(contest => (
                <Card
                  key={contest.id}
                  className="p-4 border border-border hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-mono font-semibold">{contest.prompt}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono px-2 py-1 border ${
                          contest.status === "ACTIVE"
                            ? "border-green-500 text-green-600"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {contest.status}
                      </span>
                      {contest.gated && <span className="text-sm">🔒</span>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mb-3">
                    {contest.status === "ACTIVE" ? `Ends in ${contest.endsIn}` : `Ended ${contest.endedAgo}`} ·{" "}
                    {contest.votes} votes {contest.options ? `· ${contest.options} options` : ""}
                  </p>
                  <Button variant="outline" className="font-mono text-xs bg-transparent" size="sm">
                    {contest.status === "ACTIVE" ? "VOTE" : "VIEW RESULTS"}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Passports Tab */}
          <TabsContent value="passports" className="space-y-4">
            <p className="text-sm text-muted-foreground font-mono mb-6">PASSPORT TYPES ({MOCK_PASSPORTS.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_PASSPORTS.map(passport => (
                <Card key={passport.id} className="p-6 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎫</span>
                    <h3 className="font-mono font-bold text-lg">{passport.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono mb-3">{passport.mode}</p>
                  <p className="text-xs text-muted-foreground font-mono mb-4">{passport.holders} holders</p>
                  <Button
                    variant={passport.userHolds ? "default" : "outline"}
                    className="font-mono text-xs w-full"
                    disabled={!passport.userEligible && !passport.userHolds}
                  >
                    {passport.userHolds ? "✓ YOU HOLD THIS" : passport.userEligible ? "MINT" : "NOT ELIGIBLE"}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground font-mono mb-3">MEMBERS ({MOCK_ASSEMBLY.members} total)</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["All", "Member", "Contributor"].map(p => (
                  <Button key={p} variant="outline" className="font-mono text-xs bg-transparent" size="sm">
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {MOCK_MEMBERS.map(member => (
                <div key={member.id} className="p-3 border border-border rounded font-mono text-sm">
                  <p className="font-semibold mb-1">{member.address}</p>
                  <p className="text-xs text-muted-foreground">{member.passports.join(", ")}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="outline" className="font-mono text-sm bg-transparent">
                LOAD MORE
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
