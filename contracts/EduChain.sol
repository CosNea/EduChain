// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EduChain is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Certificate {
        string name;
        string institution;
        uint256 issueDate;
        string ipfsHash;
        bool isVerified;
    }

    mapping(uint256 => Certificate) private certificates;
    mapping(address => bool) private authorizedIssuers;

    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        string name,
        string institution,
        string ipfsHash
    );

    constructor() ERC721("EduChain", "EDU") {
        authorizedIssuers[msg.sender] = true;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized to issue certificates");
        _;
    }

    function addIssuer(address issuer) public onlyOwner {
        authorizedIssuers[issuer] = true;
    }

    function removeIssuer(address issuer) public onlyOwner {
        authorizedIssuers[issuer] = false;
    }

    function isAuthorizedIssuer(address issuer) public view returns (bool) {
        return authorizedIssuers[issuer];
    }

    function issueCertificate(
        address recipient,
        string memory name,
        string memory institution,
        string memory ipfsHash,
        string memory metadataURI
    ) public onlyAuthorizedIssuer returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        certificates[newTokenId] = Certificate({
            name: name,
            institution: institution,
            issueDate: block.timestamp,
            ipfsHash: ipfsHash,
            isVerified: true
        });

        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        emit CertificateIssued(
            newTokenId,
            recipient,
            name,
            institution,
            ipfsHash
        );

        return newTokenId;
    }

    function getCertificateDetails(uint256 tokenId)
        public
        view
        returns (
            string memory name,
            string memory institution,
            uint256 issueDate,
            string memory ipfsHash,
            bool isVerified
        )
    {
        require(_exists(tokenId), "Certificate does not exist");
        Certificate memory cert = certificates[tokenId];
        return (
            cert.name,
            cert.institution,
            cert.issueDate,
            cert.ipfsHash,
            cert.isVerified
        );
    }

    // Override required functions for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 