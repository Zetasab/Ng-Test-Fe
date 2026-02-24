import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TagModel } from '../../../models/games/tag.model';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class TagService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/games/tags');

  getAll(): Observable<TagModel[]> {
    return this.httpGet<TagModel[]>(this.endpoint);
  }

  getById(id: string): Observable<TagModel> {
    return this.httpGet<TagModel>(`${this.endpoint}/${id}`);
  }

  insert(model: TagModel): Observable<TagModel> {
    return this.httpPost<TagModel>(this.endpoint, model);
  }

  update(id: string, model: TagModel): Observable<void> {
    return this.httpPut(`${this.endpoint}/${id}`, model);
  }

  delete(id: string): Observable<void> {
    return this.httpDelete(`${this.endpoint}/${id}`);
  }
}
