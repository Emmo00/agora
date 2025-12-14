// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { IAssembly } from "./interfaces/IAssembly.sol";
import { AssemblyPassports } from "./AssemblyPassports.sol";
import { Contest } from "./Contest.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title Assembly
 * @notice Core governance unit that manages admins, passports, and contests
 * @dev Designed to be cloned - uses initialize pattern
 */
contract Assembly is IAssembly, AccessControl, ReentrancyGuard {
    // ============ State Variables ============

    /// @notice Admin role identifier
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Whether this Assembly has been initialized
    bool private _initialized;

    /// @notice Contest implementation for cloning
    address public contestImplementation;

    /// @notice The passport contract for this Assembly
    address public passports;

    /// @notice Assembly metadata URI (IPFS/URL)
    string public metadataURI;

    /// @notice Array of all contests created by this Assembly
    address[] public contests;

    /// @notice Mapping to check if address is a contest from this Assembly
    mapping(address => bool) public isContest;

    /// @notice Array to track all admin addresses
    address[] private _adminList;

    /// @notice Mapping to track if address is in admin list
    mapping(address => bool) private _isAdmin;

    /**
     * @notice Constructor for implementation contract
     * @dev This is only called once when deploying the implementation
     */
    constructor(address initialOwner, string memory _metadataURI, address _contestImplementation) {
        // For the implementation contract, we do minimal setup
        // The actual instances will be initialized via __init
        contestImplementation = _contestImplementation;
        metadataURI = _metadataURI;

        // Grant roles to prevent the implementation from being used directly
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);

        // Track admin in list
        _adminList.push(initialOwner);
        _isAdmin[initialOwner] = true;

        _initialized = true; // Mark implementation as initialized
    }

    // ============ Initialization ============

    /**
     * @notice Initializes a cloned Assembly
     * @param creator Initial admin of the Assembly
     * @param _metadataURI URI pointing to Assembly metadata
     * @param _contestImplementation Address of Contest implementation
     */
    function __init(address creator, string memory _metadataURI, address _contestImplementation) external {
        if (_initialized) revert AlreadyInitialized();
        if (bytes(_metadataURI).length == 0) revert EmptyMetadataURI();
        if (_contestImplementation == address(0)) revert InvalidContestImplementation();

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, creator);
        _grantRole(ADMIN_ROLE, creator);

        // Track admin in list
        _adminList.push(creator);
        _isAdmin[creator] = true;

        // Deploy passport contract (this Assembly is the owner)
        passports = address(new AssemblyPassports(address(this)));

        // Store metadata and contest implementation
        metadataURI = _metadataURI;
        contestImplementation = _contestImplementation;
        _initialized = true;

        emit AssemblyInitialized(address(this), creator, _metadataURI);
    }

    // ============ Modifiers ============

    modifier whenInitialized() {
        if (!_initialized) revert NotInitialized();
        _;
    }

    // ============ Admin Management ============

    /**
     * @notice Add a new admin to the Assembly
     * @param newAdmin Address to grant admin role
     */
    function addAdmin(address newAdmin) external onlyRole(ADMIN_ROLE) whenInitialized {
        if (!_isAdmin[newAdmin]) {
            _adminList.push(newAdmin);
            _isAdmin[newAdmin] = true;
        }
        grantRole(ADMIN_ROLE, newAdmin);
        emit AdminAdded(newAdmin);
    }

    /**
     * @notice Remove an admin from the Assembly
     * @param admin Address to revoke admin role
     */
    function removeAdmin(address admin) external onlyRole(ADMIN_ROLE) whenInitialized {
        revokeRole(ADMIN_ROLE, admin);
        emit AdminRemoved(admin);
    }

    /**
     * @notice Check if an address is an admin
     * @param account Address to check
     */
    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    /**
     * @notice Get total number of admins
     */
    function getAdminCount() external view returns (uint256) {
        return _adminList.length;
    }

    /**
     * @notice Get admin address at specific index
     * @param index Index in the admin set
     */
    function getAdminAt(uint256 index) external view returns (address) {
        require(index < _adminList.length, "Index out of bounds");
        return _adminList[index];
    }

    // ============ Metadata Management ============

    /**
     * @notice Update Assembly metadata URI
     * @param newURI New metadata URI
     */
    function updateMetadata(string calldata newURI) external onlyRole(ADMIN_ROLE) whenInitialized {
        if (bytes(newURI).length == 0) revert EmptyMetadataURI();

        string memory oldURI = metadataURI;
        metadataURI = newURI;

        emit MetadataUpdated(oldURI, newURI);
    }

    // ============ Passport Management ============

    /**
     * @notice Create a new passport type
     * @param name Name of the passport type
     * @param metadataUri URI for passport metadata
     * @param isOpen Whether anyone can mint (true) or allowlist only (false)
     * @return tokenId The newly created passport type ID
     */
    function createPassportType(
        string calldata name,
        string calldata metadataUri,
        bool isOpen
    ) external onlyRole(ADMIN_ROLE) whenInitialized returns (uint256 tokenId) {
        tokenId = AssemblyPassports(passports).createPassportType(name, metadataUri, isOpen);
        emit PassportTypeCreated(tokenId, name, isOpen);
    }

    /**
     * @notice Add addresses to passport allowlist
     * @param tokenId Passport type ID
     * @param accounts Addresses to allowlist
     */
    function addToPassportAllowlist(
        uint256 tokenId,
        address[] calldata accounts
    ) external onlyRole(ADMIN_ROLE) whenInitialized {
        AssemblyPassports(passports).addToAllowlist(tokenId, accounts);
    }

    /**
     * @notice Update passport type URI
     * @param tokenId Passport type ID
     * @param newUri New metadata URI
     */
    function updatePassportURI(uint256 tokenId, string calldata newUri) external onlyRole(ADMIN_ROLE) whenInitialized {
        AssemblyPassports(passports).updatePassportURI(tokenId, newUri);
    }

    /**
     * @notice Mint a passport to a specific address
     * @param to Address to receive passport
     * @param tokenId Passport type ID
     */
    function mintPassportTo(address to, uint256 tokenId) external onlyRole(ADMIN_ROLE) whenInitialized {
        AssemblyPassports(passports).mintTo(to, tokenId);
    }

    // ============ Contest Management ============

    /**
     * @notice Create a new contest
     * @param prompt The question or decision prompt
     * @param options Array of voting options
     * @param votingDuration Duration of voting period in seconds
     * @param requiredPassports Passport IDs required to vote (empty for open)
     * @return contest Address of the newly created contest
     */
    function createContest(
        string memory prompt,
        string[] memory options,
        uint256 votingDuration,
        uint256[] memory requiredPassports
    ) external onlyRole(ADMIN_ROLE) whenInitialized nonReentrant returns (address contest) {
        // Clone the contest implementation
        contest = Clones.clone(contestImplementation);

        // Initialize the contest
        Contest(contest).__init(address(this), address(passports), prompt, options, votingDuration, requiredPassports);

        // Track the contest
        contests.push(contest);
        isContest[contest] = true;

        emit ContestCreated(contest, prompt, block.timestamp + votingDuration);
    }

    /**
     * @notice Get total number of contests
     */
    function getContestCount() external view returns (uint256) {
        return contests.length;
    }

    /**
     * @notice Get contest address at index
     * @param index Index in contests array
     */
    function getContest(uint256 index) external view returns (address) {
        if (index >= contests.length) revert ContestNotFound();
        return contests[index];
    }

    /**
     * @notice Get all contest addresses
     */
    function getAllContests() external view returns (address[] memory) {
        return contests;
    }

    /**
     * @notice Get active contests
     * @return activeContests Array of currently active contest addresses
     */
    function getActiveContests() external view returns (address[] memory activeContests) {
        uint256 activeCount = 0;

        // First pass: count active contests
        for (uint256 i = 0; i < contests.length; i++) {
            if (Contest(contests[i]).isActive()) {
                activeCount++;
            }
        }

        // Second pass: populate array
        activeContests = new address[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < contests.length; i++) {
            if (Contest(contests[i]).isActive()) {
                activeContests[currentIndex] = contests[i];
                currentIndex++;
            }
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get comprehensive Assembly information
     * @return passportContract Address of the passport contract
     * @return metadata Assembly metadata URI
     * @return contestCount Total number of contests
     * @return adminCount Total number of admins
     */
    function getInfo()
        external
        view
        returns (address passportContract, string memory metadata, uint256 contestCount, uint256 adminCount)
    {
        passportContract = address(passports);
        metadata = metadataURI;
        contestCount = contests.length;
        adminCount = _adminList.length;
    }

    /**
     * @notice Check if Assembly has been initialized
     */
    function initialized() external view returns (bool) {
        return _initialized;
    }
}
