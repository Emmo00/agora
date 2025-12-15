---
applyTo: '**'
---
# Agora Smart Contract to Frontend Integration Guide

## Overview

This guide describes the complete integration between Agora smart contracts and the frontend using Scaffold-ETH hooks, Wagmi, and Viem. Every data fetch and write operation is detailed for each page.

---

## SETUP & CONFIGURATION

### 1. Contract Deployment Information

Create `contracts/deployedContracts.ts`:

```typescript
export const deployedContracts = {
  534352: { // Scroll Mainnet
    AgoraFactory: {
      address: "0x...", // From deployment
      abi: [...] // Import from artifacts
    }
  },
  534351: { // Scroll Sepolia
    AgoraFactory: {
      address: "0x...",
      abi: [...]
    }
  }
} as const;
```

### 2. Contract ABIs

Store ABIs in `contracts/abis/`:
- `AgoraFactory.json`
- `Assembly.json`
- `AssemblyPassports.json`
- `Contest.json`

### 3. Wagmi Configuration

```typescript
// wagmi.config.ts
import { createConfig, http } from 'wagmi';
import { scroll, scrollSepolia } from 'wagmi/chains';

export const config = createConfig({
  chains: [scroll, scrollSepolia],
  transports: {
    [scroll.id]: http(),
    [scrollSepolia.id]: http(),
  },
});
```

### 4. Custom Hooks Setup

Create `hooks/scaffold-eth/` directory with wrapper hooks.

---

## DATA FETCHING PATTERNS

### Pattern 1: Single Contract Read

```typescript
const { data, isLoading, error, refetch } = useScaffoldContractRead({
  contractName: "AgoraFactory",
  functionName: "getAssemblyCount",
});
```

### Pattern 2: Dynamic Contract Address

```typescript
const { data: assemblyInfo } = useScaffoldContractRead({
  contractName: "Assembly",
  functionName: "getInfo",
  address: assemblyAddress as `0x${string}`,
});
```

### Pattern 3: With Arguments

```typescript
const { data: isAdmin } = useScaffoldContractRead({
  contractName: "Assembly",
  functionName: "isAdmin",
  address: assemblyAddress,
  args: [userAddress],
});
```

### Pattern 4: Multicall (Multiple Reads)

```typescript
import { useReadContracts } from 'wagmi';

const contracts = assemblies.map(address => ({
  address,
  abi: AssemblyABI,
  functionName: 'getInfo',
}));

const { data: results } = useReadContracts({ contracts });
```

### Pattern 5: Write Operations

```typescript
const { writeAsync, isPending, isSuccess } = useScaffoldContractWrite({
  contractName: "Assembly",
  functionName: "createContest",
  address: assemblyAddress,
  args: [prompt, options, duration, requiredPassports],
  onBlockConfirmation: (txnReceipt) => {
    // Handle success
  },
});
```

---

## PAGE 1: HOME / LANDING PAGE

### Data Requirements
- Total assembly count
- Recent assemblies (last 5)
- Assembly metadata for each
- Active contest count per assembly

### Implementation

```typescript
// pages/index.tsx or app/page.tsx

import { useScaffoldContractRead, useScaffoldMultiContractRead } from '@/hooks/scaffold-eth';
import { useAccount } from 'wagmi';

export default function HomePage() {
  const { address, isConnected } = useAccount();

  // 1. Get total assembly count
  const { data: assemblyCount, isLoading: countLoading } = useScaffoldContractRead({
    contractName: "AgoraFactory",
    functionName: "getAssemblyCount",
  });

  // 2. Get recent assemblies (last 5)
  const { data: recentAssemblies, isLoading: assembliesLoading } = useScaffoldContractRead({
    contractName: "AgoraFactory",
    functionName: "getRecentAssemblies",
    args: [5n],
  });

  // 3. For each assembly, get info
  const assemblyAddresses = recentAssemblies || [];
  
  const { data: assembliesInfo } = useReadContracts({
    contracts: assemblyAddresses.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: AssemblyABI,
      functionName: 'getInfo',
    })),
  });

  // 4. Fetch metadata from IPFS for each assembly
  const [assembliesData, setAssembliesData] = useState<AssemblyData[]>([]);

  useEffect(() => {
    if (!assembliesInfo) return;

    const fetchMetadata = async () => {
      const data = await Promise.all(
        assembliesInfo.map(async (info, index) => {
          const metadataURI = info.result?.[1]; // metadata URI
          const metadata = await fetchFromIPFS(metadataURI);
          
          return {
            address: assemblyAddresses[index],
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            contestCount: info.result?.[2],
            adminCount: info.result?.[3],
          };
        })
      );
      setAssembliesData(data);
    };

    fetchMetadata();
  }, [assembliesInfo, assemblyAddresses]);

  // 5. Get active contests for each assembly
  const { data: activeContests } = useReadContracts({
    contracts: assemblyAddresses.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: AssemblyABI,
      functionName: 'getActiveContests',
    })),
  });

  return (
    <div>
      <h1>AGORA</h1>
      <p>Onchain governance primitive</p>
      
      {isConnected && (
        <>
          <button onClick={() => router.push('/create-assembly')}>
            CREATE ASSEMBLY
          </button>
          <button onClick={() => router.push('/assemblies')}>
            BROWSE ASSEMBLIES
          </button>
        </>
      )}

      <section>
        <h2>RECENT ASSEMBLIES</h2>
        {assembliesLoading ? (
          <LoadingSkeleton />
        ) : (
          assembliesData.map((assembly, index) => (
            <AssemblyCard
              key={assembly.address}
              {...assembly}
              activeVotes={activeContests?.[index]?.result?.length || 0}
              onClick={() => router.push(`/assembly/${assembly.address}`)}
            />
          ))
        )}
      </section>

      <section>
        <h2>STATS</h2>
        <p>Total Assemblies: {assemblyCount?.toString()}</p>
      </section>
    </div>
  );
}
```

### Helper Functions

```typescript
// utils/ipfs.ts

export async function fetchFromIPFS(uri: string): Promise<any> {
  if (!uri) return null;
  
  // Handle different URI formats
  let url = uri;
  if (uri.startsWith('ipfs://')) {
    url = `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch from IPFS:', error);
    return null;
  }
}

