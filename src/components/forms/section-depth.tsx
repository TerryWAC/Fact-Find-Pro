import { ClipboardCheck } from 'lucide-react'

/** Decorative paper layers use the surrounding adviser's brand tokens. */
export function SectionDepth({ number, reviewing = false }: { number: number; reviewing?: boolean }) {
  return (
    <div className="factfind-depth" aria-hidden="true">
      <span className="factfind-depth-sheet factfind-depth-back" />
      <span className="factfind-depth-sheet factfind-depth-middle" />
      <span className="factfind-depth-sheet factfind-depth-front" key={reviewing ? 'review' : number}>
        <span className="factfind-depth-line" />
        {reviewing ? <ClipboardCheck className="h-7 w-7" /> : <span className="text-2xl font-semibold tabular-nums tracking-tight">{String(number).padStart(2, '0')}</span>}
        <span className="factfind-depth-line factfind-depth-line-short" />
      </span>
    </div>
  )
}
