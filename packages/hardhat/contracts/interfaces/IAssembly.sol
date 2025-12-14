// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAssembly
 * @notice Interface for Assembly contracts
 */
interface IAssembly {
    // ============ Events ============

    event AssemblyInitialized(address indexed assemblyAddress, address indexed creator, string metadataURI);

    event MetadataUpdated(string oldURI, string newURI);

    event PassportTypeCreated(uint256 indexed tokenId, string name, bool isOpen);

    event ContestCreated(address indexed contest, string prompt, uint256 votingEnd);

    event AdminAdded(address indexed admin);

    event AdminRemoved(address indexed admin);

    // ============ Errors ============

    error AlreadyInitialized();
    error NotInitialized();
    error EmptyMetadataURI();
    error ContestNotFound();
    error InvalidContestImplementation();

    // ============ Initialization ============

    function __init(address creator, string memory _metadataURI, address _contestImplementation) external;

    // ============ Admin Management ============

    function addAdmin(address newAdmin) external;

    function removeAdmin(address admin) external;

    function isAdmin(address account) external view returns (bool);

    function getAdminCount() external view returns (uint256);

    function getAdminAt(uint256 index) external view returns (address);

    // ============ Metadata Management ============

    function updateMetadata(string calldata newURI) external;

    // ============ Passport Management ============

    function createPassportType(
        string calldata name,
        string calldata metadataUri,
        bool isOpen
    ) external returns (uint256 tokenId);

    function addToPassportAllowlist(uint256 tokenId, address[] calldata accounts) external;

    function updatePassportURI(uint256 tokenId, string calldata newUri) external;

    function mintPassportTo(address to, uint256 tokenId) external;

    // ============ Contest Management ============

    function createContest(
        string memory prompt,
        string[] memory options,
        uint256 votingDuration,
        uint256[] memory requiredPassports
    ) external returns (address contest);

    function getContestCount() external view returns (uint256);

    function getContest(uint256 index) external view returns (address);

    function getAllContests() external view returns (address[] memory);

    function getActiveContests() external view returns (address[] memory);

    // ============ View Functions ============

    function ADMIN_ROLE() external view returns (bytes32);

    function contestImplementation() external view returns (address);

    function passports() external view returns (address);

    function metadataURI() external view returns (string memory);

    function contests(uint256 index) external view returns (address);

    function isContest(address contest) external view returns (bool);

    function getInfo()
        external
        view
        returns (address passportContract, string memory metadata, uint256 contestCount, uint256 adminCount);

    function initialized() external view returns (bool);
}
