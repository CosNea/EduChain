# EduChain - Blockchain Certificate Platform

EduChain is a decentralized application (dApp) that enables educational institutions to issue and verify certificates as NFTs on the blockchain. Built with Next.js, Ethereum, and IPFS, it provides a secure and transparent way to manage educational credentials.

![EduChain Platform](frontend/public/assets/logo.jpg)

## Features

- **Secure Certificate Issuance**: Issue educational certificates as unique NFTs on the Ethereum blockchain
- **Instant Verification**: Verify certificates instantly using their unique ID
- **NFT Integration**: Each certificate is minted as an NFT, providing proof of ownership
- **MetaMask Integration**: Seamless wallet connection and NFT management
- **IPFS Storage**: Certificate images and metadata stored on IPFS for decentralized access
- **Dark/Light Mode**: User-friendly interface with theme switching capability
- **Responsive Design**: Modern Web3 design that works across all devices

## Technology Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Smart Contracts**: Solidity
- **Storage**: IPFS (via Pinata)
- **Web3 Integration**: ethers.js
- **Wallet**: MetaMask

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v14 or later)
- npm or yarn
- MetaMask browser extension
- Some Sepolia ETH for testing (can be obtained from a faucet)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/educhain.git
cd educhain
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install blockchain dependencies
cd ..
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
```

4. Start the development server:
```bash
cd frontend
npm run dev
```

## Smart Contract Deployment

1. Configure Hardhat network settings in `hardhat.config.js`
2. Deploy the contract:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
3. Update the contract address in your `.env.local` file

## Usage

1. **Connect Wallet**:
   - Click "Connect Wallet" and approve the MetaMask connection

2. **Issue Certificate**:
   - Fill in recipient's address
   - Enter certificate details (name, institution)
   - Upload certificate image
   - Click "Issue Certificate" and confirm the transaction

3. **Verify Certificate**:
   - Enter the certificate ID
   - Click "Verify Certificate" to see the details

4. **View on OpenSea**:
   - After issuance, certificates can be viewed on OpenSea (Sepolia Testnet)
   - They can also be added directly to MetaMask

## Features in Detail

### Certificate Issuance
- Certificates are issued as NFTs on the Ethereum blockchain
- Each certificate contains:
  - Recipient's name
  - Institution name
  - Issue date
  - Certificate image (stored on IPFS)
  - Unique identifier

### Verification System
- Instant verification using certificate ID
- Blockchain-based proof of authenticity
- Immutable record of issuance

### NFT Integration
- ERC-721 standard compliance
- Viewable on OpenSea
- Transferable between wallets
- Custom metadata support

## Security

- Smart contract security best practices implemented
- Decentralized storage through IPFS
- MetaMask security features
- Role-based access control for certificate issuance

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Created by CosNea - [GitHub Profile](https://github.com/yourusername)

## Acknowledgments

- OpenZeppelin for smart contract libraries
- IPFS and Pinata for decentralized storage
- MetaMask for wallet integration
- OpenSea for NFT marketplace support 