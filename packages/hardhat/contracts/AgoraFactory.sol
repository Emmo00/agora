// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { IAgoraFactory } from "./interfaces/IAgoraFactory.sol";
import { Assembly } from "./Assembly.sol";
import { Contest } from "./Contest.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgoraFactory
 * @notice Factory contract for deploying new Assemblies
 * @dev Uses minimal clone pattern for gas-efficient Assembly deployment
 */
contract AgoraFactory is IAgoraFactory, Ownable {
    /// @notice Implementation contract for Assembly clones
    address public immutable assemblyImplementation;

    /// @notice Implementation contract for Contest clones
    address public immutable contestImplementation;

    /// @notice Array of all deployed Assemblies
    address[] public assemblies;

    /// @notice Mapping to verify if address is a valid Assembly from this factory
    mapping(address => bool) public isAssembly;

    /// @notice Mapping from creator to their Assemblies
    mapping(address => address[]) public assembliesByCreator;

    /**
     * @notice Deploys the factory and implementation contracts
     * @param factoryOwner Address that will own the factory
     */
    constructor(address factoryOwner) Ownable(factoryOwner) {
        // Deploy Contest implementation first (needed by Assembly)
        contestImplementation = address(new Contest());

        // Deploy Assembly implementation with contest implementation address
        // Note: we pass address(this) as creator for the implementation
        // This is just for deployment; actual Assemblies will have proper creators
        assemblyImplementation = address(new Assembly(address(this), "ipfs://implementation", contestImplementation));

        if (assemblyImplementation == address(0)) revert InvalidImplementation();
        if (contestImplementation == address(0)) revert InvalidImplementation();

        emit FactoryDeployed(address(this), assemblyImplementation, contestImplementation);
    }

    // ============ Assembly Creation ============

    /**
     * @notice Creates a new Assembly
     * @param metadataURI URI pointing to Assembly metadata (IPFS/URL)
     * @return assemblyAddress Address of the newly created Assembly
     */
    function createAssembly(string calldata metadataURI) external returns (address assemblyAddress) {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        // Clone the Assembly implementation
        assemblyAddress = Clones.clone(assemblyImplementation);

        // Initialize the Assembly with the creator as admin
        Assembly(assemblyAddress).__init(msg.sender, metadataURI, contestImplementation);

        // Track the Assembly
        uint256 assemblyIndex = assemblies.length;
        assemblies.push(assemblyAddress);
        isAssembly[assemblyAddress] = true;
        assembliesByCreator[msg.sender].push(assemblyAddress);

        emit AssemblyCreated(assemblyAddress, msg.sender, metadataURI, assemblyIndex);
    }

    // ============ View Functions ============

    /**
     * @notice Get total number of Assemblies
     */
    function getAssemblyCount() external view returns (uint256) {
        return assemblies.length;
    }

    /**
     * @notice Get Assembly address at specific index
     * @param index Index in the assemblies array
     */
    function getAssembly(uint256 index) external view returns (address) {
        if (index >= assemblies.length) revert AssemblyNotFound();
        return assemblies[index];
    }

    /**
     * @notice Get all Assembly addresses
     */
    function getAllAssemblies() external view returns (address[] memory) {
        return assemblies;
    }

    /**
     * @notice Get Assemblies created by a specific address
     * @param creator Address to query
     */
    function getAssembliesByCreator(address creator) external view returns (address[] memory) {
        return assembliesByCreator[creator];
    }

    /**
     * @notice Get paginated list of Assemblies
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return paginatedAssemblies Array of Assembly addresses
     * @return total Total number of Assemblies
     */
    function getAssembliesPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory paginatedAssemblies, uint256 total) {
        total = assemblies.length;

        if (offset >= total) {
            return (new address[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        paginatedAssemblies = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            paginatedAssemblies[i] = assemblies[offset + i];
        }
    }

    /**
     * @notice Get the most recently created Assemblies
     * @param count Number of recent Assemblies to return
     */
    function getRecentAssemblies(uint256 count) external view returns (address[] memory recentAssemblies) {
        uint256 total = assemblies.length;

        if (count > total) {
            count = total;
        }

        recentAssemblies = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            recentAssemblies[i] = assemblies[total - 1 - i];
        }
    }

    /**
     * @notice Verify if an address is a valid Assembly from this factory
     * @param potentialAssembly Address to verify
     */
    function verifyAssembly(address potentialAssembly) external view returns (bool) {
        return isAssembly[potentialAssembly];
    }

    /**
     * @notice Get factory information
     * @return factory Factory address
     * @return assemblyImpl Assembly implementation address
     * @return contestImpl Contest implementation address
     * @return totalAssemblies Total number of Assemblies created
     */
    function getFactoryInfo()
        external
        view
        returns (address factory, address assemblyImpl, address contestImpl, uint256 totalAssemblies)
    {
        factory = address(this);
        assemblyImpl = assemblyImplementation;
        contestImpl = contestImplementation;
        totalAssemblies = assemblies.length;
    }
}
