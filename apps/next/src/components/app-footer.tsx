export function AppFooter() {
  return (
    <footer className="w-full border-t border-border/40 py-3">
      <div className="flex flex-col items-center justify-center gap-1 px-6 text-center">
        {/* Caption (12px) */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Aumo Finance. All rights reserved.
        </p>
        {/* Label kecil (11px) */}
        <p className="text-[11px] text-muted-foreground">
          by <span className="font-medium text-foreground">rdmmoonlight</span>
        </p>
      </div>
    </footer>
  );
}
