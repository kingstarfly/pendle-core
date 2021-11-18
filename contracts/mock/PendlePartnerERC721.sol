pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";


contract PendlePartnerERC721 is ERC721 {
    using Counters for Counters.Counter;

    // Declaring the variables
    ERC721 internal pendlePartnerNftToken;
    Counters.Counter private _tokenIds;

    // Constructor
    constructor(address _pendlePartnerNftAddress)
    {
        pendlePartnerNftToken = ERC721(_pendlePartnerNftAddress);
    }

    function mintToken(address user, string nftTokenUri)
        public
    {
        _tokenIds.increment();
        
        uint256 newItemId = _tokenIds.current();
        pendlePartnerNftToken._mint(user, newItemId);
        pendlePartnerNftToken._setTokenURI(newItemId, nftTokenUri);

        return newItemId;
    }
}