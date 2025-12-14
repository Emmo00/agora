// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { IContest } from "./interfaces/IContest.sol";
import { AssemblyPassports } from "./AssemblyPassports.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Contest
 * @notice A time-bound voting mechanism for Assemblies to make decisions
 * @dev Designed to be cloned - uses initialize pattern instead of constructor
 */
contract Contest is IContest, ReentrancyGuard {
    // ============ State Variables ============

    /// @notice Maximum number of options allowed per contest
    uint256 public constant MAX_OPTIONS = 10;

    /// @notice Whether this contract has been initialized
    bool private _initialized;

    /// @notice The Assembly that created this contest
    address public assemblyAddress;

    /// @notice The passport contract for gating
    address public passports;

    /// @notice Contest prompt/question
    string public prompt;

    /// @notice Array of voting options
    string[] public options;

    /// @notice Timestamp when voting ends
    uint256 public votingEnd;

    /// @notice Required passport token IDs (empty array = open voting)
    uint256[] public requiredPassports;

    /// @notice Vote tallies: optionIndex => vote count
    mapping(uint256 => uint256) public voteTally;

    /// @notice Track who has voted: address => hasVoted
    mapping(address => bool) public hasVoted;

    /// @notice Track individual votes: address => optionIndex
    mapping(address => uint256) public userVote;

    /// @notice Total number of votes cast
    uint256 public totalVotes;

    // ============ Modifiers ============

    modifier onlyAssembly() {
        if (msg.sender != assemblyAddress) revert OnlyAssembly();
        _;
    }

    modifier votingActive() {
        if (block.timestamp >= votingEnd) revert VotingEnded();
        _;
    }

    modifier votingComplete() {
        if (block.timestamp < votingEnd) revert VotingNotEnded();
        _;
    }

    // ============ Initialization ============

    /**
     * @notice Initializes the contest (called by Assembly after cloning)
     * @param _assembly Address of the Assembly creating this contest
     * @param _passports Address of the passport contract
     * @param _prompt The question or prompt for this contest
     * @param _options Array of voting options
     * @param _votingDuration Duration of voting period in seconds
     * @param _requiredPassports Array of passport token IDs required to vote
     */
    function __init(
        address _assembly,
        address _passports,
        string memory _prompt,
        string[] memory _options,
        uint256 _votingDuration,
        uint256[] memory _requiredPassports
    ) external {
        if (_initialized) revert AlreadyInitialized();

        if (bytes(_prompt).length == 0) revert EmptyPrompt();
        if (_options.length < 2) revert NotEnoughOptions();
        if (_options.length > MAX_OPTIONS) revert TooManyOptions();
        if (_votingDuration == 0) revert InvalidVotingPeriod();

        // Validate all options are non-empty
        for (uint256 i = 0; i < _options.length; i++) {
            if (bytes(_options[i]).length == 0) revert EmptyOption();
        }

        assemblyAddress = _assembly;
        passports = _passports;
        prompt = _prompt;
        options = _options;
        votingEnd = block.timestamp + _votingDuration;
        requiredPassports = _requiredPassports;
        _initialized = true;

        emit ContestCreated(_assembly, _prompt, votingEnd, _options.length, _requiredPassports.length > 0);
    }

    // ============ Voting Functions ============

    /**
     * @notice Cast a vote for an option
     * @param optionIndex Index of the option to vote for
     */
    function vote(uint256 optionIndex) external nonReentrant votingActive {
        if (!_initialized) revert NotInitialized();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (optionIndex >= options.length) revert InvalidOption();

        // Check passport requirements if gated
        if (requiredPassports.length > 0) {
            if (!AssemblyPassports(passports).holdsAnyPassport(msg.sender, requiredPassports)) {
                revert MissingRequiredPassport();
            }
        }

        // Record the vote
        hasVoted[msg.sender] = true;
        userVote[msg.sender] = optionIndex;
        voteTally[optionIndex]++;
        totalVotes++;

        emit VoteCast(msg.sender, optionIndex);
    }

    // ============ View Functions ============

    /**
     * @notice Get all voting options
     */
    function getOptions() external view returns (string[] memory) {
        return options;
    }

    /**
     * @notice Get all required passport IDs
     */
    function getRequiredPassports() external view returns (uint256[] memory) {
        return requiredPassports;
    }

    /**
     * @notice Get complete vote results
     * @return optionNames Array of option strings
     * @return votes Array of vote counts for each option
     * @return total Total votes cast
     */
    function getResults() external view returns (string[] memory optionNames, uint256[] memory votes, uint256 total) {
        optionNames = options;
        votes = new uint256[](options.length);

        for (uint256 i = 0; i < options.length; i++) {
            votes[i] = voteTally[i];
        }

        total = totalVotes;
    }

    /**
     * @notice Get the winning option index
     * @dev In case of tie, returns the lowest index option
     * @return winningIndex Index of the winning option
     * @return winningVotes Number of votes for the winner
     */
    function getWinner() external view votingComplete returns (uint256 winningIndex, uint256 winningVotes) {
        winningIndex = 0;
        winningVotes = voteTally[0];

        for (uint256 i = 1; i < options.length; i++) {
            if (voteTally[i] > winningVotes) {
                winningIndex = i;
                winningVotes = voteTally[i];
            }
        }
    }

    /**
     * @notice Check if voting is currently active
     */
    function isActive() external view returns (bool) {
        return _initialized && block.timestamp < votingEnd;
    }

    /**
     * @notice Check if a specific address can vote
     * @param voter Address to check
     */
    function canVote(address voter) external view returns (bool) {
        if (!_initialized) return false;

        // Check if voting is active
        if (block.timestamp >= votingEnd) return false;

        // Check if already voted
        if (hasVoted[voter]) return false;

        // Check passport requirements
        if (requiredPassports.length > 0) {
            return AssemblyPassports(passports).holdsAnyPassport(voter, requiredPassports);
        }

        return true;
    }

    /**
     * @notice Get time remaining in voting period
     * @return seconds remaining (0 if ended)
     */
    function timeRemaining() external view returns (uint256) {
        if (!_initialized || block.timestamp >= votingEnd) return 0;
        return votingEnd - block.timestamp;
    }

    /**
     * @notice Check if contest is gated by passports
     */
    function isGated() external view returns (bool) {
        return requiredPassports.length > 0;
    }

    /**
     * @notice Check if contest has been initialized
     */
    function initialized() external view returns (bool) {
        return _initialized;
    }
}
