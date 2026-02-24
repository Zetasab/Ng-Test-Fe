import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlatformModel } from '../../../models/games/platform.model';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class PlatformService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/games/platforms');

  getAll(): Observable<PlatformModel[]> {
    return this.httpGet<PlatformModel[]>(this.endpoint);
  }

  getById(id: string): Observable<PlatformModel> {
    return this.httpGet<PlatformModel>(`${this.endpoint}/${id}`);
  }

  insert(model: PlatformModel): Observable<PlatformModel> {
    return this.httpPost<PlatformModel>(this.endpoint, model);
  }

  update(id: string, model: PlatformModel): Observable<void> {
    return this.httpPut(`${this.endpoint}/${id}`, model);
  }

  delete(id: string): Observable<void> {
    return this.httpDelete(`${this.endpoint}/${id}`);
  }
}
