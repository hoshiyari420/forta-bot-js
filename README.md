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


- 1. Start anvil on current fork
- 2. Update JSON-RPC url in the bot or forta.config.js with the local url
- 3. Run the bot in another terminal
- 4. Run foundry script that updates the contracts using prank in ./automate-testing-foundry
- 5. Check the finding on the active terminal of the bot