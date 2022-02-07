const networkInfo = {
  MAINNET: {
    // TODO: Mainnet not here yet
  },
  TESTNET: {
    VITE: 'wss://buidl.vite.net/gvite/ws',
    BSC: 'wss://speedy-nodes-nyc.moralis.io/68f77d726d550db1ccab7dea/bsc/testnet/archive/ws'
  }
}

const contractAbis = {
  MAINNET: {
    // TODO: Mainnet not here yet
  },
  TESTNET: {
    VITE: [{ inputs: [{ internalType: 'tokenId', name: '_tid', type: 'tokenId' }, { internalType: 'address payable[]', name: '_keepers', type: 'address[]' }, { internalType: 'uint8', name: '_threshold', type: 'uint8' }], stateMutability: 'payable', type: 'constructor' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'bytes32', name: 'id', type: 'bytes32' }], name: 'Approved', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'index', type: 'uint256' }, { indexed: false, internalType: 'bytes32', name: 'id', type: 'bytes32' }, { indexed: false, internalType: 'bytes', name: 'dest', type: 'bytes' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }, { indexed: false, internalType: 'address payable', name: 'from', type: 'address' }], name: 'Input', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'bytes32', name: 'id', type: 'bytes32' }, { indexed: false, internalType: 'bytes32', name: 'sigR', type: 'bytes32' }, { indexed: false, internalType: 'bytes32', name: 'sigS', type: 'bytes32' }, { indexed: false, internalType: 'uint8', name: 'sigV', type: 'uint8' }], name: 'InputProved', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'uint256', name: 'index', type: 'uint256' }, { indexed: false, internalType: 'bytes32', name: 'id', type: 'bytes32' }, { indexed: false, internalType: 'address payable', name: 'dest', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'Output', type: 'event' }, { executionBehavior: 'async', inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }, { internalType: 'address payable', name: 'dest', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'approveAndExecOutput', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { executionBehavior: 'async', inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }], name: 'approveOutput', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { executionBehavior: 'async', inputs: [{ internalType: 'bytes', name: 'dest', type: 'bytes' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'input', outputs: [], stateMutability: 'payable', type: 'function' }, { executionBehavior: 'async', inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }, { internalType: 'address payable', name: 'dest', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'output', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { executionBehavior: 'async', inputs: [{ internalType: 'uint8', name: 'sigV', type: 'uint8' }, { internalType: 'bytes32', name: 'sigR', type: 'bytes32' }, { internalType: 'bytes32', name: 'sigS', type: 'bytes32' }, { internalType: 'bytes32', name: 'id', type: 'bytes32' }], name: 'proveInputId', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { executionBehavior: 'sync', inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], name: 'approvedCnt', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }, { internalType: 'address payable', name: '', type: 'address' }], name: 'approvedKeepers', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], name: 'blockedOutputIds', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [], name: 'inputIndex', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }, { internalType: 'address payable', name: '', type: 'address' }], name: 'inputProvedKeepers', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [{ internalType: 'address payable', name: '', type: 'address' }], name: 'keepers', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [], name: 'outputIndex', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [], name: 'prevInputId', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [], name: 'prevOutputId', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [], name: 'threshold', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'offchain' }, { executionBehavior: 'sync', inputs: [], name: 'tid', outputs: [{ internalType: 'tokenId', name: '', type: 'tokenId' }], stateMutability: 'view', type: 'offchain' }],
    BSC: [{ inputs: [{ internalType: 'contract IERC20', name: '_token', type: 'address' }, { internalType: 'contract IKeeper', name: '_keeper', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'uint256', name: 'index', type: 'uint256' }, { indexed: false, internalType: 'bytes32', name: 'id', type: 'bytes32' }, { indexed: false, internalType: 'bytes', name: 'dest', type: 'bytes' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }, { indexed: false, internalType: 'address', name: 'from', type: 'address' }], name: 'Input', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'uint256', name: 'index', type: 'uint256' }, { indexed: false, internalType: 'bytes32', name: 'id', type: 'bytes32' }, { indexed: false, internalType: 'address', name: 'dest', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'Output', type: 'event' }, { inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], name: 'blockedOutputIds', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'bytes', name: 'dest', type: 'bytes' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'input', outputs: [], stateMutability: 'payable', type: 'function' }, { inputs: [], name: 'inputIndex', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'keeper', outputs: [{ internalType: 'contract IKeeper', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }, { internalType: 'address payable', name: 'dest', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'output', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'outputIndex', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'prevInputId', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'prevOutputId', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }], name: 'spent', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'token', outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { stateMutability: 'payable', type: 'receive' }]
  }
}

const channels = {
  MAINNET: [
    // TODO: Mainnet not here yet
  ],
  TESTNET: {
    VITE: [
      {
        address: 'vite_029b2a33f03a39009f96f141b7e1ae52c73830844f3b9804e8',
        tokenSymbol: 'VITE',
        tokenDecimals: 18
      },
      {
        address: 'vite_9c337fe9a8d4828c80de00d5c3432f62c3dece4ac9062aa008',
        tokenSymbol: 'USDV',
        tokenDecimals: 18
      }
    ],
    BSC: [
      {
        address: '0xea52147b9b1d2bf069da858efe78bb2ac3dc2ea0',
        tokenSymbol: 'VITE',
        tokenDecimals: 18
      },
      {
        address: '0x1ff7efed79585d43fb1c637064480e10c21db709',
        tokenSymbol: 'USDV',
        tokenDecimals: 18
      }
    ]
  }
}