import type {
  CreatePeriodFormValues,
  CreatePeriodOutputValues,
} from "@/lib/validations/period";

export interface ApiError {
  data?: { message?: string };
  message?: string;
}

export interface AccountItem {
  id?: number | string;
  displayLabel?: string;
  referenceNumber?: string;
  accountName?: string;
}

export interface PeriodItem {
  id: number;
  periodName?: string;
  startDate?: string;
  endDate?: string;
  isClosed?: boolean;
  isSelected?: boolean;
}

export interface OpenInfoData {
  hasExistingPermanentAccounts?: boolean;
  availableCashAndBankAccounts?: AccountItem[];
  availableRetainedEarningsAccounts?: AccountItem[];
}

export interface CreatePeriodValues {
  month?: number;
  year?: number;
  setupMode?: "LoadExisting" | "CreateNew";
  cashAccountId?: string;
  bankAccountId?: string;
  retainedId?: string;
  cashAccountCode?: string;
  cashAccountName?: string;
  cashBalance?: number | "";
  bankAccountCode?: string;
  bankAccountName?: string;
  bankBalance?: number | "";
  retainedCode?: string;
  retainedName?: string;
}

export interface PeriodListProps {
  periods: PeriodItem[];
  selectedPeriod: PeriodItem | null;
  isLoading: boolean;
  isClearing: boolean;
  selectingId: number | null;
  closingId: number | null;
  onClearSelection: () => void;
  onSelectPeriod: (p: PeriodItem) => void;
  onClosePeriod: (p: PeriodItem) => void;
  onOpenCreateView: () => void;
}

export interface CreatePeriodFormProps {
  openInfo?: OpenInfoData | null;
  isLoadingOpenInfo?: boolean;
  isCreating?: boolean;
  isLoading?: boolean;
  initialValues?: Partial<CreatePeriodFormValues>;
  defaultValues?: Partial<CreatePeriodFormValues>;
  onSubmit: (values: CreatePeriodOutputValues) => void | Promise<void>;
  onCancel: () => void;
  [key: string]: any;
}

export interface GetPeriodColumnsProps {
  selectedPeriod: PeriodItem | null;
  selectingId: number | null;
  closingId: number | null;
  onSelectPeriod: (p: PeriodItem) => void;
  onClosePeriod: (p: PeriodItem) => void;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
