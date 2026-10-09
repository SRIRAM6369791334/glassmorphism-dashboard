export type IconName = 'user' | 'mail' | 'lock' | 'eye' | 'eye-off' | 'arrow' | 'sparkles' | 'check'

export interface IconProps {
  name: IconName
  className?: string
  size?: number
}

export function Icon({ name, className, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === 'user' && (
        <>
          <circle cx="12" cy="7" r="3.5" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </>
      )}
      {name === 'mail' && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 6 9 7 9-7" />
        </>
      )}
      {name === 'lock' && (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
        </>
      )}
      {(name === 'eye' || name === 'eye-off') && (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {name === 'eye-off' && <path d="m3 3 18 18" />}
        </>
      )}
      {name === 'arrow' && <path d="M5 12h14m-5-5 5 5-5 5" />}
      {name === 'sparkles' && (
        <>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </>
      )}
      {name === 'check' && <polyline points="20 6 9 17 4 12" />}
    </svg>
  )
}

export default Icon
