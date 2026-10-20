export type SetupMode = 'CreateNew' | 'LoadExisting';

export type Period = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
    isSelected?: boolean;
    createdAt: string;
    updatedAt: string;
};

export type GetPeriodsResponse = {
    success: boolean;
    selectedPeriodId?: string | null;
    periods: Period[];
};

export type OpenPeriodInfo = {
    year: number;
    month: number;
    suggestedName?: string;
    canCreateNew?: boolean;
    canLoadExisting?: boolean;
};

export type CreatePeriodRequest = {
    year: number;
    month: number;
    setupMode: SetupMode;
    [key: string]: unknown;
};

export type ActionPeriodResponse = {
    success: boolean;
    message: string;
    periodId?: string;
};