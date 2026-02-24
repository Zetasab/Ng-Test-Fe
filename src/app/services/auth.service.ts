import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserLogin } from '../../models/user-login.model';
import { UserResponse } from '../../models/user-response.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/users/users/login');

  login(login: UserLogin): Observable<UserResponse> {
    return this.httpPost<UserResponse>(this.endpoint, login);
  }
}