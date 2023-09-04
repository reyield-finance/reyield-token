import { REYLDToken } from "../typechain-types";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("REYLDToken", function () {
  async function deployREYLDTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const REYLDToken = await ethers.getContractFactory("REYLDToken");
    const token = (await REYLDToken.deploy(
      owner.address
    )) as unknown as REYLDToken;

    await token.addExecutor(owner.address);
    return { token, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployREYLDTokenFixture);

      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should receive the correct amount of tokens", async function () {
      const { token, owner } = await loadFixture(deployREYLDTokenFixture);

      const total = await token.totalSupply();
      const balance = await token.balanceOf(owner.address);

      expect(total).to.be.equal(balance);

      const amount = 10000000000n;
      const totalSupply = amount * 10n ** 18n;

      expect(total).to.be.equal(totalSupply);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.transfer(otherAccount.address, amount18d);

      const balance = await token.balanceOf(otherAccount.address);
      expect(balance).to.be.equal(amount18d);
    });

    it("Should fail if the sender doesn't have enough tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await expect(
        token.connect(otherAccount).transfer(owner.address, amount18d)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("Approve", function () {
    it("Should approve tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.approve(otherAccount.address, amount18d);

      const allowance = await token.allowance(
        owner.address,
        otherAccount.address
      );
      expect(allowance).to.be.equal(amount18d);
    });

    it("Should approve tokens even the sender doesn't have enough tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.connect(otherAccount).approve(owner.address, amount18d);
      const allowance = await token.allowance(
        otherAccount.address,
        owner.address
      );
      expect(allowance).to.be.equal(amount18d);
    });

    it("Should transferFrom tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );
      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.approve(otherAccount.address, amount18d);
      await token
        .connect(otherAccount)
        .transferFrom(owner.address, otherAccount.address, amount18d);
      const allowance = await token.allowance(
        owner.address,
        otherAccount.address
      );
      expect(allowance).to.be.equal(0n);
      const balance = await token.balanceOf(otherAccount.address);
      expect(balance).to.be.equal(amount18d);
    });

    it("Should fail if the sender doesn't have enough tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.connect(otherAccount).approve(owner.address, amount18d);
      await expect(
        token.transferFrom(otherAccount.address, owner.address, amount18d)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should fail if the sender doesn't have enough allowance", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.approve(otherAccount.address, amount18d);
      await expect(
        token
          .connect(otherAccount)
          .transferFrom(owner.address, otherAccount.address, amount18d + 1n)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should override if approve again", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.approve(otherAccount.address, amount18d);
      await token.approve(otherAccount.address, 0n);
      const allowance = await token.allowance(
        owner.address,
        otherAccount.address
      );
      expect(allowance).to.be.equal(0n);
    });

    it("Should increaseAllowance", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;
      const amount2 = 200n;
      const amount218d = amount2 * 10n ** 18n;

      await token.approve(otherAccount.address, amount18d);
      await token.increaseAllowance(otherAccount.address, amount218d);
      const allowance = await token.allowance(
        owner.address,
        otherAccount.address
      );
      expect(allowance).to.be.equal(amount18d + amount218d);
    });

    it("Should decreaseAllowance", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 200n;
      const amount18d = amount * 10n ** 18n;
      const amount2 = 100n;
      const amount218d = amount2 * 10n ** 18n;

      await token.approve(otherAccount.address, amount18d);
      await token.decreaseAllowance(otherAccount.address, amount218d);
      const allowance = await token.allowance(
        owner.address,
        otherAccount.address
      );
      expect(allowance).to.be.equal(amount18d - amount218d);
    });

    it("Should fail if decreaseAllowance greater than allowance ", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;
      const amount2 = 200n;
      const amount218d = amount2 * 10n ** 18n;

      await token.approve(otherAccount.address, amount18d);
      await expect(
        token.decreaseAllowance(otherAccount.address, amount218d)
      ).to.be.revertedWith("ERC20: decreased allowance below zero");
    });
  });

  describe("Pause", function () {
    it("Should pause", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      await token.pause();
      const paused = await token.paused();
      expect(paused).to.be.true;

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      // transfer directly
      await expect(
        token.transfer(otherAccount.address, amount18d)
      ).to.be.revertedWith("Pausable: paused");

      // transfer by approve
      await token.approve(otherAccount.address, amount18d);
      await expect(
        token
          .connect(otherAccount)
          .transferFrom(owner.address, otherAccount.address, amount18d)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Unpause", function () {
    it("Should unpause", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      await token.pause();
      await token.unpause();
      const paused = await token.paused();
      expect(paused).to.be.false;

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      // transfer directly
      await token.transfer(otherAccount.address, amount18d);

      // transfer by approve
      await token.approve(otherAccount.address, amount18d);
      await token
        .connect(otherAccount)
        .transferFrom(owner.address, otherAccount.address, amount18d);
    });
  });

  describe("Burn", function () {
    it("Should burn", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      const totalSupply = await token.totalSupply();

      await token.burn(amount18d);
      expect(await token.balanceOf(owner.address)).to.be.equal(
        totalSupply - amount18d
      );
    });

    it("Should fail if the sender doesn't have enough tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.transfer(otherAccount.address, amount18d);

      await expect(
        token.connect(otherAccount).burn(amount18d + 1n)
      ).to.be.revertedWith("Only executor can call this function");
    });

    it("Should fail if the sender doesn't have enough tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.addExecutor(otherAccount.address);
      await token.transfer(otherAccount.address, amount18d);
      await expect(
        token.connect(otherAccount).burn(amount18d + 1n)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should remove executor", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployREYLDTokenFixture
      );

      const amount = 100n;
      const amount18d = amount * 10n ** 18n;

      await token.removeExecutor(owner.address);
      await expect(token.burn(amount18d)).to.be.revertedWith(
        "Only executor can call this function"
      );
    });
  });
});
