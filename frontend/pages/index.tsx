import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import Head from 'next/head';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    }
  }
}

interface Certificate {
  name: string;
  institution: string;
  issueDate: number;
  ipfsHash: string;
  isVerified: boolean;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address"
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string"
      },
      {
        indexed: false,
        internalType: "string",
        name: "institution",
        type: "string"
      },
      {
        indexed: false,
        internalType: "string",
        name: "ipfsHash",
        type: "string"
      }
    ],
    name: "CertificateIssued",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address"
      }
    ],
    name: "addIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "getCertificateDetails",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string"
      },
      {
        internalType: "string",
        name: "institution",
        type: "string"
      },
      {
        internalType: "uint256",
        name: "issueDate",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "ipfsHash",
        type: "string"
      },
      {
        internalType: "bool",
        name: "isVerified",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address"
      }
    ],
    name: "isAuthorizedIssuer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address"
      },
      {
        internalType: "string",
        name: "name",
        type: "string"
      },
      {
        internalType: "string",
        name: "institution",
        type: "string"
      },
      {
        internalType: "string",
        name: "ipfsHash",
        type: "string"
      },
      {
        internalType: "string",
        name: "metadataURI",
        type: "string"
      }
    ],
    name: "issueCertificate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address"
      }
    ],
    name: "removeIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4"
      }
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [certificateDetails, setCertificateDetails] = useState<Certificate | null>(null);
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [issuedCertificateId, setIssuedCertificateId] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [formData, setFormData] = useState({
    recipientAddress: '',
    name: '',
    institution: '',
    file: null as File | null,
  });

  useEffect(() => {
    // Reset connection state on each load
    setConnected(false);
    setAccount('');

    const checkMetaMask = async () => {
      if (typeof window !== 'undefined') {
        const ethereum = window.ethereum;
        if (ethereum && ethereum.isMetaMask) {
          setHasMetaMask(true);
          // Check if there are connected accounts
          try {
            const accounts = await ethereum.request({
              method: 'eth_accounts'
            });
            
            // Even if there are saved accounts, force user to connect manually
            setConnected(false);
            setAccount('');
          } catch (error) {
            console.log("Error checking accounts:", error);
            setConnected(false);
            setAccount('');
          }
        } else {
          setHasMetaMask(false);
          setConnected(false);
          setAccount('');
        }
      }
    };
    
    checkMetaMask();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setConnected(false);
        setAccount('');
        // Redirect user to login page when disconnected
        window.location.reload();
      } else {
        setAccount(accounts[0]);
        setConnected(true);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', () => {
        setConnected(false);
        setAccount('');
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', () => {
          setConnected(false);
          setAccount('');
        });
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!hasMetaMask) {
      alert("Please install MetaMask! Visit https://metamask.io/");
      return;
    }

    try {
      const accounts = await window.ethereum?.request({
        method: "eth_requestAccounts",
      });
      
      if (accounts && accounts[0]) {
        setAccount(accounts[0]);
        setConnected(true);
      } else {
        setConnected(false);
        setAccount('');
        alert("Please connect to MetaMask.");
      }
    } catch (error: any) {
      setConnected(false);
      setAccount('');
      if (error.code === 4001) {
        alert("Please connect to MetaMask.");
      } else {
        console.error("Error connecting to MetaMask:", error);
        alert("Error connecting to MetaMask. Please try again.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const uploadToIPFS = async (file: File) => {
    try {
      console.log("Starting IPFS upload...");
      
      const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
      
      if (!pinataApiKey || !pinataSecretKey) {
        throw new Error("Pinata API keys are not configured");
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Pinata
      const response = await axios({
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        data: formData,
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey,
          'Content-Type': 'multipart/form-data'
        },
        maxBodyLength: Infinity
      });

      console.log("File uploaded to IPFS with CID:", response.data.IpfsHash);
      return response.data.IpfsHash;
    } catch (error: any) {
      console.error("Error uploading to IPFS:", error.response?.data || error.message);
      throw error;
    }
  };

  const generateNFTMetadata = async (name: string, institution: string, ipfsHash: string) => {
    console.log("\nGenerating NFT metadata for:", { name, institution, ipfsHash });
    
    // Build image URL using IPFS public gateway
    const imageUrl = "https://gateway.pinata.cloud/ipfs/".concat(ipfsHash);
    
    // Metadata in OpenSea format
    const metadata = {
      name: `${institution} Certificate - ${name}`,
      description: `Educational certificate issued by ${institution} to ${name}`,
      image: imageUrl,
      external_url: `https://testnets.opensea.io/assets/sepolia/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`,
      attributes: [
        {
          trait_type: "Institution",
          value: institution
        },
        {
          trait_type: "Student Name",
          value: name
        },
        {
          trait_type: "Issue Date",
          value: new Date().toISOString()
        }
      ]
    };

    console.log("Created metadata:", metadata);
    return metadata;
  };

  const uploadMetadataToIPFS = async (metadata: any) => {
    try {
      // Create metadata file
      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const metadataFile = new File([blob], 'metadata.json');
      
      // Upload metadata to IPFS
      console.log("Uploading metadata to IPFS...");
      const metadataCid = await uploadToIPFS(metadataFile);
      console.log("✅ Metadata uploaded to IPFS with CID:", metadataCid);
      
      // Check if metadata is accessible
      const metadataUrl = "https://gateway.pinata.cloud/ipfs/".concat(metadataCid);
      console.log("Metadata URL:", metadataUrl);

      // Wait a bit to ensure metadata is available
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      return metadataCid;
    } catch (error) {
      console.error("Error uploading metadata:", error);
      throw error;
    }
  };

  const addNFTToMetaMask = async (tokenId: string, ipfsCid?: string) => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
        throw new Error("Contract address is not configured!");
      }

      // Build parameters for wallet_watchAsset
      const params = {
        type: 'ERC721',
        options: {
          address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          tokenId: tokenId
        }
      };

      console.log("Adding NFT to MetaMask with params:", params);

      // Add NFT to MetaMask
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [params]
      });

      const openSeaUrl = `https://testnets.opensea.io/assets/sepolia/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${tokenId}`;
      console.log("NFT added to MetaMask successfully!");
      console.log("OpenSea URL:", openSeaUrl);
      
      alert(`NFT added to MetaMask! You can also view it on OpenSea:
${openSeaUrl}

If it doesn't appear in MetaMask, you can add it manually:
1. Open MetaMask
2. Click "Import NFTs"
3. Enter:
   Contract Address: ${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}
   Token ID: ${tokenId}`);

      if (confirm("Would you like to view the NFT on OpenSea?")) {
        window.open(openSeaUrl, '_blank');
      }
    } catch (error) {
      console.error("Error adding NFT to MetaMask:", error);
      alert(`To add the NFT manually to MetaMask:
1. Open MetaMask
2. Click "Import NFTs"
3. Enter:
   Contract Address: ${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}
   Token ID: ${tokenId}`);
    }
  };

  const issueCertificate = async (recipientAddress: string, name: string, institution: string, metadataCid: string) => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      // Ensure address is in correct format
      const formattedAddress = ethers.getAddress(recipientAddress);
      console.log("\n🔍 ADDRESS VERIFICATION:");
      console.log("Recipient address (original):", recipientAddress);
      console.log("Recipient address (formatted):", formattedAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("Signer address (you):", signerAddress);

      if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
        throw new Error("Contract address is not configured!");
      }

      // Initialize contract
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Build metadataURI using CID
      const metadataURI = `ipfs://${metadataCid}`;
      console.log("\n📝 CERTIFICATE PARAMETERS:");
      console.log({
        recipientAddress: formattedAddress,
        name,
        institution,
        ipfsHash: metadataCid,
        metadataURI
      });

      // Build data for issueCertificate function
      const functionData = contract.interface.encodeFunctionData("issueCertificate", [
        formattedAddress,  // recipient
        name,             // name
        institution,      // institution
        metadataCid,     // ipfsHash
        metadataURI      // metadataURI
      ]);

      console.log("\n🚀 SENDING TRANSACTION...");
      console.log("Contract address:", process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
      console.log("Function data:", functionData);

      // Build transaction
      const transactionRequest = {
        to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        from: signerAddress,
        data: functionData,
        value: "0x0"  // No ETH sent
      };

      // Send transaction through MetaMask
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionRequest],
      });

      console.log("Transaction hash:", txHash);
      
      console.log("\n⏳ Waiting for transaction confirmation...");
      const receipt = await provider.waitForTransaction(txHash);

      if (!receipt) {
        throw new Error("Transaction confirmation not received");
      }

      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

      // Check CertificateIssued event
      const certificateIssuedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.name === "CertificateIssued";
        } catch {
          return false;
        }
      });

      if (!certificateIssuedEvent) {
        throw new Error("Could not find CertificateIssued event in logs");
      }

      const parsedEvent = contract.interface.parseLog(certificateIssuedEvent);
      if (!parsedEvent) {
        throw new Error("Could not parse event");
      }

      const tokenId = parsedEvent.args[0].toString();
      const recipient = parsedEvent.args[1];
      const eventName = parsedEvent.args[2];
      const eventInstitution = parsedEvent.args[3];

      console.log("\n✅ EVENT FOUND:");
      console.log("Token ID:", tokenId);
      console.log("Recipient:", recipient);
      console.log("Name:", eventName);
      console.log("Institution:", eventInstitution);

      setIssuedCertificateId(tokenId);

      // Show a message with instructions
      alert(`Certificate issued successfully!
Token ID: ${tokenId}
Recipient: ${formattedAddress}

To add the NFT to MetaMask:
1. Open NFTs tab
2. Click "Import NFT"
3. Enter these details:
   Contract address: ${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}
   Token ID: ${tokenId}

You can view the certificate on OpenSea:
https://testnets.opensea.io/assets/sepolia/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${tokenId}`);

      // Try to add NFT automatically to MetaMask
      await addNFTToMetaMask(tokenId, metadataCid);

      return {
        transactionHash: txHash,
        blockNumber: receipt.blockNumber,
        tokenId: tokenId,
        tokenURI: metadataURI,
        recipient: formattedAddress
      };
    } catch (error: any) {
      console.error("Error issuing certificate:", error);
      alert(error.message || "Error issuing certificate. Please try again.");
      throw error;
    }
  };

  const handleIssueCertificate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIssuingCertificate(true);

    try {
      console.log("Starting certificate issuance process...");
      console.log("Recipient address:", formData.recipientAddress);

      // Upload certificate image
      console.log("Uploading certificate image...");
      if (!formData.file) {
        throw new Error("No file selected");
      }
      const imageCid = await uploadToIPFS(formData.file);
      console.log("✅ Certificate image uploaded, CID:", imageCid);

      // Generate and upload NFT metadata
      console.log("Generating and uploading NFT metadata...");
      const metadata = await generateNFTMetadata(
        formData.name,
        formData.institution,
        imageCid
      );
      const metadataCid = await uploadMetadataToIPFS(metadata);

      // Issue certificate
      console.log("Issuing certificate on blockchain...");
      const result = await issueCertificate(
        formData.recipientAddress,
        formData.name,
        formData.institution,
        metadataCid
      );
      console.log("✅ Certificate issued successfully:", result);

      // Reset form
      setFormData({
        recipientAddress: '',
        name: '',
        institution: '',
        file: null,
      });
      
    } catch (error: any) {
      console.error("❌ Error in certificate issuance process:", error);
      alert(error.message || "Error issuing certificate. Please try again.");
    } finally {
      setIssuingCertificate(false);
    }
  };

  const verifyCertificate = async (certificateId: string) => {
    try {
      console.log("Verifying certificate with ID:", certificateId);
      
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        CONTRACT_ABI,
        provider
      );

      // Convert certificateId to BigNumber to ensure correct format
      const certId = ethers.toBigInt(certificateId);
      console.log("Calling contract with ID:", certId.toString());

      const result = await contract.getCertificateDetails(certId);
      console.log("Certificate details:", result);

      if (!result) {
        alert("Certificate not found!");
        return;
      }

      const [recipient, name, institution, cid] = result;
      
      alert(`Certificate verified successfully!
Details:
- Recipient: ${recipient}
- Name: ${name}
- Institution: ${institution}
- IPFS CID: ${cid}`);

    } catch (error) {
      console.error("Error verifying certificate:", error);
      alert("Error verifying certificate. Please check console for more details.");
    }
  };

  const handleLogout = async () => {
    setConnected(false);
    setAccount('');
    setIssuedCertificateId(null);
    // Refresh page to reset complete state
    window.location.reload();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-[#F8F9FB]'}`}>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex justify-between items-center px-8 py-4">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.jpg" alt="EduChain" className="w-10 h-10" />
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : ''}`}>EduChain</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Blockchain Certificate Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100'}`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* User Menu */}
              {!hasMetaMask ? (
                <a 
                  href="https://metamask.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Install MetaMask
                </a>
              ) : !connected || !account ? (
                <button
                  onClick={connectWallet}
                  className="btn btn-primary"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">Connected</p>
                    <p className="text-sm text-gray-500">{account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {!connected ? (
            // Landing page when not connected
            <div className="max-w-6xl mx-auto">
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-12 mb-12 text-white relative overflow-hidden">
                <div className="max-w-2xl relative z-10">
                  <h1 className="text-5xl font-bold mb-6">Transform Education with Blockchain Technology</h1>
                  <p className="text-xl mb-8 opacity-90">Issue and verify educational certificates as unique NFTs on the blockchain. Secure, immutable, and instantly verifiable.</p>
                  <button
                    onClick={connectWallet}
                    className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    Get Started with MetaMask
                  </button>
                </div>
                <img src="/assets/hero-image.svg" alt="Hero" className="absolute right-0 top-0 h-full object-cover opacity-30" />
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white p-8 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 00-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Secure & Immutable</h3>
                  <p className="text-gray-600">Certificates are stored on the blockchain, making them tamper-proof and permanently verifiable.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Instant Verification</h3>
                  <p className="text-gray-600">Verify certificates instantly with just a certificate ID. No more waiting for manual verification.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">NFT Technology</h3>
                  <p className="text-gray-600">Each certificate is a unique NFT, providing proof of ownership and easy transfer capabilities.</p>
                </div>
              </div>

              {/* How It Works Section */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
                <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">Connect Wallet</h3>
                    <p className="text-gray-600">Connect your MetaMask wallet to get started</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">Issue Certificate</h3>
                    <p className="text-gray-600">Fill in the details and upload the certificate</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">Mint NFT</h3>
                    <p className="text-gray-600">The certificate is minted as a unique NFT</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">4</span>
                    </div>
                    <h3 className="font-semibold mb-2">Verify Anytime</h3>
                    <p className="text-gray-600">Instantly verify certificates using their ID</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Certificate sections when connected
            <>
              {/* Hero Banner simplificat */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
                <div className="max-w-lg">
                  <h1 className="text-4xl font-bold mb-4">EduChain NFT Certificates</h1>
                  <p className="mb-6">Issue and verify educational certificates as unique NFTs on the blockchain.</p>
                </div>
                <img src="/assets/hero-image.svg" alt="Hero" className="absolute right-0 bottom-0 h-full object-cover opacity-50" />
              </div>

              {/* Main Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Issue Certificate Section */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                  <h2 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : ''}`}>Issue Certificate</h2>
                  <div className="space-y-4">
                    <div>
                      <label className={`block mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Recipient Address</label>
                      <input
                        type="text"
                        name="recipientAddress"
                        value={formData.recipientAddress}
                        onChange={handleInputChange}
                        className={`input w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-300'
                        }`}
                        placeholder="0x..."
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`input w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Institution</label>
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution}
                        onChange={handleInputChange}
                        className={`input w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Institution Name"
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Certificate File</label>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className={`input w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <button
                      onClick={handleIssueCertificate}
                      disabled={issuingCertificate}
                      className={`w-full px-4 py-2 rounded-lg font-medium ${
                        darkMode
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {issuingCertificate ? 'Issuing...' : 'Issue Certificate'}
                    </button>
                  </div>
                </div>

                {/* Verify Certificate Section */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
                  <h2 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : ''}`}>Verify Certificate</h2>
                  <div className="space-y-4">
                    <div>
                      <label className={`block mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Certificate ID</label>
                      <input
                        type="text"
                        value={certificateId}
                        onChange={(e) => setCertificateId(e.target.value)}
                        className={`input w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter certificate ID"
                      />
                    </div>
                    <button
                      onClick={() => verifyCertificate(certificateId)}
                      disabled={loading}
                      className={`w-full px-4 py-2 rounded-lg font-medium ${
                        darkMode
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {loading ? 'Verifying...' : 'Verify Certificate'}
                    </button>
                  </div>

                  {issuedCertificateId && (
                    <div className={`mt-6 p-4 rounded-lg ${
                      darkMode ? 'bg-green-900/20' : 'bg-green-50'
                    }`}>
                      <h3 className={`font-semibold text-lg mb-2 ${
                        darkMode ? 'text-green-400' : 'text-green-800'
                      }`}>Certificate Issued Successfully!</h3>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        Certificate ID: <span className="font-mono">{issuedCertificateId}</span>
                      </p>
                      <p className={`text-sm mt-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Save this ID to verify the certificate later.</p>
                      <button
                        onClick={() => addNFTToMetaMask(issuedCertificateId)}
                        className={`mt-4 px-4 py-2 rounded-lg flex items-center ${
                          darkMode
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <img src="/assets/metamask-fox.svg" alt="MetaMask" className="w-5 h-5 mr-2" />
                        Add to MetaMask
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        <footer className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-t'}`}>
          <div className="container mx-auto px-8 py-4">
            <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Created with ❤️ by <span className="font-semibold">CosNea</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
} 