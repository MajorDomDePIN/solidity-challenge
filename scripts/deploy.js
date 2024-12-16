require("dotenv").config({ path: require("find-config")(".env") });
const hre = require("hardhat");

async function main() {
  // Beispiel: Auslesen des PRIVATE_KEY Schlüssels aus der .env-Datei
  const privateKey = process.env.PRIVATE_KEY;

  // Sicherstellen, dass PRIVATE_KEY definiert ist
  if (!privateKey) {
    throw new Error("Bitte definieren Sie PRIVATE_KEY in Ihrer .env-Datei.");
  }

  // Hier beginnt die Logik für das Deployment
  const ethPool = await hre.ethers.getContractFactory("ETHPool").deploy();

  await ethPool.deployed();

  console.log(
    `ETHPool deployed to ${ethPool.address}` // Die korrekte Eigenschaft ist `address`, nicht `target`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
