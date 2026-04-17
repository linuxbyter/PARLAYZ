import { useState } from "react";
import { X, Loader2, CheckCircle, Copy, LogOut } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// MetaMask fox icon (SVG inline)
function MetaMaskIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32.958 1L19.198 11.003l2.532-5.984L32.958 1z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.042 1l13.64 10.09-2.41-6.07L2.042 1z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.226 23.533l-3.66 5.607 7.84 2.157 2.25-7.638-6.43-.126z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.36 23.659l2.24 7.638 7.83-2.157-3.65-5.607-6.42.126z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.013 14.515l-2.19 3.313 7.81.35-.26-8.397-5.36 4.734z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.987 14.515l-5.43-4.82-.18 8.483 7.8-.35-2.19-3.313z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.43 29.14l4.71-2.28-4.06-3.17-.65 5.45z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.86 26.86l4.71 2.28-.64-5.45-4.07 3.17z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// WalletConnect icon
function WalletConnectIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 300 185" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M61.44 36.22c48.88-47.88 128.24-47.88 177.12 0l5.88 5.76a6.04 6.04 0 010 8.68l-20.12 19.72a3.17 3.17 0 01-4.42 0l-8.1-7.92c-34.1-33.4-89.4-33.4-123.5 0l-8.68 8.5a3.17 3.17 0 01-4.42 0L54.08 51.24a6.04 6.04 0 010-8.68l7.36-6.34zm218.7 40.76l17.9 17.54a6.04 6.04 0 010 8.68l-80.74 79.12a6.34 6.34 0 01-8.84 0l-57.3-56.14a1.59 1.59 0 00-2.22 0l-57.3 56.14a6.34 6.34 0 01-8.84 0L2.06 103.2a6.04 6.04 0 010-8.68l17.9-17.54a6.34 6.34 0 018.84 0l57.3 56.14c.6.6 1.62.6 2.22 0l57.3-56.14a6.34 6.34 0 018.84 0l57.3 56.14c.6.6 1.62.6 2.22 0l57.3-56.14a6.34 6.34 0 018.84 0z" fill="#3B99FC"/>
    </svg>
  );
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connected, address, balance, walletType, connecting, connect, disconnect } = useWallet();

  if (!isOpen) return null;

  async function handleConnect(type: "metamask" | "walletconnect") {
    await connect(type);
    toast.success("Wallet connected successfully");
  }

  function handleDisconnect() {
    disconnect();
    toast.success("Wallet disconnected");
    onClose();
  }

  function handleCopy() {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied");
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4">
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F1F]">
            <h2 className="text-sm font-bold text-white">
              {connected ? "Connected Wallet" : "Connect Wallet"}
            </h2>
            <button onClick={onClose} className="text-[#5A5A5A] hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5">
            {connected ? (
              /* Connected state */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A0A] border border-[#1F1F1F]">
                  <div className="w-8 h-8 rounded-lg bg-[#1F1F1F] flex items-center justify-center">
                    {walletType === "metamask" ? <MetaMaskIcon size={20} /> : <WalletConnectIcon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A]">
                      {walletType === "metamask" ? "MetaMask" : "WalletConnect"}
                    </p>
                    <p className="text-sm font-mono font-medium text-white truncate">
                      {address ? truncateAddress(address) : ""}
                    </p>
                  </div>
                  <button onClick={handleCopy} className="text-[#5A5A5A] hover:text-[#D4AF37] transition-colors">
                    <Copy size={14} />
                  </button>
                </div>

                {/* Balance chip */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#D4AF3710] border border-[#D4AF3730]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Balance</span>
                  <span className="text-base font-bold font-mono text-[#D4AF37]">{balance} ETH</span>
                </div>

                {/* Full address */}
                <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#1F1F1F]">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#5A5A5A] mb-1">Full Address</p>
                  <p className="text-[10px] font-mono text-[#A0A0A0] break-all">{address}</p>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#1F1F1F] text-[#5A5A5A] hover:text-red-400 hover:border-red-400/30 transition-all text-sm font-medium"
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              </div>
            ) : (
              /* Connect options */
              <div className="space-y-3">
                <p className="text-[11px] text-[#5A5A5A] mb-4">
                  Connect your wallet to place bets and track your positions on-chain.
                </p>

                {/* MetaMask */}
                <button
                  onClick={() => handleConnect("metamask")}
                  disabled={connecting}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                    "border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#E17726]/40 hover:bg-[#E1772608]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1F1F1F] flex items-center justify-center shrink-0">
                    {connecting ? <Loader2 size={20} className="animate-spin text-[#E17726]" /> : <MetaMaskIcon size={24} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">MetaMask</p>
                    <p className="text-[10px] text-[#5A5A5A]">Connect using browser extension</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-[#5A5A5A]" />
                </button>

                {/* WalletConnect */}
                <button
                  onClick={() => handleConnect("walletconnect")}
                  disabled={connecting}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                    "border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#3B99FC]/40 hover:bg-[#3B99FC08]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1F1F1F] flex items-center justify-center shrink-0">
                    {connecting ? <Loader2 size={20} className="animate-spin text-[#3B99FC]" /> : <WalletConnectIcon size={24} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">WalletConnect</p>
                    <p className="text-[10px] text-[#5A5A5A]">Scan QR with mobile wallet</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-[#5A5A5A]" />
                </button>

                <p className="text-[9px] text-[#3A3A3A] text-center pt-2">
                  Non-custodial · Your keys, your funds
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Missing import
function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
