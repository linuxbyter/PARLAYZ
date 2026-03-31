export const PARLAYZ_MARKET_ABI = [
  {
    "inputs": [{"internalType": "address","name":"_usdt","type":"address"},{"internalType": "address","name":"_adminResolver","type":"address"},{"internalType": "address","name":"_cryptoOracle","type":"address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "uint256","name":"marketId","type":"uint256"},{"internalType": "string","name":"title","type":"string"},{"internalType": "string","name":"category","type":"string"},{"internalType": "string[]","name":"outcomes","type":"string[]"},{"internalType": "uint256","name":"closesAt","type":"uint256"},{"internalType": "bool","name":"isCrypto","type":"bool"},{"internalType": "uint256","name":"strikePrice","type":"uint256"}],
    "name": "createMarket",
    "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name":"marketId","type":"uint256"},{"internalType": "uint8","name":"outcomeIndex","type":"uint8"},{"internalType": "uint256","name":"amount","type":"uint256"}],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name":"marketId","type":"uint256"},{"internalType": "uint8","name":"outcomeIndex","type":"uint8"},{"internalType": "uint256","name":"price","type":"uint256"},{"internalType": "uint256","name":"timestamp","type":"uint256"},{"internalType": "bytes","name":"signature","type":"bytes"}],
    "name": "settleCryptoMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name":"marketId","type":"uint256"},{"internalType": "uint8","name":"outcomeIndex","type":"uint8"},{"internalType": "uint256","name":"timestamp","type":"uint256"},{"internalType": "bytes","name":"signature","type":"bytes"}],
    "name": "settleManualMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name":"marketId","type":"uint256"},{"internalType": "uint256","name":"betIndex","type":"uint256"}],
    "name": "claimWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name":"marketId","type":"uint256"}],
    "name": "getMarket",
    "outputs": [{"internalType": "string","name":"title","type":"string"},{"internalType": "string","name":"category","type":"string"},{"internalType": "string[]","name":"outcomes","type":"string[]"},{"internalType": "uint256","name":"closesAt","type":"uint256"},{"internalType": "bool","name":"resolved","type":"bool"},{"internalType": "uint8","name":"winningOutcome","type":"uint8"},{"internalType": "uint256","name":"totalPool","type":"uint256"},{"internalType": "bool","name":"isCrypto","type":"bool"},{"internalType": "uint256","name":"strikePrice","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name":"marketId","type":"uint256"}],
    "name": "getBetCount",
    "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "marketCount",
    "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "USDT",
    "outputs": [{"internalType": "address","name":"","type":"address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "uint256","name":"marketId","type":"uint256"},{"indexed": true,"internalType": "address","name":"bettor","type":"address"},{"indexed": false,"internalType": "uint8","name":"outcomeIndex","type":"uint8"},{"indexed": false,"internalType": "uint256","name":"amount","type":"uint256"}],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true,"internalType": "uint256","name":"marketId","type":"uint256"},{"indexed": false,"internalType": "uint8","name":"winningOutcome","type":"uint8"},{"indexed": false,"internalType": "uint256","name":"totalPool","type":"uint256"},{"indexed": false,"internalType": "string","name":"method","type":"string"}],
    "name": "MarketResolved",
    "type": "event"
  }
] as const
