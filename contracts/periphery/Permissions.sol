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

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


abstract contract Permissions {
    event MaintainerSet(address maintainer);
    event EtherWithdraw(uint256 amount, address sendTo);
    event TokenWithdraw(IERC20 token, uint256 amount, address sendTo);

    address public immutable governance;
    address public maintainer;
    address internal initializer;

    constructor(address _governance) {
        require(_governance != address(0), "Benchmark: zero address");
        initializer = msg.sender;
        governance = _governance;
    }

    modifier initialized() {
        require(initializer == address(0), "Benchmark: not initialized");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "Benchmark: only governance");
        _;
    }

    modifier onlyMaintainer() {
        require(msg.sender == maintainer, "Benchmark: only maintainer");
        _;
    }

    function setMaintainer(address _maintainer) public onlyGovernance {
        require(_maintainer != address(0), "Benchmark: zero address");

        maintainer = _maintainer;
        emit MaintainerSet(_maintainer);
    }

    /**
     * @dev Allows the maintainer to withdraw Ether in a Benchmark contract
     *      in case of accidental token transfer into the contract.
     * @param amount The amount of Ether to withdraw.
     * @param sendTo The recipient address.
     */
    function withdrawEther(uint256 amount, address payable sendTo) external onlyMaintainer {
        (bool success, ) = sendTo.call{value: amount}("");
        require(success, "withdraw failed");
        emit EtherWithdraw(amount, sendTo);
    }

    /**
     * @dev Allows the maintainer to withdraw all IERC20 compatible tokens in a Benchmark
     *      contract in case of accidental token transfer into the contract.
     * @param token IERC20 The address of the token contract.
     * @param amount The amount of IERC20 tokens to withdraw.
     * @param sendTo The recipient address.
     */
    function withdrawToken(
        IERC20 token,
        uint256 amount,
        address sendTo
    ) external onlyMaintainer {
        token.transfer(sendTo, amount);
        emit TokenWithdraw(token, amount, sendTo);
    }
}