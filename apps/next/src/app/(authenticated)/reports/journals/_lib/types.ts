// Closing
export interface ClosingJournalLine {
  referenceNumber?: number;
  accountName: string;
  debit: number;
  credit: number;
}
export interface ClosingJournalEntryGroup {
  description: string;
  lines: ClosingJournalLine[];
}
export interface ClosingJournalViewModel {
  netIncome: number;
  retainedEarningsAccountName: string;
  groups: ClosingJournalEntryGroup[];
}

// General & Adjusting (sama struktur)
export interface Account {
  id: number;
  referenceNumber: number;
  accountName: string;
}
export interface JournalLine {
  id: number;
  lineOrder: number;
  debit: number;
  credit: number;
  lineDescription?: string;
  accountName?: string;
  referenceNumber?: number;
  account?: Account;
}
export interface JournalEntry {
  id: number;
  transactionNumber: string;
  entryDate: string;
  createdAt: string;
  updatedAt?: string;
  lines: JournalLine[];
  isAdjusting?: boolean;
}

export interface FlatJournalRow {
  entryId: number;
  transactionNumber: string;
  entryDate: string;
  createdAt: string;
  updatedAt?: string;
  lineId: number;
  lineOrder: number;
  debit: number;
  credit: number;
  lineDescription?: string;
  accountName: string;
  referenceNumber: string | number;
  isFirstLine: boolean;
  showHeader: boolean;
  formattedDate: string;
  groupIdx: number;
  originalEntry: JournalEntry;
}
