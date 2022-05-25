import { Contract, utils } from "ethers";
import {EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS} from "../constants";


export const addLiquidity = async (signer, addCDAmountWei, addEtherAmountWei) => {
    try {
        const tokenContract = new Contract (TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

        const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);

        // CD tokens are an ERC20 so user would need to give the contract allowance(approval) to take the required number CD tokens out of his contract
        let tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, addCDAmountWei.toString());
        await tx.wait();

        // After the contract has the approval, add the ether and cd tokens in the liquidity
        tx = await exchangeContract.addLiquidity(addCDAmountWei, {
            value: addEtherAmountWei,
        });
        await tx.wait();
    } catch (error) {
        console.error(error);
    }
}


export const calculateCD = async (_addEther = "0", etherBalanceContract, cdTokenReserve) => {
    // `_addEther` is a string that need to be converted to a Bignumber before calculations and We do that using the `parseEther` function from `ethers.js`
    const _addEtherAmountWei = utils.parseEther(_addEther);

    // to get the ratio we use the math (amount of Crypto Dev tokens to be added) = (Eth that would be added * Crypto Dev tokens balance) / (Eth reserve in the contract)
    const cryptoDevTokenAmount = _addEtherAmountWei.mul(cdTokenReserve).div(etherBalanceContract);
    return cryptoDevTokenAmount;
};