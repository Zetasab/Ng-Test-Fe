import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ApiAuditLog } from '../../../../models/audit/api-audit-log.model';
import { AuditService } from '../../../services/audit.service';
import { UserService } from '../../../services/user.service';
import { UserModel } from '../../../../models/user.model';

type ApiAuditLogPaginationResponseRaw = {
  ApiAuditLogs?: ApiAuditLog[];
  apiAuditLogs?: ApiAuditLog[];
  Items?: ApiAuditLog[];
  items?: ApiAuditLog[];
  TotalResutls?: number;
  totalResutls?: number;
  TotalResults?: number;
  totalResults?: number;
};

@Component({
  selector: 'app-audit-page',
  imports: [TableModule, ButtonModule],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPage {
  private readonly auditService = inject(AuditService);
  private readonly userService = inject(UserService);

  protected readonly auditLogs = signal<ApiAuditLog[]>([]);
  protected readonly usersById = signal<Record<string, UserModel>>({});
  protected readonly isLoading = signal(false);
  protected readonly isUsersLoading = signal(false);
  protected readonly totalRecords = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly pageSizeOptions = [10, 20, 50, 100];

  protected readonly firstRow = computed(() => (this.currentPage() - 1) * this.pageSize());
  protected readonly loadedRecords = computed(() => this.auditLogs().length);
  protected readonly hasMoreRecords = computed(() => this.loadedRecords() < this.totalRecords());
  protected readonly isAnyLoading = computed(() => this.isLoading() || this.isUsersLoading());

  public ngOnInit(): void {
    void this.loadUsers();
    void this.loadPage(1, this.pageSize());
  }

  protected reloadTable(): void {
    void this.loadUsers();
    void this.loadPage(this.currentPage(), this.pageSize());
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = this.parseRows(event.rows);
    const page = this.parsePage(event.first, rows);

    if (
      page === this.currentPage()
      && rows === this.pageSize()
      && this.auditLogs().length > 0
    ) {
      return;
    }

    this.pageSize.set(rows);
    void this.loadPage(page, rows);
  }

  protected loadMore(): void {
    const nextPageSize = this.pageSize() + 10;
    this.pageSize.set(nextPageSize);
    void this.loadPage(1, nextPageSize);
  }

  protected getMethodClass(method: string | null | undefined): string {
    const normalizedMethod = method?.trim().toUpperCase() ?? '';

    switch (normalizedMethod) {
      case 'GET':
        return 'method-get';
      case 'POST':
        return 'method-post';
      case 'PUT':
      case 'PATCH':
        return 'method-update';
      case 'DELETE':
        return 'method-delete';
      default:
        return 'method-other';
    }
  }

  protected getStatusClass(statusCode: number | null | undefined): string {
    if (!statusCode || statusCode < 100) {
      return 'status-unknown';
    }

    if (statusCode >= 200 && statusCode < 300) {
      return 'status-success';
    }

    if (statusCode >= 300 && statusCode < 400) {
      return 'status-redirect';
    }

    if (statusCode >= 400 && statusCode < 500) {
      return 'status-client-error';
    }

    if (statusCode >= 500) {
      return 'status-server-error';
    }

    return 'status-unknown';
  }

  protected getRelatedUserName(userId: string | null | undefined, fallbackUserName: string | null | undefined): string {
    const normalizedUserId = userId?.trim();

    if (normalizedUserId) {
      const relatedUser = this.usersById()[normalizedUserId];

      if (relatedUser?.username) {
        return relatedUser.username;
      }
    }

    const fallback = fallbackUserName?.trim();
    return fallback ? fallback : '-';
  }

  protected trackByAuditId(index: number, item: ApiAuditLog): string {
    return item.id || `${index}-${item.requestUtc}`;
  }

  protected formatUtc(value: Date | string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const parsed = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleString();
  }

  private async loadPage(page: number, pageSize: number): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(this.auditService.getAll(page, pageSize)) as ApiAuditLogPaginationResponseRaw;

      this.auditLogs.set(response.ApiAuditLogs ?? response.apiAuditLogs ?? response.Items ?? response.items ?? []);
      this.totalRecords.set(
        response.TotalResutls
          ?? response.totalResutls
          ?? response.TotalResults
          ?? response.totalResults
          ?? 0,
      );
      this.currentPage.set(page);
    } catch (error: unknown) {
      console.error('Error cargando auditoría:', error);
      this.auditLogs.set([]);
      this.totalRecords.set(0);
      this.currentPage.set(1);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadUsers(): Promise<void> {
    this.isUsersLoading.set(true);

    try {
      const users = await firstValueFrom(this.userService.getAll());
      const byId = users.reduce<Record<string, UserModel>>((acc, user) => {
        if (user.id) {
          acc[user.id] = user;
        }

        return acc;
      }, {});

      this.usersById.set(byId);
    } catch (error: unknown) {
      console.error('Error cargando users para auditoría:', error);
      this.usersById.set({});
    } finally {
      this.isUsersLoading.set(false);
    }
  }

  private parseRows(rows: number | undefined | null): number {
    if (!rows || rows <= 0) {
      return this.pageSize();
    }

    return rows;
  }

  private parsePage(first: number | undefined | null, rows: number): number {
    if (!first || first < 0) {
      return 1;
    }

    return Math.floor(first / rows) + 1;
  }
}
