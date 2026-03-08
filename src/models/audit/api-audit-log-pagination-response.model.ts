import { ApiAuditLog } from './api-audit-log.model';

export class ApiAuditLogPaginationResponse {
  TotalResutls = 0;
  ApiAuditLogs: ApiAuditLog[] = [];
}
