import { Contract } from "ethers";
import {EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS} from "../constants";

export const getEtherBalance = async (provider, address, contract = false) => {
    try {
    // If the caller has set the `contract` boolean to true, retrieve the balance of ether in the `exchange contract`, if it is set to false, retrieve the balance of the user's address
        if (contract) {
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
            return balance;
        } else {
            const balance = await provider.getBalance(address);
            return balance;
        }

    } catch (error) {
        console.error(error);
        return 0;
    };
};


// gets the Crypto Dev tokens in the account of the provided `address` i.e the users address
export const getCDTokensBalance = async (provider, address) => {
    try {
        const tokenContract = new Contract(TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, provider);
        const balanceOfCryptoDevTokens = await tokenContract.balanceOf(address);
        return balanceOfCryptoDevTokens;
    } catch (error) {
        console.error(error);
    };
};


// gets the LP tokens in the account of the provided `address` i.e the users address
export const getLPTokensBalance = async (provider, address) => {
    try {
        const exchangeContract = new Contract(EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, provider);
        const balanceOfLPTokens = await exchangeContract.balanceOf(address);
        return balanceOfLPTokens;
    } catch (error) {
        console.error(error);
    };
};


// gets the amount of CD tokens in the exchange contract address
export const getReserveOfCDTokens = async (provider) => {
    try {
        const exchangeContract = new Contract(EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, provider);
        const reserve = await exchangeContract.getReserve();
        return reserve;
    } catch (error) {
        console.error(error);
    };
};