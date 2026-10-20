import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_URL } from "../../../core/config";

export interface Period {
  id: number;
  periodName: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  isSelected: boolean;
  userId: string;
}

export type CreatePeriodDto = Pick<
  Period,
  "periodName" | "startDate" | "endDate"
>;

@Injectable({ providedIn: "root" })
export class PeriodsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/periods`;

  getPeriods(): Observable<Period[]> {
    return this.http.get<Period[]>(this.baseUrl);
  }

  createPeriod(dto: CreatePeriodDto): Observable<Period> {
    return this.http.post<Period>(this.baseUrl, dto);
  }

  selectPeriod(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/select`, {});
  }

  clearSelection(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/clear-selection`, {});
  }

  closePeriod(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/close`, {});
  }
}
