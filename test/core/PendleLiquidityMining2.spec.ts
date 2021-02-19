import { assert, expect } from "chai";
import { createFixtureLoader } from "ethereum-waffle";
import { BigNumber as BN, Contract, Wallet } from "ethers";
import PendleLiquidityMining from "../../build/artifacts/contracts/core/PendleLiquidityMining.sol/PendleLiquidityMining.json";
import {
  approxBigNumber,
  consts,
  evm_revert,
  evm_snapshot,
  setTime,
  setTimeNextBlock,
  startOfEpoch,
} from "../helpers";
import {
  liqParams,
  pendleLiquidityMiningFixture,
  userStakeAction,
} from "./fixtures";
import * as scenario from "./fixtures/pendleLiquidityMiningScenario.fixture";

const { waffle } = require("hardhat");
const hre = require("hardhat");
const { deployContract, provider } = waffle;

// returns a rewards object = BN[][]
//    rewards[userId][0] is the rewards withdrawable at currentEpoch
//    rewards[userId][1] is the rewards withdrawable at currentEpoch + 1
//    ...
function calExpectedRewards(
  userStakingData: userStakeAction[][][],
  params: liqParams,
  currentEpoch: number
): BN[][] {
  let nUsers = userStakingData[0].length;
  /*
  pushing params.NUMBER_OF_EPOCHS empty epochs to mimic the real-life situation where users
  will continue to receive rewards even if they don't do any action
  */
  for (let i = 1; i <= params.NUMBER_OF_EPOCHS.toNumber(); i++) {
    let emptyArr = [];
    for (let j = 1; j <= nUsers; j++) {
      emptyArr.push([]);
    }
    userStakingData.push(emptyArr);
  }

  let userCurrentStakes: BN[] = [];
  let rewards: BN[][] = [];

  let availableRewardsForEpoch: BN[][] = []; // availableRewardsForEpoch[userId][epochId]

  for (let i: number = 0; i < nUsers; i++) {
    userCurrentStakes.push(BN.from(0));
    rewards.push([]);
    availableRewardsForEpoch.push([]);
    for (
      let j: number = 0;
      j < params.NUMBER_OF_EPOCHS.add(params.VESTING_EPOCHS).toNumber();
      j++
    ) {
      availableRewardsForEpoch[i].push(BN.from(0));
    }
    for (let j: number = 0; j < params.VESTING_EPOCHS.toNumber(); j++) {
      rewards[i].push(BN.from(0));
    }
  }

  userStakingData.forEach((epochData, i) => {
    let epochId = i + 1;
    if (epochId >= currentEpoch) return; // only count for epoches before currentEpoch
    let userStakeSeconds: BN[] = [];
    let totalStakeSeconds = BN.from(0);

    epochData.forEach((userData, userId) => {
      userStakeSeconds.push(BN.from(0));
      let lastTimeUpdated = startOfEpoch(params, epochId);
      userData.push(
        new userStakeAction(
          startOfEpoch(params, epochId + 1),
          BN.from(0),
          true,
          -1
        )
      );
      userData.forEach((userAction, actionId) => {
        // console.log(`\t[calculateExpectedRewards] Processing userAction: ${userAction.time} ${userAction.amount} ${userAction.isStaking} for user ${userId}`);
        const timeElapsed = userAction.time.sub(lastTimeUpdated);
        const additionalStakeSeconds = userCurrentStakes[userId].mul(
          timeElapsed
        );
        userStakeSeconds[userId] = userStakeSeconds[userId].add(
          additionalStakeSeconds
        );
        // console.log(`\t\ttotalStakeSeconds before = ${totalStakeSeconds}, ${totalStakeSeconds.add(additionalStakeSeconds)}`);
        totalStakeSeconds = totalStakeSeconds.add(additionalStakeSeconds);
        // console.log(`\t\t[calculateExpectedRewards] additionalStakeSeconds = ${additionalStakeSeconds}, timeElapsed = ${timeElapsed}, totalStakeSeconds = ${totalStakeSeconds}`);

        if (userAction.isStaking) {
          userCurrentStakes[userId] = userCurrentStakes[userId].add(
            userAction.amount
          );
        } else {
          userCurrentStakes[userId] = userCurrentStakes[userId].sub(
            userAction.amount
          );
        }
        lastTimeUpdated = userAction.time;
      });
    });
    // console.log(`\t[calculateExpectedRewards] Epoch = ${epochId}, totalStakeSeconds = ${totalStakeSeconds}`);

    epochData.forEach((userData, userId) => {
      const rewardsPerVestingEpoch = params.REWARDS_PER_EPOCH.mul(
        userStakeSeconds[userId]
      )
        .div(totalStakeSeconds)
        .div(params.VESTING_EPOCHS);
      for (
        let e: number = epochId + 1;
        e <= epochId + params.VESTING_EPOCHS.toNumber();
        e++
      ) {
        if (e <= currentEpoch) {
          rewards[userId][0] = rewards[userId][0].add(rewardsPerVestingEpoch);
          continue;
        }
        if (e < currentEpoch + params.VESTING_EPOCHS.toNumber()) {
          rewards[userId][e - currentEpoch] = rewards[userId][
            e - currentEpoch
          ].add(rewardsPerVestingEpoch);
        }
      }
    });
  });
  // rewards.forEach((userReward, userId) => {
  //   console.log(`\tRewards for user ${userId}: ${userReward}`);
  // });
  return rewards;
}

