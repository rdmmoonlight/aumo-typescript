import { ApiResponse } from '../../common/types/api-response.type.js';

export interface JournalEntryLineDto {
    id: number;
    accountId: number;
    lineDescription: string | null;
    debit: number;
    credit: number;
    lineOrder: number;
}
export interface JournalEntryDto {
    id: number; // journalEntryId
    transactionNumber: string;
    journalType: string;
    entryDate: Date;
    createdAt: Date;
    updatedAt: Date | null;
    isLocked: boolean;
    lines: JournalEntryLineDto[];
}
export type JournalEntryResponse = ApiResponse<JournalEntryDto>;