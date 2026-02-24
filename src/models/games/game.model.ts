import { BaseEntity } from '../base-entity.model';

export class GameModel extends BaseEntity {
  title = '';
  imgUrl: string | null = null;
  description: string | null = null;
  releaseDate: string | null = null;
  platformId: string | null = null;
  tagIds: string[] = [];
  genreIds: string[] = [];
  developerId: string | null = null;
  reviewIds: string[] = [];
}
