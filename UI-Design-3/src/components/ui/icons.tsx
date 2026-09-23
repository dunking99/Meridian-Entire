type P = { className?: string; size?: number };

const base = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconCompass = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5Z" />
  </svg>
);
export const IconPie = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3a9 9 0 1 0 9 9h-9Z" />
    <path d="M15 3.5A9 9 0 0 1 20.5 9H15Z" />
  </svg>
);
export const IconCandles = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 4v3M7 17v3M17 3v4M17 15v6" />
    <rect x="4.5" y="7" width="5" height="10" rx="1" />
    <rect x="14.5" y="7" width="5" height="8" rx="1" />
  </svg>
);
export const IconNews = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 5h12v14H5a1 1 0 0 1-1-1Z" />
    <path d="M16 9h4v8a2 2 0 0 1-4 0Z" />
    <path d="M7 8.5h6M7 12h6M7 15.5h4" />
  </svg>
);
export const IconFlask = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M10 3h4M10.5 3v6L5 18.2A2 2 0 0 0 6.7 21h10.6a2 2 0 0 0 1.7-2.8L13.5 9V3" />
    <path d="M7.5 14h9" />
  </svg>
);
export const IconPen = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17Z" />
    <path d="M15 6l3 3" />
  </svg>
);
export const IconGear = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 14H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.6V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.5 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </svg>
);
export const IconSearch = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconEye = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);
export const IconEyeOff = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.3 8.2A16.7 16.7 0 0 0 2 12s3.6 6 10 6a9.8 9.8 0 0 0 4-.8" />
    <path d="M9.8 10a3 3 0 0 0 4.2 4.2" />
  </svg>
);
export const IconArrow = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconChevron = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const IconAlert = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4M12 17h.01" />
  </svg>
);
export const IconSpark = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3 13.9 9.3 20 11l-6.1 1.7L12 19l-1.9-6.3L4 11l6.1-1.7Z" />
  </svg>
);
export const IconCalendar = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);
export const IconDownload = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v11M7.5 10 12 14.5 16.5 10M4 19.5h16" />
  </svg>
);
export const IconFilter = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 5.5h17l-6.5 7.5v6l-4 2v-8Z" />
  </svg>
);
export const IconX = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 6 18 18M18 6 6 18" />
  </svg>
);
export const IconCheck = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);
export const IconScale = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v18M7 21h10M4 8h16M4 8l-2.5 6a3.5 3.5 0 0 0 5 0Zm16 0-2.5 6a3.5 3.5 0 0 0 5 0Z" />
    <path d="M12 5.5 4 8m8-2.5L20 8" />
  </svg>
);
export const IconCoins = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <ellipse cx="9" cy="7" rx="5.5" ry="2.8" />
    <path d="M3.5 7v4.5c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8V7" />
    <path d="M9.5 14.2v2.3c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8V12" />
    <ellipse cx="15" cy="12" rx="5.5" ry="2.8" />
  </svg>
);
export const IconLayers = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m12 3 9 5-9 5-9-5Z" />
    <path d="m3.5 12.5 8.5 4.7 8.5-4.7M3.5 16.8l8.5 4.7 8.5-4.7" />
  </svg>
);
export const IconActivity = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </svg>
);
export const IconTarget = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);
