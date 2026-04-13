'use client'

import { useState } from 'react'
import { Menu, X, Plug, BookOpen, HelpCircle, FileText, Globe, Github, MessageCircle, Instagram, Languages, Moon, Twitter } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

const menuItems = [
  { icon: Plug, label: 'APIs', href: '/docs' },
  { icon: BookOpen, label: 'Accuracy', href: '/accuracy' },
  { icon: BookOpen, label: 'Documentation', href: '/docs' },
  { icon: HelpCircle, label: 'Help Center', href: '/docs' },
  { icon: FileText, label: 'Terms of Use', href: '/terms' },
]

const socialLinks = [
  { icon: Twitter, label: 'X', href: 'https://x.com/parlayz' },
  { icon: MessageCircle, label: 'Discord', href: 'https://discord.gg/parlayz' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/parlayz' },
]

export function SidebarMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-[#8B8B8B] hover:text-[#C9A84C] transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0a0a0a] border-l border-[#222222] overflow-y-auto">
            <div className="p-4 border-b border-[#222222] flex items-center justify-between">
              <span className="font-bold text-white">More</span>
              <button onClick={() => setIsOpen(false)} className="text-[#8B8B8B] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[#8B8B8B] hover:text-white hover:bg-[#141414] rounded-lg transition"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="p-4 border-t border-[#222222]">
              <div className="flex items-center justify-between">
                <span className="text-[#8B8B8B] text-sm">Language</span>
                <div className="flex items-center gap-2 text-white">
                  <Globe className="w-4 h-4" />
                  <span>English</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#222222]">
              <div className="flex items-center justify-between">
                <span className="text-[#8B8B8B] text-sm">Dark Mode</span>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition ${darkMode ? 'bg-[#C9A84C]' : 'bg-[#222222]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-[#222222]">
              <div className="flex items-center justify-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[#8B8B8B] hover:text-[#C9A84C] transition"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>

            <div className="p-4 border-t border-[#222222]">
              <SignedOut>
                <div className="space-y-2">
                  <SignInButton mode="modal">
                    <button className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded-lg hover:bg-[#B8860B] transition">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <button className="w-full bg-[#141414] border border-[#222222] text-white font-bold py-3 rounded-lg hover:border-[#C9A84C] transition">
                      Sign Up
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
            </div>

            <div className="p-4 border-t border-[#222222]">
              <SignedIn>
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Your Account</p>
                    <Link href="/wallet" className="text-[#C9A84C] text-sm hover:underline">
                      View Wallet
                    </Link>
                  </div>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}