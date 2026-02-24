import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GameModel } from '../../../models/games/game.model';
import { GamePaginationResponse } from '../../../models/games/game-pagination-response.model';
import { BaseService } from '../base.service';

type GameSearchParams = {
  page: number;
  pageSize: number;
  title?: string | null;
  description?: string | null;
  releaseDate?: string | Date | null;
  platformId?: string | null;
  developerId?: string | null;
  tagIds?: string | null;
  genreIds?: string | null;
  reviewIds?: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class GameService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/games/games');

  getAll(): Observable<GameModel[]> {
    return this.httpGet<GameModel[]>(this.endpoint);
  }

  getById(id: string): Observable<GameModel> {
    return this.httpGet<GameModel>(`${this.endpoint}/${id}`);
  }

  insert(model: GameModel): Observable<GameModel> {
    return this.httpPost<GameModel>(this.endpoint, model);
  }

  update(id: string, model: GameModel): Observable<void> {
    return this.httpPut(`${this.endpoint}/${id}`, model);
  }

  delete(id: string): Observable<void> {
    return this.httpDelete(`${this.endpoint}/${id}`);
  }

  search(params: GameSearchParams): Observable<GamePaginationResponse> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });

    this.appendQueryParam(query, 'title', params.title);
    this.appendQueryParam(query, 'description', params.description);
    this.appendQueryParam(query, 'releaseDate', this.toDateQueryValue(params.releaseDate));
    this.appendQueryParam(query, 'platformId', params.platformId);
    this.appendQueryParam(query, 'developerId', params.developerId);
    this.appendQueryParam(query, 'tagIds', params.tagIds);
    this.appendQueryParam(query, 'genreIds', params.genreIds);
    this.appendQueryParam(query, 'reviewIds', params.reviewIds);

    return this.httpGet<GamePaginationResponse>(`${this.endpoint}/search?${query.toString()}`);
  }

  private appendQueryParam(query: URLSearchParams, key: string, value: string | null | undefined): void {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return;
    }

    query.set(key, trimmedValue);
  }

  private toDateQueryValue(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      return trimmedValue ? trimmedValue : null;
    }

    if (Number.isNaN(value.getTime())) {
      return null;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
