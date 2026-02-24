export enum UserRole {
  User = 'User',
  Admin = 'Admin',
}

export class UserResponse {
  username = '';
  token = '';
  role: UserRole = UserRole.User;
}
