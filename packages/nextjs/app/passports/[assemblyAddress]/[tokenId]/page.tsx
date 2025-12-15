"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import deployedContracts from "@/contracts/deployedContracts";
import { convertIPFSUrl, fetchFromIPFS } from "@/utils/ipfs";
import { notification } from "@/utils/scaffold-eth";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";

interface PassportMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

type EligibilityStatus = "loading" | "eligible" | "not-eligible" | "already-holds" | "not-connected";

export default function PassportMintPage() {
  const params = useParams();
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();

  const assemblyAddress = params.assemblyAddress as `0x${string}`;
  const tokenId = BigInt(params.tokenId as string);

  const [passportData, setPassportData] = useState<PassportMetadata | null>(null);
  const [passportType, setPassportType] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eligibilityStatus, setEligibilityStatus] = useState<EligibilityStatus>("loading");

  // Get ABIs from deployed contracts
  const passportsABI = (deployedContracts as any)[chainId]?.AssemblyPassports?.abi || [];

  // Get passports address from assembly
  const assemblyABI = (deployedContracts as any)[chainId]?.Assembly?.abi || [];
  const { data: assemblyInfo } = useReadContract({
    address: assemblyAddress,
    abi: assemblyABI,
    functionName: "getInfo",
  });

  const passportsAddress = ((assemblyInfo as any)?.[0] as `0x${string}`) || null;

  // Get passport type info
  const { data: passportTypeData } = useReadContract({
    address: passportsAddress || ("0x" as `0x${string}`),
    abi: passportsABI,
    functionName: "passportTypes",
    args: [tokenId],
    query: { enabled: !!passportsAddress },
  });

  // Check if user already holds this passport
  const { data: userBalance } = useReadContract({
    address: passportsAddress || ("0x" as `0x${string}`),
    abi: passportsABI,
    functionName: "balanceOf",
    args: [userAddress || ("0x" as `0x${string}`), tokenId],
    query: { enabled: isConnected && !!passportsAddress },
  });

  // Check if user is allowlisted (for gated passports)
  const shouldCheckAllowlist = isConnected && !!passportsAddress && passportTypeData && !(passportTypeData as any)?.[2];
  const { data: isAllowlisted } = useReadContract({
    address: passportsAddress || ("0x" as `0x${string}`),
    abi: passportsABI,
    functionName: "allowlist",
    args: [tokenId, userAddress || ("0x" as `0x${string}`)] as const,
    query: { enabled: Boolean(shouldCheckAllowlist) } as any,
  });

  // Minting contract hook
  const { writeContractAsync: mint, isPending: isMinting } = useWriteContract();

  // Fetch passport metadata
  useEffect(() => {
    if (!passportTypeData) return;

    const fetchMetadata = async () => {
      try {
        const metadataUri = (passportTypeData as any)?.[1];
        if (!metadataUri) {
          setPassportData(null);
          return;
        }

        const metadata = await fetchFromIPFS(metadataUri);
        setPassportData(metadata as PassportMetadata);
        setPassportType(passportTypeData);
      } catch (error) {
        console.error("Failed to fetch passport metadata:", error);
        setPassportData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [passportTypeData]);

  // Determine eligibility
  useEffect(() => {
    if (!isConnected) {
      setEligibilityStatus("not-connected");
      return;
    }

    if (!passportTypeData) {
      setEligibilityStatus("loading");
      return;
    }

    // Check if user already holds
    if ((userBalance as any) && (userBalance as any) > 0n) {
      setEligibilityStatus("already-holds");
      return;
    }

    // Get passport data
    const isOpen = (passportTypeData as any)?.[2]; // isOpen is the 3rd element
    setEligibilityStatus("loading");

    // If open, user is eligible
    if (isOpen) {
      setEligibilityStatus("eligible");
      return;
    }

    // If gated, check allowlist
    if (isAllowlisted === undefined) {
      // Still loading
      setEligibilityStatus("loading");
    } else if (isAllowlisted) {
      setEligibilityStatus("eligible");
    } else {
      setEligibilityStatus("not-eligible");
    }
  }, [isConnected, passportTypeData, userBalance, isAllowlisted]);

  // Handle minting
  const handleMint = async () => {
    if (!passportsAddress || !userAddress) {
      notification.error("Wallet not connected");
      return;
    }

    try {
      await mint({
        address: passportsAddress,
        abi: passportsABI,
        functionName: "mint",
        args: [tokenId],
      });

      notification.success("Passport minted successfully! 🎉");

      // Redirect back to assembly after a short delay
      setTimeout(() => {
        router.push(`/assemblies/${assemblyAddress}`);
      }, 2000);
    } catch (error: any) {
      console.error("Minting error:", error);

      // Parse common errors
      if (error.message?.includes("AlreadyHoldsPassport")) {
        notification.error("You already hold this passport");
      } else if (error.message?.includes("NotAllowlisted")) {
        notification.error("You are not eligible to mint this passport");
      } else if (error.message?.includes("PassportTypeDoesNotExist")) {
        notification.error("This passport type does not exist");
      } else {
        notification.error("Failed to mint passport. Please try again.");
      }
    }
  };

  // Render eligibility message
  const renderEligibilitySection = () => {
    switch (eligibilityStatus) {
      case "loading":
        return (
          <Card className="p-8 border border-border text-center">
            <p className="text-sm text-muted-foreground font-mono animate-pulse">Checking eligibility...</p>
          </Card>
        );

      case "not-connected":
        return (
          <Card className="p-8 border border-border text-center">
            <p className="text-sm text-muted-foreground font-mono mb-4">Connect your wallet to mint this passport</p>
            <Button
              className="font-mono text-sm"
              onClick={() => {
                // Trigger wallet connection - RainbowKit handles this
                const event = new CustomEvent("rainbow-kit-connect");
                window.dispatchEvent(event);
              }}
            >
              CONNECT WALLET
            </Button>
          </Card>
        );

      case "already-holds":
        return (
          <Card className="p-8 text-center bg-green-950 border border-green-700">
            <p className="text-sm font-mono text-green-400 mb-4">✓ YOU ALREADY HOLD THIS PASSPORT</p>
            <p className="text-xs font-mono text-green-300">You cannot mint the same passport twice</p>
          </Card>
        );

      case "eligible":
        return (
          <Card className="p-8 text-center bg-blue-950 border border-blue-700">
            <p className="text-sm font-mono text-blue-400 mb-6">✓ YOU ARE ELIGIBLE TO MINT THIS PASSPORT</p>
            <Button className="font-mono text-sm" onClick={handleMint} disabled={isMinting}>
              {isMinting ? "MINTING..." : "MINT PASSPORT"}
            </Button>
          </Card>
        );

      case "not-eligible":
        return (
          <Card className="p-8 text-center bg-red-950 border border-red-700">
            <p className="text-sm font-mono text-red-400 mb-4">⚠️ YOU ARE NOT ELIGIBLE TO MINT</p>
            <p className="text-xs font-mono text-red-300">
              This passport requires allowlist approval. Contact the assembly admins.
            </p>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Back Button */}
        <Button variant="ghost" className="mb-8 font-mono text-sm" onClick={() => router.back()}>
          ← BACK
        </Button>

        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-3xl font-mono font-bold mb-2">MINT PASSPORT</h1>
          <p className="text-muted-foreground font-mono text-sm">
            Assembly: {assemblyAddress.slice(0, 6)}...{assemblyAddress.slice(-4)}
          </p>
        </div>

        {isLoading ? (
          <Card className="p-12 border border-border text-center">
            <p className="text-sm text-muted-foreground font-mono animate-pulse">Loading passport information...</p>
          </Card>
        ) : passportData && passportType ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Passport Display */}
            <div className="md:col-span-1">
              <Card className="p-6 border border-border sticky top-4">
                {passportData.image && (
                  <Image
                    src={convertIPFSUrl(passportData.image)}
                    alt={passportData.name}
                    width={500}
                    height={500}
                    className="w-full aspect-square border border-border object-cover mb-4"
                  />
                )}
                <h2 className="text-xl font-mono font-bold mb-2">{passportData.name}</h2>
                <p className="text-sm text-muted-foreground font-mono mb-6">
                  {passportData.description || "No description"}
                </p>

                {/* Passport Type Badge */}
                <div className="flex items-center justify-center mb-6">
                  <span
                    className={`text-xs font-mono px-3 py-1 border ${
                      passportType[2] ? "border-green-500 text-green-600" : "border-yellow-500 text-yellow-600"
                    }`}
                  >
                    {passportType[2] ? "OPEN MINTING" : "ALLOWLIST ONLY"}
                  </span>
                </div>

                {/* Attributes */}
                {passportData.attributes && passportData.attributes.length > 0 && (
                  <div className="space-y-2 mb-6 text-xs font-mono">
                    {passportData.attributes.map((attr, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span>{attr.trait_type}</span>
                        <span className="font-bold">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Minting Info */}
            <div className="md:col-span-2 space-y-6">
              {/* Eligibility Status */}
              <div>
                <h3 className="text-sm font-mono font-bold mb-4 text-muted-foreground">ELIGIBILITY STATUS</h3>
                {renderEligibilitySection()}
              </div>

              {/* About This Passport */}
              <div>
                <h3 className="text-sm font-mono font-bold mb-4 text-muted-foreground">ABOUT THIS PASSPORT</h3>
                <Card className="p-6 border border-border space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono mb-1">TYPE ID</p>
                    <p className="font-mono font-bold">{tokenId.toString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-mono mb-1">MINTING</p>
                    <p className="font-mono font-bold">{passportType[2] ? "Anyone can mint" : "Allowlist required"}</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground font-mono mb-3">
                      This passport is part of the governance system for this assembly. It grants voting rights and
                      represents your membership status.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="text-sm font-mono font-bold mb-4 text-muted-foreground">REQUIREMENTS</h3>
                <Card className="p-6 border border-border space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">✓</span>
                    <div>
                      <p className="font-mono font-bold text-sm">Connected Wallet</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {isConnected
                          ? `Connected: ${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)}`
                          : "Not connected"}
                      </p>
                    </div>
                  </div>
                  {passportType && !passportType[2] && (
                    <div className="flex items-start gap-3">
                      <span className={`text-lg ${isAllowlisted ? "✓" : "✗"}`}></span>
                      <div>
                        <p className="font-mono font-bold text-sm">Allowlist</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {isAllowlisted === undefined
                            ? "Checking..."
                            : isAllowlisted
                              ? "Your address is approved"
                              : "Your address is not approved"}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <Card className="p-12 border border-border text-center">
            <p className="text-sm text-muted-foreground font-mono">Passport not found</p>
          </Card>
        )}
      </main>
    </div>
  );
}
