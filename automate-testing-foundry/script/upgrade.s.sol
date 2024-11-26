// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test, console} from "forge-std/Test.sol";
interface Proxy{
    function upgradeTo(address newImplementation) external;
}
contract newIMPL{
    struct AddressSlot {
        address value;
    }
    event Upgraded(address indexed newImplementation);
    uint public immutable x;
    constructor(uint _x) public{
        x = _x;
    }
    function proxiableUUID() external returns(bytes32){
        return 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    }
    function upgradeTo(address newImpl) external{
        bytes32 slot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        getAddressSlot(slot).value = newImpl;
        emit Upgraded(newImpl);
    }
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }
}

contract UpgradeScript is Script, Test {
    address public newImplementation;
    bool public changeByteCodeEverytime = true;
    function setUp() public {
        vm.startBroadcast(0x88517740B86F3eBF4C7a9aC5808B4986b289f9AD);
        uint x = 1;
        if(changeByteCodeEverytime){
            x = block.timestamp;
        }
        newImplementation = address(new newIMPL(x));
        vm.stopBroadcast();
    }

    function run() public {
        vm.startBroadcast(0x88517740B86F3eBF4C7a9aC5808B4986b289f9AD);

        Proxy(0xAFfb7705552705eda9e31b53c83FAa69C0b0ffE2).upgradeTo(newImplementation);
        vm.stopBroadcast();
    }
}
