// SPDX-License-Identifier: MIT
/*
 * MIT License
 * ===========
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 */
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IBenchmarkForge.sol";
import "../tokens/BenchmarkFutureYieldToken.sol";
import "../tokens/BenchmarkOwnershipToken.sol";

contract BenchmarkForge is IBenchmarkForge, ReentrancyGuard {
    address public override factory;
    address public override underlyingYieldToken;

    constructor() {
        factory = msg.sender;
    }

    function initialize(address _underlyingYieldToken) external override {
        underlyingYieldToken = _underlyingYieldToken;
    }

    // function redeem(uint256 _amount) external {
    //     require(_amount > 0, "Amount to redeem needs to be > 0");

    //     uint256 amountToRedeem = _amount;

    //     //if amount is equal to uint(-1), the user wants to redeem everything
    //     if (_amount == UINT_MAX_VALUE) {
    //         amountToRedeem = currentBalance;
    //     }

    //     require(
    //         amountToRedeem <= token.balanceOf(msg.sender),
    //         "Cannot redeem more than the available balance"
    //     );

    //     // burns tokens equivalent to the amount requested
    //     _burn(msg.sender, amountToRedeem);

    //     // executes redeem of the underlying asset
    //     forge.redeemUnderlying(
    //         underlyingAssetAddress,
    //         msg.sender,
    //         amountToRedeem,
    //         currentBalance.sub(amountToRedeem)
    //     );

    //     emit Redeem(msg.sender, amountToRedeem);
    // }

    // function tokenizeYield(
    //     ContractDurations _contractDuration,
    //     uint256 _amountToTokenize,
    //     address _to
    // ) external override returns (address ot, address xyt) {
    //     ot = forgeOwnershipToken();
    //     xyt = forgeOwnershipToken();
    // }

    function _forgeFutureYieldToken(
        string calldata _tokenName,
        string calldata _tokenSymbol,
        uint8 _tokenDecimals,
        address _underlyingToken,
        ContractDurations _contractDuration
    ) internal nonReentrant() returns (address xyt) {
        bytes memory bytecode = type(BenchmarkFutureYieldToken).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_underlyingToken, _contractDuration));

        bytecode = abi.encodePacked(
            bytecode,
            abi.encode(
                _tokenName,
                _tokenSymbol,
                _tokenDecimals,
                _underlyingToken,
                _contractDuration
            )
        );

        assembly {
            xyt := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
    }

    function _forgeOwnershipToken(
        string calldata _tokenName,
        string calldata _tokenSymbol,
        uint8 _tokenDecimals,
        address _underlyingToken,
        ContractDurations _contractDuration
    ) internal nonReentrant() returns (address ot) {
        bytes memory bytecode = type(BenchmarkOwnershipToken).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_underlyingToken, _contractDuration));

        bytecode = abi.encodePacked(
            bytecode,
            abi.encode(
                _tokenName,
                _tokenSymbol,
                _tokenDecimals,
                _underlyingToken,
                _contractDuration
            )
        );

        assembly {
            ot := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
    }
}