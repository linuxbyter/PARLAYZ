import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, Sparkles, ChevronRight } from "lucide-react";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();
  const { items, toggleSlip, isOpen } = useBetSlip();

  const navLinks = [
    { href: "/", label: "Markets", icon: LayoutDashboard },
    { href: "/history", label: "History", icon: History },
    { href: "/parlay", label: "AI Parlay", icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-black/95 backdrop-blur-md border-t border-[#1F1F1F]">
      <div className="flex items-center justify-around h-16 px-2">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              location === href
                ? "text-[#D4AF37]"
                : "text-[#5A5A5A]"
            )}
          >
            <Icon size={18} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
          </Link>
        ))}

        {/* Bet Slip tab */}
        <button
          onClick={toggleSlip}
          className={cn(
            "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
            isOpen ? "text-[#D4AF37]" : "text-[#5A5A5A]"
          )}
        >
          <div className="relative">
            <ChevronRight size={18} />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 text-[8px] font-bold bg-[#D4AF37] text-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">Slip</span>
        </button>
      </div>
    </nav>
  );
}
