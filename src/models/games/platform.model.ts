import { BaseEntity } from '../base-entity.model';

export class PlatformModel extends BaseEntity {
  name = '';
  manufacturer: string | null = null;
  releaseYear: number | null = null;
}
