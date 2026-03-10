import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-24 shrink-0" />
                <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3.5 w-32" />
                    </div>
                ))}
            </div>
        </section>
    )
}

export default function ManifestLoading() {
    return (
        <div className="max-w-3xl mx-auto px-6 pb-6 flex flex-col gap-12">
            {/* Header */}
            <div className="flex flex-col gap-6 pt-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-16 w-full" />
            </div>

            <SectionSkeleton rows={3} />
            <SectionSkeleton rows={2} />
            <SectionSkeleton rows={4} />
            <SectionSkeleton rows={2} />
        </div>
    )
}
