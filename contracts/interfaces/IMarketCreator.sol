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

import "./IBenchmarkProvider.sol";


interface IMarketCreator {
    /**
     * @notice Creates a market given a future yield token and an ERC20 token.
     * @param _xyt Token address of the future yield token as base asset.
     * @param _token Token address of an ERC20 token as quote asset.
     * @param _expiry Yield contract expiry in epoch time.
     * @return market Returns the address of the newly created market.
     **/
    function create(
        address _xyt,
        address _token,
        uint256 _expiry
    ) external returns (address market);

    /**
     * @dev Returns the address of the Benchmark core contract for this BenchmarkMarket.
     * @return Returns core's address.
     **/
    function core() external view returns (address);

    /**
     * @dev Returns the address of the BenchmarkFactory for this BenchmarkForge.
     * @return Returns the factory's address.
     **/
    function factory() external view returns (address);

    /**
     * @dev Returns an instance of the BenchmarkProvider contract.
     * @return Returns the provider's instance.
     **/
    function provider() external view returns (IBenchmarkProvider);
}