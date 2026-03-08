import { BaseEntity } from '../base-entity.model';

export class ApiAuditLog extends BaseEntity {
  requestUtc: Date = new Date();
  method = '';
  url = '';
  path = '';
  queryString = '';
  ipAddress = '';
  statusCode = 0;
  userId = '';
  userName = '';
}
