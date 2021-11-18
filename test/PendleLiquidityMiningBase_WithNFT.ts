// // import { ethers } from 'hardhat';
// // import { Signer } from 'ethers';

// // const { expect } = require('chai');

// // describe('Token contract', function () {
// //   it('Deployment should assign the total supply of tokens to the owner', async function () {
// //     //get a list of the accounts (Signers) in the node that we are connected to
// //     const [owner] = await ethers.getSigners(); // 'ethers' is imported variable from hardhat

// //     //ContractFactory in ether.js is an abstraction to deploy new smart contracts
// //     const Token = await ethers.getContractFactory('Token');

// //     // calling deploy starts the deployment, returning a 'Promise' that resolves into a 'Contract'
// //     const hardhatToken = await Token.deploy();

// //     // test 1
// //     // call on hardhatToken's contract methods and use them to get balance of owner account
// //     const ownerBalance = await hardhatToken.balanceOf(owner.address);
// //     expect(await hardhatToken.totalSupply()).to.equal(ownerBalance); // check that it equals total
// //   });
// // });

// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { } from ".sol";

// // Step 1: Greeter
// describe("Greeter", function () {
//   let contract: Greeter;

//   beforeEach(async () => {
//     const Greeter = await ethers.getContractFactory("Greeter");
//     contract = await Greeter.deploy();
//   });

//   // Step 2: Function name we want to test
//   describe("sum", () => {

//     // Step 3: Actually test and check the values we want to check
//     it("should return 5 when given parameters are 2 and 3", async function () {
//       await contract.deployed();

//       const sum = await contract.sum(2, 3);

//       expect(sum).to.be.not.undefined;
//       expect(sum).to.be.not.null;
//       expect(sum).to.be.not.NaN;
//       expect(sum).to.equal(5);
//     });
//   });
// });
