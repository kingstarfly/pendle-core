import { Contract, BigNumber } from 'ethers'
import { createFixtureLoader } from 'ethereum-waffle'

import { benchmarkMarketFixture } from './fixtures'
import {constants, tokens, amountToWei, getAContract, resetChain, evm_snapshot, evm_revert, advanceTime} from "../helpers"
const { waffle } = require("hardhat");
const { deployContract, provider } = waffle;

describe('BenchmarkMarket', async () => {
    const wallets = provider.getWallets()
    const loadFixture = createFixtureLoader(wallets, provider)
    const [wallet, wallet1] = wallets;
    let benchmark: Contract;
    let benchmarkTreasury: Contract;
    let benchmarkMarketFactory: Contract;
    let benchmarkData: Contract;
    let benchmarkOwnershipToken: Contract;
    let benchmarkFutureYieldToken: Contract;
    let lendingPoolCore: Contract
    let benchmarkAaveForge: Contract
    let benchmarkMarket: Contract
    let testToken: Contract
    let aUSDT: Contract
    let snapshotId: string

    const printAmmDetails = async() => {
        console.log(`\tPrinting details for amm for xyt ${benchmarkOwnershipToken.address} and token ${testToken.address}`);
        console.log(`\t\tXyt bal = ${await benchmarkOwnershipToken.balanceOf(benchmarkMarket.address)}`);
        console.log(`\t\tToken bal = ${await testToken.balanceOf(benchmarkMarket.address)}`);
        console.log(`\t\taUSDT bal = ${await aUSDT.balanceOf(benchmarkMarket.address)}`);
        console.log(`\t\tTotal Supply of LP= ${await benchmarkMarket.totalSupply()}`);
      }

    before(async () => {
        await resetChain();

        const fixture = await loadFixture(benchmarkMarketFixture)
        benchmark = fixture.core.benchmark
        benchmarkTreasury = fixture.core.benchmarkTreasury
        benchmarkMarketFactory = fixture.core.benchmarkMarketFactory
        benchmarkData = fixture.core.benchmarkData
        benchmarkOwnershipToken = fixture.forge.benchmarkOwnershipToken
        benchmarkFutureYieldToken = fixture.forge.benchmarkFutureYieldToken 
        benchmarkAaveForge = fixture.forge.benchmarkAaveForge
        lendingPoolCore = fixture.aave.lendingPoolCore;
        testToken = fixture.testToken
        benchmarkMarket = fixture.benchmarkMarket
        aUSDT = await getAContract(wallet, lendingPoolCore, tokens.USDT);
        snapshotId = await evm_snapshot()
        
    });

    beforeEach(async () => {
      await evm_revert(snapshotId)
      snapshotId = await evm_snapshot()
    })

    it('should be able to bootstrap', async () => {
      console.log("Before bootstrap:");
      await printAmmDetails();

      const token = tokens.USDT
      const amountToTokenize = amountToWei(token, BigNumber.from(100));

        await printAmmDetails();

        await benchmarkMarket.bootstrap(
          amountToTokenize,
          amountToTokenize
        );
  
        console.log("After bootstrap:");
        await printAmmDetails();
      });

      it('should be able to join a bootstrapped pool', async () => {
        console.log("Before bootstrap:");
        await printAmmDetails();

        const token = tokens.USDT
        const amountToTokenize = amountToWei(token, BigNumber.from(10));
        await benchmarkMarket.bootstrap(
          amountToTokenize,
          amountToTokenize
        );

        await testToken.approve(benchmarkMarket.address, constants.MAX_ALLOWANCE);
 
        console.log("Before joinPoolByAll:");
        await printAmmDetails();
        const totalSuply = await benchmarkMarket.totalSupply()

        await benchmarkMarket.connect(wallet1).joinPoolByAll(
          totalSuply.div(2),
          amountToTokenize,
          amountToTokenize
        );
  
        console.log("After joinPoolByAll:");
        await printAmmDetails();
      });
     
      it('should be able to swap amount out', async () => {
        const token = tokens.USDT
        const amountToTokenize = amountToWei(token, BigNumber.from(100));
        await benchmarkMarket.bootstrap(
          amountToTokenize,
          amountToTokenize
        );

        console.log("Before swapAmountOut:");
        await printAmmDetails();
        
        await benchmarkMarket.connect(wallet1).swapAmountOut(
          testToken.address,
          constants.MAX_ALLOWANCE,
          benchmarkFutureYieldToken.address,
          amountToTokenize.div(10),
          constants.MAX_ALLOWANCE,
        );

        console.log("After swapAmountOut: (swapped 15e8, 10% of xyt out)");
        await printAmmDetails();
      });


    it('should be able to exit a pool', async () => {
      const token = tokens.USDT
      const amountToTokenize = amountToWei(token, BigNumber.from(100));
      await benchmarkMarket.bootstrap(
        amountToTokenize,
        amountToTokenize
      );

      console.log("Before exitPoolByAll:");
      await printAmmDetails();

      await advanceTime(provider, constants.ONE_MOUNTH);
      console.log("one month has passed");
      console.log("Before exitPoolByAll");
      const totalSuply = await benchmarkMarket.totalSupply()

      await benchmarkMarket.exitPoolByAll(
        totalSuply.div(10),
        amountToTokenize.div(10),
        amountToTokenize.div(10),
      );

      console.log("After exitPoolByAll: (exited 1/10 of current pool)");
      await printAmmDetails();
    });
});
