import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import * as path from "path";
import * as fs from "fs";

/**
 * Deploys the Agora contract system:
 * - AgoraFactory: Factory contract for creating Assemblies
 * - Assembly Implementation: Implementation contract for cloned Assemblies
 * - Contest Implementation: Implementation contract for cloned Contests
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAgora: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🚀 Starting Agora deployment...\n");

  // Deploy Contest Implementation
  console.log("\n1️⃣  Deploying Contest Implementation...");
  const contestDeploy = await deploy("Contest", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  const contestImplementation = contestDeploy.address;
  console.log(`✅ Contest Implementation deployed to: ${contestImplementation}`);

  // Deploy Assembly Implementation
  console.log("\n2️⃣  Deploying Assembly Implementation...");
  const assemblyDeploy = await deploy("Assembly", {
    from: deployer,
    args: [deployer, "https://example.com/assembly-metadata", contestImplementation],
    log: true,
    autoMine: true,
  });
  const assemblyImplementation = assemblyDeploy.address;
  console.log(`✅ Assembly Implementation deployed to: ${assemblyImplementation}`);

  // Deploy Passport Implementation
  console.log("\n0️⃣  Deploying Passport Implementation...");
  const passportDeploy = await deploy("AssemblyPassports", {
    from: deployer,
    args: [assemblyImplementation],
    log: true,
    autoMine: true,
  });
  const passportImplementation = passportDeploy.address;
  console.log(`✅ Passport Implementation deployed to: ${passportImplementation}`);

  // Deploy AgoraFactory
  console.log("\n3️⃣  Deploying AgoraFactory...");
  const factoryDeploy = await deploy("AgoraFactory", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });
  console.log(`✅ AgoraFactory deployed to: ${factoryDeploy.address}`);

  // Verify deployment
  console.log("\n📋 Verifying deployment...");
  console.log(`Factory Info:`);
  console.log(`  - Factory Address: ${factoryDeploy.address}`);
  console.log(`  - Assembly Implementation: ${assemblyImplementation}`);
  console.log(`  - Contest Implementation: ${contestImplementation}`);

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkId = (await hre.ethers.provider.getNetwork()).chainId;

  console.log("\n============================================================");
  console.log("Deployment Summary:");
  console.log("============================================================");
  console.log(`Network: ${hre.network.name} (Chain ID: ${networkId})`);
  console.log(`Deployer: ${deployer}`);
  console.log(`Factory: ${factoryDeploy.address}`);
  console.log(`Assembly Implementation: ${assemblyImplementation}`);
  console.log(`Contest Implementation: ${contestImplementation}`);
  console.log("============================================================\n");
  console.log("Deployment complete! 🎉\n");
};

export default deployAgora;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployAgora.tags = ["Agora"];
