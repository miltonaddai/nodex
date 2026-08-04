import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TokenAvatarProps {
  imageUrl?: string
  symbol: string
  fallbackClassName?: string
  className?: string
}

function normalizeImageUrl(value?: string): string | null {
  const url = value?.trim()
  if (!url) return null

  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.slice('ipfs://'.length).replace(/^ipfs\//, '')}`
  }

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
}

export function TokenAvatar({
  imageUrl,
  symbol,
  fallbackClassName,
  className,
}: TokenAvatarProps) {
  const normalizedUrl = normalizeImageUrl(imageUrl)
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [normalizedUrl])

  const showImage = Boolean(normalizedUrl) && !failed

  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white',
        showImage ? 'bg-white/10' : fallbackClassName,
        className
      )}
    >
      {showImage ? (
        <img
          src={normalizedUrl!}
          alt={`${symbol} token logo`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        symbol.charAt(0) || '?'
      )}
    </div>
  )
}
