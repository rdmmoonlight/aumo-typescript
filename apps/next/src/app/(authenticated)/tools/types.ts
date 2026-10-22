export interface JournalLineImport {
  rowIndex: number;
  refNumber: number;
  accountName: string;
  description: string;
  debit: number | null;
  credit: number | null;
}

export interface JournalTransactionImport {
  transactionNumber?: string;
  date: string;
  journalType: string;
  lines: JournalLineImport[];
}

export interface JournalImportResult {
  isSuccess: boolean;
  totalTransactionsRead: number;
  totalLinesRead: number;
  transactions: JournalTransactionImport[];
}

export interface AccountMappingDetail {
  excelRef: number;
  excelAccountName: string;
  mappedRef: number;
  mappedAccountName: string;
  status: string;
}
