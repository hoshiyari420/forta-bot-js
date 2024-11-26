## Uniswap contract data

Without fetching ABI from the etherscan. 

```
node ./standalone-uniswap.js 
```

# Proxy upgrade implementation bot

## Description

This bot detects upgrade events for targeted proxy addresses.

## Supported Chains

- Ethereum
- Other EVM chains

## Not Supported Proxy ... yet
- Diamond proxy


## Alerts

Describe each of the type of alerts fired by this bot

- Initialization : Implementation not matched
  - Fired during initialization to update the targeted proxy address data to ensure it's upto date. 
  - Severity is always set to "HIGH" 
  - Type is always set to "info"
  - Metadata - targeted proxy address, new Implementation address, new bytecode hash, extra info if found.

- Implementation upgraded
  - Fired when a targeted proxy contract is upgraded with a new implementation and a new bytecode. 
  - Severity is always set to "HIGH" 
  - Type is always set to "info"
  - Metadata - targeted proxy address, new Implementation address, new bytecode hash, extra info if found.

## Configuration : 

- Add target proxy contracts in the ./proxy-addresses.json
```
{
    "contracts":{
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9":{
        "name":"AAVE",
        "currentImplementationAddress":"0xa606dd423df7dfb65efe14ab66f5fdebf62ff583",
        "currentCodehash":"0x"
    },
    "<NEW CONTRACT>":{
        "name":"",
        "currentImplementationAddress":"",
        "currentCodehash":"0x"
    },
    }
}
```

## Test Data

The bot behaviour can be verified with the following transactions:

- 0x36cee31ee3406355358825b5731c11f9f35494bce893bf2c36d17235e9256f92 (AAVE Proxy contract)

## Test
### 1. Local test 

```
- npm run test
```

### 2. Manual test on forked chain on a particular upgrade transaction

```
- export FORTA_CHAIN_ID=1
- npm run tx 0x36cee31ee3406355358825b5731c11f9f35494bce893bf2c36d17235e9256f92 --chainId 1 // AAVE 

```

### 3. Manual test on forked chain on a particular block

```
- export FORTA_CHAIN_ID=1
- forta-bot run --block 16852321
```

### 4. Automated testing - Work in progress

1. Start anvil on current fork : 
```
 anvil --fork-url https://cloudflare-eth.com/ --auto-impersonate
```
Let's assume anvil is running on local url : http://127.0.0.1:8545
2. Update JSON-RPC url in the bot or forta.config.js with the local url
In bot.js :
```
  let rpcUrl = "https://cloudflare-eth.com/"; ==> let rpcUrl = "http://127.0.0.1:8545";
```
3. Run the bot in another terminal
```
npm run start
```
4. Run foundry script that updates the contracts using prank in ./automate-testing-foundry
```
forge script UpgradeScript --rpc-url http://127.0.0.1:8545 --broadcast --unlocked 0x88517740B86F3eBF4C7a9aC5808B4986b289f9AD
```

5. Check the finding on the active terminal of the bot by running script multiple times
- You can also update `changeByteCodeEverytime` variable in `UpgradeScript` to check for false positives.