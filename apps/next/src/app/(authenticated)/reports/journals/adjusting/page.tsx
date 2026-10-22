"use client";

import { FilePen, Loader2, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { store } from "@/lib/store";
import { journalEntryApi } from "@/lib/store/(authenticated)/journal-entry/journalEntryApi";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";

import { DeleteEntryDialog } from "../_components/delete-entry-dialog";
import { GeneralJournalTable } from "../_components/general-journal-table";
import { JournalEmptyState } from "../_components/journal-empty-state";
import { formatDateDisplay } from "../_lib/format";
import { JournalEntry } from "../_lib/types";

export default function AdjustingJournalPage() {
  const navigate = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  // --- State Pengganti Hook RTK Query ---
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Data Manual via store.dispatch
  const fetchAdjustingJournal = async () => {
    setIsLoading(true);
    try {
      const result = await store.dispatch(
        reportsApi.endpoints.getJournalsAdjusting.initiate(),
      );

      if ("data" in result) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch adjusting journal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustingJournal();
  }, []);

  // Handle Delete Manual via store.dispatch
  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    try {
      const result = await store.dispatch(
        journalEntryApi.endpoints.deleteJournalEntry.initiate(entryToDelete.id),
      );

      if ("data" in result || !("error" in result)) {
        await fetchAdjustingJournal();
      }
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
    } finally {
      setIsDeleting(false);
      setEntryToDelete(null);
    }
  };

  const d = data as any;
  const hasPeriodSelected =
    d?.hasPeriodSelected ?? Boolean(d?.selectedPeriodName);
  const entries: JournalEntry[] = d?.entries || [];

  const flatData = useMemo(() => {
    let tracker = "";
    let gIdx = 0;
    return entries.flatMap((entry) => {
      const cur = formatDateDisplay(entry.entryDate);
      const showHeader = cur !== tracker;
      if (showHeader) {
        tracker = cur;
        gIdx++;
      }
      return [...entry.lines]
        .sort((a, b) => a.lineOrder - b.lineOrder)
        .map((line, idx) => ({
          entryId: entry.id,
          transactionNumber: entry.transactionNumber,
          entryDate: entry.entryDate,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          lineId: line.id,
          lineOrder: line.lineOrder,
          debit: line.debit,
          credit: line.credit,
          lineDescription: line.lineDescription,
          accountName: line.accountName || line.account?.accountName || "-",
          referenceNumber:
            line.referenceNumber || line.account?.referenceNumber || "-",
          isFirstLine: idx === 0,
          showHeader: idx === 0 && showHeader,
          formattedDate: cur,
          groupIdx: gIdx,
          originalEntry: entry,
        }));
    });
  }, [entries]);

  if (isLoading) {
    return (
      <div className="py-10 text-center text-xs flex justify-center gap-2">
        <Loader2 className="animate-spin" size={16} /> Loading adjusting
        entries...
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="flex gap-2 text-xl font-bold">
            <FilePen className="text-purple-500" /> Adjusting Journal
          </h1>
          <p className="text-sm text-muted-foreground">
            Adjusting entries{" "}
            {d?.selectedPeriodName ? `(${d.selectedPeriodName})` : ""} • IDR
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/journal-entry?type=adjusting">
              <Plus className="h-3.5 w-3.5" /> Add Adjusting
            </Link>
          </Button>
          <Button
            variant={editMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setEditMode((p) => !p)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {flatData.length ? (
            <GeneralJournalTable
              flatData={flatData}
              editMode={editMode}
              isDeleting={isDeleting}
              onPromptDelete={setEntryToDelete}
            />
          ) : (
            <JournalEmptyState selectedPeriodName={d?.selectedPeriodName} />
          )}
        </CardContent>
      </Card>

      <DeleteEntryDialog
        open={!!entryToDelete}
        transactionNumber={(entryToDelete as any)?.transactionNumber}
        isDeleting={isDeleting}
        onOpenChange={(o) => {
          if (!o) setEntryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
