import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const showLabel = label !== ''
  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar"
      className="flex items-center gap-1 px-1.5 h-6 border border-[var(--border)] rounded-md text-[12px] text-[var(--ink-ghost)] hover:border-[var(--acc-border)] hover:text-[var(--acc)] transition-colors shrink-0"
    >
      {copied ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3" />}
      {showLabel && (label ?? (copied ? 'Copiado!' : 'Copiar'))}
    </button>
  )
}
