"use client";
import { Loader2 } from "lucide-react";
export function LoadingState({ text }: { text: string }) {
  return (
    <div className="py-16 text-center text-caption text-muted-foreground flex items-center justify-center gap-2">
      <Loader2 className="animate-spin" size={16} /> {text}
    </div>
  );
}
