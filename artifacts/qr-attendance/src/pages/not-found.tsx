import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
      <Card className="w-full max-w-md mx-4 bg-card border border-slate-300/70 rounded-lg shadow-xs">
        <CardContent className="pt-6 px-6 pb-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-md bg-red-50 border border-red-200 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="eyebrow text-slate-500 mb-1.5">Error 404</p>
            <h1
              className="text-2xl font-bold text-slate-950 tracking-tight"
              style={{ fontFamily: "var(--app-font-display)" }}
            >
              Page Not Found
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              This page does not exist or may have been moved. Did you forget to add the page to the router?
            </p>
            <p className="mt-5 px-3 py-1 rounded border border-slate-300 bg-slate-50 font-mono text-[11px] text-slate-600 tracking-widest uppercase">
              404 · Not Found
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
