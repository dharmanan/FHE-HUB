# FHEVM Sepolia (Relayer SDK) Deployment Guide

## Gereksinimler

1. **Testnet Ethereum**: Sepolia ETH'niz olmalı (faucet'lerden alabilirsiniz)
2. **Private Key**: Deploy için kullanacağınız cüzdan private key'i
3. **FHEVM Access**: Zama FHEVM testnet'e erişim

## Kurulum Adımları

### 1. Environment Variables Ayarlama

`.env` dosyası oluşturun (`.env.example` dosyasından kopyalayabilirsiniz):

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
PRIVATE_KEY=your_actual_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Frontend (browser) config (optional overrides)
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_RELAYER_URL=https://relayer.testnet.zama.org
```

⚠️ **DİKKAT**: `.env` dosyasını asla git'e commit etmeyin!

Not: Public contract adreslerini `.env`/`.env.local` içine yazmıyoruz.
Deploy script otomatik olarak şu dosyaları günceller (commitlenebilir):

- `frontend/lib/deployments.json`
- `frontend/DEPLOYMENTS.md`

### 2. Dependencies Kurulumu

```bash
npm install
```

### 3. Contract'ı Compile Etme

```bash
npx hardhat compile
```

### 4. Sepolia'ya Deploy

```bash
npx hardhat run scripts/deploy-fhevm-sepolia.ts --network sepolia
```

## Network Yapılandırması

Projenizde şu network'ler yapılandırılmış durumda:

- **hardhat**: Local development network
- **localhost**: Local Hardhat node (port 8545)
- **sepolia**: Ethereum Sepolia testnet
- **sepolia**: Ethereum Sepolia testnet (FHEVM host chain)

## FHEVM Sepolia (Relayer SDK) Bilgileri

- **Host Chain ID (Sepolia)**: 11155111
- **Relayer**: varsayılan `https://relayer.testnet.zama.org`
- **RPC**: varsayılan `https://ethereum-sepolia-rpc.publicnode.com`

Not: Gateway chain id ve doğrulayıcı sözleşme adresleri SDK'nın `SepoliaConfig` objesinde gömülü geliyor.

## Test Deployment

Deploy işleminden önce local test yapmak için:

```bash
npx hardhat test
```

## Troubleshooting

### Insufficient Funds Hatası

Cüzdanınızda yeterli Sepolia ETH olduğundan emin olun. Faucet'lerden alabilirsiniz:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### Gateway Connection Hatası

FHEVM Gateway URL'in doğru olduğundan emin olun:
```env
GATEWAY_URL=https://gateway.devnet.zama.ai
```

### Contract Verification

Deploy edilen contract'ı verify etmek için:
```bash
npx hardhat verify --network fhevmSepolia <CONTRACT_ADDRESS>
```

## Relayer Kullanımı

Frontend tarafında relayer SDK başlatma [frontend/lib/fhevm.ts](frontend/lib/fhevm.ts) içinde `SepoliaConfig` ile yapılıyor.

## Daha Fazla Bilgi

- [Zama FHEVM Docs](https://docs.zama.org/)
- [FHEVM Hardhat Plugin](https://docs.zama.org/fhevm/guides/hardhat)
- [FHEVM Examples](https://github.com/zama-ai/fhevm)