export async function uploadToIPFS(data: object): Promise<string> {
  // Using Pinata as example
  const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const PINATA_SECRET = process.env.NEXT_PUBLIC_PINATA_SECRET;
  
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET,
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Failed to upload to IPFS:', error);
    throw error;
  }
}
```

---

## PAGE 2: CREATE ASSEMBLY

### Data Requirements
- User's connected address (to set as admin)
- Gas estimation for createAssembly call

### Implementation

```typescript
// components/CreateAssemblyModal.tsx

import { useState } from 'react';
import { useScaffoldContractWrite } from '@/hooks/scaffold-eth';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { uploadToIPFS } from '@/utils/ipfs';

export default function CreateAssemblyModal({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null,
  });
  
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload image to IPFS
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET!,
      },
      body: formData,
    });
    
    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  };

  // Write contract hook
  const { writeAsync: createAssembly, isPending } = useScaffoldContractWrite({
    contractName: "AgoraFactory",
    functionName: "createAssembly",
    onBlockConfirmation: (txnReceipt) => {
      // Parse AssemblyCreated event to get new assembly address
      const assemblyCreatedEvent = txnReceipt.logs.find(
        log => log.topics[0] === getEventSignature('AssemblyCreated')
      );
      
      if (assemblyCreatedEvent) {
        const assemblyAddress = `0x${assemblyCreatedEvent.topics[1].slice(26)}`;
        router.push(`/assembly/${assemblyAddress}`);
      }
    },
  });

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      
      // 1. Upload image if provided
      let imageURI = '';
      if (formData.image) {
        imageURI = await uploadImage(formData.image);
      }
      
      // 2. Create metadata object
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imageURI,
        created: new Date().toISOString(),
      };
      
      // 3. Upload metadata to IPFS
      const metadataURI = await uploadToIPFS(metadata);
      
      setIsUploading(false);
      
      // 4. Call createAssembly
      await createAssembly({
        args: [metadataURI],
      });
      
    } catch (error) {
      console.error('Error creating assembly:', error);
      setIsUploading(false);
      // Show error toast
    }
  };

  // Estimate gas
  const { data: gasEstimate } = useEstimateGas({
    to: getDeployedContract('AgoraFactory').address,
    data: encodeFunctionData({
      abi: AgoraFactoryABI,
      functionName: 'createAssembly',
      args: ['ipfs://dummy'], // Dummy URI for estimation
    }),
  });

  return (
    <div className="modal">
      <h2>CREATE ASSEMBLY</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>ASSEMBLY NAME *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            maxLength={50}
          />
        </div>

        <div>
          <label>DESCRIPTION *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            maxLength={500}
            rows={4}
          />
        </div>

        <div>
          <label>IMAGE</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="preview" />
          )}
        </div>

        <div className="preview-card">
          <h3>PREVIEW</h3>
          {imagePreview && <img src={imagePreview} alt="Preview" />}
          <p>{formData.name || 'Assembly Name'}</p>
          <p>{formData.description || 'Description...'}</p>
        </div>

        <div>
          <p>ESTIMATED GAS: ~{gasEstimate ? formatEther(gasEstimate) : '0.002'} ETH</p>
        </div>

        <div className="actions">
          <button type="button" onClick={onClose}>
            CANCEL
          </button>
          <button 
            type="submit" 
            disabled={isPending || isUploading}
          >
            {isUploading ? 'UPLOADING...' : isPending ? 'CREATING...' : 'CREATE ASSEMBLY'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Event Parsing Helper

```typescript
// utils/events.ts

import { keccak256, toHex } from 'viem';

export function getEventSignature(eventName: string): string {
  // For AssemblyCreated(address indexed assembly, address indexed creator, string metadataURI, uint256 assemblyIndex)
  const signatures = {
    'AssemblyCreated': 'AssemblyCreated(address,address,string,uint256)',
    'ContestCreated': 'ContestCreated(address,string,uint256)',
    'PassportTypeCreated': 'PassportTypeCreated(uint256,string,bool)',
    'VoteCast': 'VoteCast(address,uint256)',
  };
  
  return keccak256(toHex(signatures[eventName]));
}

export function parseAssemblyCreatedEvent(log: any): string {
  // Extract assembly address from indexed parameter
  return `0x${log.topics[1].slice(26)}`;
}
```

---

## PAGE 3: BROWSE ASSEMBLIES

### Data Requirements
- All assemblies from factory
- Assembly info for each
- Metadata for each
- Active contest count for each
- Filter by user's assemblies

### Implementation

```typescript
// app/assemblies/page.tsx

import { useState, useEffect, useMemo } from 'react';
import { useScaffoldContractRead } from '@/hooks/scaffold-eth';
import { useAccount } from 'wagmi';
import { useReadContracts } from 'wagmi';

type SortOption = 'newest' | 'mostMembers' | 'mostActive';
type FilterOption = 'all' | 'my' | 'activeVotes';

export default function BrowseAssembliesPage() {
  const { address, isConnected } = useAccount();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // 1. Get all assemblies
  const { data: allAssemblies, isLoading } = useScaffoldContractRead({
    contractName: "AgoraFactory",
    functionName: "getAllAssemblies",
  });

  // 2. Get info for all assemblies using multicall
  const assemblyContracts = useMemo(() => {
    if (!allAssemblies) return [];
    return allAssemblies.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: AssemblyABI,
      functionName: 'getInfo',
    }));
  }, [allAssemblies]);

  const { data: assembliesInfo } = useReadContracts({
    contracts: assemblyContracts,
  });

  // 3. Check which assemblies user is admin of
  const adminCheckContracts = useMemo(() => {
    if (!allAssemblies || !address) return [];
    return allAssemblies.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: AssemblyABI,
      functionName: 'isAdmin',
      args: [address],
    }));
  }, [allAssemblies, address]);

  const { data: adminStatus } = useReadContracts({
    contracts: adminCheckContracts,
    query: { enabled: isConnected },
  });

  // 4. Get active contests for each
  const activeContestsContracts = useMemo(() => {
    if (!allAssemblies) return [];
    return allAssemblies.map((addr: string) => ({
      address: addr as `0x${string}`,
      abi: AssemblyABI,
      functionName: 'getActiveContests',
    }));
  }, [allAssemblies]);

  const { data: activeContests } = useReadContracts({
    contracts: activeContestsContracts,
  });

  // 5. Fetch metadata
  const [assembliesData, setAssembliesData] = useState<AssemblyData[]>([]);

  useEffect(() => {
    if (!assembliesInfo || !allAssemblies) return;

    const fetchAllMetadata = async () => {
      const data = await Promise.all(
        assembliesInfo.map(async (info, index) => {
          if (!info.result) return null;
          
          const metadataURI = info.result[1]; // metadata from getInfo
          const metadata = await fetchFromIPFS(metadataURI);
          
          return {
            address: allAssemblies[index],
            name: metadata?.name || 'Unnamed Assembly',
            description: metadata?.description || '',
            image: metadata?.image || '',
            memberCount: 0, // Need to calculate from passport holders
            contestCount: Number(info.result[2]),
            activeVoteCount: activeContests?.[index]?.result?.length || 0,
            isUserAdmin: adminStatus?.[index]?.result || false,
          };
        })
      );
      
      setAssembliesData(data.filter(Boolean) as AssemblyData[]);
    };

    fetchAllMetadata();
  }, [assembliesInfo, allAssemblies, activeContests, adminStatus]);

  // 6. Apply filters and sorting
  const filteredAndSorted = useMemo(() => {
    let filtered = [...assembliesData];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filter
    switch (filterBy) {
      case 'my':
        filtered = filtered.filter(a => a.isUserAdmin);
        break;
      case 'activeVotes':
        filtered = filtered.filter(a => a.activeVoteCount > 0);
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'newest':
        // Already in order from contract
        break;
      case 'mostMembers':
        filtered.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'mostActive':
        filtered.sort((a, b) => b.contestCount - a.contestCount);
        break;
    }

    return filtered;
  }, [assembliesData, searchTerm, filterBy, sortBy]);

  // 7. Paginate
  const paginatedData = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredAndSorted.slice(start, start + PAGE_SIZE);
  }, [filteredAndSorted, page]);

  return (
    <div>
      <h1>ASSEMBLIES ({assembliesData.length})</h1>

      <input
        type="text"
        placeholder="SEARCH"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="filters">
        <button onClick={() => setFilterBy('all')} data-active={filterBy === 'all'}>
          All
        </button>
        <button onClick={() => setFilterBy('my')} data-active={filterBy === 'my'}>
          My Assemblies
        </button>
        <button onClick={() => setFilterBy('activeVotes')} data-active={filterBy === 'activeVotes'}>
          Active Votes
        </button>
      </div>

      <div className="sort">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
          <option value="newest">Newest</option>
          <option value="mostMembers">Most Members</option>
          <option value="mostActive">Most Active</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeletons count={PAGE_SIZE} />
      ) : (
        <div className="assembly-grid">
          {paginatedData.map((assembly) => (
            <AssemblyCard
              key={assembly.address}
              {...assembly}
              onClick={() => router.push(`/assembly/${assembly.address}`)}
            />
          ))}
        </div>
      )}

      {filteredAndSorted.length > (page + 1) * PAGE_SIZE && (
        <button onClick={() => setPage(page + 1)}>
          LOAD MORE
        </button>
      )}
    </div>
  );
}
```

### Optimization: Custom Hook for Assembly Data

```typescript
// hooks/useAssemblyData.ts

import { useEffect, useState } from 'react';
import { useReadContracts } from 'wagmi';
import { fetchFromIPFS } from '@/utils/ipfs';

export function useAssemblyData(addresses: string[]) {
  const [data, setData] = useState<AssemblyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get all info in one multicall
  const { data: results } = useReadContracts({
    contracts: addresses.map(addr => ({
      address: addr as `0x${string}`,
      abi: AssemblyABI,
      functionName: 'getInfo',
    })),
  });

  useEffect(() => {
    if (!results) return;

    const fetchData = async () => {
      setIsLoading(true);
      
      const assembled = await Promise.all(
        results.map(async (result, index) => {
          if (!result.result) return null;
          
          const metadata = await fetchFromIPFS(result.result[1]);
          
          return {
            address: addresses[index],
            name: metadata?.name,
            description: metadata?.description,
            image: metadata?.image,
            passportsAddress: result.result[0],
            contestCount: Number(result.result[2]),
            adminCount: Number(result.result[3]),
          };
        })
      );
      
      setData(assembled.filter(Boolean) as AssemblyData[]);
      setIsLoading(false);
    };

    fetchData();
  }, [results, addresses]);

  return { data, isLoading };
}
```

---

## PAGE 4: ASSEMBLY DETAIL

### Data Requirements
- Assembly info
- Assembly metadata
- All contests
- Contest details for each
- Passport types
- User's admin status
- User's passports

### Implementation

```typescript
// app/assembly/[address]/page.tsx

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useScaffoldContractRead } from '@/hooks/scaffold-eth';
import { useAccount } from 'wagmi';
import { useReadContracts } from 'wagmi';

type Tab = 'contests' | 'passports' | 'members';

export default function AssemblyDetailPage() {
  const params = useParams();
  const assemblyAddress = params.address as `0x${string}`;
  const { address: userAddress, isConnected } = useAccount();
  
  const [activeTab, setActiveTab] = useState<Tab>('contests');
  const [assemblyMetadata, setAssemblyMetadata] = useState<any>(null);

  // 1. Get assembly info
  const { data: assemblyInfo, isLoading: infoLoading } = useScaffoldContractRead({
    contractName: "Assembly",
    functionName: "getInfo",
    address: assemblyAddress,
  });

  // 2. Check if user is admin
  const { data: isAdmin } = useScaffoldContractRead({
    contractName: "Assembly",
    functionName: "isAdmin",
    address: assemblyAddress,
    args: [userAddress],
    query: { enabled: isConnected },
  });

  // 3. Get all contests
  const { data: allContests } = useScaffoldContractRead({
    contractName: "Assembly",
    functionName: "getAllContests",
    address: assemblyAddress,
  });

  // 4. Get active contests
  const { data: activeContests } = useScaffoldContractRead({
    contractName: "Assembly",
    functionName: "getActiveContests",
    address: assemblyAddress,
  });

  // 5. Get passports contract address
  const passportsAddress = assemblyInfo?.[0] as `0x${string}`;

  // 6. Get next token ID to know how many passport types exist
  const { data: nextTokenId } = useScaffoldContractRead({
    contractName: "AssemblyPassports",
    functionName: "nextTokenId",
    address: passportsAddress,
    query: { enabled: !!passportsAddress },
  });

  // 7. Get passport types info
  const passportTypeIds = Array.from(
    { length: Number(nextTokenId || 0) - 1 },
    (_, i) => i + 1
  );

  const { data: passportTypesData } = useReadContracts({
    contracts: passportTypeIds.map(id => ({
      address: passportsAddress,
      abi: AssemblyPassportsABI,
      functionName: 'passportTypes',
      args: [BigInt(id)],
    })),
    query: { enabled: !!passportsAddress && passportTypeIds.length > 0 },
  });

  // 8. Check which passports user holds
  const { data: userPassports } = useReadContracts({
    contracts: passportTypeIds.map(id => ({
      address: passportsAddress,
      abi: AssemblyPassportsABI,
      functionName: 'balanceOf',
      args: [userAddress, BigInt(id)],
    })),
    query: { enabled: isConnected && !!passportsAddress && passportTypeIds.length > 0 },
  });

  // 9. Get contest details for each contest
  const { data: contestsData } = useReadContracts({
    contracts: (allContests || []).flatMap((contestAddr: string) => [
      {
        address: contestAddr as `0x${string}`,
        abi: ContestABI,
        functionName: 'prompt',
      },
      {
        address: contestAddr as `0x${string}`,
        abi: ContestABI,
        functionName: 'isActive',
      },
      {
        address: contestAddr as `0x${string}`,
        abi: ContestABI,
        functionName: 'totalVotes',
      },
      {
        address: contestAddr as `0x${string}`,
        abi: ContestABI,
        functionName: 'votingEnd',
      },
      {
        address: contestAddr as `0x${string}`,
        abi: ContestABI,
        functionName: 'getOptions',
      },
    ]),
    query: { enabled: !!allContests && allContests.length > 0 },
  });

  // 10. Process contest data
  const contests = useMemo(() => {
    if (!allContests || !contestsData) return [];
    
    return allContests.map((addr: string, index: number) => {
      const baseIndex = index * 5;
      return {
        address: addr,
        prompt: contestsData[baseIndex]?.result,
        isActive: contestsData[baseIndex + 1]?.result,
        totalVotes: contestsData[baseIndex + 2]?.result,
        votingEnd: contestsData[baseIndex + 3]?.result,
        options: contestsData[baseIndex + 4]?.result,
      };
    });
  }, [allContests, contestsData]);

  // 11. Fetch assembly metadata
  useEffect(() => {
    if (!assemblyInfo) return;
    
    const fetchMetadata = async () => {
      const metadataURI = assemblyInfo[1];
      const metadata = await fetchFromIPFS(metadataURI);
      setAssemblyMetadata(metadata);
    };
    
    fetchMetadata();
  }, [assemblyInfo]);

  // 12. Process passport types
  const passportTypes = useMemo(() => {
    if (!passportTypesData || !userPassports) return [];
    
    return passportTypesData.map((data, index) => {
      const tokenId = index + 1;
      const userBalance = userPassports[index]?.result || 0n;
      
      return {
        tokenId,
        name: data.result?.[0],
        uri: data.result?.[1],
        isOpen: data.result?.[2],
        exists: data.result?.[3],
        userHolds: userBalance > 0n,
      };
    }).filter(p => p.exists);
  }, [passportTypesData, userPassports]);

  if (infoLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Header */}
      <div className="header">
        {assemblyMetadata?.image && (
          <img src={convertIPFSUrl(assemblyMetadata.image)} alt={assemblyMetadata.name} />
        )}
        <h1>{assemblyMetadata?.name || 'Loading...'}</h1>
        <p>{assemblyMetadata?.description}</p>
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <AdminPanel assemblyAddress={assemblyAddress} />
      )}

      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setActiveTab('contests')} data-active={activeTab === 'contests'}>
          CONTESTS
        </button>
        <button onClick={() => setActiveTab('passports')} data-active={activeTab === 'passports'}>
          PASSPORTS
        </button>
        <button onClick={() => setActiveTab('members')} data-active={activeTab === 'members'}>
          MEMBERS
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'contests' && (
        <ContestsTab
          contests={contests}
          assemblyAddress={assemblyAddress}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === 'passports' && (
        <PassportsTab
          passportTypes={passportTypes}
          passportsAddress={passportsAddress}
          userAddress={userAddress}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === 'members' && (
        <MembersTab
          passportsAddress={passportsAddress}
          passportTypes={passportTypes}
        />
      )}
    </div>
  );
}
```

### Contests Tab Component

```typescript
// components/ContestsTab.tsx

function ContestsTab({ contests, assemblyAddress, isAdmin }: ContestsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sort: active first, then by end time
  const sortedContests = useMemo(() => {
    return [...contests].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return Number(b.votingEnd) - Number(a.votingEnd);
    });
  }, [contests]);

  return (
    <div>
      <div className="header">
        <h2>
          CONTESTS ({contests.length} total, {contests.filter(c => c.isActive).length} active)
        </h2>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)}>
            + CREATE CONTEST
          </button>
        )}
      </div>

      <div className="contest-list">
        {sortedContests.map((contest) => (
          <ContestCard key={contest.address} contest={contest} />
        ))}
      </div>

      {showCreateModal && (
        <CreateContestModal
          assemblyAddress={assemblyAddress}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
```

### Passports Tab Component

```typescript
// components/PassportsTab.tsx

function PassportsTab({ passportTypes, passportsAddress, userAddress, isAdmin }: PassportsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div>
      <h2>PASSPORT TYPES ({passportTypes.length})</h2>

      {isAdmin && (
        <button onClick={() => setShowCreateModal(true)}>
          + CREATE PASSPORT TYPE
        </button>
      )}

      <div className="passport-grid">
        {passportTypes.map((passport) => (
          <PassportCard
            key={passport.tokenId}
            passport={passport}
            passportsAddress={passportsAddress}
            userAddress={userAddress}
          />
        ))}
      </div>

      {showCreateModal && (
        <CreatePassportTypeModal
          assemblyAddress={assemblyAddress}
          passportsAddress={passportsAddress}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
```

### Passport Card with Mint Function

```typescript
// components/PassportCard.tsx

function PassportCard({ passport, passportsAddress, userAddress }: PassportCardProps) {
  // Check if user can mint
  const { data: canMint } = useScaffoldContractRead({
    contractName: "AssemblyPassports",
    functionName: "allowlist",
    address: passportsAddress,
    args: [BigInt(passport.tokenId), userAddress],
    query: { enabled: !passport.isOpen && !!userAddress },
  });

  // Mint function
  const { writeAsync: mint, isPending } = useScaffoldContractWrite({
    contractName: "AssemblyPassports",
    functionName: "mint",
    address: passportsAddress,
    args: [BigInt(passport.tokenId)],
    onBlockConfirmation: () => {
      // Show success toast
      // Refresh data
    },
  });

  const handleMint = async () => {
    try {
      await mint();
    } catch (error) {
      console.error('Failed to mint passport:', error);
      // Show error toast
    }
  };

  const isEligible = passport.isOpen || canMint;

  return (
    <div className="passport-card">
      <h3>🎫 {passport.name}</h3>
      <p>{passport.isOpen ? 'Open minting' : 'Allowlist only'}</p>

      {passport.userHolds ? (
        <div className="badge">✓ YOU HOLD THIS</div>
      ) : isEligible ? (
        <button onClick={handleMint} disabled={isPending}>
          {isPending ? 'MINTING...' : 'MINT'}
        </button>
      ) : (
        <div className="not-eligible">NOT ELIGIBLE</div>
      )}
    </div>
  );
}
```

---

## PAGE 5: CREATE CONTEST MODAL

### Implementation

```typescript
// components/CreateContestModal.tsx

import { useState, useMemo } from 'react';
import { useScaffoldContractWrite, useScaffoldContractRead } from '@/hooks/scaffold-eth';

interface CreateContestModalProps {
  assemblyAddress: `0x${string}`;
  onClose: () => void;
}

export default function CreateContestModal({ assemblyAddress, onClose }: CreateContestModalProps) {
  const [formData, setFormData] = useState({
    prompt: '',
    options: ['', ''],
    durationDays: 7,
    durationHours: 0,
    votingMode: 'open' as 'open' | 'gated',
    requiredPassports: [] as number[],
  });

  // 1. Get passports address
  const { data: assemblyInfo } = useScaffoldContractRead({
    contractName: "Assembly",
    functionName: "getInfo",
    address: assemblyAddress,
  });

  const passportsAddress = assemblyInfo?.[0] as `0x${string}`;

  // 2. Get available passport types
  const { data: nextTokenId } = useScaffoldContractRead({
    contractName: "AssemblyPassports",
    functionName: "nextTokenId",
    address: passportsAddress,
    query: { enabled: !!passportsAddress },
  });

  const passportTypeIds = Array.from(
    { length: Number(nextTokenId || 0) - 1 },
    (_, i) => i + 1
  );

  const { data: passportTypesData } = useReadContracts({
    contracts: passportTypeIds.map(id => ({
      address: passportsAddress,
      abi: AssemblyPassportsABI,
      functionName: 'passportTypes',
      args: [BigInt(id)],
    })),
    query: { enabled: !!passportsAddress && passportTypeIds.length > 0 },
  });

  const passportTypes = useMemo(() => {
    if (!passportTypesData) return [];
    return passportTypesData
      .map((data, index) => ({
        tokenId: index + 1,
        name: data.result?.[0],
        exists: data.result?.[3],
      }))
      .filter(p => p.exists);
  }, [passportTypesData]);

  // 3. Handle options
  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({
        ...formData,
        options: [...formData.options, ''],
      });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  // 4. Calculate duration in seconds
  const durationInSeconds = useMemo(() => {
    return (formData.durationDays * 24 * 60 * 60) + (formData.durationHours * 60 * 60);
  }, [formData.durationDays, formData.durationHours]);

  // 5. Validation
  const isValid = useMemo(() => {
    return (
      formData.prompt.length >= 10 &&
      formData.prompt.length <= 200 &&
      formData.options.length >= 2 &&
      formData.options.every(opt => opt.trim().length > 0) &&
      durationInSeconds >= 3600 && // Min 1 hour
      (formData.votingMode === 'open' || formData.requiredPassports.length > 0)
    );
  }, [formData, durationInSeconds]);

  // 6. Create contest
  const { writeAsync: createContest, isPending } = useScaffoldContractWrite({
    contractName: "Assembly",
    functionName: "createContest",
    address: assemblyAddress,
    onBlockConfirmation: (txnReceipt) => {
      // Parse ContestCreated event
      const contestCreatedEvent = txnReceipt.logs.find(
        log => {
          try {
            const parsed = AssemblyABI.find(
              item => item.type === 'event' && item.name === 'ContestCreated'
            );
            return log.topics[0] === getEventSignature('ContestCreated');
          } catch {
            return false;
          }
        }
      );

      if (contestCreatedEvent) {
        const contestAddress = `0x${contestCreatedEvent.topics[1].slice(26)}`;
        router.push(`/contest/${contestAddress}`);
      }

      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    try {
      const requiredPassportsBigInt = formData.votingMode === 'gated'
        ? formData.requiredPassports.map(id => BigInt(id))
        : [];

      await createContest({
        args: [
          formData.prompt,
          formData.options,
          BigInt(durationInSeconds),
          requiredPassportsBigInt,
        ],
      });
    } catch (error) {
      console.error('Failed to create contest:', error);
      // Show error toast
    }
  };

  // 7. Handle passport selection
  const togglePassport = (tokenId: number) => {
    setFormData({
      ...formData,
      requiredPassports: formData.requiredPassports.includes(tokenId)
        ? formData.requiredPassports.filter(id => id !== tokenId)
        : [...formData.requiredPassports, tokenId],
    });
  };

  return (
    <div className="modal">
      <h2>CREATE CONTEST</h2>

      <form onSubmit={handleSubmit}>
        {/* Prompt */}
        <div>
          <label>PROMPT *</label>
          <input
            type="text"
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            placeholder="What question are you asking?"
            minLength={10}
            maxLength={200}
            required
          />
          <small>{formData.prompt.length}/200</small>
        </div>

        {/* Options */}
        <div>
          <label>OPTIONS *</label>
          {formData.options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                required
              />
              {formData.options.length > 2 && (
                <button type="button" onClick={() => removeOption(index)}>×</button>
              )}
            </div>
          ))}
          {formData.options.length < 10 && (
            <button type="button" onClick={addOption}>+ ADD OPTION</button>
          )}
          <small>{formData.options.length}/10 options</small>
        </div>

        {/* Duration */}
        <div>
          <label>VOTING DURATION *</label>
          <div className="duration-inputs">
            <input
              type="number"
              value={formData.durationDays}
              onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <span>Days</span>
            <input
              type="number"
              value={formData.durationHours}
              onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value) || 0 })}
              min={0}
              max={23}
            />
            <span>Hours</span>
          </div>
          <div className="presets">
            <button type="button" onClick={() => setFormData({ ...formData, durationDays: 1, durationHours: 0 })}>
              1d
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, durationDays: 3, durationHours: 0 })}>
              3d
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, durationDays: 7, durationHours: 0 })}>
              7d
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, durationDays: 30, durationHours: 0 })}>
              30d
            </button>
          </div>
          <small>Ends: {new Date(Date.now() + durationInSeconds * 1000).toLocaleString()}</small>
        </div>

        {/* Voting Mode */}
        <div>
          <label>WHO CAN VOTE?</label>
          <div>
            <label>
              <input
                type="radio"
                value="open"
                checked={formData.votingMode === 'open'}
                onChange={() => setFormData({ ...formData, votingMode: 'open', requiredPassports: [] })}
              />
              Anyone (open voting)
            </label>
            <label>
              <input
                type="radio"
                value="gated"
                checked={formData.votingMode === 'gated'}
                onChange={() => setFormData({ ...formData, votingMode: 'gated' })}
              />
              Passport holders only
            </label>
          </div>
        </div>

        {/* Passport Selection */}
        {formData.votingMode === 'gated' && (
          <div>
            <label>REQUIRED PASSPORTS</label>
            <p className="helper-text">Voters need ANY of the selected passports</p>
            {passportTypes.map((passport) => (
              <label key={passport.tokenId}>
                <input
                  type="checkbox"
                  checked={formData.requiredPassports.includes(passport.tokenId)}
                  onChange={() => togglePassport(passport.tokenId)}
                />
                {passport.name}
              </label>
            ))}
            {formData.requiredPassports.length === 0 && (
              <small className="error">Select at least one passport</small>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="preview">
          <h3>PREVIEW</h3>
          <div className="contest-card-preview">
            <p>{formData.prompt || 'Prompt text'}</p>
            <ul>
              {formData.options.filter(o => o).map((opt, i) => (
                <li key={i}>• {opt}</li>
              ))}
            </ul>
            <p>Ends in {formData.durationDays}d {formData.durationHours}h</p>
            {formData.votingMode === 'gated' && <p>🔒 Passport required</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="actions">
          <button type="button" onClick={onClose}>
            CANCEL
          </button>
          <button type="submit" disabled={!isValid || isPending}>
            {isPending ? 'CREATING...' : 'CREATE CONTEST'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## PAGE 6: CONTEST DETAIL

### Implementation

```typescript
// app/contest/[address]/page.tsx

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScaffoldContractRead, useScaffoldContractWrite } from '@/hooks/scaffold-eth';
import { useAccount } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contestAddress = params.address as `0x${string}`;
  const { address: userAddress, isConnected } = useAccount();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // 1. Get contest data
  const { data: prompt } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "prompt",
    address: contestAddress,
  });

  const { data: options } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "getOptions",
    address: contestAddress,
  });

  const { data: isActive } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "isActive",
    address: contestAddress,
  });

  const { data: votingEnd } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "votingEnd",
    address: contestAddress,
  });

  const { data: totalVotes } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "totalVotes",
    address: contestAddress,
  });

  const { data: requiredPassports } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "getRequiredPassports",
    address: contestAddress,
  });

  const { data: sourceAssembly } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "sourceAssembly",
    address: contestAddress,
  });

  const { data: passportsAddress } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "passports",
    address: contestAddress,
  });

  // 2. Check user status
  const { data: hasVoted } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "hasVoted",
    address: contestAddress,
    args: [userAddress],
    query: { enabled: isConnected },
  });

  const { data: userVote } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "userVote",
    address: contestAddress,
    args: [userAddress],
    query: { enabled: isConnected && hasVoted },
  });

  const { data: canVote } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "canVote",
    address: contestAddress,
    args: [userAddress],
    query: { enabled: isConnected },
  });

  // 3. Get results (works for both active and ended)
  const { data: results, refetch: refetchResults } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "getResults",
    address: contestAddress,
  });

  const [optionNames, votes, total] = results || [[], [], 0n];

  // 4. Get winner (only if ended)
  const { data: winner } = useScaffoldContractRead({
    contractName: "Contest",
    functionName: "getWinner",
    address: contestAddress,
    query: { enabled: !isActive },
  });

  // 5. Check if user has required passports
  const isGated = requiredPassports && requiredPassports.length > 0;

  const { data: holdsRequiredPassport } = useScaffoldContractRead({
    contractName: "AssemblyPassports",
    functionName: "holdsAnyPassport",
    address: passportsAddress,
    args: [userAddress, requiredPassports || []],
    query: { enabled: isConnected && isGated },
  });

  // 6. Get passport type names for display
  const { data: passportTypesData } = useReadContracts({
    contracts: (requiredPassports || []).map((id: bigint) => ({
      address: passportsAddress,
      abi: AssemblyPassportsABI,
      functionName: 'passportTypes',
      args: [id],
    })),
    query: { enabled: isGated },
  });

  const requiredPassportNames = useMemo(() => {
    if (!passportTypesData) return [];
    return passportTypesData.map(data => data.result?.[0]).filter(Boolean);
  }, [passportTypesData]);

  // 7. Vote function
  const { writeAsync: vote, isPending: isVoting } = useScaffoldContractWrite({
    contractName: "Contest",
    functionName: "vote",
    address: contestAddress,
    onBlockConfirmation: () => {
      refetchResults();
      // Show success toast
    },
  });

  const handleVote = async () => {
    if (selectedOption === null) return;

    // Confirmation
    const confirmed = window.confirm(
      `You're voting for "${options?.[selectedOption]}". This action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    try {
      await vote({
        args: [BigInt(selectedOption)],
      });
    } catch (error) {
      console.error('Failed to vote:', error);
      // Show error toast
    }
  };

  // 8. Format time
  const timeText = useMemo(() => {
    if (!votingEnd) return '';
    
    const endDate = new Date(Number(votingEnd) * 1000);
    
    if (isActive) {
      return `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    } else {
      return `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    }
  }, [votingEnd, isActive]);

  // 9. Process results for visualization
  const processedResults = useMemo(() => {
    if (!optionNames || !votes) return [];

    const totalVotesNum = Number(total);

    return optionNames.map((name, index) => ({
      name,
      votes: Number(votes[index]),
      percentage: totalVotesNum > 0 ? (Number(votes[index]) / totalVotesNum) * 100 : 0,
      isWinner: winner && Number(winner[0]) === index,
    })).sort((a, b) => b.votes - a.votes); // Sort by votes descending
  }, [optionNames, votes, total, winner]);

  return (
    <div>
      {/* Back navigation */}
      <button onClick={() => router.push(`/assembly/${sourceAssembly}`)}>
        ← Back to Assembly
      </button>

      {/* Header */}
      <div className="header">
        <h1>{prompt}</h1>
        <div className="meta">
          <span className={`status ${isActive ? 'active' : 'ended'}`}>
            {isActive ? 'ACTIVE' : 'ENDED'}
          </span>
          <span>{timeText}</span>
          <span>{totalVotes?.toString()} votes cast</span>
          {isGated && (
            <span>🔒 Requires: {requiredPassportNames.join(' OR ')}</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isActive ? (
        // ACTIVE CONTEST VIEW
        <div>
          {!isConnected ? (
            // Not connected
            <div className="message">
              <p>Connect your wallet to vote</p>
              <button onClick={() => /* trigger wallet connect */}>
                CONNECT WALLET
              </button>
            </div>
          ) : hasVoted ? (
            // Already voted
            <div className="voted-message">
              <h2>✓ YOU VOTED</h2>
              <p>Your choice: {options?.[Number(userVote)]}</p>
              <p>Results will be visible when voting ends</p>
            </div>
          ) : !canVote ? (
            // Cannot vote (needs passport)
            <div className="cannot-vote-message">
              <h2>⚠️ You need a passport to vote</h2>
              <p>Required: {requiredPassportNames.join(' OR ')}</p>
              <button onClick={() => router.push(`/assembly/${sourceAssembly}?tab=passports`)}>
                VIEW PASSPORTS
              </button>
            </div>
          ) : (
            // Can vote
            <div className="voting-form">
              <h2>YOUR VOTE</h2>
              <div className="options">
                {options?.map((option, index) => (
                  <label key={index} className="option-radio">
                    <input
                      type="radio"
                      name="vote"
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleVote}
                disabled={selectedOption === null || isVoting}
              >
                {isVoting ? 'VOTING...' : 'CAST VOTE'}
              </button>
            </div>
          )}
        </div>
      ) : (
        // ENDED CONTEST VIEW - RESULTS
        <div className="results">
          <h2>RESULTS</h2>
          <div className="results-list">
            {processedResults.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-header">
                  {result.isWinner && <span className="winner-badge">🏆</span>}
                  <span className="option-name">{result.name}</span>
                </div>
                <div className="result-stats">
                  <span>{result.votes} votes ({result.percentage.toFixed(1)}%)</span>
                </div>
                <div className="result-bar">
                  <div
                    className="result-bar-fill"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {hasVoted && (
            <div className="user-vote-highlight">
              <p>YOUR VOTE: {options?.[Number(userVote)]}</p>
              {winner && Number(userVote) === Number(winner[0]) && (
                <p>✓ Your choice won!</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Real-Time Updates

```typescript
// hooks/useContestCountdown.ts

import { useState, useEffect } from 'react';

export function useContestCountdown(votingEnd: bigint | undefined) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!votingEnd) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const end = Number(votingEnd);
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Ended');
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [votingEnd]);

  return timeRemaining;
}
```

---

## PAGE 7: CREATE PASSPORT TYPE MODAL

### Implementation

```typescript
// components/CreatePassportTypeModal.tsx

