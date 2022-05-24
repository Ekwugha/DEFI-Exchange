import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { BigNumber, providers, utils } from "ethers";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { addLiquidity, calculateCD } from "../utils/addLiquidity";
import {getCDTokensBalance, getEtherBalance, getLPTokensBalance, getReserveOfCDTokens} from "../utils/getAmounts";
import {getTokensAfterRemove, removeLiquidity} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
  const web3ModalRef = useRef();
  const zero = BigNumber.from(0);
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [liquidityTab, setLiquidityTab] = useState(true);
   /************************************************************* Variables to keep track of amount ********************************************************/
  // `ethBalance` keeps track of the amount of Eth held by the user's account
  const [ethBalance, setEtherBalance] = useState(zero);
  // `reservedCD` keeps track of the Crypto Dev tokens Reserve balance in the Exchange contract
  const [reservedCD, setReservedCD] = useState(zero);
  // Keeps track of the ether balance in the contract
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  // cdBalance is the amount of `CD` tokens help by the users account
  const [cdBalance, setCDBalance] = useState(zero);
  // `lpBalance` is the amount of LP tokens held by the users account
  const [lpBalance, setLPBalance] = useState(zero);
  /************************************************************* Variables to keep track of swap functionality ********************************************************/
  // Amount that the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // This keeps track of the number of tokens that the user would receive after a swap completes
  const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] = useState(
    zero
  );
  // Keeps track of whether  `Eth` or `Crypto Dev` token is selected. If `Eth` is selected it means that the user
  // wants to swap some `Eth` for some `Crypto Dev` tokens and vice versa if `Eth` is not selected
  const [ethSelected, setEthSelected] = useState(true);
  /******************************************************** Variables to keep track of liquidity to be added or removed ***************************************************/
  // addEther is the amount of Ether that the user wants to add to the liquidity
  const [addEther, setAddEther] = useState(zero);
  // addCDTokens keeps track of the amount of CD tokens that the user wants to add to the liquidity
  // in case when there is no initial liquidity and after liquidity gets added it keeps track of the
  // CD tokens that the user can add given a certain amount of ether
  const [addCDTokens, setAddCDTokens] = useState(zero);
  // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  // removeCD is the amount of `Crypto Dev` tokens that would be sent back to the user based on a certain number of `LP` tokens
  // that he wants to withdraw
  const [removeCD, setRemoveCD] = useState(zero);
  // amount of LP tokens that the user wants to remove from liquidity
  const [removeLPTokens, setRemoveLPTokens] = useState("0");








  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }



  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  }


  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);



  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const _ethBalance = await getEtherBalance(provider, address);
      const _cdBalance = await getCDTokensBalance(provider, address);
      const _lpBalance = await getLPTokensBalance(provider, address);
      const _reservedCD = await getReserveOfCDTokens(provider);
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setCDBalance(_cdBalance);
      setLPBalance(_lpBalance);
      setReservedCD(_reservedCD);
      setReservedCD(_reservedCD);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (error) {
      console.error(error);
    }
  }



  // This function Returns the number of Eth/Crypto Dev tokens that can be received when the user swaps `_swapAmountWEI` amount of Eth/Crypto Dev tokens.
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
        const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
        if (!_swapAmountWEI.eq(zero)) {
          const provider = await getProviderOrSigner();
          const _ethBalance = await getEtherBalance(provider);
          const amountOfTokens = await getAmountOfTokensReceivedFromSwap(_swapAmountWEI, provider, ethSelected, _ethBalance, reservedCD);
          settokenToBeReceivedAfterSwap(amountOfTokens);
        } else {
          settokenToBeReceivedAfterSwap(zero);
        }
    } catch (error) {
      console.error(error);
    }
  }



  // This function Swaps  `swapAmountWei` of Eth or Crypto Dev tokens with `tokenToBeReceivedAfterSwap` amount of Eth or Crypto Dev tokens.
  const _swapTokens = async () => {
    try {
      const swapAmountWei = utils.parseEther(swapAmount);
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await swapTokens(signer, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected);
        setLoading(false);
        // Get all the updated amounts after the swap
        await getAmounts();
        setSwapAmount("");
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setSwapAmount("");
    }
  };



  const _addLiquidity = async () => {
    try {
      const addEtherWei = utils.parseEther(addEther.toString());
      if (!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await addLiquidity(signer, addCDTokens, addEtherWei);
        setLoading(false);
        // Reinitialize the CD tokens
        setAddCDTokens(zero);
        await getAmounts();
      }else {
        setAddCDTokens(zero);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setAddCDTokens(zero);
    }
  }



  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      const _ethBalance = await getEtherBalance(provider, null, true);
      const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
      const { _removeEther, _removeCD } = await getTokensAfterRemove(provider, removeLPTokenWei, _ethBalance, cryptoDevTokenReserve);
      setRemoveEther(_removeEther);
      setRemoveCD(_removeCD);
    } catch (error) {
      console.error(error);
    }
  }



  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveCD(zero);
      setRemoveEther(zero);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setRemoveCD(zero);
      setRemoveEther(zero);
    }
  };



  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    };

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    
    if (liquidityTab) {
      return (
        <div>
          <div className={styles.description}>
            You have:
            <br />
            {/* Converted the BigNumber to string using the formatEther function from ethers.js */}
            {utils.formatEther(cdBalance)} Crypto Dev Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Crypto Dev LP tokens
          </div>
          <div>
            {utils.parseEther(reservedCD.toString()).eq(zero) ? (
              <div>
                <input 
                  type="number" 
                  placeholder="Amount of Ether" 
                  onChange={(e) => 
                    setAddEther(
                      e.target.value || "0"
                    )
                  } 
                  className={styles.input} 
                />
                <input 
                  type="number" 
                  placeholder="Amount of CryptoDev tokens"
                  onChange={(e) => 
                    setAddCDTokens(
                      BigNumber.from(utils.parseEther((e.target.value || "0")))
                    )
                  }
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input 
                  type="number" 
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    // calculate the number of CD tokens that
                    // can be added given  `e.target.value` amount of Eth
                    const _addCDTokens = await calculateCD(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedCD
                    );
                    setAddCDTokens(_addCDTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {`You will need ${utils.formatEther(addCDTokens)} Crypto Dev Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input 
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  // Calculate the amount of Ether and CD tokens that the user would receive
                  // After he removes `e.target.value` amount of `LP` tokens
                  await _getTokensAfterRemove(e.target.value || "0");
                }} 
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {`You will get ${utils.formatEther(removeCD)} Crypto Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input 
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would receive after the swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }} 
            className={styles.input}
            value={swapAmount}
          />
          <select 
            className={styles.select} 
            name="dropdown" 
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="cryptoDevToken">Crypto Dev Token</option>
          </select>
          <br />
          <div className={styles.inputDiv}>
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Crypto Dev Tokens`
              : `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
            )} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };




  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="DEFI-Exchange" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs Exchange</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Crypto Dev Tokens
          </div>
          <div>
            <button className={styles.button} onClick={() => {
              setLiquidityTab(!liquidityTab);
            }}>
              Liquidity
            </button>
            <button className={styles.button} onClick={() => {
              setLiquidityTab(false);
            }}>
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" alt="cryptodevs-image" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Elo
      </footer>
    </div>
  )
};
