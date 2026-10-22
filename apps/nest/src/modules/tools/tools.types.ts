import { ApiResponse } from '../../common/types/api-response.type.js';

export interface JournalLineDto {
    refNumber: number;
    accountName: string;
    description?: string;
    debit?: number | null;
    credit?: number | null;
}

export interface JournalTransactionDto {
    date: string; // yyyy-MM-dd from client, akan dipaksa ke TargetYear/Month
    journalType: string; // GJ | AJ | General | Adjusting
    lines: JournalLineDto[];
    transactionNumber?: string; // generated on preview/import
}

export interface AccountMappingDetailDto {
    excelRef: number;
    excelAccountName: string;
    mappedRef: number;
    mappedAccountName: string;
    status: 'EXACT_MATCH' | 'REALLOCATED_NAME' | 'REALLOCATED_REF' | 'UNMAPPED';
    reason: string;
}

export interface JournalImportRequestDto {
    targetYear: number;
    targetMonth: number; // 1-12
    transactions: JournalTransactionDto[];
    customMappings?: AccountMappingDetailDto[];
}

export interface PreviewSummaryDto {
    totalUniqueAccounts: number;
    exactMatchCount: number;
    reallocatedCount: number;
    unmappedCount: number;
    isPerfectMatch: boolean;
}

export interface PreviewJournalResponseDto {
    transactions: (JournalTransactionDto & { transactionNumber: string })[];
    accountMappings: AccountMappingDetailDto[];
    summary: PreviewSummaryDto;
}

export interface ImportJournalResponseDto {
    message: string;
    importedEntriesCount: number;
    importedTransactionNumbers?: string[];
}

export type PreviewResponse = ApiResponse<PreviewJournalResponseDto>;
export type ImportResponse = ApiResponse<ImportJournalResponseDto>;

// Internal DB-like types (mimic Drizzle / EF models)
export interface ChartOfAccount {
    id: string;
    userId: string;
    referenceNumber: number;
    accountName: string;
    isActive: boolean;
}

export interface TransactionCounter {
    userId: string;
    counterKey: string;
    lastSequence: number;
}

export interface Period {
    id?: string;
    userId: string;
    periodName: string;
    startDate: Date;
    endDate: Date;
    isClosed: boolean;
    isSelected: boolean;
}

export interface GeneralJournalRow {
    journalEntryId: number;
    userId: string;
    transactionNumber: string;
    journalType: string;
    transactionDate: Date;
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
}