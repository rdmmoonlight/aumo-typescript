// src/lib/store/(authenticated)/tools/toolsApi.ts
import { baseApi } from "@/lib/apiClient";

// --- DTO & Type Definitions ---
export type JournalLineDto = {
  refNumber?: number | string;
  accountName?: string;
  description?: string;
  debit?: null | number | string;
  credit?: null | number | string;
};

export type JournalTransactionDto = {
  transactionNumber?: string;
  date?: string;
  journalType?: string;
  lines?: JournalLineDto[];
};

export type AccountMappingDetailDto = {
  excelRef?: number | string;
  excelAccountName?: string;
  mappedRef?: number | string;
  mappedAccountName?: string;
  status?: string;
  reason?: string;
};

export type JournalImportRequestDto = {
  targetYear?: number | string;
  targetMonth?: number | string;
  transactions?: JournalTransactionDto[];
  customMappings?: null | AccountMappingDetailDto[];
};

// --- API Slice Definition ---
export const toolsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /tools/download-journal-template
    downloadJournalTemplate: builder.query<unknown, void>({
      query: () => ({
        url: "/tools/download-journal-template", // Wajib diawali '/'
      }),
      providesTags: ["Tools"],
    }),

    // POST /tools/preview-journal-import
    previewJournalImport: builder.mutation<unknown, JournalImportRequestDto>({
      query: (body) => ({
        url: "/tools/preview-journal-import",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tools"],
    }),

    // POST /tools/import-journal-entries
    importJournalEntries: builder.mutation<unknown, JournalImportRequestDto>({
      query: (body) => ({
        url: "/tools/import-journal-entries",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tools"],
    }),
  }),
  overrideExisting: false,
});
