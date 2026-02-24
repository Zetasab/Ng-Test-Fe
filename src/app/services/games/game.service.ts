import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GameModel } from '../../../models/games/game.model';
import { BaseService } from '../base.service';

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
}
