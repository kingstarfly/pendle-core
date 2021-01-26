import { expect, assert } from "chai";
import { Contract } from "ethers";
import { createFixtureLoader } from "ethereum-waffle";

import { pendleRouterFixture } from "./fixtures";
import { evm_revert, evm_snapshot } from "../helpers";

const { waffle } = require("hardhat");
const provider = waffle.provider;

describe("PendleData", async () => {
  const wallets = provider.getWallets();
  const loadFixture = createFixtureLoader(wallets, provider);

  let pendleRouter: Contract;
  let pendleData: Contract;
  let pendleTreasury: Contract;
  let snapshotId: string;
  let globalSnapshotId: string;

  before(async () => {
    globalSnapshotId = await evm_snapshot();

    const fixture = await loadFixture(pendleRouterFixture);
    pendleRouter = fixture.pendleRouter;
    pendleData = fixture.pendleData;
    pendleTreasury = fixture.pendleTreasury;
    snapshotId = await evm_snapshot();
  });

  after(async () => {
    await evm_revert(globalSnapshotId);
  });

  beforeEach(async () => {
    await evm_revert(snapshotId);
    snapshotId = await evm_snapshot();
  });

  it("should be able to setMarketFees", async () => {
    await pendleData.setMarketFees(10, 100);
    let swapFee = await pendleData.swapFee();
    let exitFee = await pendleData.exitFee();
    expect(swapFee).to.be.eq(10);
    expect(exitFee).to.be.eq(100);
  });

  it("allMarketsLength", async () => {
    let allMarketsLength = await pendleData.allMarketsLength();
    expect(allMarketsLength).to.be.eq(0);
  });

  it("getAllMarkets", async () => {
    let getAllMarkets = await pendleData.getAllMarkets();
    assert(Array.isArray(getAllMarkets));
  });

  it("should be able to setRouter", async () => {
    await expect(pendleData.setRouter(pendleRouter.address))
      .to.emit(pendleData, "RouterSet")
      .withArgs(pendleRouter.address);
  });

  it("Should be able to setTreasury", async () => {
    await expect(pendleData.setTreasury(pendleTreasury.address))
      .to.emit(pendleData, "TreasurySet")
      .withArgs(pendleTreasury.address);
  });
});
