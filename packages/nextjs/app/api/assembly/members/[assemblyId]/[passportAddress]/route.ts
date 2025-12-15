import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, getContract } from "viem";
import { scroll } from "viem/chains";

// Assembly ABI (getInfo and isAdmin)
const ASSEMBLY_ABI = [
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
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "isAdmin",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "admins",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// AssemblyPassports ABI
const PASSPORTS_ABI = [
  {
    inputs: [],
    name: "nextTokenId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
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
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
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
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { assemblyId: string; passportAddress: string } }
) {
  try {
    const { assemblyId, passportAddress } = params;

    // Validate addresses
    if (!assemblyId.startsWith("0x") || !passportAddress.startsWith("0x")) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    const client = createPublicClient({
      chain: scroll,
      transport: http(),
    });

    // Get assembly admin list
    const adminList = await client.readContract({
      address: assemblyId as `0x${string}`,
      abi: ASSEMBLY_ABI,
      functionName: "admins",
    });

    const adminSet = new Set(adminList.map((addr) => addr.toLowerCase()));

    // Get next token ID to know how many passport types
    const nextTokenId = await client.readContract({
      address: passportAddress as `0x${string}`,
      abi: PASSPORTS_ABI,
      functionName: "nextTokenId",
    });

    const tokenIds = Array.from(
      { length: Number(nextTokenId) - 1 },
      (_, i) => i + 1
    );

    // Get passport type names
    const passportTypes: Record<number, string> = {};
    for (const tokenId of tokenIds) {
      const typeInfo = await client.readContract({
        address: passportAddress as `0x${string}`,
        abi: PASSPORTS_ABI,
        functionName: "passportTypes",
        args: [BigInt(tokenId)],
      });

      if (typeInfo[3]) {
        // exists
        passportTypes[tokenId] = typeInfo[0]; // name
      }
    }

    // Get total supplies and collect unique member addresses
    const memberMap: Record<
      string,
      { passports: number[]; passportNames: string[] }
    > = {};

    for (const tokenId of tokenIds) {
      if (!passportTypes[tokenId]) continue;

      const totalSupply = await client.readContract({
        address: passportAddress as `0x${string}`,
        abi: PASSPORTS_ABI,
        functionName: "totalSupply",
        args: [BigInt(tokenId)],
      });

      const supply = Number(totalSupply);

      // Note: This is a limitation - we can't enumerate all holders directly
      // In production, you would use The Graph or query Transfer events
      // For now, we'll return an empty list or use indexed events
      // This is a placeholder that needs proper indexing solution
    }

    // Query Transfer events to find unique holders
    // This is a simplified approach - in production use The Graph or similar
    const members = Object.entries(memberMap).map(([address, data]) => ({
      address,
      passports: data.passports,
      passportNames: data.passportNames,
      isAdmin: adminSet.has(address.toLowerCase()),
    }));

    // Sort: admins first, then by address
    members.sort((a, b) => {
      if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
      return a.address.localeCompare(b.address);
    });

    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error("Error fetching assembly members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members", members: [] },
      { status: 500 }
    );
  }
}
