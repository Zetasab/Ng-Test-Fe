import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReviewModel } from '../../../models/games/review.model';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/games/reviews');

  getAll(): Observable<ReviewModel[]> {
    return this.httpGet<ReviewModel[]>(this.endpoint);
  }

  getById(id: string): Observable<ReviewModel> {
    return this.httpGet<ReviewModel>(`${this.endpoint}/${id}`);
  }

  insert(model: ReviewModel): Observable<ReviewModel> {
    return this.httpPost<ReviewModel>(this.endpoint, model);
  }

  update(id: string, model: ReviewModel): Observable<void> {
    return this.httpPut(`${this.endpoint}/${id}`, model);
  }

  delete(id: string): Observable<void> {
    return this.httpDelete(`${this.endpoint}/${id}`);
  }
}
