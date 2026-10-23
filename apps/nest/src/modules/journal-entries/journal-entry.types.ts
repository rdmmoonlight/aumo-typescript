/** Bentuk JSON sama dengan JournalEntryController sumber (camelCase). */
export interface JournalEntryLineDto {
    id: number;
    accountId: number;
    lineDescription: string | null;
    debit: number;
    credit: number;
    lineOrder: number;
}

export interface JournalEntryDto {
    id: number;
    transactionNumber: string;
    journalType: string;
    entryDate: string;
    createdAt: string;
    updatedAt: string | null;
    isLocked: boolean;
    lines: JournalEntryLineDto[];
}

export interface GetJournalEntryResponse {
    success: true;
    entry: JournalEntryDto;
}

export interface CreateJournalEntryResponse {
    success: true;
    message: string;
    entryId: number;
    transactionNumber: string;
}

export interface MessageResponse {
    success: true;
    message: string;
}

export interface NextTransactionNumberResponse {
    success: true;
    transactionNumber: string;
}
