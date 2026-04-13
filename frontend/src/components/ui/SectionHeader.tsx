// ── Section Header ─────────────────────────────────────────────────────────────
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// ── Props ──────────────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  linkTo?: string;
  linkLabel?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SectionHeader({
  title,
  linkTo,
  linkLabel = "Смотреть все",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2">

      {/* ── Title ─────────────────────────────────────────────────────────────── */}
      <h2 className="font-heading font-bold text-baltic-navy uppercase tracking-wide text-base">
        {title}
      </h2>

      {/* ── View All Link ─────────────────────────────────────────────────────── */}
      {linkTo && (
        <Link
          to={linkTo}
          className="text-amber text-sm flex items-center gap-0.5 hover:opacity-80 transition-opacity"
        >
          {linkLabel}
          <ChevronRight size={16} />
        </Link>
      )}

    </div>
  );
}
