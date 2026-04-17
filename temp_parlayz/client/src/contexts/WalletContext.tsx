import React, { createContext, useContext, useState, useCallback } from "react";

export type WalletType = "metamask" | "walletconnect" | null;

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
  walletType: WalletType;
  connecting: boolean;
}

interface WalletContextValue extends WalletState {
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// Mock addresses for demo
const MOCK_ADDRESSES = [
  "0x742d35Cc6634C0532925a3b8D4C9E2b3F1a8E4d2",
  "0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C",
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    balance: null,
    walletType: null,
    connecting: false,
  });

  const connect = useCallback(async (type: WalletType) => {
    setState((s) => ({ ...s, connecting: true }));
    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 1200));
    const addr = MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];
    const bal = (Math.random() * 4 + 0.5).toFixed(4);
    setState({
      connected: true,
      address: addr,
      balance: bal,
      walletType: type,
      connecting: false,
    });
  }, []);

  const disconnect = useCallback(() => {
    setState({
      connected: false,
      address: null,
      balance: null,
      walletType: null,
      connecting: false,
    });
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
