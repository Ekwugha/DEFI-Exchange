import { Contract, utils } from "ethers";
import {EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS} from "../constants";

export const getAmountOfTokensReceivedFromSwap = async (_swapAmountWei, provider, ethSelected, ethBalance, reservedCD) => {
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, provider);

    let amountOfTokens;

    if(ethSelected) {
        // If `Eth` is selected this means our input value is `Eth` which means our input amount would be
        // `_swapAmountWei`, the input reserve would be the `ethBalance` of the contract and output reserve
        // would be the `Crypto Dev` token reserve
        amountOfTokens = await exchangeContract.getAmountOfTokens(_swapAmountWei, ethBalance, reservedCD);
    } else {
        // If `Eth` is not selected this means our input value is `Crypto Dev` tokens which means our input amount would be
        // `_swapAmountWei`, the input reserve would be the `Crypto Dev` token reserve of the contract and output reserve
        // would be the `ethBalance`
        amountOfTokens = await exchangeContract.getAmountOfTokens(_swapAmountWei, reservedCD, ethBalance);
    }
    return amountOfTokens;
}


export const swapTokens = async (signer, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected) => {
    const tokenContract = new Contract (TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, signer);
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, signer);

    let tx;
    
    if (ethSelected) {
        tx = await exchangeContract.ethToCryptoDevToken(tokenToBeReceivedAfterSwap, {
            value: swapAmountWei,
        });
    } else {
        tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, swapAmountWei.toString());
        await tx.wait();
        tx = await exchangeContract.cryptoDevTokenToEth(swapAmountWei, tokenToBeReceivedAfterSwap);
    }
    await tx.wait();
};