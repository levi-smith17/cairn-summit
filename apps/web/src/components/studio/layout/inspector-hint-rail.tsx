export function InspectorHintRail({ message }: { message: string }) {
  return (
    <aside
      className="flex h-full w-10 shrink-0 items-center justify-center border-l border-border bg-column-inspector px-1"
      aria-label={message}
    >
      <p
        className="max-h-full whitespace-nowrap text-[10px] font-medium leading-snug tracking-wide text-muted-foreground"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {message}
      </p>
    </aside>
  )
}
