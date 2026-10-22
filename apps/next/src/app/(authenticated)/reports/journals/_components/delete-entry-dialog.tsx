"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteEntryDialogProps {
  open: boolean;
  isDeleting?: boolean;
  transactionNumber?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteEntryDialog({
  open,
  isDeleting = false,
  transactionNumber,
  onOpenChange,
  onConfirm,
}: DeleteEntryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            Delete Journal Entry
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            Are you sure you want to delete entry{" "}
            <span className="font-mono font-semibold text-foreground">
              &quot;{transactionNumber}&quot;
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="text-sm">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
