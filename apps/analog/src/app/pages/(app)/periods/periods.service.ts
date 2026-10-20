import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_URL } from "../../../core/config";

export interface Period {
  id: string | number;
  year: number;
  month: number;
  status: 'OPEN' | 'CLOSED';
  periodName?: string;
  startDate?: string;
  endDate?: string;
  isClosed?: boolean;
  isSelected?: boolean;
  // K8: userId dihapus karena tidak dikirim oleh server Nest
}

export interface GetPeriodsResponse {
  success: boolean;
  selectedPeriodId: string | number | null;
  periods: Period[];
}

export interface OpenInfoResponse {
  success: boolean;
  data: {
    year: number;
    month: number;
    setupMode: 'CreateNew' | 'LoadExisting';
    [key: string]: any;
  };
}

// K7: DTO baru sesuai spesifikasi backend Nest
export interface CreatePeriodDto {
  year: number;
  month: number;
  setupMode: 'CreateNew' | 'LoadExisting';
  [key: string]: any;
}

// K9: Tipe respons aksi yang membawa message dari server
export interface PeriodActionResponse {
  success: boolean;
  message: string;
  selectedPeriodId?: string | number;
  data?: any;
}

@Injectable({ providedIn: "root" })
export class PeriodsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/periods`;

  /** K6: Mengembalikan objek wrapper yang berisi res.periods */
  getPeriods(): Observable<GetPeriodsResponse> {
    return this.http.get<GetPeriodsResponse>(this.baseUrl);
  }

  /** K7: Memuat info pembukaan periode sebelum submit */
  getOpenInfo(): Observable<OpenInfoResponse> {
    return this.http.get<OpenInfoResponse>(`${this.baseUrl}/open-info`);
  }

  /** K7: Mengirim DTO pembuatan periode baru */
  createPeriod(dto: CreatePeriodDto): Observable<PeriodActionResponse> {
    return this.http.post<PeriodActionResponse>(this.baseUrl, dto);
  }

  /** K9: Mengembalikan respons aksi beserta message */
  selectPeriod(id: string | number): Observable<PeriodActionResponse> {
    return this.http.post<PeriodActionResponse>(`${this.baseUrl}/${id}/select`, {});
  }

  /** K9: Mengembalikan respons aksi beserta message */
  clearSelection(): Observable<PeriodActionResponse> {
    return this.http.post<PeriodActionResponse>(`${this.baseUrl}/clear-selection`, {});
  }

  /** K9: Mengembalikan respons aksi beserta message */
  closePeriod(id: string | number): Observable<PeriodActionResponse> {
    return this.http.post<PeriodActionResponse>(`${this.baseUrl}/${id}/close`, {});
  }
}
