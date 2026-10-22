import { ApiResponse } from '../../common/types/api-response.type.js';

export interface ExampleDto {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
}

export type ExampleResponse = ApiResponse<ExampleDto>;
export type ExampleListResponse = ApiResponse<ExampleDto[]>;