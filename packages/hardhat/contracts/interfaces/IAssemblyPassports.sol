// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAssemblyPassports
 * @notice Interface for Assembly passport contracts
 */
interface IAssemblyPassports {
    // ============ Structs ============

    struct PassportType {
        string name;
        string uri;
        bool isOpen;
        bool exists;
    }

    // ============ Events ============

    event PassportTypeCreated(uint256 indexed tokenId, string name, string uri, bool isOpen);

    event PassportMinted(address indexed holder, uint256 indexed tokenId);

    event AllowlistUpdated(uint256 indexed tokenId, address indexed account, bool allowed);

    // ============ Errors ============

    error TransfersNotAllowed();
    error PassportTypeDoesNotExist();
    error AlreadyHoldsPassport();
    error NotAllowlisted();
    error PassportTypeNotOpen();
    error EmptyName();
    error EmptyURI();
    error EmptyAddressArray();

    // ============ Admin Functions ============

    function createPassportType(
        string calldata name,
        string calldata metadataUri,
        bool isOpen
    ) external returns (uint256 tokenId);

    function addToAllowlist(uint256 tokenId, address[] calldata accounts) external;

    function updatePassportURI(uint256 tokenId, string calldata newUri) external;

    // ============ Minting Functions ============

    function mint(uint256 tokenId) external;

    function mintTo(address to, uint256 tokenId) external;

    // ============ View Functions ============

    function passportTypes(
        uint256 tokenId
    ) external view returns (string memory name, string memory uri, bool isOpen, bool exists);

    function allowlist(uint256 tokenId, address account) external view returns (bool);

    function holdsPassport(address account, uint256 tokenId) external view returns (bool);

    function holdsAnyPassport(address account, uint256[] calldata tokenIds) external view returns (bool);

    function nextTokenId() external view returns (uint256);

    function uri(uint256 tokenId) external view returns (string memory);

    function balanceOf(address account, uint256 id) external view returns (uint256);
}
