"use client";
import { useState } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi";
import { WalletConnectButton } from "../wallet-connect-button";
import { useSolana } from "../solana-provider";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const segment = useSelectedLayoutSegment();
  const { isConnected } = useSolana();

  const navLinks = isConnected
    ? [
        { href: "/deck", label: "Decks", segment: "deck" },
        { href: "/contests", label: "Contests", segment: "contests" },
        { href: "/profile", label: "Profile", segment: "profile" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200">
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#cc2229] to-[#ff5b61] text-white font-bold text-xl group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="text-xl font-bold text-zinc-700 group-hover:text-[#cc2229] transition-colors">
            Arbitron
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium transition-all duration-300 ${
                segment === link.segment
                  ? "text-[#cc2229] after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[2px] after:bg-[#cc2229] after:rounded-full"
                  : "text-zinc-600 hover:text-[#cc2229]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <WalletConnectButton />
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden p-2 rounded-md hover:bg-zinc-100 transition"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-zinc-200 shadow-sm">
          <div className="flex flex-col space-y-2 py-4 px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  segment === link.segment
                    ? "text-[#cc2229]"
                    : "text-zinc-600 hover:text-[#cc2229]"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <WalletConnectButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
