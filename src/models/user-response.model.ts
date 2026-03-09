export enum UserRole {
  User = 0,
  Admin = 1,
}

export class UserResponse {
  username = '';
  token = '';
  role: UserRole = UserRole.User;
}
