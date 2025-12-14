// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { IAssemblyPassports } from "./interfaces/IAssemblyPassports.sol";
import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AssemblyPassports
 * @notice Non-transferable ERC-1155 membership credentials for an Assembly
 * @dev Each token ID represents a different passport type (member, contributor, etc.)
 */
contract AssemblyPassports is IAssemblyPassports, ERC1155, Ownable, ReentrancyGuard {
    /// @notice Counter for passport type IDs
    uint256 private _nextTokenId;

    /// @notice Mapping from token ID to passport type config
    mapping(uint256 => PassportType) public passportTypes;

    /// @notice Allowlist: tokenId => address => allowed
    mapping(uint256 => mapping(address => bool)) public allowlist;

    /**
     * @notice Initializes the passport contract
     * @param assemblyAddress The Assembly contract that owns this passport system
     */
    constructor(address assemblyAddress) ERC1155("") Ownable(assemblyAddress) {
        _nextTokenId = 1; // Start token IDs at 1
    }

    // ============ Admin Functions ============

    /**
     * @notice Creates a new passport type
     * @param name Human-readable name for this passport type
     * @param metadataUri URI pointing to passport metadata (IPFS/URL)
     * @param isOpen Whether anyone can mint (true) or allowlist only (false)
     * @return tokenId The ID of the newly created passport type
     */
    function createPassportType(
        string calldata name,
        string calldata metadataUri,
        bool isOpen
    ) external onlyOwner returns (uint256 tokenId) {
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(metadataUri).length == 0) revert EmptyURI();

        tokenId = _nextTokenId++;

        passportTypes[tokenId] = PassportType({ name: name, uri: metadataUri, isOpen: isOpen, exists: true });

        emit PassportTypeCreated(tokenId, name, metadataUri, isOpen);
    }

    /**
     * @notice Adds addresses to the allowlist for a passport type
     * @param tokenId The passport type ID
     * @param accounts Array of addresses to allowlist
     */
    function addToAllowlist(uint256 tokenId, address[] calldata accounts) external onlyOwner {
        if (!passportTypes[tokenId].exists) revert PassportTypeDoesNotExist();
        if (accounts.length == 0) revert EmptyAddressArray();

        for (uint256 i = 0; i < accounts.length; i++) {
            allowlist[tokenId][accounts[i]] = true;
            emit AllowlistUpdated(tokenId, accounts[i], true);
        }
    }

    /**
     * @notice Updates the URI for a passport type
     * @param tokenId The passport type ID
     * @param newUri New metadata URI
     */
    function updatePassportURI(uint256 tokenId, string calldata newUri) external onlyOwner {
        if (!passportTypes[tokenId].exists) revert PassportTypeDoesNotExist();
        if (bytes(newUri).length == 0) revert EmptyURI();

        passportTypes[tokenId].uri = newUri;
    }

    // ============ Minting Functions ============

    /**
     * @notice Mints a passport to the caller
     * @param tokenId The passport type to mint
     */
    function mint(uint256 tokenId) external nonReentrant {
        PassportType memory passportType = passportTypes[tokenId];

        if (!passportType.exists) revert PassportTypeDoesNotExist();
        if (balanceOf(msg.sender, tokenId) > 0) revert AlreadyHoldsPassport();

        // Check access: must be open OR caller must be allowlisted
        if (!passportType.isOpen) {
            if (!allowlist[tokenId][msg.sender]) revert NotAllowlisted();
        }

        _mint(msg.sender, tokenId, 1, "");

        emit PassportMinted(msg.sender, tokenId);
    }

    /**
     * @notice Mints a passport to a specific address (admin only)
     * @param to Address to mint passport to
     * @param tokenId The passport type to mint
     */
    function mintTo(address to, uint256 tokenId) external onlyOwner nonReentrant {
        if (!passportTypes[tokenId].exists) revert PassportTypeDoesNotExist();
        if (balanceOf(to, tokenId) > 0) revert AlreadyHoldsPassport();

        _mint(to, tokenId, 1, "");

        emit PassportMinted(to, tokenId);
    }

    // ============ View Functions ============

    /**
     * @notice Returns the URI for a specific passport type
     * @param tokenId The passport type ID
     */
    function uri(uint256 tokenId) public view override(ERC1155, IAssemblyPassports) returns (string memory) {
        if (!passportTypes[tokenId].exists) revert PassportTypeDoesNotExist();
        return passportTypes[tokenId].uri;
    }

    /**
     * @notice Returns the balance of passports held by an account for a specific type
     * @param account Address to query
     * @param tokenId Passport type ID
     */
    function balanceOf(
        address account,
        uint256 tokenId
    ) public view override(ERC1155, IAssemblyPassports) returns (uint256) {
        return super.balanceOf(account, tokenId);
    }

    /**
     * @notice Checks if an address holds a specific passport
     * @param account Address to check
     * @param tokenId Passport type ID
     */
    function holdsPassport(address account, uint256 tokenId) external view returns (bool) {
        return balanceOf(account, tokenId) > 0;
    }

    /**
     * @notice Checks if an address holds any of the specified passports
     * @param account Address to check
     * @param tokenIds Array of passport type IDs
     */
    function holdsAnyPassport(address account, uint256[] calldata tokenIds) external view returns (bool) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (balanceOf(account, tokenIds[i]) > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Gets the next token ID that will be assigned
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    // ============ Transfer Restrictions ============

    /**
     * @notice Overrides to make passports non-transferable (soulbound)
     */
    function safeTransferFrom(address, address, uint256, uint256, bytes memory) public pure override {
        revert TransfersNotAllowed();
    }

    /**
     * @notice Overrides to make passports non-transferable (soulbound)
     */
    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override {
        revert TransfersNotAllowed();
    }
}
