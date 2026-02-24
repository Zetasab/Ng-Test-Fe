import { BaseEntity } from '../base-entity.model';

export class GameModel extends BaseEntity {
  title = '';
  description: string | null = null;
  releaseDate: string | null = null;
  platformId: string | null = null;
  tagIds: string[] = [];
  genreIds: string[] = [];
  developerId: string | null = null;
  reviewIds: string[] = [];
}
