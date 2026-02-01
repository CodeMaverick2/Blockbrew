# BlockBrew

[![CI](https://github.com/CodeMaverick2/BlockBrew/actions/workflows/ci.yml/badge.svg)](https://github.com/CodeMaverick2/BlockBrew/actions/workflows/ci.yml)

A multi-chain blockchain transaction explorer with tax-ready CSV export. View, analyze, and export transaction history from any wallet address across 14 blockchains.

## Features

### Core Functionality
- **Multi-Chain Support**: Track transactions across Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, Solana, Bitcoin, Polkadot, Cosmos, Osmosis, Bittensor, and Ronin
- **Multi-Chain Search**: Search the same address across all EVM-compatible chains simultaneously
- **Real-Time Data**: Live transaction data fetched directly from blockchain explorers
- **Token Balances**: View ERC-20 token holdings for EVM wallets

### Transaction Management
- **Advanced Filtering**: Filter by date range, transaction type, and status
- **Expandable Details**: Click any transaction to view full details including gas, method calls, and raw data
- **Sortable Tables**: Sort by any column with pagination support
- **Search History**: Recent searches saved locally with bookmark support

### Export Options
- **Multiple Tax Formats**: Export to Awaken, Koinly, CoinTracker, or TaxBit CSV formats
- **Tax-Ready**: Properly formatted for direct import into crypto tax software

### Analytics
- **Statistics Dashboard**: Total received, sent, net flow, fees paid, transaction count
- **Visual Analytics**: Charts for gas spending, transaction frequency, and value flow over time
- **Multi-Chain Aggregation**: Combined statistics when searching multiple chains

### User Experience
- **Dark Mode**: Clean, modern dark interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **No Account Required**: Privacy-focused, runs entirely in your browser
- **Saved Addresses**: Bookmark frequently used addresses with custom labels

## Quick Start
### Installation

```bash
# Clone the repository
git clone https://github.com/CodeMaverick2/BlockBrew.git
cd blockbrew

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Supported Blockchains

### EVM Compatible (Multi-Chain Search)

| Chain | Symbol | API Source |
|-------|--------|------------|
| Ethereum | ETH | Blockscout |
| Polygon | MATIC | Blockscout |
| Arbitrum | ETH | Blockscout |
| Optimism | ETH | Blockscout |
| Base | ETH | Blockscout |
| BNB Chain | BNB | BSCScan |
| Avalanche | AVAX | Snowtrace |

### Other Networks

| Chain | Symbol | API Source |
|-------|--------|------------|
| Solana | SOL | Solana RPC |
| Bitcoin | BTC | Blockchair |
| Polkadot | DOT | Subscan |
| Cosmos | ATOM | Cosmostation |
| Osmosis | OSMO | Cosmostation |
| Bittensor | TAO | Subscan |
| Ronin | RON | Ronin Explorer |

## Export Formats

### Awaken Format
```csv
Date,Type,Sent Currency,Sent Amount,Received Currency,Received Amount,Fee Currency,Fee Amount,TX Hash,TX Src,TX Dest
```

### Koinly Format
```csv
Date,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,Net Worth Amount,Net Worth Currency,Label,Description,TxHash
```

### CoinTracker Format
```csv
Date,Received Quantity,Received Currency,Sent Quantity,Sent Currency,Fee Amount,Fee Currency,Tag
```

### TaxBit Format
```csv
Date and Time,Transaction Type,Sent Quantity,Sent Currency,Sending Source,Received Quantity,Received Currency,Receiving Destination,Fee,Fee Currency,Exchange Transaction ID,Blockchain Transaction Hash
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Data Fetching**: TanStack React Query
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
blockbrew/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── filters/            # Transaction filters
│   │   ├── address-memory/     # Saved addresses
│   │   ├── token-balances/     # Token balance display
│   │   ├── multi-chain/        # Multi-chain search UI
│   │   ├── analytics/          # Charts and analytics
│   │   ├── transaction-details/ # Expandable row details
│   │   ├── chain-selector.tsx
│   │   ├── wallet-input.tsx
│   │   ├── transaction-table.tsx
│   │   ├── stats-cards.tsx
│   │   ├── export-dropdown.tsx
│   │   ├── header.tsx
│   │   └── footer.tsx
│   ├── config/
│   │   └── chains.ts           # Blockchain configurations
│   ├── hooks/
│   │   ├── use-local-storage.ts
│   │   ├── use-address-memory.ts
│   │   ├── use-transaction-filters.ts
│   │   └── use-multi-chain-search.ts
│   ├── services/
│   │   ├── blockchain.ts       # Transaction fetchers
│   │   ├── token-balance.ts    # Token balance API
│   │   ├── csv-export.ts       # Awaken format
│   │   ├── csv-export-koinly.ts
│   │   ├── csv-export-cointracker.ts
│   │   └── csv-export-taxbit.ts
│   ├── lib/
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
│   └── chains/                 # Chain logos
├── tailwind.config.js
├── next.config.js
└── package.json
```

## Configuration

The application works without API keys using public endpoints. For production deployments with higher rate limits, you can optionally configure API keys in `.env.local`:

```env
# Optional API keys for higher rate limits
ETHERSCAN_API_KEY=your_key
POLYGONSCAN_API_KEY=your_key
BSCSCAN_API_KEY=your_key
```

See `.env.example` for all available options.

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Or use the Vercel dashboard to import the repository directly.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Other Platforms

The application can be deployed to any platform that supports Node.js:

```bash
npm run build
npm start
```

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests and linting (`npm run lint && npm run build`)
5. Commit your changes (`git commit -m 'Add your feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add TypeScript types for new code
- Test on multiple screen sizes
- Ensure no TypeScript errors (`npm run build`)

### Testing

Run chain API integration tests to verify all blockchain connections:

```bash
# Run all chain tests
npm run test:chains

# Run tests in watch mode during development
npm run test:watch

# Run all tests
npm run test
```

The test suite verifies:
- Address validation for each chain format
- Transaction fetching from all 14 supported chains
- Error handling for invalid addresses
- Graceful handling of rate limits and API failures

## License

MIT License - see LICENSE file for details.

## Author

Built by [@TejasGhatule](https://x.com/TejasGhatule)

## Acknowledgments

- [Awaken](https://awaken.tax) for CSV format specifications
- Blockchain explorer APIs: Blockscout, Etherscan, Subscan, and others
- The open source community for the tools and libraries used in this project
