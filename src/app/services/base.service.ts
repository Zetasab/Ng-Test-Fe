import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { USER_SESSION_KEY } from '../shared/auth.guard';
import { UserResponse } from '../../models/user-response.model';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  protected readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  protected httpGet<T>(url: string): Observable<T> {
    return this.httpClient.get<T>(url, { observe: 'response', headers: this.buildAuthHeaders() }).pipe(
      map((response) => this.extractBody(response, 'GET', url)),
      catchError((error) => this.handleHttpError(error, 'GET', url)),
    );
  }

  protected httpGetText(url: string): Observable<string> {
    return this.httpClient
      .get(url, { observe: 'response', responseType: 'text', headers: this.buildAuthHeaders() })
      .pipe(
      map((response) => this.extractTextBody(response, 'GET', url)),
      catchError((error) => this.handleHttpError(error, 'GET', url)),
    );
  }

  protected httpPost<TResponse>(url: string, body: unknown): Observable<TResponse> {
    return this.httpClient.post<TResponse>(url, body, { observe: 'response', headers: this.buildAuthHeaders() }).pipe(
      map((response) => this.extractBody(response, 'POST', url)),
      catchError((error) => this.handleHttpError(error, 'POST', url)),
    );
  }

  protected httpPut<TBody>(url: string, body: TBody): Observable<void> {
    return this.httpClient.put<void>(url, body, { observe: 'response', headers: this.buildAuthHeaders() }).pipe(
      map((response) => this.extractBody(response, 'PUT', url)),
      catchError((error) => this.handleHttpError(error, 'PUT', url)),
    );
  }

  protected httpDelete(url: string): Observable<void> {
    return this.httpClient.delete<void>(url, { observe: 'response', headers: this.buildAuthHeaders() }).pipe(
      map((response) => this.extractBody(response, 'DELETE', url)),
      catchError((error) => this.handleHttpError(error, 'DELETE', url)),
    );
  }

  protected buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBaseUrl}${normalizedPath}`;
  }

  private extractBody<T>(response: HttpResponse<T>, method: string, url: string): T {
    this.logIfNot200(response.status, method, url);
    return response.body as T;
  }

  private extractTextBody(response: HttpResponse<string>, method: string, url: string): string {
    this.logIfNot200(response.status, method, url);
    return response.body ?? '';
  }

  private handleHttpError(error: unknown, method: string, url: string): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      this.logIfNot200(error.status, method, url);
    }

    return throwError(() => error);
  }

  private logIfNot200(status: number, method: string, url: string): void {
    if (status !== 200) {
      console.error(`[HTTP ${method}] ${url} returned status ${status}`);
    }
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.getSessionToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private getSessionToken(): string | null {
    const rawUser = sessionStorage.getItem(USER_SESSION_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser) as UserResponse;
      const token = user.token?.trim();
      return token ? token : null;
    } catch {
      return null;
    }
  }
}