/** Padanan ToolsDto.cs sumber. Properti JSON camelCase. */
export interface JournalLineDto {
    refNumber: number;
    accountName: string | null;
    description: string | null;
    debit: number | null;
    credit: number | null;
}

export interface JournalTransactionDto {
    transactionNumber: string;
    date: string;
    journalType: string;
    lines: JournalLineDto[] | null;
}

export type MappingStatus = 'EXACT_MATCH' | 'UNMAPPED' | 'REALLOCATED_NAME' | 'REALLOCATED_REF' | string;

export interface AccountMappingDetailDto {
    excelRef: number;
    excelAccountName: string | null;
    mappedRef: number;
    mappedAccountName: string;
    status: MappingStatus;
    reason: string;
}

export interface JournalImportRequestDto {
    targetYear: number;
    targetMonth: number;
    transactions: JournalTransactionDto[] | null;
    customMappings: AccountMappingDetailDto[] | null;
}

export interface PreviewTransaction {
    transactionNumber: string;
    date: string;
    journalType: string;
    lines: {
        refNumber: number;
        accountName: string;
        description: string | null;
        debit: number | null;
        credit: number | null;
    }[];
}

export interface PreviewResponse {
    transactions: PreviewTransaction[];
    accountMappings: AccountMappingDetailDto[];
    summary: {
        totalUniqueAccounts: number;
        exactMatchCount: number;
        reallocatedCount: number;
        unmappedCount: number;
        isPerfectMatch: boolean;
    };
}

export interface ImportResponse {
    message: string;
    importedEntriesCount: number;
}
