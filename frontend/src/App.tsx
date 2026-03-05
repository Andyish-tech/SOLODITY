import { useEffect, useMemo, useState } from "react";
import {
  BaseError,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type EIP1193Provider,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

import helloWorld from "./contracts/HelloWorld.json";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export default function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [message, setMessage] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: hardhat,
        transport: http("http://127.0.0.1:8545"),
      }),
    []
  );

  const injectedWalletClient = useMemo(() => {
    if (!window.ethereum) return null;
    return createWalletClient({
      chain: hardhat,
      transport: custom(window.ethereum),
    });  
  }, []);

  const localDevAccount = useMemo(() => {
    const key = import.meta.env.VITE_DEV_PRIVATE_KEY;
    if (!key) return null;
    if (!key.startsWith("0x")) return null;

    try {
      return privateKeyToAccount(key as `0x${string}`);
    } catch {
      return null;
    }
  }, []);

  const localWalletClient = useMemo(() => {
    if (!localDevAccount) return null;
    return createWalletClient({
      account: localDevAccount,
      chain: hardhat,
      transport: http("http://127.0.0.1:8545"),
    });
  }, [localDevAccount]);

  const walletClient = localWalletClient ?? injectedWalletClient;

  const contractAddress = helloWorld.address as `0x${string}`;
  const contractAbi = helloWorld.abi;
  const hardhatChainIdHex = "0x7a69";

  function getErrorMessage(error: unknown): string {
    if (error instanceof BaseError) {
      const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
      if (reverted instanceof ContractFunctionRevertedError) {
        return reverted.shortMessage;
      }

      const execution = error.walk((e) => e instanceof ContractFunctionExecutionError);
      if (execution instanceof ContractFunctionExecutionError) {
        return execution.shortMessage;
      }

      return error.shortMessage;
    }

    return error instanceof Error ? error.message : String(error);
  }

  async function ensureHardhatNetwork(): Promise<void> {
    if (!window.ethereum) return;

    const currentChainId = (await window.ethereum.request({
      method: "eth_chainId",
    })) as string;

    if (currentChainId === hardhatChainIdHex) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hardhatChainIdHex }],
      });
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "number"
          ? (error as { code: number }).code
          : undefined;

      if (code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hardhatChainIdHex,
              chainName: "Hardhat Local",
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["http://127.0.0.1:8545"],
            },
          ],
        });
        return;
      }

      throw error;
    }
  }

  async function connect() {
    if (localDevAccount) {
      setAccount(localDevAccount.address);
      setStatus("Using local dev private key signer.");
      return;
    }

    if (window.ethereum) {
      await ensureHardhatNetwork();

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as `0x${string}`[];

      const [addr] = accounts;
      setAccount(addr);
      setStatus("Connected with MetaMask.");
      return;
    }

    alert(
      "No signer found. Install MetaMask or set VITE_DEV_PRIVATE_KEY in frontend/.env.local."
    );
  }

  async function refresh() {
    try {
      const current = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "get",
      });
      setMessage(current as string);
    } catch (error: unknown) {
      setStatus(`Read failed: ${getErrorMessage(error)}`);
    }
  }

  async function updateMessage() {
    try {
      if (!walletClient || !account) {
        setStatus("Connect wallet first.");
        return;
      }

      setStatus("Sending transaction...");
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "set",
        args: [newMessage],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      setStatus("Updated!");
      setNewMessage("");
      await refresh();
    } catch (error: unknown) {
      setStatus(`Write failed: ${getErrorMessage(error)}`);
    }
  }

  useEffect(() => {
    if (!window.ethereum && localDevAccount) {
      setAccount(localDevAccount.address);
      setStatus("Using local dev private key signer.");
    }

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDevAccount]);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>HelloWorld DApp (Hardhat + viem)</h1>

      <div style={{ marginBottom: 16 }}>
        <button onClick={connect}>
          {account
            ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
            : localDevAccount
              ? "Use Local Dev Signer"
              : window.ethereum
                ? "Connect MetaMask"
                : "No Signer"}
        </button>
      </div>

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <p>
          <b>Contract:</b> {helloWorld.address}
        </p>
        <p>
          <b>Current message:</b> {message || "(empty)"}
        </p>

        <button onClick={refresh} style={{ marginBottom: 16 }}>
          Refresh
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a new message..."
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={updateMessage}>Set</button>
        </div>

        {status && <p style={{ marginTop: 12 }}>{status}</p>}
      </div>
    </div>
  );
}