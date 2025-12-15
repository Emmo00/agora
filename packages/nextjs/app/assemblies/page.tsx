"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useScaffoldReadContract } from "@/hooks/scaffold-eth";
import { useReadContracts } from "wagmi";
import { fetchFromIPFS, convertIPFSUrl } from "@/utils/ipfs";

interface AssemblyDisplay {
  address: string;
  name: string;
  description: string;
  imageUrl: string;
  contestCount: number;
  adminCount: number;
}

const ITEMS_PER_PAGE = 10;

export default function AssembliesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allAssemblies, setAllAssemblies] = useState<AssemblyDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Get all assemblies from factory
  const { data: allAssemblyAddresses } = useScaffoldReadContract({
    contractName: "AgoraFactory",
    functionName: "getAllAssemblies",
  });

  const assemblyAddresses = useMemo(() => (allAssemblyAddresses as string[]) || [], [allAssemblyAddresses]);

  // 2. Get info for all assemblies using multicall
  const { data: assembliesInfo } = useReadContracts({
    contracts: assemblyAddresses.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: [
        {
          inputs: [],
          name: "getInfo",
          outputs: [
            { internalType: "address", name: "passportsAddress", type: "address" },
            { internalType: "string", name: "metadataURI", type: "string" },
            { internalType: "uint256", name: "contestCount", type: "uint256" },
            { internalType: "uint256", name: "adminCount", type: "uint256" },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "getInfo",
    })),
    query: {
      enabled: assemblyAddresses.length > 0,
    },
  });

  // 3. Fetch metadata from IPFS for each assembly
  useEffect(() => {
    if (!assembliesInfo || !assemblyAddresses.length) {
      setAllAssemblies([]);
      setIsLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoading(true);

      try {
        const data = await Promise.all(
          assembliesInfo.map(async (info, index) => {
            if (!info.result) {
              return null;
            }

            // Result is a tuple: [passportsAddress, metadataURI, contestCount, adminCount]
            const [, metadataURI, contestCountBigInt, adminCountBigInt] = info.result as [
              string,
              string,
              bigint,
              bigint,
            ];

            const contestCount = Number(contestCountBigInt || 0);
            const adminCount = Number(adminCountBigInt || 0);

            // Fetch metadata from IPFS
            const metadata = await fetchFromIPFS(metadataURI);

            return {
              address: assemblyAddresses[index],
              name: metadata?.name || "Unnamed Assembly",
              description: metadata?.description || "",
              imageUrl: convertIPFSUrl(metadata?.image || ""),
              contestCount,
              adminCount,
            };
          })
        );

        setAllAssemblies(data.filter((a): a is AssemblyDisplay => a !== null));
      } catch (error) {
        console.error("Error fetching assembly metadata:", error);
        setAllAssemblies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [assembliesInfo, assemblyAddresses]);

  // 4. Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) {
      return allAssemblies;
    }

    return allAssemblies.filter(
      a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [allAssemblies, search]);

  // 5. Paginate
  const paginatedAssemblies = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = paginatedAssemblies.length < filtered.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold mb-2">GROUPS</h1>
          <p className="text-muted-foreground mb-6">Browse and join groups on Agora</p>
          <Input
            placeholder="Search groups by name or description..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="font-mono"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block border-2 border-primary border-t-transparent rounded-full w-8 h-8 animate-spin mb-4"></div>
              <p className="text-muted-foreground font-mono">Loading groups...</p>
            </div>
          </div>
        ) : allAssemblies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-mono mb-6">No groups found</p>
            <Link href="/">
              <Button className="font-mono">← Back Home</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-muted-foreground font-mono">
              Showing {Math.min(paginatedAssemblies.length, filtered.length)} of {filtered.length} groups
            </div>

            <div className="space-y-3 mb-8">
              {paginatedAssemblies.map(assembly => (
                <Link key={assembly.address} href={`/assembly/${assembly.address}`}>
                  <Card className="p-4 border border-border hover:bg-muted cursor-pointer transition-colors">
                    <div className="flex gap-4">
                      {assembly.imageUrl && (
                        <img
                          src={assembly.imageUrl}
                          alt={assembly.name}
                          className="w-20 h-20 border border-border rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = "/placeholder.svg?height=80&width=80";
                          }}
                        />
                      )}
                      {!assembly.imageUrl && (
                        <div className="w-20 h-20 border border-border bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono font-semibold text-lg truncate">{assembly.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{assembly.description}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {assembly.adminCount} member{assembly.adminCount !== 1 ? "s" : ""} · {assembly.contestCount} votes
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  className="font-mono bg-transparent"
                  onClick={() => setPage(p => p + 1)}
                >
                  LOAD MORE
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
