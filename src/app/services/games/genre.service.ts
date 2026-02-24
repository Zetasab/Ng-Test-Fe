import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenreModel } from '../../../models/games/genre.model';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class GenreService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/games/genres');

  getAll(): Observable<GenreModel[]> {
    return this.httpGet<GenreModel[]>(this.endpoint);
  }

  getById(id: string): Observable<GenreModel> {
    return this.httpGet<GenreModel>(`${this.endpoint}/${id}`);
  }

  insert(model: GenreModel): Observable<GenreModel> {
    return this.httpPost<GenreModel>(this.endpoint, model);
  }

  update(id: string, model: GenreModel): Observable<void> {
    return this.httpPut(`${this.endpoint}/${id}`, model);
  }

  delete(id: string): Observable<void> {
    return this.httpDelete(`${this.endpoint}/${id}`);
  }
}
