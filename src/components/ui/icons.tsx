import type { SVGProps } from 'react'

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const DashboardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)

export const ChallengeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M5 21V4" />
    <path d="M5 4h13l-3 4 3 4H5" />
  </svg>
)

export const HabitGridIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 2v4M16 2v4" />
  </svg>
)

export const WatchlistIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M6 3h12v18l-6-4-6 4Z" />
  </svg>
)

export const ProfileIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
  </svg>
)

export const FriendsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.8 20c1.2-3.4 3.7-5 6.2-5s5 1.6 6.2 5" />
    <circle cx="17" cy="7" r="2.4" />
    <path d="M15.5 12.2c2 .2 3.9 1.7 4.8 4.3" />
  </svg>
)

export const SignOutIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
)

export const SunIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
)

export const MoonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

export const ArrowUpIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5 15 12 8l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ArrowDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ChevronLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

export const ChevronRightIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)

export const EditIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

export const DeleteIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
)

export const FireIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M12 22c4-1 6-4 6-7.5 0-2-1-3.5-2-4.5.3 1.5-.3 2.5-1 3 .5-3-1-5.5-3.5-7 .5 2-.5 3.5-2 5C7.7 12.5 6 14 6 16.5 6 19.5 8.5 22 12 22Z" />
  </svg>
)

export const TargetIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
)

export const TrophyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
    <path d="M8 5H5a2 2 0 0 0 0 4h1.5M16 5h3a2 2 0 0 1 0 4h-1.5" />
    <path d="M10 16v2h4v-2M9 21h6" />
  </svg>
)

export const CheckCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2 2 5-5" />
  </svg>
)

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3-3" />
  </svg>
)

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
  </svg>
)

export const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4.6a7.6 7.6 0 0 0-1.7-1L14.8 3h-3.6l-.5 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-.6-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-.6a7.6 7.6 0 0 0 1.7 1l.5 2.6h3.6l.5-2.6a7.6 7.6 0 0 0 1.7-1l2.4.6 2-3.4Z" />
  </svg>
)

export const DragHandleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="8" cy="6" r="1.6" />
    <circle cx="8" cy="12" r="1.6" />
    <circle cx="8" cy="18" r="1.6" />
    <circle cx="16" cy="6" r="1.6" />
    <circle cx="16" cy="12" r="1.6" />
    <circle cx="16" cy="18" r="1.6" />
  </svg>
)

export const LayoutEditIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="5" rx="1.5" />
    <rect x="13" y="10" width="8" height="11" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <path d="M16.5 15.5 21 20M21 15.5v4.5h-4.5" />
  </svg>
)

export const EyeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const EyeOffIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M2 12s3.5-7 10-7c1.7 0 3.2.4 4.5 1M22 12s-3.5 7-10 7c-1.7 0-3.2-.4-4.5-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="M3 3l18 18" />
  </svg>
)

// Sigilli dei Ranghi Samurai (usati da AvatarFrame)
export const RankRoninIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 2 L13.5 9.2 L12 12.4 L10.5 9.2 Z" fill="currentColor" />
    <line x1="12" y1="12.4" x2="12" y2="18.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="8.8" y1="13.6" x2="15.2" y2="13.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="12" cy="19.6" r="1.15" fill="currentColor" />
  </svg>
)

export const RankAshigaruIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 3 L18 5.4 V11 C18 15.6 15.3 18.8 12 20.1 C8.7 18.8 6 15.6 6 11 V5.4 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <line x1="12" y1="5.6" x2="12" y2="17.6" stroke="currentColor" strokeWidth="1.1" />
    <line x1="8.2" y1="9" x2="15.8" y2="9" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
  </svg>
)

export const RankSamuraiIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="5" y1="19.5" x2="19" y2="4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="19" y1="19.5" x2="5" y2="4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)

export const RankDaimyoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" />
    <path d="M12 4.8 L19.2 12 L12 19.2 L4.8 12 Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
)

// Icone Tipo Media (Watchlist)
export const MediaVideoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 9.5V18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M4 9.5 5.2 5h13.6L20 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M7 5 8.4 9.5M11.5 5 12.9 9.5M16 5 17.4 9.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

export const MediaBookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 6.5c-1.8-1.5-4.6-1.9-7.4-1.5v12.5c2.8-.4 5.6 0 7.4 1.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M12 6.5c1.8-1.5 4.6-1.9 7.4-1.5v12.5c-2.8-.4-5.6 0-7.4 1.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <line x1="12" y1="6.5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

export const MediaMangaIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3.4" y="4" width="12" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="8.6" y="11" width="12" height="9" rx="1.2" fill="var(--color-ink)" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6.6" cy="7.4" r="1" fill="currentColor" />
    <path d="M4.6 11 8 8 11 10.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
  </svg>
)

export const MediaAudiobookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 13.5V12a8 8 0 0 1 16 0v1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="3" y="13" width="3.4" height="6.2" rx="1.2" fill="currentColor" />
    <rect x="17.6" y="13" width="3.4" height="6.2" rx="1.2" fill="currentColor" />
  </svg>
)

export const MediaGameIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M6.5 9h11a3.5 3.5 0 0 1 3.5 3.5V16a2 2 0 0 1-3.4 1.4L15.5 15h-7l-2.1 2.4A2 2 0 0 1 3 16v-3.5A3.5 3.5 0 0 1 6.5 9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <line x1="7.2" y1="12.5" x2="9.6" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="8.4" y1="11.3" x2="8.4" y2="13.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="16" cy="12" r="0.9" fill="currentColor" />
    <circle cx="18" cy="13.5" r="0.9" fill="currentColor" />
  </svg>
)

export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5 12.5 9.5 17 19 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const RankShogunIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M4.2 14.2 C4.2 8.2 7.6 4 12 4 C16.4 4 19.8 8.2 19.8 14.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M4.2 14.2 L2.4 10.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M19.8 14.2 L21.6 10.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4.2 14.2 H19.8 L17.6 18 H6.4 Z" fill="currentColor" opacity="0.92" />
    <circle cx="12" cy="9.4" r="1.3" fill="currentColor" />
  </svg>
)
