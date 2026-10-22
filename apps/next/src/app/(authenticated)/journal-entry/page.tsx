"use client";

import JournalEntryContent from "@/app/(authenticated)/journal-entry/journal-entry-content";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function JournalEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} /> Loading...
        </div>
      }
    >
      <JournalEntryContent />
    </Suspense>
  );
}
