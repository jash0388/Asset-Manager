import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export function BackButton({ to = "/dashboard", label = "Back" }: { to?: string; label?: string }) {
  return (
    <Link href={to}>
      <button
        data-testid="back-button"
        className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors border border-gray-200"
      >
        <ArrowLeft className="w-4 h-4" />
        {label}
      </button>
    </Link>
  );
}
