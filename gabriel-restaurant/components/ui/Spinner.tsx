import { clsx } from 'clsx'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
    />
  )
}
