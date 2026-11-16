import { cn } from '@/lib/utils'
export function LoadingSpinner({ size='md', className }: { size?:'sm'|'md'|'lg'; className?:string }) {
  const s = { sm:'w-4 h-4', md:'w-6 h-6', lg:'w-8 h-8' }
  return <div className={cn('border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin', s[size], className)} />
}
export function PageLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-[13px] text-[#5c5082]">Carregando...</span>
      </div>
    </div>
  )
}
