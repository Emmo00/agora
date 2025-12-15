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
/**
 * Hook to fetch total contest count across all assemblies
 */
export function useTotalContestCount() {
  const [totalContests, setTotalContests] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get all assemblies
  const { data: allAssemblyAddresses } = useScaffoldReadContract({
    contractName: "AgoraFactory",
    functionName: "getAllAssemblies",
  });

  const assemblyAddresses = useMemo(
    () => (allAssemblyAddresses as string[]) || [],
    [allAssemblyAddresses]
  );

  // Get contest count for each assembly
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

  useEffect(() => {
    if (!assembliesInfo) {
      setIsLoading(false);
      return;
    }

    const total = assembliesInfo.reduce((sum, info) => {
      if (!info.result) return sum;
      const contestCount = Number(info.result[2] || 0);
      return sum + contestCount;
    }, 0);

    setTotalContests(total);
    setIsLoading(false);
  }, [assembliesInfo]);

  return {
    count: totalContests,
    isLoading,
  };
}

/**
 * Hook to fetch total votes cast across all contests
 */
export function useTotalVoteCount() {
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get all assemblies
  const { data: allAssemblyAddresses } = useScaffoldReadContract({
    contractName: "AgoraFactory",
    functionName: "getAllAssemblies",
  });

  const assemblyAddresses = useMemo(
    () => (allAssemblyAddresses as string[]) || [],
    [allAssemblyAddresses]
  );

  // Get all contests from each assembly
  const { data: allContestsData } = useReadContracts({
    contracts: assemblyAddresses.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: [
        {
          inputs: [],
          name: "getAllContests",
          outputs: [
            {
              internalType: "address[]",
              name: "",
              type: "address[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "getAllContests",
    })),
    query: {
      enabled: assemblyAddresses.length > 0,
    },
  });

  // Flatten all contest addresses
  const allContestAddresses = useMemo(() => {
    const contests: string[] = [];
    if (allContestsData) {
      allContestsData.forEach((data) => {
        if (data.result && Array.isArray(data.result[0])) {
          contests.push(...(data.result[0] as string[]));
        }
      });
    }
    return contests;
  }, [allContestsData]);

  // Get vote count for each contest
  const { data: contestsVotes } = useReadContracts({
    contracts: allContestAddresses.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: [
        {
          inputs: [],
          name: "totalVotes",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "totalVotes",
    })),
    query: {
      enabled: allContestAddresses.length > 0,
    },
  });

  useEffect(() => {
    if (!contestsVotes) {
      setIsLoading(false);
      return;
    }

    const total = contestsVotes.reduce((sum, data) => {
      if (!data.result) return sum;
      const votes = Number(data.result || 0);
      return sum + votes;
    }, 0);

    setTotalVotes(total);
    setIsLoading(false);
  }, [contestsVotes]);

  return {
    count: totalVotes,
    isLoading,
  };
}

/**
 * Hook to fetch total members (passport holders) across all assemblies
 */
export function useTotalMemberCount() {
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get all assemblies
  const { data: allAssemblyAddresses } = useScaffoldReadContract({
    contractName: "AgoraFactory",
    functionName: "getAllAssemblies",
  });

  const assemblyAddresses = useMemo(
    () => (allAssemblyAddresses as string[]) || [],
    [allAssemblyAddresses]
  );

  // Get passports address for each assembly
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

  const passportAddresses = useMemo(() => {
    const addresses: `0x${string}`[] = [];
    if (assembliesInfo) {
      assembliesInfo.forEach((info) => {
        if (info.result && info.result[0]) {
          addresses.push(info.result[0] as `0x${string}`);
        }
      });
    }
    return addresses;
  }, [assembliesInfo]);

  // Get next token ID for each passport contract (to know how many passport types)
  const { data: nextTokenIds } = useReadContracts({
    contracts: passportAddresses.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: [
        {
          inputs: [],
          name: "nextTokenId",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "nextTokenId",
    })),
    query: {
      enabled: passportAddresses.length > 0,
    },
  });

  // Build list of passport tokens to check total supply
  const passportTokens = useMemo(() => {
    const tokens: { passportAddr: string; tokenId: number }[] = [];
    if (nextTokenIds) {
      nextTokenIds.forEach((data, index) => {
        if (data.result) {
          const nextId = Number(data.result);
          // Token IDs start at 1, so we have 1 to nextId-1
          for (let i = 1; i < nextId; i++) {
            tokens.push({
              passportAddr: passportAddresses[index],
              tokenId: i,
            });
          }
        }
      });
    }
    return tokens;
  }, [nextTokenIds, passportAddresses]);

  // Get total supply for each passport token
  const { data: passportSupplies } = useReadContracts({
    contracts: passportTokens.map((item) => ({
      address: item.passportAddr as `0x${string}`,
      abi: [
        {
          inputs: [
            {
              internalType: "uint256",
              name: "id",
              type: "uint256",
            },
          ],
          name: "totalSupply",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "totalSupply",
      args: [BigInt(item.tokenId)],
    })),
    query: {
      enabled: passportTokens.length > 0,
    },
  });

  useEffect(() => {
    if (!passportSupplies) {
      setIsLoading(false);
      return;
    }

    // Sum all passport supplies
    // Note: This counts duplicate members (someone with multiple passports counted multiple times)
    // For a more accurate count, we'd need to track unique addresses, but this requires off-chain data
    const total = passportSupplies.reduce((sum, data) => {
      if (!data.result) return sum;
      const supply = Number(data.result || 0);
      return sum + supply;
    }, 0);

    setTotalMembers(total);
    setIsLoading(false);
  }, [passportSupplies]);

  return {
    count: totalMembers,
    isLoading,
  };
}