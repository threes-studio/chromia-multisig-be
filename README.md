# Chromia MultiSig Backend

Backend service for Chromia MultiSig application, providing authentication and multi-signature transaction management functionality on the Chromia platform.

## Key Features

- ETH wallet authentication
- Multi-signature account management
- Multi-signature transaction processing
- Asset and transaction fee management
- Chromia blockchain integration

## System Requirements

- Node.js >= 20
- MongoDB >= 4.4

## Installation

1. Clone repository:
```bash
git clone https://github.com/threes-studio/chromia-multisig-be.git
cd chromia-multisig-be
```

2. Install dependencies:
```bash
yarn install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:

## Development

1. Run server in development mode:
```bash
yarn dev
```

2. Check code style:
```bash
yarn lint
```

## Build and Deploy

1. Build application:
```bash
yarn build
```

2. Run built application:
```bash
yarn start
```

## Directory Structure

```
src/
├── components/           # Feature modules
│   ├── auth/            # User authentication
│   ├── transactions/    # Transaction processing
│   └── multisig-accounts/ # Multi-signature account management
├── core/                # Core functionality
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

## Technologies Used

- Node.js & Express
- TypeScript
- MongoDB
- Redis
- JWT Authentication
- Ethers.js
- Chromia SDK

## Contributing

1. Fork repository
2. Create new branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

