import { useEffect, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { fetchFromIPFS, convertIPFSUrl } from "~~/utils/ipfs";
import { useAccount } from "wagmi";

export interface Contest {
  address: string;
  prompt: string;
  isActive: boolean;
  totalVotes: number;
  votingEnd: bigint;
  options: string[];
  requiredPassports: bigint[];
}

export interface PassportType {
  tokenId: number;
  name: string;
  uri: string;
  isOpen: boolean;
  userHolds: boolean;
  holders: number;
}

export interface AssemblyDetail {
  address: string;
  passportsAddress: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  contestCount: number;
  adminCount: number;
}

/**
 * Hook to fetch detailed assembly information
 */
export function useAssemblyDetail(assemblyAddress: `0x${string}`) {
  const { address: userAddress, isConnected } = useAccount();
  const [assemblyData, setAssemblyData] = useState<AssemblyDetail | null>(null);
  const [assemblyMetadata, setAssemblyMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Get assembly info
  const { data: assemblyInfo } = useScaffoldReadContract({
    contractName: "Assembly",
    functionName: "getInfo",
    address: assemblyAddress,
  });

  // 2. Fetch metadata from IPFS
  useEffect(() => {
    if (!assemblyInfo) return;

    const fetchMetadata = async () => {
      try {
        const metadataURI = (assemblyInfo as any)[1] as string;
        const metadata = await fetchFromIPFS(metadataURI);
        setAssemblyMetadata(metadata);

        const [passportsAddress, , contestCount, adminCount] = assemblyInfo as [
          string,
          string,
          bigint,
          bigint,
        ];

        setAssemblyData({
          address: assemblyAddress,
          passportsAddress,
          name: metadata?.name || "Unnamed Assembly",
          description: metadata?.description || "",
          image: metadata?.image || "",
          imageUrl: convertIPFSUrl(metadata?.image || ""),
          contestCount: Number(contestCount || 0),
          adminCount: Number(adminCount || 0),
        });
      } catch (err) {
        console.error("Error fetching assembly metadata:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch assembly");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [assemblyInfo, assemblyAddress]);

  // 3. Check if user is admin
  const { data: isAdmin } = useScaffoldReadContract({
    contractName: "Assembly",
    functionName: "isAdmin",
    address: assemblyAddress,
    args: [userAddress],
    query: { enabled: isConnected },
  });

  return {
    assemblyData,
    assemblyMetadata,
    isAdmin: isAdmin as boolean,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch all contests for an assembly
 */
export function useAssemblyContests(assemblyAddress: `0x${string}`) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get all contests
  const { data: allContestAddresses } = useScaffoldReadContract({
    contractName: "Assembly",
    functionName: "getAllContests",
    address: assemblyAddress,
  });

  // Get active contests
  const { data: activeContestAddresses } = useScaffoldReadContract({
    contractName: "Assembly",
    functionName: "getActiveContests",
    address: assemblyAddress,
  });

  // Fetch contest details for each
  const { data: contestsData } = useReadContracts({
    contracts: (allContestAddresses as string[])?.flatMap((contestAddr: string) => [
      {
        address: contestAddr as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: "prompt",
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "isActive",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "totalVotes",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "votingEnd",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "getOptions",
            outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "getRequiredPassports",
            outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "prompt",
      },
      {
        address: contestAddr as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: "isActive",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "isActive",
      },
      {
        address: contestAddr as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: "totalVotes",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "totalVotes",
      },
      {
        address: contestAddr as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: "votingEnd",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "votingEnd",
      },
      {
        address: contestAddr as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: "getOptions",
            outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "getOptions",
      },
      {
        address: contestAddr as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: "getRequiredPassports",
            outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "getRequiredPassports",
      },
    ]) || [],
    query: {
      enabled: (allContestAddresses as string[])?.length > 0,
    },
  });

  useEffect(() => {
    if (!contestsData || !allContestAddresses) {
      setContests([]);
      setIsLoading(false);
      return;
    }

    try {
      const processedContests: Contest[] = [];

      (allContestAddresses as string[]).forEach((contestAddr, index) => {
        const baseIndex = index * 6;
        const prompt = contestsData[baseIndex]?.result as string;
        const isActive = contestsData[baseIndex + 1]?.result as boolean;
        const totalVotes = contestsData[baseIndex + 2]?.result as bigint;
        const votingEnd = contestsData[baseIndex + 3]?.result as bigint;
        const options = (contestsData[baseIndex + 4]?.result as string[]) || [];
        const requiredPassports = (contestsData[baseIndex + 5]?.result as bigint[]) || [];

        processedContests.push({
          address: contestAddr,
          prompt: prompt || "Unknown Contest",
          isActive: isActive || false,
          totalVotes: Number(totalVotes || 0),
          votingEnd: votingEnd || 0n,
          options,
          requiredPassports,
        });
      });

      setContests(processedContests);
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing contests:", err);
      setError(err instanceof Error ? err.message : "Failed to process contests");
      setIsLoading(false);
    }
  }, [contestsData, allContestAddresses, activeContestAddresses]);

  return { contests, isLoading, error };
}

/**
 * Hook to fetch passport types for an assembly
 */
export function useAssemblyPassports(passportsAddress: `0x${string}` | null) {
  const { address: userAddress, isConnected } = useAccount();
  const [passports, setPassports] = useState<PassportType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get next token ID to determine how many passport types exist
  const { data: nextTokenId, refetch: refetchNextTokenId } = useReadContract({
    address: passportsAddress || undefined,
    abi: [
      {
        inputs: [],
        name: "nextTokenId",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "nextTokenId",
    query: { enabled: !!passportsAddress },
  });

  const passportTypeIds = Array.from({ length: Number(nextTokenId || 0) - 1 }, (_, i) => i + 1);

  // Get passport type info
  const { data: passportTypesData, refetch: refetchPassportTypes } = useReadContracts({
    contracts: passportTypeIds.map((id) => ({
      address: passportsAddress || ("0x0" as `0x${string}`),
      abi: [
        {
          inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          name: "passportTypes",
          outputs: [
            { internalType: "string", name: "name", type: "string" },
            { internalType: "string", name: "uri", type: "string" },
            { internalType: "bool", name: "isOpen", type: "bool" },
            { internalType: "bool", name: "exists", type: "bool" },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "passportTypes",
      args: [BigInt(id)],
    })),
    query: { enabled: !!passportsAddress && passportTypeIds.length > 0 },
  });

  // Check which passports user holds
  const { data: userPassportBalances, refetch: refetchUserPassports } = useReadContracts({
    contracts: passportTypeIds.map((id) => ({
      address: passportsAddress || ("0x0" as `0x${string}`),
      abi: [
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "id", type: "uint256" },
          ],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "balanceOf",
      args: [userAddress || ("0x0" as `0x${string}`), BigInt(id)],
    })),
    query: { enabled: isConnected && !!passportsAddress && passportTypeIds.length > 0 },
  });

  useEffect(() => {
    if (!passportTypesData) {
      setPassports([]);
      setIsLoading(false);
      return;
    }

    try {
      const processedPassports: PassportType[] = passportTypesData
        .map((data, index) => {
          const [name, uri, isOpen, exists] = data.result as [string, string, boolean, boolean];
          const tokenId = index + 1;
          const userBalance = userPassportBalances?.[index]?.result as bigint;

          if (!exists) return null;

          return {
            tokenId,
            name: name || "Unknown Passport",
            uri: uri || "",
            isOpen: isOpen || false,
            userHolds: (userBalance || 0n) > 0n,
            holders: 0, // Would need additional contract calls
          };
        })
        .filter((p): p is PassportType => p !== null);

      setPassports(processedPassports);
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing passports:", err);
      setIsLoading(false);
    }
  }, [passportTypesData, userPassportBalances]);

  const refetch = async () => {
    await Promise.all([refetchNextTokenId(), refetchPassportTypes(), refetchUserPassports()]);
  };

  return { passports, isLoading, refetch };
}
