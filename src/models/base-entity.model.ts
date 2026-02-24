export class BaseEntity {
  id = '';
  createdUtc: Date = new Date();
  updatedUtc: Date | null = null;
}
