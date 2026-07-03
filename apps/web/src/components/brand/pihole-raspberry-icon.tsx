/** Stylized raspberry mark for Pi-hole navigation (not Pi-hole trademark). Copied from Asgard. */
export function PiholeRaspberryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pi-hole"
      className={className}
    >
      <title>Pi-hole</title>
      <path
        fill="currentColor"
        d="M12 2.5c-.4 0-.8.2-1 .5L8.2 6.2a1 1 0 0 0 .2 1.4l1.1.9-1.8 1.1a1 1 0 0 0-.3 1.4l.8 1.3-1.5.6a1 1 0 0 0-.5 1.2l.5 1.6a1 1 0 0 0 1.1.7h11.4a1 1 0 0 0 1.1-.7l.5-1.6a1 1 0 0 0-.5-1.2l-1.5-.6.8-1.3a1 1 0 0 0-.3-1.4l-1.8-1.1 1.1-.9a1 1 0 0 0 .2-1.4L13 3c-.2-.3-.6-.5-1-.5Z"
        opacity="0.35"
      />
      <ellipse cx="12" cy="14.5" rx="6.5" ry="7" fill="currentColor" />
      <circle cx="9" cy="12.5" r="1.1" fill="currentColor" opacity="0.55" />
      <circle cx="12" cy="11.5" r="1.1" fill="currentColor" opacity="0.55" />
      <circle cx="15" cy="12.5" r="1.1" fill="currentColor" opacity="0.55" />
      <circle cx="10" cy="15" r="1.1" fill="currentColor" opacity="0.55" />
      <circle cx="14" cy="15" r="1.1" fill="currentColor" opacity="0.55" />
      <circle cx="12" cy="16.5" r="1.1" fill="currentColor" opacity="0.55" />
      <path
        fill="currentColor"
        d="M10.5 3.2c.8-.9 2.2-.9 3 0l1.2 1.4-2.1 1.3-1.2-1.1c-.3-.3-.8-.3-1.1 0l-1.2 1.1-2.1-1.3 1.5-1.4Z"
      />
    </svg>
  )
}
