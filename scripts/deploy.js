const hre = require("hardhat");

async function main() {
  const EduChain = await hre.ethers.getContractFactory("EduChain");
  const eduChain = await EduChain.deploy();

  await eduChain.waitForDeployment();

  console.log("EduChain deployed to:", await eduChain.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 