import { useState } from 'react';
import { useScaffoldContractWrite } from '@/hooks/scaffold-eth';
import { uploadToIPFS, uploadImageToIPFS } from '@/utils/ipfs';

interface CreatePassportTypeModalProps {
  assemblyAddress: `0x${string}`;
  passportsAddress: `0x${string}`;
  onClose: () => void;
}

export default function CreatePassportTypeModal({
  assemblyAddress,
  passportsAddress,
  onClose
}: CreatePassportTypeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null,
    isOpen: true,
    allowlist: [''] as string[],
  });

  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle allowlist management
  const addAllowlistAddress = () => {
    setFormData({
      ...formData,
      allowlist: [...formData.allowlist, ''],
    });
  };

  const removeAllowlistAddress = (index: number) => {
    setFormData({
      ...formData,
      allowlist: formData.allowlist.filter((_, i) => i !== index),
    });
  };

  const updateAllowlistAddress = (index: number, value: string) => {
    const newAllowlist = [...formData.allowlist];
    newAllowlist[index] = value;
    setFormData({ ...formData, allowlist: newAllowlist });
  };

  // Handle CSV upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header if present
      const addresses = lines
        .slice(lines[0].toLowerCase().includes('address') ? 1 : 0)
        .map(line => line.trim())
        .filter(addr => addr.startsWith('0x'));

      setFormData({
        ...formData,
        allowlist: addresses,
      });
    };
    reader.readAsText(file);
  };

  // Validate addresses
  const validateAddresses = (addresses: string[]): string[] => {
    return addresses.filter(addr => {
      return addr.match(/^0x[a-fA-F0-9]{40}$/);
    });
  };

  // 1. Create passport type
  const { writeAsync: createPassportType, isPending: isCreating } = useScaffoldContractWrite({
    contractName: "Assembly",
    functionName: "createPassportType",
    address: assemblyAddress,
  });

  // 2. Add to allowlist (if needed)
  const { writeAsync: addToAllowlist, isPending: isAddingAllowlist } = useScaffoldContractWrite({
    contractName: "Assembly",
    functionName: "addToPassportAllowlist",
    address: assemblyAddress,
  });

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsUploading(true);

      // 1. Upload image if provided
      let imageURI = '';
      if (formData.image) {
        imageURI = await uploadImageToIPFS(formData.image);
      }

      // 2. Create metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imageURI,
        attributes: [
          { trait_type: 'Type', value: formData.name },
          { trait_type: 'Minting', value: formData.isOpen ? 'Open' : 'Allowlist' },
        ],
      };

      // 3. Upload metadata
      const metadataURI = await uploadToIPFS(metadata);

      setIsUploading(false);

      // 4. Create passport type
      const tx = await createPassportType({
        args: [formData.name, metadataURI, formData.isOpen],
      });

      // Wait for confirmation to get token ID
      const receipt = await tx.wait();

      // Parse PassportTypeCreated event to get token ID
      const passportCreatedEvent = receipt.logs.find(
        log => log.topics[0] === getEventSignature('PassportTypeCreated')
      );

      if (!passportCreatedEvent) {
        throw new Error('Failed to get passport token ID');
      }

      const tokenId = BigInt(passportCreatedEvent.topics[1]);

      // 5. If allowlist mode, add addresses
      if (!formData.isOpen && formData.allowlist.length > 0) {
        const validAddresses = validateAddresses(formData.allowlist);
        
        if (validAddresses.length > 0) {
          await addToAllowlist({
            args: [tokenId, validAddresses],
          });
        }
      }

      // Success!
      onClose();
      // Show success toast
      
    } catch (error) {
      console.error('Failed to create passport type:', error);
      setIsUploading(false);
      // Show error toast
    }
  };

  const validAllowlistAddresses = formData.allowlist.filter(addr => 
    addr.match(/^0x[a-fA-F0-9]{40}$/)
  );

  const isValid = 
    formData.name.trim().length > 0 &&
    formData.name.length <= 30 &&
    (!formData.isOpen ? validAllowlistAddresses.length > 0 : true);

  return (
    <div className="modal">
      <h2>CREATE PASSPORT TYPE</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>PASSPORT NAME *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Member, Contributor, Core Team"
            required
            maxLength={30}
          />
        </div>

        <div>
          <label>DESCRIPTION</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this role"
            maxLength={200}
            rows={3}
          />
        </div>

        <div>
          <label>IMAGE</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="preview-image" />
          )}
          <small>Recommended: 500x500px</small>
        </div>

        <div>
          <label>MINTING MODE *</label>
          <label>
            <input
              type="radio"
              checked={formData.isOpen}
              onChange={() => setFormData({ ...formData, isOpen: true, allowlist: [''] })}
            />
            Open - Anyone can mint
          </label>
          <label>
            <input
              type="radio"
              checked={!formData.isOpen}
              onChange={() => setFormData({ ...formData, isOpen: false })}
            />
            Allowlist - Only approved addresses
          </label>
        </div>

        {!formData.isOpen && (
          <div>
            <label>INITIAL ALLOWLIST</label>
            {formData.allowlist.map((address, index) => (
              <div key={index} className="allowlist-row">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => updateAllowlistAddress(index, e.target.value)}
                  placeholder="0x..."
                  pattern="^0x[a-fA-F0-9]{40}$"
                />
                <button type="button" onClick={() => removeAllowlistAddress(index)}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addAllowlistAddress}>
              + ADD ADDRESS
            </button>
            <div>
              <label htmlFor="csv-upload">Or UPLOAD CSV</label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
              />
            </div>
            <small>{validAllowlistAddresses.length} valid addresses</small>
          </div>
        )}

        <div className="preview">
          <h3>PREVIEW</h3>
          <div className="passport-card-preview">
            {imagePreview && <img src={imagePreview} alt="Preview" />}
            <p>{formData.name || 'Passport Name'}</p>
            <p>{formData.isOpen ? 'Open minting' : 'Allowlist only'}</p>
          </div>
        </div>

        <div className="actions">
          <button type="button" onClick={onClose}>
            CANCEL
          </button>
          <button
            type="submit"
            disabled={!isValid || isPending || isUploading || isAddingAllowlist}
          >
            {isUploading ? 'UPLOADING...' :
             isCreating ? 'CREATING...' :
             isAddingAllowlist ? 'ADDING ALLOWLIST...' :
             'CREATE PASSPORT TYPE'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## HELPER UTILITIES

### IPFS Upload Functions

```typescript
// utils/ipfs.ts

export async function uploadImageToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET!,
      },
      body: formData,
    });

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Failed to upload image to IPFS:', error);
    throw error;
  }
}

export function convertIPFSUrl(uri: string): string {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return uri;
}
```

### Address Formatting

```typescript
// utils/format.ts

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}
```

### Event Listener Hook

```typescript
// hooks/useContractEvent.ts

import { useEffect } from 'react';
import { useWatchContractEvent } from 'wagmi';

export function useVoteCastEvent(contestAddress: `0x${string}`, callback: () => void) {
  useWatchContractEvent({
    address: contestAddress,
    abi: ContestABI,
    eventName: 'VoteCast',
    onLogs() {
      callback();
    },
  });
}
```

This comprehensive guide provides all the contract integration code needed to build the Agora frontend. Each page has detailed implementations with proper hooks, error handling, and state management.
