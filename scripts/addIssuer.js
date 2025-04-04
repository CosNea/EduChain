const hre = require("hardhat");

async function main() {
  const contractAddress = "0xfeCb3E541acB48647412488F9Ae6Ee463aBA89f6";
  const issuerAddress = "0x87Eb5fBA1e07E4fa28c8b83b5e5010f62035806b";

  console.log("Connecting to contract...");
  const EduChain = await hre.ethers.getContractFactory("EduChain");
  const contract = EduChain.attach(contractAddress);

  // Get the signer's address
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer address:", await signer.getAddress());

  // Get the contract owner
  const owner = await contract.owner();
  console.log("Contract owner:", owner);

  if (owner.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
    console.error("❌ Signer is not the contract owner!");
    return;
  }

  console.log("\nAttempting to add issuer:", issuerAddress);
  const tx = await contract.addIssuer(issuerAddress);
  console.log("Transaction hash:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("✅ Issuer added successfully!");

  // Check if the address is now authorized
  const isAuthorized = await contract.isAuthorizedIssuer(issuerAddress);
  console.log("Is authorized:", isAuthorized);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 