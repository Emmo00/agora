// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAgoraFactory
 * @notice Interface for the Agora Factory contract
 */
interface IAgoraFactory {
    // ============ Events ============

    event FactoryDeployed(
        address indexed factory,
        address indexed assemblyImplementation,
        address indexed contestImplementation
    );

    event AssemblyCreated(
        address indexed assemblyAddress,
        address indexed creator,
        string metadataURI,
        uint256 assemblyIndex
    );

    // ============ Errors ============

    error EmptyMetadataURI();
    error InvalidImplementation();
    error AssemblyNotFound();

    // ============ Assembly Creation ============

    function createAssembly(string calldata metadataURI) external returns (address assemblyAddress);

    // ============ View Functions ============

    function assemblyImplementation() external view returns (address);

    function contestImplementation() external view returns (address);

    function assemblies(uint256 index) external view returns (address);

    function isAssembly(address assemblyAddress) external view returns (bool);

    function assembliesByCreator(address creator, uint256 index) external view returns (address);

    function getAssemblyCount() external view returns (uint256);

    function getAssembly(uint256 index) external view returns (address);

    function getAllAssemblies() external view returns (address[] memory);

    function getAssembliesByCreator(address creator) external view returns (address[] memory);

    function getAssembliesPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory paginatedAssemblies, uint256 total);

    function getRecentAssemblies(uint256 count) external view returns (address[] memory recentAssemblies);

    function verifyAssembly(address potentialAssembly) external view returns (bool);

    function getFactoryInfo()
        external
        view
        returns (address factory, address assemblyImpl, address contestImpl, uint256 totalAssemblies);
}
