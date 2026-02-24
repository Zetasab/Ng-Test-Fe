import { BaseEntity } from '../base-entity.model';

export class GenreModel extends BaseEntity {
  name = '';
  description: string | null = null;
}
