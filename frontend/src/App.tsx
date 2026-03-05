import {React, useMemo, useState} from 'react';
import {
  BaseError,
  ContractFunctionExecutionError,
  ContractFunctionReveredError,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type EIP1193Provider,

} from "viem":

import { PrivateKeyAccount } from 'viem';
import {hardhat} from "viem/chains";

import helloWorld from "./contracts/HelloWorld.json";
import { privateKeyToAccount } from 'viem/accounts';

declare global {
  interface Window{
    ethereum?: EIP1193Provider;
  }
}

export default function App() {
    const [account, setAccount] = useState<`0${string}` | null> (null);
    const [message, setMessage] = useState<string>("");
    const [newMessage, setNewMessage] = useState<string>("");
    const [status, setStatus] = useState<string>("");

    const publicClient = useMemo(
      () =>
        createPublicClient({
          chain: hardhat,
          transport: http("http://127.0.0.1:8545"),
        })
    )

    const injectedWalletClient = useMemo(() => {
      if (!window.ethereum) return null;
      return createWalletClient({
        chain: hardhat,
        transport: custom(window.ethereum)
      });
    }, []);

    const localDevAccount = useMemo(() => {
      const key = import.meta.env.VITE_DEV_PRIVATE_KEY;
      if(!key) return null;
      if(!key.startsWith("0x")) return null;

      try {
        return privateKeyToAccount(key as `0x${string}`);
      } catch {
        return null;
      }
    }, []);

    const localWalletClient = useMemo(() =>{
      if(!localDevAccount)return null;
      return createWalletClient({
        account: localDevAccount,
        chain: hardhat,
        transport: http("http://127.0.0.1:8545"),
      });
    }, [localDevAccount]);

    const walletClient = localWalletClient ?? injectedWalletClient;

    const contractAddress = helloWorld.address as `0x${string}`;
    const contractAbi = helloWorld.abi;
    const hardhatChainIdHe = "0x7a69";

    function getErrorMessage(error:unknown): string{
      if(error instanceof BaseError) {
        const reverted = error.walk((e) => e instanceof ContractFunctionReveredError);
        if (reverted instanceof ContractFunctionReveredError){
          return reverted.shortMessage;
        }

        const execution = error.walk((e) => e instanceof ContractFunctionExecutionError);
        if (execution instanceof ContractFunctionExecutionError){
          return execution.shortMessage;
        }
        return error.shortMessage;
      }

      return error instanceof Error ? error.message : String(error);
    }

    async function  ensureHardhatNetwork(): Promise<void> {
      if(!window.ethereum) return;

      const currentChainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) string;
      
      if(currentChainId ===hardhatChainIdHex) return;

      try {
        await window.ethereum.request({
          method: "wallet_swithEthereumChain",
          params:[{chainId: hardhatChainIdHex}],
        });
      } catch (error: unknown){
        const code= 
        typeof error ==="object" &&
        error !== null &&
        "code" in error &&
        typeof(error as {code?: unknown}).code ==="number"
        ? (error as {code: number}).code
        : undefined;

        if (code ===4902){
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params:[
              {
                
              }
            ]
          })
        }
      }
      
    }
  return (
    
    <div>App</div>
  )
}
