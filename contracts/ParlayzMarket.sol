// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title ParlayzMarket
 * @notice Hybrid escrow market contract on Base L2
 * @dev Two settlement methods:
 *   - settleCryptoMarket(): Oracle-signed price payload (auto)
 *   - settleManualMarket(): Admin-signed outcome (EPL, culture, etc.)
 */
contract ParlayzMarket is Ownable, EIP712 {
    using ECDSA for bytes32;

    // USDT on Base
    IERC20 public immutable USDT;

    // Admin wallet for manual settlements (sports, culture)
    address public adminResolver;

    // Oracle for crypto market settlements
    address public cryptoOracle;

    // Domain separator for signature verification
    bytes32 public constant SETTLEMENT_TYPEHASH = keccak256(
        "Settlement(uint256 marketId,uint8 outcomeIndex,uint256 price,uint256 timestamp)"
    );

    struct Market {
        uint256 id;
        string title;
        string category;
        string[] outcomes;
        uint256 closesAt;
        bool resolved;
        uint8 winningOutcome;
        uint256 totalPool;
        bool isCrypto;
        uint256 strikePrice;
    }

    struct Bet {
        uint256 marketId;
        address bettor;
        uint8 outcomeIndex;
        uint256 amount;
        bool claimed;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet[]) public bets;
    mapping(address => uint256[]) public userBets;

    event MarketCreated(
        uint256 indexed marketId,
        string title,
        bool isCrypto,
        uint256 closesAt
    );

    event BetPlaced(
        uint256 indexed marketId,
        address indexed bettor,
        uint8 outcomeIndex,
        uint256 amount
    );

    event MarketResolved(
        uint256 indexed marketId,
        uint8 winningOutcome,
        uint256 totalPool,
        string method
    );

    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed bettor,
        uint256 amount
    );

    modifier onlyAdminResolver() {
        require(msg.sender == adminResolver, "Not admin resolver");
        _;
    }

    modifier onlyCryptoOracle() {
        require(msg.sender == cryptoOracle, "Not crypto oracle");
        _;
    }

    constructor(
        address _usdt,
        address _adminResolver,
        address _cryptoOracle
    ) Ownable(msg.sender) EIP712("ParlayzMarket", "1") {
        USDT = IERC20(_usdt);
        adminResolver = _adminResolver;
        cryptoOracle = _cryptoOracle;
    }

    function setAdminResolver(address _addr) external onlyOwner {
        adminResolver = _addr;
    }

    function setCryptoOracle(address _addr) external onlyOwner {
        cryptoOracle = _addr;
    }

    /**
     * @notice Create a new market
     * @param title Market description
     * @param category Market category
     * @param outcomes Possible outcomes
     * @param closesAt Unix timestamp when market closes
     * @param isCrypto Whether this is a crypto price market
     * @param strikePrice Strike price for crypto markets (0 for non-crypto)
     */
    function createMarket(
        string calldata title,
        string calldata category,
        string[] calldata outcomes,
        uint256 closesAt,
        bool isCrypto,
        uint256 strikePrice
    ) external onlyOwner returns (uint256) {
        require(outcomes.length >= 2, "Need at least 2 outcomes");
        require(closesAt > block.timestamp, "Must close in future");

        uint256 id = marketCount;
        markets[id] = Market({
            id: id,
            title: title,
            category: category,
            outcomes: outcomes,
            closesAt: closesAt,
            resolved: false,
            winningOutcome: 0,
            totalPool: 0,
            isCrypto: isCrypto,
            strikePrice: strikePrice
        });

        marketCount++;
        emit MarketCreated(id, title, isCrypto, closesAt);
        return id;
    }

    /**
     * @notice Place a bet on a market
     * @param marketId Market ID
     * @param outcomeIndex Index of chosen outcome
     * @param amount USDT amount to bet
     */
    function placeBet(
        uint256 marketId,
        uint8 outcomeIndex,
        uint256 amount
    ) external {
        require(marketId < marketCount, "Market does not exist");
        Market storage market = markets[marketId];
        require(!market.resolved, "Market already resolved");
        require(block.timestamp < market.closesAt, "Market closed");
        require(outcomeIndex < market.outcomes.length, "Invalid outcome");
        require(amount > 0, "Must bet something");

        // Transfer USDT from bettor to contract
        require(
            USDT.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );

        bets[marketId].push(Bet({
            marketId: marketId,
            bettor: msg.sender,
            outcomeIndex: outcomeIndex,
            amount: amount,
            claimed: false
        }));

        userBets[msg.sender].push(bets[marketId].length - 1);
        market.totalPool += amount;

        emit BetPlaced(marketId, msg.sender, outcomeIndex, amount);
    }

    /**
     * @notice Settle a crypto market using oracle-signed price payload
     * @dev Called by the crypto oracle after market expiry
     * @param marketId Market ID
     * @param outcomeIndex Winning outcome (0 or 1)
     * @param price Settlement price from oracle
     * @param timestamp Price timestamp
     * @param signature ECDSA signature of the settlement data
     */
    function settleCryptoMarket(
        uint256 marketId,
        uint8 outcomeIndex,
        uint256 price,
        uint256 timestamp,
        bytes calldata signature
    ) external {
        require(marketId < marketCount, "Market does not exist");
        Market storage market = markets[marketId];
        require(market.isCrypto, "Not a crypto market");
        require(!market.resolved, "Already resolved");
        require(block.timestamp >= market.closesAt, "Market not closed yet");

        // Verify oracle signature
        bytes32 structHash = keccak256(
            abi.encode(SETTLEMENT_TYPEHASH, marketId, outcomeIndex, price, timestamp)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == cryptoOracle, "Invalid oracle signature");

        _resolveMarket(marketId, outcomeIndex, "crypto_oracle");
    }

    /**
     * @notice Settle a non-crypto market using admin signature
     * @dev Called by the admin resolver wallet (MetaMask signing)
     * @param marketId Market ID
     * @param outcomeIndex Winning outcome index
     * @param timestamp Settlement timestamp
     * @param signature ECDSA signature from admin wallet
     */
    function settleManualMarket(
        uint256 marketId,
        uint8 outcomeIndex,
        uint256 timestamp,
        bytes calldata signature
    ) external {
        require(marketId < marketCount, "Market does not exist");
        Market storage market = markets[marketId];
        require(!market.isCrypto, "Use settleCryptoMarket for crypto");
        require(!market.resolved, "Already resolved");
        require(block.timestamp >= market.closesAt, "Market not closed yet");

        // Verify admin signature
        bytes32 structHash = keccak256(
            abi.encode(SETTLEMENT_TYPEHASH, marketId, outcomeIndex, 0, timestamp)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == adminResolver, "Invalid admin signature");

        _resolveMarket(marketId, outcomeIndex, "admin_resolver");
    }

    /**
     * @notice Internal resolution logic - distributes pool to winners
     */
    function _resolveMarket(
        uint256 marketId,
        uint8 outcomeIndex,
        string memory method
    ) internal {
        Market storage market = markets[marketId];
        market.resolved = true;
        market.winningOutcome = outcomeIndex;

        emit MarketResolved(marketId, outcomeIndex, market.totalPool, method);
    }

    /**
     * @notice Claim winnings after market resolution
     * @param marketId Market ID
     * @param betIndex Index of the bet in the market's bet array
     */
    function claimWinnings(uint256 marketId, uint256 betIndex) external {
        require(marketId < marketCount, "Market does not exist");
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");

        Bet storage bet = bets[marketId][betIndex];
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.claimed, "Already claimed");

        if (bet.outcomeIndex == market.winningOutcome) {
            // Calculate winner's share
            uint256 winningPool = 0;
            for (uint256 i = 0; i < bets[marketId].length; i++) {
                if (bets[marketId][i].outcomeIndex == market.winningOutcome) {
                    winningPool += bets[marketId][i].amount;
                }
            }

            require(winningPool > 0, "No winners");

            // Pro-rata share of total pool (minus 3% platform fee)
            uint256 grossPayout = (bet.amount * market.totalPool) / winningPool;
            uint256 profit = grossPayout - bet.amount;
            uint256 fee = (profit * 3) / 100;
            uint256 netPayout = grossPayout - fee;

            bet.claimed = true;

            require(
                USDT.transfer(msg.sender, netPayout),
                "USDT transfer failed"
            );

            emit WinningsClaimed(marketId, msg.sender, netPayout);
        } else {
            bet.claimed = true;
        }
    }

    /**
     * @notice Claim all winnings from multiple resolved markets
     */
    function claimAllWinnings(uint256[] calldata marketIds) external {
        for (uint256 i = 0; i < marketIds.length; i++) {
            uint256[] memory betIndices = userBets[msg.sender];
            for (uint256 j = 0; j < betIndices.length; j++) {
                Bet storage bet = bets[marketIds[i]][betIndices[j]];
                if (bet.marketId == marketIds[i] && !bet.claimed) {
                    claimWinnings(marketIds[i], betIndices[j]);
                }
            }
        }
    }

    /**
     * @notice Emergency withdraw (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }

    /**
     * @notice Get market details
     */
    function getMarket(uint256 marketId) external view returns (
        string memory title,
        string memory category,
        string[] memory outcomes,
        uint256 closesAt,
        bool resolved,
        uint8 winningOutcome,
        uint256 totalPool,
        bool isCrypto,
        uint256 strikePrice
    ) {
        Market storage m = markets[marketId];
        return (
            m.title,
            m.category,
            m.outcomes,
            m.closesAt,
            m.resolved,
            m.winningOutcome,
            m.totalPool,
            m.isCrypto,
            m.strikePrice
        );
    }

    /**
     * @notice Get bet count for a market
     */
    function getBetCount(uint256 marketId) external view returns (uint256) {
        return bets[marketId].length;
    }

    /**
     * @notice Get user's bet indices
     */
    function getUserBetIndices(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
}