// TODO: test set allocation, interest of Lp
describe("PendleLiquidityMining-beta tests", async () => {
  const wallets = provider.getWallets();
  const loadFixture = createFixtureLoader(wallets, provider);
  const [alice, bob, charlie, dave] = wallets;
  let pendleLiq: Contract;
  let pdl: Contract;
  let params: liqParams;
  let snapshotId: string;
  let globalSnapshotId: string;
  let pendleLiqWeb3: any; // TODO: move this to fixture
  before(async () => {
    globalSnapshotId = await evm_snapshot();
    const fixture = await loadFixture(pendleLiquidityMiningFixture);
    pendleLiq = fixture.pendleLiquidityMining;
    params = fixture.params;
    pdl = fixture.pdl;
    pendleLiqWeb3 = new hre.web3.eth.Contract(
      PendleLiquidityMining.abi,
      pendleLiq.address
    );
    snapshotId = await evm_snapshot();
  });

  after(async () => {
    await evm_revert(globalSnapshotId);
  });

  beforeEach(async () => {
    await evm_revert(snapshotId);
    snapshotId = await evm_snapshot();
  });

  async function doStake(person: Wallet, amount: BN) {
    await pendleLiq
      .connect(person)
      .stake(consts.T0.add(consts.SIX_MONTH), amount, consts.HIGH_GAS_OVERRIDE);
  }

  async function doWithdraw(person: Wallet, amount: BN) {
    await pendleLiq
      .connect(person)
      .withdraw(
        consts.T0.add(consts.SIX_MONTH),
        amount,
        consts.HIGH_GAS_OVERRIDE
      );
  }

  async function claimRewardsWeb3(user: Wallet) {
    return await pendleLiqWeb3.methods
      .claimRewards()
      .call({ from: user.address });
  }
  // [epochs][user][transaction]
  async function doSequence(userStakingData: userStakeAction[][][]) {
    let flatData: userStakeAction[] = [];

    userStakingData.forEach((epochData) => {
      epochData.forEach((userData) => {
        userData.forEach((userAction) => {
          if (userAction.id != -1) {
            flatData.push(userAction);
          }
        });
      });
    });

    flatData = flatData.sort((a, b) => {
      return a.time.sub(b.time).toNumber();
    });

    // console.log(flatData);
    for (let i = 0; i < flatData.length; i++) {
      let action: userStakeAction = flatData[i];
      if (i != 0) {
        // console.log(flatData[i - 1], flatData[i]);
        assert(flatData[i - 1].time < flatData[i].time);
      }
      await setTimeNextBlock(provider, action.time);
      if (action.isStaking) {
        await doStake(wallets[action.id], action.amount); // acess users directly by their id instead of names
      } else {
        // withdrawing
        await doWithdraw(wallets[action.id], action.amount);
      }
    }
  }

  async function checkEqualRewards(
    userStakingData: userStakeAction[][][],
    epochToCheck: number,
    _allocationRateDiv?: number
  ) {
    let expectedRewards: BN[][] = calExpectedRewards(
      userStakingData,
      params,
      epochToCheck
    );
    await setTime(provider, startOfEpoch(params, epochToCheck));
    let numUser = expectedRewards.length;
    let allocationRateDiv =
      _allocationRateDiv !== undefined ? _allocationRateDiv : 1;
    for (let userId = 0; userId < numUser; userId++) {
      await pendleLiq.connect(wallets[userId]).claimRewards();
      // console.log(expectedRewards[userId][0].toString(), (await pdl.balanceOf(wallets[userId].address)).toString());
      approxBigNumber(
        await pdl.balanceOf(wallets[userId].address),
        expectedRewards[userId][0].div(allocationRateDiv),
        BN.from(100),
        false
      );
      // expect(expectedRewards[userId][0].toNumber()).to.be.approximately(
      // (await pdl.balanceOf(wallets[userId].address)).toNumber(),
      // 100 // 100 is much better than necessary, but usually the differences are 0
      // );
    }
    // console.log(await claimRewardsWeb3(wallets[0]));
    // console.log(await claimRewardsWeb3(wallets[1]));
  }

  async function checkEqualRewardsFourEpochs(
    userStakingData: userStakeAction[][][],
    epochToCheck: number,
    _allocationRateDiv?: number
  ) {
    for (let i = 0; i < 4; i++) {
      await checkEqualRewards(
        userStakingData,
        epochToCheck + i,
        _allocationRateDiv
      );
    }
  }

  it("test 1", async () => {
    let userStakingData: userStakeAction[][][] = scenario.scenario01(params);
    await doSequence(userStakingData);
    await checkEqualRewardsFourEpochs(
      userStakingData,
      userStakingData.length + 1
    );
  });

  it("test 4", async () => {
    let userStakingData: userStakeAction[][][] = scenario.scenario04(params);
    await doSequence(userStakingData);
    await checkEqualRewardsFourEpochs(
      userStakingData,
      userStakingData.length + 1
    );
  });

  it("test 5", async () => {
    await pendleLiq.setAllocationSetting(
      [consts.T0.add(consts.SIX_MONTH), consts.T0.add(consts.THREE_MONTH)],
      [params.TOTAL_NUMERATOR.div(2), params.TOTAL_NUMERATOR.div(2)],
      consts.HIGH_GAS_OVERRIDE
    );
    let userStakingData: userStakeAction[][][] = scenario.scenario04(params);
    await doSequence(userStakingData);
    await checkEqualRewardsFourEpochs(
      userStakingData,
      userStakingData.length + 1,
      2
    );
  });

  it("test invalid setAllocationSetting", async () => {
    await expect(
      pendleLiq.setAllocationSetting(
        [
          consts.T0.add(consts.SIX_MONTH),
          consts.T0.add(consts.THREE_MONTH),
          consts.T0.add(consts.ONE_MONTH),
        ],
        [
          params.TOTAL_NUMERATOR.div(3),
          params.TOTAL_NUMERATOR.div(3),
          params.TOTAL_NUMERATOR.div(3),
        ],
        consts.HIGH_GAS_OVERRIDE
      )
    ).to.be.revertedWith(
      "VM Exception while processing transaction: revert Pendle: allocations dont add up"
    );
  });

  it("this test shouldn't crash", async () => {
    const amountToStake = params.INITIAL_LP_AMOUNT;

    await setTimeNextBlock(provider, params.START_TIME);
    await pendleLiq
      .connect(bob)
      .stake(
        consts.T0.add(consts.SIX_MONTH),
        amountToStake,
        consts.HIGH_GAS_OVERRIDE
      );

    await setTimeNextBlock(
      provider,
      params.START_TIME.add(params.EPOCH_DURATION)
    );
    await pendleLiq
      .connect(bob)
      .withdraw(
        consts.T0.add(consts.SIX_MONTH),
        amountToStake,
        consts.HIGH_GAS_OVERRIDE
      );
    await pendleLiq.connect(bob).claimRewards();
    await setTimeNextBlock(
      provider,
      params.START_TIME.add(params.EPOCH_DURATION).add(params.EPOCH_DURATION)
    );
    await pendleLiq.connect(bob).claimRewards();
  });
});