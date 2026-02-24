import { BaseEntity } from '../base-entity.model';

export class DeveloperModel extends BaseEntity {
  name = '';
  country: string | null = null;
  foundedDate: string | null = null;
}
