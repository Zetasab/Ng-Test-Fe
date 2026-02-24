import { BaseEntity } from '../base-entity.model';

export class ReviewModel extends BaseEntity {
  gameId = '';
  userId: string | null = null;
  rating = 0;
  comment: string | null = null;
}
