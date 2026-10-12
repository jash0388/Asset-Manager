import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export function BackButton({
  to = "/dashboard",
  label = "Back",
  className = "mb-4",
}: {
  to?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link href={to}>
      <button
        data-testid="back-button"
        className={`inline-flex items-center gap-0.5 h-8 -ml-1.5 pl-0.5 pr-2.5 rounded-full text-[15px] font-medium text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer ${className}`}
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
        {label}
      </button>
    </Link>
  );
}
