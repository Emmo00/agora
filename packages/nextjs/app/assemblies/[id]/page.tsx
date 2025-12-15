"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssemblyDetail, useAssemblyContests, useAssemblyPassports } from "@/hooks/useAssemblyDetail";
import { formatDuration } from "@/utils/format";
import { notification } from "@/utils/scaffold-eth";
import CreatePassportTypeModal from "@/components/create-passport-type-modal";
import CreateContestModal from "@/components/create-contest-modal";

export default function AssemblyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assemblyAddress = params.id as string as `0x${string}`;
  const [activeTab, setActiveTab] = useState("contests");
  const [showCreatePassportModal, setShowCreatePassportModal] = useState(false);
  const [showCreateContestModal, setShowCreateContestModal] = useState(false);
  const [sharedContestId, setSharedContestId] = useState<string>("");

  // Fetch assembly data
  const { assemblyData, isLoading: assemblyLoading, isAdmin } = useAssemblyDetail(assemblyAddress);

  // Fetch contests
  const { contests, isLoading: contestsLoading } = useAssemblyContests(assemblyAddress);

  // Fetch passports
  const { passports, isLoading: passportsLoading, refetch: refetchPassports } = useAssemblyPassports(
    (assemblyData?.passportsAddress as `0x${string}`) || null
  );

  // Sort contests: active first, then by end time
  const sortedContests = useMemo(() => {
    return [...contests].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return Number(b.votingEnd) - Number(a.votingEnd);
    });
  }, [contests]);

  // Auto-refetch passport data when Members tab is active (to show updated holder counts after minting)
  useEffect(() => {
    if (activeTab !== "members") return;

    const interval = setInterval(() => {
      refetchPassports();
    }, 2000); // Refetch every 2 seconds while viewing Members tab

    return () => clearInterval(interval);
  }, [activeTab, refetchPassports]);

  if (assemblyLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse">
          <p className="font-mono text-muted-foreground">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!assemblyData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-muted-foreground">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        {/* Header Section */}
        <div className="mb-12 pb-12 border-b border-border">
          <div className="flex gap-8 mb-8">
            <Image
              src={assemblyData.imageUrl || "/placeholder.svg?height=128&width=128"}
              alt={assemblyData.name}
              width={128}
              height={128}
              className="border border-border object-cover"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-mono font-bold mb-3">{assemblyData.name}</h1>
              <p className="text-muted-foreground mb-6">{assemblyData.description}</p>
              {isAdmin && (
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
            <TabsTrigger value="contests">VOTES</TabsTrigger>
            <TabsTrigger value="passports">MEMBERSHIPS</TabsTrigger>
            <TabsTrigger value="members">MEMBERS</TabsTrigger>
          </TabsList>

          {/* Votes Tab */}
          <TabsContent value="contests" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground font-mono">
                {sortedContests.length} total, {sortedContests.filter((c) => c.isActive).length} active
              </p>
              {isAdmin && (
                <Button
                  onClick={() => setShowCreateContestModal(true)}
                  className="font-mono text-sm"
                >
                  + CREATE A VOTE
                </Button>
              )}
            </div>

            {contestsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 border border-border animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : sortedContests.length > 0 ? (
              <div className="space-y-3">
                {sortedContests.map((contest) => {
                  const now = Math.floor(Date.now() / 1000);
                  const timeRemaining = Number(contest.votingEnd) - now;
                  const timeText =
                    timeRemaining > 0 ? formatDuration(timeRemaining) : "Ended";

                  const handleShare = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/contests/${contest.address}`;
                    navigator.clipboard.writeText(url);
                    setSharedContestId(contest.address);
                    setTimeout(() => setSharedContestId(""), 2000);
                    notification.success("Link copied to clipboard!");
                  };

                  return (
                    <Card
                      key={contest.address}
                      className="p-4 border border-border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => router.push(`/contests/${contest.address}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-mono font-semibold">{contest.prompt}</h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono px-2 py-1 border ${
                              contest.isActive
                                ? "border-green-500 text-green-600"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {contest.isActive ? "ACTIVE" : "ENDED"}
                          </span>
                          {contest.requiredPassports.length > 0 && (
                            <span className="text-sm">🔒</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mb-3">
                        {contest.isActive ? `Ends in ${timeText}` : `Ended ${timeText} ago`} · {contest.totalVotes}{" "}
                        votes · {contest.options.length} options
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="font-mono text-xs bg-transparent flex-1" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/contests/${contest.address}`);
                          }}
                        >
                          {contest.isActive ? "VOTE" : "VIEW RESULTS"}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="font-mono text-xs bg-transparent" 
                          size="sm"
                          onClick={handleShare}
                        >
                          {sharedContestId === contest.address ? "✓" : "SHARE"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 border border-border text-center">
                <p className="text-sm text-muted-foreground font-mono">
                  No votes yet. {isAdmin && "Create one to get started!"}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Memberships Tab */}
          <TabsContent value="passports" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground font-mono">MEMBERSHIP TYPES ({passports.length})</p>
              {isAdmin && (
                <Button
                  className="font-mono text-sm"
                  onClick={() => setShowCreatePassportModal(true)}
                >
                  + CREATE MEMBERSHIP TYPE
                </Button>
              )}
            </div>

            {passportsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 border border-border animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/2 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </Card>
                ))}
              </div>
            ) : passports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passports.map((passport) => (
                  <Card
                    key={passport.tokenId}
                    className="p-6 border border-border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => {
                      if (!passport.userHolds) {
                        window.location.href = `/passports/${assemblyAddress}/${passport.tokenId}`;
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎫</span>
                      <h3 className="font-mono font-bold text-lg">{passport.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mb-3">
                      {passport.isOpen ? "Open minting" : "Allowlist only"}
                    </p>
                    <Button
                      variant={passport.userHolds ? "default" : "outline"}
                      className="font-mono text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!passport.userHolds) {
                          window.location.href = `/passports/${assemblyAddress}/${passport.tokenId}`;
                        }
                      }}
                    >
                      {passport.userHolds ? "✓ YOU HAVE THIS" : passport.isOpen ? "GET MEMBERSHIP" : "CHECK ELIGIBILITY"}
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 border border-border text-center">
                <p className="text-sm text-muted-foreground font-mono">
                  No membership types yet. {isAdmin && "Create one to gate voting!"}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground font-mono mb-3">
                PASSPORT HOLDERS BY TYPE
              </p>
            </div>

            {passports.length === 0 ? (
              <Card className="p-8 border border-border text-center">
                <p className="text-sm text-muted-foreground font-mono">
                  No passport types created yet
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passports.map((passport) => (
                  <Card key={passport.tokenId} className="p-4 border border-border">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-mono font-semibold text-sm mb-1">
                          {passport.name}
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">
                            {passport.holders}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {passport.holders === 1 ? "holder" : "holders"}
                          </span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">
                            {passport.isOpen ? "🔓 Open" : "🔒 Allowlist"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Passport Type Modal */}
        {assemblyData && (
          <CreatePassportTypeModal
            assemblyAddress={assemblyAddress}
            isOpen={showCreatePassportModal}
            onClose={() => setShowCreatePassportModal(false)}
            onSuccess={() => refetchPassports()}
          />
        )}

        {/* Create Contest Modal */}
        <CreateContestModal
          assemblyAddress={assemblyAddress}
          isOpen={showCreateContestModal}
          onClose={() => setShowCreateContestModal(false)}
          onSuccess={() => {
            // Refetch contests after creation
            window.location.reload();
          }}
        />
      </main>
    </div>
  );
}
