import type { SVGProps } from "react";

export type IconName =
  | "sparkles" | "store" | "film" | "home" | "tv" | "inbox" | "user-circle" | "gauge"
  | "sliders" | "org" | "users" | "user" | "file" | "settings" | "billing" | "search"
  | "bell" | "help" | "chevron-right" | "chevron-down" | "chevron-left" | "plus" | "pencil"
  | "trash" | "check" | "close" | "download" | "upload" | "link" | "play" | "bolt"
  | "calendar" | "globe" | "image" | "music" | "layers" | "logout" | "filter" | "dots"
  | "arrow-left" | "arrow-up-right" | "eye" | "clock" | "shield" | "menu" | "chart" | "sort";

const paths: Record<IconName, React.ReactNode> = {
  sparkles: <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" /><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" /></>,
  store: <><path d="M3 9l1.5-4.5h15L21 9" /><path d="M4 9v10.5h16V9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M9.5 19.5V14h5v5.5" /></>,
  film: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M7 5v14M17 5v14M2.5 12h19M2.5 8.5h4.5M2.5 15.5h4.5M17 8.5h4.5M17 15.5h4.5" /></>,
  home: <><path d="M4 10.5L12 4l8 6.5" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></>,
  tv: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 3l4 3 4-3" /><path d="M9 21h6" /></>,
  inbox: <><path d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" /><path d="M4 13h4l1.5 3h5L16 13h4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z" /></>,
  "user-circle": <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 19a6 6 0 0 1 11 0" /></>,
  gauge: <><circle cx="12" cy="12" r="9" /><path d="M12 12l4-3.5" /><path d="M12 4v1.5M4 12h1.5M18.5 12H20" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="17" r="2" /></>,
  org: <><rect x="9" y="3" width="6" height="5" rx="1.5" /><rect x="2.5" y="15" width="6" height="5" rx="1.5" /><rect x="15.5" y="15" width="6" height="5" rx="1.5" /><path d="M12 8v4M5.5 15v-2h13v2" /></>,
  users: <><circle cx="9" cy="9" r="3.2" /><path d="M3 19c.8-3 3.2-4.6 6-4.6S14.2 16 15 19" /><path d="M16 6.2a3.2 3.2 0 0 1 0 6.1M17.5 14.6c2 .6 3.4 2.1 3.9 4.4" /></>,
  user: <><circle cx="12" cy="8.5" r="3.6" /><path d="M4.5 20c1-3.6 4-5.6 7.5-5.6S18.5 16.4 19.5 20" /></>,
  file: <><path d="M6 3h7l5 5v13H6z" /><path d="M13 3v5h5" /><path d="M9 13h6M9 16.5h6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  billing: <><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19" /><path d="M6 14.5h4" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 4 1.2 5.5 2 6.4H4c.8-.9 2-2.4 2-6.4z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .9-1 1.6v.3" /><path d="M12 17h.01" /></>,
  "chevron-right": <path d="M9.5 5.5l6 6.5-6 6.5" />,
  "chevron-down": <path d="M5.5 9.5l6.5 6 6.5-6" />,
  "chevron-left": <path d="M14.5 5.5l-6 6.5 6 6.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  pencil: <><path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z" /><path d="M14.5 6.5l3 3" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  download: <><path d="M12 4v11" /><path d="M8 11.5l4 4 4-4" /><path d="M4.5 19.5h15" /></>,
  upload: <><path d="M12 20V9" /><path d="M8 12.5l4-4 4 4" /><path d="M4.5 4.5h15" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7L11.6 6.7" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 1 0 11 18.7l1.4-1.4" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 8.5l6 3.5-6 3.5z" /></>,
  bolt: <path d="M13 3L5 13.5h5l-1 7.5 8-10.5h-5L13 3z" />,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.7 3.7 5.7 3.7 9S14.5 18.3 12 21c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3z" /></>,
  image: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="8.5" cy="10" r="1.6" /><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" /></>,
  music: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  layers: <><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" /><path d="M3 12.5l9 4.5 9-4.5" /><path d="M3 17l9 4.5 9-4.5" /></>,
  logout: <><path d="M15 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" /><path d="M10 12h11" /><path d="M18 8.5l3.5 3.5L18 15.5" /></>,
  filter: <path d="M4 6h16l-6.5 7.5V20l-3-2v-4.5L4 6z" />,
  dots: <><circle cx="12" cy="5.5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="18.5" r="1.4" /></>,
  "arrow-left": <><path d="M20 12H4" /><path d="M9.5 6.5L4 12l5.5 5.5" /></>,
  "arrow-up-right": <><path d="M7 17L17 7" /><path d="M8.5 7H17v8.5" /></>,
  eye: <><path d="M2 12c1.6-4 5.5-6.5 10-6.5S20.4 8 22 12c-1.6 4-5.5 6.5-10 6.5S3.6 16 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.2 2" /></>,
  shield: <><path d="M12 3l7.5 3v6c0 4.4-3 8.1-7.5 9-4.5-.9-7.5-4.6-7.5-9V6L12 3z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  sort: <><path d="M7 4v16M7 20l-3-3M7 4l3 3" /><path d="M17 20V4M17 4l3 3M17 20l-3-3" /></>,
};

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

/** Single stroke-based icon set so the whole CMS shares one visual weight. */
export default function Icon({ name, size = 18, className = "", ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
