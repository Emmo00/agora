"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import deployedContracts from "@/contracts/deployedContracts";
import { notification } from "@/utils/scaffold-eth";
import Link from "next/link";

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contestAddress = (params.id as string) as `0x${string}`;
  const { address: userAddress, isConnected } = useAccount();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showShareCopied, setShowShareCopied] = useState(false);
  const [assemblyName, setAssemblyName] = useState<string | null>(null);

  // Fetch contest data
  const { data: prompt } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "prompt",
  });

  const { data: isActive } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "isActive",
  });

  const { data: votingEnd } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "votingEnd",
  });

  const { data: totalVotes } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "totalVotes",
  });

  const { data: options } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "getOptions",
  });

  const { data: sourceAssembly } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "assemblyAddress",
  });

  // Fetch assembly info to get metadata URI
  const { data: assemblyInfo } = useReadContract({
    address: sourceAssembly as `0x${string}` | undefined,
    abi: deployedContracts[31337]?.Assembly?.abi || [],
    functionName: "getInfo",
    query: { enabled: !!sourceAssembly },
  });

  // Fetch assembly metadata from IPFS
  useEffect(() => {
    if (!assemblyInfo) return;

    const metadataURI = assemblyInfo[1];
    if (!metadataURI) return;

    const fetchMetadata = async () => {
      try {
        let url = metadataURI;
        if (metadataURI.startsWith("ipfs://")) {
          url = `https://ipfs.io/ipfs/${metadataURI.slice(7)}`;
        }

        const response = await fetch(url);
        const metadata = await response.json();
        setAssemblyName(metadata.name || null);
      } catch (error) {
        console.error("Failed to fetch assembly metadata:", error);
      }
    };

    fetchMetadata();
  }, [assemblyInfo]);

  const { data: passportsAddress } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "passports",
  });

  const { data: requiredPassports } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "getRequiredPassports",
  });

  // Check user status
  const { data: hasVoted } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "hasVoted",
    args: [userAddress || "0x0"],
    query: { enabled: isConnected },
  });

  const { data: userVote } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "userVote",
    args: [userAddress || "0x0"],
    query: { enabled: isConnected && hasVoted },
  });

  const { data: canVote } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "canVote",
    args: [userAddress || "0x0"],
    query: { enabled: isConnected },
  });

  // Get results
  const { data: results, refetch: refetchResults } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "getResults",
  });

  const [optionNames, votes, total] = results || [[], [], 0n];

  // Get winner (only if ended)
  const { data: winner } = useReadContract({
    address: contestAddress,
    abi: deployedContracts[31337]?.Contest?.abi || [],
    functionName: "getWinner",
    query: { enabled: !isActive },
  });

  // Check if user has required passports
  const isGated = requiredPassports && requiredPassports.length > 0;

  // const { data: holdsRequiredPassport } = useReadContract({
  //   address: passportsAddress,
  //   abi: deployedContracts[31337]?.AssemblyPassports?.abi || [],
  //   functionName: "holdsAnyPassport",
  //   args: [userAddress || "0x0", requiredPassports || []],
  //   query: { enabled: isConnected && isGated },
  // });

  // Vote function
  const { writeContractAsync: vote } = useWriteContract();

  const handleVote = async () => {
    if (selectedOption === null) return;

    const confirmed = window.confirm(
      `You're voting for "${options?.[selectedOption]}". This action cannot be undone. Continue?`
    );
    if (!confirmed) return;

    setIsVoting(true);
    try {
      await vote({
        address: contestAddress,
        abi: deployedContracts[31337]?.Contest?.abi || [],
        functionName: "vote",
        args: [BigInt(selectedOption)],
      });

      notification.success("Vote cast successfully! 🎉");
      refetchResults();
    } catch (error) {
      console.error("Error voting:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cast vote";
      notification.error(errorMessage);
    } finally {
      setIsVoting(false);
    }
  };

  // Copy share link
  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/contests/${contestAddress}` : "";
    navigator.clipboard.writeText(url);
    setShowShareCopied(true);
    setTimeout(() => setShowShareCopied(false), 2000);
    notification.success("Link copied to clipboard!");
  };

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!votingEnd) return "";

    const now = Math.floor(Date.now() / 1000);
    const end = Number(votingEnd);
    const diff = end - now;

    if (diff <= 0) return "Voting ended";

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m remaining`;
  }, [votingEnd]);

  // Process results for visualization
  const processedResults = useMemo(() => {
    if (!optionNames || !votes) return [];

    const totalVotesNum = Number(total);

    return optionNames
      .map((name, index) => ({
        name,
        votes: Number(votes[index]),
        percentage: totalVotesNum > 0 ? (Number(votes[index]) / totalVotesNum) * 100 : 0,
        isWinner: winner && Number(winner[0]) === index,
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [optionNames, votes, total, winner]);

  if (!prompt) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse">
          <p className="font-mono text-muted-foreground">Loading vote...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm font-mono text-muted-foreground">
          <Link href="/assemblies" className="hover:text-foreground transition-colors">
            Groups
          </Link>
          {" / "}
          <Link href={`/assemblies/${sourceAssembly}`} className="hover:text-foreground transition-colors">
            {assemblyName || "Loading..."}
          </Link>
          {" / "}
          <span className="text-foreground">Vote</span>
        </div>

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-mono px-3 py-1 border ${
                  isActive ? "border-green-500 text-green-600" : "border-border text-muted-foreground"
                }`}
              >
                {isActive ? "ACTIVE" : "ENDED"}
              </span>
              {isGated && <span className="text-sm">🔒 Membership Required</span>}
            </div>
            <Button onClick={handleShare} variant="outline" className="font-mono text-sm bg-transparent">
              {showShareCopied ? "✓ COPIED" : "SHARE"}
            </Button>
          </div>

          <h1 className="text-4xl font-mono font-bold mb-6">{prompt}</h1>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-mono text-xs">TOTAL VOTES</p>
              <p className="font-mono font-bold text-lg">{totalVotes?.toString() || "0"}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono text-xs">STATUS</p>
              <p className="font-mono font-bold text-lg">{timeRemaining}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono text-xs">ADDRESS</p>
              <p className="font-mono font-bold text-xs truncate">{contestAddress}</p>
            </div>
          </div>
        </div>

        {/* Voting Section (Active & Not Voted) */}
        {isActive && !hasVoted && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-mono font-bold">CAST YOUR VOTE</h2>
            </div>

            {!isConnected ? (
              <Card className="p-6 border border-border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground font-mono mb-4">Connect your wallet to vote</p>
                <ConnectWalletButton />
              </Card>
            ) : !canVote ? (
              <Card className="p-6 border border-border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground font-mono mb-4">
                  {isGated ? "You need a required membership pass to vote" : "You cannot vote on this vote"}
                </p>
                {isGated && (
                  <Button
                    onClick={() => router.push(`/assemblies/${sourceAssembly}?tab=passports`)}
                    className="font-mono"
                  >
                    VIEW MEMBERSHIPS
                  </Button>
                )}
              </Card>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {options?.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedOption(index)}
                      className={`cursor-pointer border-2 p-4 rounded transition-colors ${
                        selectedOption === index ? "border-foreground bg-muted" : "border-border hover:border-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                            selectedOption === index ? "border-foreground bg-foreground" : "border-border"
                          }`}
                        >
                          {selectedOption === index && <div className="w-2 h-2 bg-background rounded-full" />}
                        </div>
                        <p className="font-mono font-semibold flex-1">{option}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full font-mono"
                  onClick={handleVote}
                  disabled={selectedOption === null || isVoting}
                >
                  {isVoting ? "VOTING..." : "CAST VOTE"}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Already Voted Message */}
        {hasVoted && (
          <div className="mb-12 p-4 border border-green-500 bg-green-50 dark:bg-green-950 rounded">
            <h3 className="font-mono font-bold mb-2">✓ YOU VOTED</h3>
            <p className="font-mono text-sm text-muted-foreground">
              Your choice: <span className="text-foreground font-semibold">{options?.[Number(userVote)]}</span>
            </p>
          </div>
        )}

        {/* Results */}
        <div>
          <h2 className="text-2xl font-mono font-bold mb-6">
            {isActive && !hasVoted ? "CURRENT RESULTS" : "RESULTS"}
          </h2>
          <div className="space-y-6">
            {processedResults.map((result, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono font-semibold flex items-center gap-2">
                    {result.name}
                    {result.isWinner && (
                      <span className="text-xs font-mono bg-foreground text-background px-2 py-0.5">WINNER</span>
                    )}
                    {hasVoted && Number(userVote) === index && (
                      <span className="text-xs font-mono border border-foreground px-2 py-0.5">YOUR VOTE</span>
                    )}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    {result.votes} votes · {result.percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="w-full bg-muted border border-border rounded h-8 overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-all duration-500"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <Button
            onClick={() => router.push(`/assemblies/${sourceAssembly}`)}
            variant="outline"
            className="font-mono bg-transparent"
          >
            ← BACK TO GROUP
          </Button>
        </div>
      </main>
    </div>
  );
}
