import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserModel } from '../../models/user.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/users/users');

  getAll(): Observable<UserModel[]> {
    return this.httpGet<UserModel[]>(this.endpoint);
  }

  getById(id: string): Observable<UserModel> {
    return this.httpGet<UserModel>(`${this.endpoint}/${id}`);
  }

  insert(model: UserModel): Observable<UserModel> {
    const payload: UserModel = {
      ...model,
      id: model.id?.trim() ? model.id : crypto.randomUUID(),
    };

    return this.httpPost<UserModel>(this.endpoint, payload);
  }

  update(id: string, model: UserModel): Observable<void> {
    return this.httpPut(`${this.endpoint}/${id}`, model);
  }

  delete(id: string): Observable<void> {
    return this.httpDelete(`${this.endpoint}/${id}`);
  }
}
