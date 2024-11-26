const {
  ethers,
  Finding,
  FindingSeverity,
  FindingType,
  scanEthereum,
  scanPolygon,
  scanAlerts,
  getProvider,
  runHealthCheck,
  
} = require("@fortanetwork/forta-bot");
const { ZeroAddress } = require("ethers");
const fs = require("fs");
let config =  require("../proxy-addresses.json");

// Load the file
//let config = JSON.parse(fs.readFileSync(fileName, "utf8"));
// ERC-1967 upgrade event. since openzeppelin-contracts@v3.1.0
const UPGRADE_EVENT = 'event Upgraded(address indexed implementation)';
let findingsCount = 0;
let _provider;
function createAlert(contract, address, newImplementation, newByteCodeHash, extraInfo) {
  return Finding.fromObject({
    name: 'Implementation upgraded',
    description: `Implementation upgraded for ${contract}`,
    alertId: 'CONTRACT UPGRADED',
    protocol: `${contract}`,
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      address,
      newImplementation,
      newByteCodeHash,
      extraInfo: JSON.stringify(extraInfo)
    },
  });
}

// Create initialization alert for implementation address not matched from the json file. 
function createInitializationAlert(contract, address, newImplementation, newBytecodeHash) {
  return Finding.fromObject({
    name: 'Initialization : Implementation not matched',
    description: `Stored contracts upgraded when offline`,
    alertId: 'CONTRACT UPGRADED',
    protocol: `${contract}`,
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      address,
      newImplementation,
      newBytecodeHash,
      extraInfo:"{}"
    },
  });
}

// Get bytecode of the the contract 
async function getByteCode(contractAddress, provider){

  return (await provider.getCode(contractAddress,"latest"));
}
// Verify change in the new implementation bytecode and check for differences of the new code. 
// We can also add more checks on the new bytecode and have mentioned below. 
async function verifyChange(newImplementation, proxyAddress, provider){
  let isDifferent = false;
  let extraInfo = {};

  let newByteCode = await getByteCode(newImplementation, provider);
  let newByteCodeHash = ethers.keccak256(newByteCode);
  let oldByteCode = await getByteCode(config.contracts[proxyAddress].currentImplementationAddress,provider);
  
  if( newByteCodeHash!= config.contracts[proxyAddress].currentCodehash){
    isDifferent = true;
  }
  // 1. To further investigate the new implementation, we can identify the function selector code:  https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-iii-the-function-selector-6a9b6886ea49 
  // and can check if any new functions are added. We can also match the function selector to backend database of function selectors For eg: openchain.xyz type database. 

  // 2. We can fully decompile the code and create few heuristics that should match the implementation standard. 
  // For eg: UUPS implementation should not be allowed to initialize again. 

  // 3. Call particular explorer API and get both new implementation source code and old implementation source code. 
  // 3.1 Compare the bytecode and create a difference file similar to upgradeHub 

 // extraInfo = checkCode(newByteCode, oldByteCode);
  return {isDifferent, newByteCodeHash, extraInfo};
}

const handleTransaction = async (txEvent, provider) => {
 
  const findings = []

  // filter the transaction logs for upgrade implementation events that contains our targeted contract. 
  const upgradeEvents = txEvent.filterLog(
    UPGRADE_EVENT,
    Object.keys(config.contracts)
  );
  // loop through each event
  for await (const upgradeEvent of upgradeEvents){
    // get implementation address
    const [newImplementation] = upgradeEvent.args;
    const proxyAddress = ethers.getAddress(upgradeEvent.address);
    const currentImplementation = config.contracts[proxyAddress].currentImplementationAddress;
    // If implementation is same, something is wrong or spam events? ignore it for now 
    if(newImplementation != currentImplementation){
      // Update config cache
      config.contracts[proxyAddress].currentImplementationAddress = newImplementation;
      // Verify the bytecode, remove the false positive where the upgraded bytecode is same.
      const res = await verifyChange(newImplementation, proxyAddress, provider);
      if(res.isDifferent){
        findingsCount++;
        findings.push(createAlert(config.contracts[proxyAddress].name, proxyAddress, newImplementation, res.newByteCodeHash, res.extraInfo));
        config.contracts[proxyAddress].currentCodehash = res.newByteCodeHash;
      }
    }
  }
  return findings;
};

// Loop through the targeted proxy addresses and get the latest implementation. 
// So ensure latest data of the proxy. 
async function initialize( config) {
  const initialFinding = []

  // Get the config and rpl url
 await Promise.all(Object.entries(config.contracts).map(
    async ([proxyAddress, data]) => {
      //1. Get Implementation address
      let implementationContract
      try{
        implementationContract =
        "0x" +
        (
          await _provider.getStorage(
            proxyAddress,
            "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc", // ERC-1967 implementation slot
            "latest"
          )
        ).slice(-40);
      }
      catch{
        console.log("Error: Initialization : Fetching implementation address");
        implementationContract = data.currentImplementationAddress
      }

      if (implementationContract != data.currentImplementationAddress && implementationContract != ZeroAddress) {

        config.contracts[proxyAddress].currentImplementationAddress = implementationContract;
        try{
        let code = await _provider.getCode(implementationContract, "latest");
        const codehash = ethers.keccak256(code);
        if(config.contracts[proxyAddress].currentCodehash !== codehash){

          config.contracts[proxyAddress].currentCodehash = codehash;
          initialFinding.push(createInitializationAlert(data.name, proxyAddress, implementationContract, codehash));
        }
        }
        catch(e){
        //findings.push(createInitializationAlert(data.name, proxyAddress, implementationContract, "0x"));
        console.log("error during initialization:", e.message);
        }
        // Tried to update the proxy-addresses.json file 
        //config.contracts.proxyAddress[currentImplementationAddress]=implementationContract;
        //fs.writeFileSync(
        //  "./extra.json",
        //  JSON.stringify(config)
        //)
      //}
    }

    }));
    console.log("Initialization successful!");
    console.log(initialFinding);
}

async function main() {
  let rpcUrl = "https://cloudflare-eth.com/"; // http://127.0.0.1:8545
  _provider = await getProvider({ rpcUrl });
  await initialize(config);
  scanEthereum({
    rpcUrl,
    handleTransaction
  });

  // scanPolygon({
  //   rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2",
  //   rpcKeyId: "d7f5e66f-0deb-4002-a52d-9b17ad254b38",
  //   localRpcUrl: "137",
  //   handleBlock,
  // });

  // scanAlerts({
  //   subscriptions: [{ botId: "0xbotId123" }],
  //   handleAlert,
  // });

  // health checks are required to run on scan nodes
  runHealthCheck();
}

// only run main() method if this file is directly invoked (vs just imported for testing)
if (require.main === module) {
  main();
}

module.exports = {
  initialize,
  handleTransaction,
  UPGRADE_EVENT,
  // handleBlock,
  // handleAlert,
  // healthCheck,
};
