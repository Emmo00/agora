import { useEffect, useMemo, useState } from "react";
import { useReadContracts } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { fetchFromIPFS, convertIPFSUrl } from "~~/utils/ipfs";

export interface AssemblyData {
  address: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  contestCount: number;
  adminCount: number;
  activeVoteCount?: number;
}

/**
 * Hook to fetch recent assemblies from the AgoraFactory contract
 * Returns assembly addresses, info, and metadata
 */
export function useRecentAssemblies(limit: number = 5) {
  const [assembliesData, setAssembliesData] = useState<AssemblyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Get recent assemblies from factory
  const { data: recentAssemblies } = useScaffoldReadContract({
    contractName: "AgoraFactory",
    functionName: "getRecentAssemblies",
    args: [BigInt(limit)],
  });

  const assemblyAddresses = useMemo(() => (recentAssemblies as string[]) || [], [recentAssemblies]);

  // 2. Get info for all assemblies using multicall with basic useReadContracts
  // We'll use a simplified approach - calling Assembly getInfo directly
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
      setAssembliesData([]);
      setIsLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);

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
              image: metadata?.image || "",
              imageUrl: convertIPFSUrl(metadata?.image || ""),
              contestCount,
              adminCount,
            };
          })
        );

        const filteredData = data.filter((item): item is AssemblyData => item !== null);
        setAssembliesData(filteredData);
      } catch (err) {
        console.error("Error fetching assembly metadata:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch assemblies");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [assembliesInfo, assemblyAddresses]);

  return { data: assembliesData, isLoading, error };
}

/**
 * Hook to fetch total assembly count
 */
export function useAssemblyCount() {
  const { data: count, isLoading } = useScaffoldReadContract({
    contractName: "AgoraFactory",
    functionName: "getAssemblyCount",
  });

  return {
    count: count ? Number(count) : 0,
    isLoading,
  };
}
