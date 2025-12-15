# �️ Agora - Onchain Governance Made Simple

<h4 align="center">
  Make decisions with your community. Create groups, issue memberships, run votes. All onchain.
</h4>

**Agora** is a simple, transparent governance platform for anyone. No tokens required.

Built on **Scaffold-ETH 2** with **NextJS**, **RainbowKit**, **Hardhat**, **Wagmi**, **Viem**, and **TypeScript**.

## Features

- 👥 **Create Groups** - Start a governance group with a name, description, and image
- 🎫 **Issue Membership Passes** - Create different membership types with open or allowlist minting
- 🗳️ **Run Votes** - Create questions, propose options, and vote (with optional membership gating)
- 📊 **Real-time Results** - See voting results update in real-time as votes are cast
- 🔐 **Onchain** - Everything stored transparently on the blockchain, no centralized control
- ♻️ **Reusable** - Deploy as many groups and votes as you want from a single factory contract

## Technology Stack

- **Frontend**: Next.js 13+ with TypeScript and Tailwind CSS
- **Web3**: wagmi, RainbowKit, viem for wallet connection and contract interaction
- **Smart Contracts**: Solidity with Hardhat (or Foundry)
- **Storage**: IPFS for metadata (group info, images, etc.)
- **Styling**: Tailwind CSS + daisyUI components

## Smart Contracts

The Agora protocol consists of:

- **AgoraFactory** - Creates and manages group deployments
- **Assembly** - Individual governance group with admin functions
- **AssemblyPassports** - ERC1155 token contracts for membership passes
- **Contest** - Individual vote/poll with voting and result tracking

See `packages/hardhat/contracts` for full contract code.

## Getting Started

### Requirements

- [Node.js >= v20.18.3](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/getting-started/install) (v1 or v2+)
- [Git](https://git-scm.com/downloads)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd agora
```

2. Install dependencies:
```bash
yarn install
```

### Local Development

1. **Start a local blockchain** (Terminal 1):
```bash
yarn chain
```

2. **Deploy contracts** (Terminal 2):
```bash
yarn deploy
```

3. **Start the frontend** (Terminal 3):
```bash
yarn start
```

Visit `http://localhost:3000` to see the application.

### Smart Contract Development

- Edit contracts in `packages/hardhat/contracts`
- Run tests: `yarn hardhat:test`
- Deploy to testnet: `yarn deploy --network scrollSepolia`
- Verify contracts: `yarn verify --network scrollSepolia`

### Frontend Development

- Edit pages in `packages/nextjs/app`
- Edit components in `packages/nextjs/components`
- Configuration: `packages/nextjs/scaffold.config.ts`
- View styling in `packages/nextjs/styles/globals.css`

## Project Structure

```
agora/
├── packages/
│   ├── hardhat/          # Smart contracts & deployment scripts
│   │   ├── contracts/    # Solidity contracts
│   │   ├── deploy/       # Deployment scripts
│   │   └── test/         # Contract tests
│   └── nextjs/           # Frontend application
│       ├── app/          # Pages (Groups, Votes, etc.)
│       ├── components/   # React components
│       ├── hooks/        # Custom React hooks
│       ├── utils/        # Helper functions (IPFS, formatting)
│       └── public/       # Static assets
├── CONTRIBUTING.md       # Contribution guidelines
└── README.md
```

## Pages & Features

### Landing Page (`/`)
- Overview of Agora's features
- Recent groups and activity stats
- Quick access to create a group or browse groups

### Groups (`/assemblies`)
- Browse all groups on the platform
- Search by name or description
- Create new groups
- View member and vote counts

### Group Detail (`/assemblies/[id]`)
- **Votes Tab** - Create and view votes within the group
- **Memberships Tab** - Create membership types and mint passes
- **Members Tab** - See holder counts for each membership type
- Admin panel for group administrators

### Vote Detail (`/contests/[id]`)
- Vote on active proposals
- View voting results in real-time
- Share vote links
- Gated voting (membership pass required)

## Configuration

### `scaffold.config.ts`

Configure your dApp settings:

```typescript
export const scaffoldConfig = {
  targetNetworks: [scrollSepolia],
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  onlyLocalBurnerWallet: false,
  walletAutoConnect: true,
} as const satisfies ScaffoldConfig;
```

### Environment Variables

Create `.env.local` in `packages/nextjs`:

```
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wc_project_id
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret
```

## Deployment

### Deploy Smart Contracts

```bash
yarn deploy --network scrollSepolia
```

Then update contract addresses in `packages/nextjs/contracts/deployedContracts.ts`.

### Deploy Frontend

```bash
yarn vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

See [LICENCE](./LICENCE) file for details.

## Resources

- [Scaffold-ETH 2 Docs](https://docs.scaffoldeth.io)
- [wagmi Documentation](https://wagmi.sh)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org)

---

**Built with ❤️ using Scaffold-ETH 2**