"use client";

import { BookX } from "lucide-react";

interface JournalEmptyStateProps {
  selectedPeriodName?: string | null;
}

export function JournalEmptyState({
  selectedPeriodName,
}: JournalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground py-2">
      <BookX className="h-7 w-7" />
      <p className="text-sm font-medium">No Entries Found</p>
      <p className="text-xs">
        No entries in{" "}
        <strong className="text-foreground">
          {selectedPeriodName || "this period"}
        </strong>
      </p>
    </div>
  );
}
