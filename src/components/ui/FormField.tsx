import { useState, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const labelCls = 'text-[13px] font-medium text-[var(--ink-faint)] mb-1.5 block'
const inputCls =
  'w-full h-11 px-4 bg-white border border-[var(--border)] rounded-[12px] text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-ghost)] focus:outline-none focus:border-[var(--acc)] focus:shadow-focus disabled:opacity-60 transition-shadow'
const selectCls =
  'w-full h-11 pl-4 pr-10 bg-white border border-[var(--border)] rounded-[12px] text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--acc)] focus:shadow-focus disabled:opacity-60 transition-shadow appearance-none bg-[length:14px] bg-[right_0.85rem_center] bg-no-repeat'

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className={labelCls}>
      {children}
      {hint && (
        <span className="font-normal text-[var(--ink-ghost)] ml-1">· {hint}</span>
      )}
    </label>
  )
}

export function FieldInput({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <div>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      <input {...props} className={cn(inputCls, className)} />
    </div>
  )
}

export function FieldTextarea({
  label,
  hint,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <div>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      <textarea
        {...props}
        className={cn(
          'w-full px-4 py-3 bg-white border border-[var(--border)] rounded-[12px] text-[14px] focus:outline-none focus:border-[var(--acc)] focus:shadow-focus resize-y',
          className
        )}
      />
    </div>
  )
}

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a97a8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

export function FieldSelect({
  label,
  hint,
  children,
  className,
  style,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string }) {
  return (
    <div>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      <select
        {...props}
        style={{ backgroundImage: selectChevron, ...style }}
        className={cn(selectCls, className)}
      >
        {children}
      </select>
    </div>
  )
}

export function PasswordInput({
  label,
  hint,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  hint?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={cn(inputCls, 'pr-10', className)}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export { inputCls, selectCls, labelCls }
