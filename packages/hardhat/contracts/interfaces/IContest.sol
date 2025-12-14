// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IAssemblyPassports } from "./IAssemblyPassports.sol";

/**
 * @title IContest
 * @notice Interface for Contest contracts
 */
interface IContest {
    // ============ Events ============

    event ContestCreated(
        address indexed assemblyAddress,
        string prompt,
        uint256 votingEnd,
        uint256 optionsCount,
        bool isGated
    );

    event VoteCast(address indexed voter, uint256 indexed optionIndex);

    // ============ Errors ============

    error AlreadyInitialized();
    error NotInitialized();
    error OnlyAssembly();
    error TooManyOptions();
    error NotEnoughOptions();
    error VotingEnded();
    error VotingNotEnded();
    error AlreadyVoted();
    error InvalidOption();
    error InvalidVotingPeriod();
    error MissingRequiredPassport();
    error EmptyPrompt();
    error EmptyOption();

    // ============ Initialization ============

    function __init(
        address _assembly,
        address _passports,
        string memory _prompt,
        string[] memory _options,
        uint256 _votingDuration,
        uint256[] memory _requiredPassports
    ) external;

    // ============ Voting Functions ============

    function vote(uint256 optionIndex) external;

    // ============ View Functions ============

    function MAX_OPTIONS() external view returns (uint256);

    function assemblyAddress() external view returns (address);

    function passports() external view returns (address);

    function prompt() external view returns (string memory);

    function options(uint256 index) external view returns (string memory);

    function votingEnd() external view returns (uint256);

    function requiredPassports(uint256 index) external view returns (uint256);

    function voteTally(uint256 optionIndex) external view returns (uint256);

    function hasVoted(address voter) external view returns (bool);

    function userVote(address voter) external view returns (uint256);

    function totalVotes() external view returns (uint256);

    function getOptions() external view returns (string[] memory);

    function getRequiredPassports() external view returns (uint256[] memory);

    function getResults() external view returns (string[] memory optionNames, uint256[] memory votes, uint256 total);

    function getWinner() external view returns (uint256 winningIndex, uint256 winningVotes);

    function isActive() external view returns (bool);

    function canVote(address voter) external view returns (bool);

    function timeRemaining() external view returns (uint256);

    function isGated() external view returns (bool);

    function initialized() external view returns (bool);
}
