import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiAuditLogPaginationResponse } from '../../models/audit/api-audit-log-pagination-response.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class AuditService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/audits');

  getAll(page: number, pageSize: number): Observable<ApiAuditLogPaginationResponse> {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    return this.httpGet<ApiAuditLogPaginationResponse>(`${this.endpoint}?${query.toString()}`);
  }
}
