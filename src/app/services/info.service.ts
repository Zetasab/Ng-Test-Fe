import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class InfoService extends BaseService {
  private readonly endpoint = this.buildApiUrl('/info');

  get(): Observable<string> {
    return this.httpGetText(this.endpoint);
  }
}
