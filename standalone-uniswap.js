const { ethers} = require("ethers");

async function main() {
// Initialize provider
  const provider = new ethers.JsonRpcProvider("https://cloudflare-eth.com/");
// Uniswap address
  let uniswapPoolAddress = "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11";

// Calling storage directly instead of using ABI. 
// Batching requests for faster results.
  const requests = [
    {
      jsonrpc: "2.0",
      method: "eth_getStorageAt",
      params: [uniswapPoolAddress, "0x06", "latest"], // Token0 
      id: 1,
    },
    {
        jsonrpc: "2.0",
        method: "eth_getStorageAt",
        params: [uniswapPoolAddress, "0x07", "latest"], // Token1
        id: 1,
    },
    {
        jsonrpc: "2.0",
        method: "eth_getStorageAt",
        params: [uniswapPoolAddress, "0x08", "latest"], // BlockTimestamp + Reserve1 + Reserve0 
        id: 1,
    },
  ];
  let token0, token1, reserve0, reserve1;

  // Get uniswap tokens and balances without abi
  await provider._send(requests).then((results) => {
    token0 = '0x' + results[0].result.slice(-40);
    token1 = '0x' + results[1].result.slice(-40);
    reserve1 = '0x'+results[2].result.slice(10,38); // Get reserve1 of token1
    reserve0 = '0x'+results[2].result.slice(38,66); // Get reserve0 of token0
  });

  // Call decimals for the tokens 
  let ERC20StandardAbi = [
    "function decimals() external view returns(uint256)",
    "function balanceOf(address) external view returns(uint256)",
    "function symbol() external view returns(string memory)"
  ]
  let token0Contract = new ethers.Contract(token0, ERC20StandardAbi, provider);
  let token1Contract = token0Contract.attach(token1);
  
  console.log("------------------------------");
  console.log("UniswapV2 pool address: ", uniswapPoolAddress);

  console.log("Token0 :");
  console.log(" -- Address: ", token0);
  console.log(" -- Symbol: ", await token0Contract.symbol());
  console.log(" -- Reserve: ", String(BigInt(reserve0))/String(BigInt(10)**(await token0Contract.decimals())));
  console.log("Token1 :");
  console.log(" -- Address: ", token1);
  console.log(" -- Symbol: ", await token1Contract.symbol());
  console.log(" -- Reserve: ", String(BigInt(reserve1))/String(BigInt(10)**(await token1Contract.decimals())));

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
