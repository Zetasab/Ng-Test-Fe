import { BaseEntity } from './base-entity.model';
import { UserRole } from './user-response.model';

export class UserModel extends BaseEntity {
  username = '';
  passwordHash = '';
  token = '';
  role: UserRole = UserRole.User;
  isActive = true;
}
