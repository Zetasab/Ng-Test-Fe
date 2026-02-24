import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeveloperModel } from '../../../models/games/developer.model';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class DeveloperService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/games/developers');

  getAll(): Observable<DeveloperModel[]> {
    return this.httpGet<DeveloperModel[]>(this.endpoint);
  }

  getById(id: string): Observable<DeveloperModel> {
    return this.httpGet<DeveloperModel>(`${this.endpoint}/${id}`);
  }

  insert(model: DeveloperModel): Observable<DeveloperModel> {
    return this.httpPost<DeveloperModel>(this.endpoint, model);
  }

  update(id: string, model: DeveloperModel): Observable<void> {
    return this.httpPut(`${this.endpoint}/${id}`, model);
  }

  delete(id: string): Observable<void> {
    return this.httpDelete(`${this.endpoint}/${id}`);
  }
}
