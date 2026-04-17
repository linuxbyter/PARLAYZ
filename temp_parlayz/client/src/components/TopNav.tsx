import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, Sparkles, Wallet, ChevronRight } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useBetSlip } from "@/contexts/BetSlipContext";
import WalletModal from "./WalletModal";
import { cn } from "@/lib/utils";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663565039763/gMt3JNrEnd5nRXvdNX4kUT/parlayz-logo-horizontal-JMxvKSvCoNtpVDUgv4xsoJ.webp";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function TopNav() {
  const [walletOpen, setWalletOpen] = useState(false);
  const { connected, address, balance } = useWallet();
  const { items, toggleSlip, isOpen } = useBetSlip();
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Markets", icon: LayoutDashboard },
    { href: "/history", label: "History", icon: History },
    { href: "/parlay", label: "Parlay AI", icon: Sparkles },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-[#1F1F1F]">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img
              src={LOGO_URL}
              alt="PARLAYZ"
              className="h-7 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                  location === href
                    ? "text-[#D4AF37] bg-[#D4AF3712]"
                    : "text-[#5A5A5A] hover:text-white hover:bg-[#1A1A1A]"
                )}
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Bet Slip toggle */}
            <button
              onClick={toggleSlip}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all",
                isOpen
                  ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF3712]"
                  : "border-[#1F1F1F] text-[#A0A0A0] hover:border-[#2A2A2A] hover:text-white"
              )}
            >
              <ChevronRight size={12} />
              <span className="hidden sm:inline">Slip</span>
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-[#D4AF37] text-black rounded-full w-4 h-4 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>

            {/* Wallet */}
            {connected ? (
              <button
                onClick={() => setWalletOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D4AF3730] bg-[#D4AF3710] hover:border-[#D4AF37] transition-all"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-[11px] font-mono font-bold text-[#D4AF37] hidden sm:block">
                  {truncateAddress(address!)}
                </span>
                <span className="text-[10px] font-mono text-[#A0A0A0] hidden md:block">
                  {parseFloat(balance!).toFixed(3)} ETH
                </span>
              </button>
            ) : (
              <button
                onClick={() => setWalletOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-black text-[11px] font-bold hover:bg-[#E5C84A] transition-all"
              >
                <Wallet size={12} />
                <span className="hidden sm:inline">Connect</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}
