import type { SVGProps } from 'react'

/** Simplified white/currentColor version of Asgard's tree favicon for Cairn nav. */
export function AsgardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Asgard" fill="none" {...props}>
      <path
        d="M12 2.4c-1.1 2-2.6 3.6-4.5 4.9h2.2c-1.5 1.8-3.4 3.4-5.7 4.7h3.1c-1.1 1.4-2.5 2.6-4.1 3.6h7v2.1c-1.8.3-3.4 1.1-4.8 2.4 1.9-.5 3.6-.6 5.2-.4L8.6 22h6.8l-1.8-1.7c1.6-.2 3.3-.1 5.2.4-1.4-1.3-3-2.1-4.8-2.4v-2.1h7c-1.6-1-3-2.2-4.1-3.6H20c-2.3-1.3-4.2-2.9-5.7-4.7h2.2C14.6 6 13.1 4.4 12 2.4Z"
        fill="currentColor"
      />
    </svg>
  )
}
