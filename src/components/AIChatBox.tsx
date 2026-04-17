"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, Send, User, Sparkles } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

export interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

interface AIChatBoxProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
  height?: string
  emptyStateMessage?: string
  suggestedPrompts?: string[]
}

export default function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Ask about parlays, odds, or betting strategies...",
  className,
  height = "500px",
  emptyStateMessage = "Ask me anything about sports betting",
  suggestedPrompts = [
    "What's a good parlay for tonight?",
    "Explain positive expected value",
    "How does parlay insurance work?",
  ],
}: AIChatBoxProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const displayMessages = messages.filter((msg) => msg.role !== "system")

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    onSendMessage(trimmed)
    setInput("")
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl overflow-hidden",
        className
      )}
      style={{ height }}
    >
      <div ref={scrollRef} className="flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col p-6">
            <div className="flex flex-col items-center justify-center flex-1 gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[var(--gold-muted)] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[var(--gold)]" />
              </div>
              <p className="text-sm text-[var(--black-dim)]">{emptyStateMessage}</p>

              {suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className="rounded-lg border border-[var(--black-border)] bg-[var(--black-soft)] px-4 py-2 text-xs font-medium text-[var(--black-dim)] transition-all hover:border-[var(--gold)]/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto p-4 space-y-4">
            {displayMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[var(--gold)]" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-[var(--gold)] text-black"
                      : "bg-[var(--black-border)] text-white"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-[var(--black-border)] flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--black-dim)]" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[var(--gold)]" />
                </div>
                <div className="rounded-2xl bg-[var(--black-border)] px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--black-dim)]" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t border-[var(--black-border)] bg-[var(--black-soft)]"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--black-dim)] resize-none focus:outline-none focus:border-[var(--gold)] transition-colors max-h-32"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="h-auto bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
