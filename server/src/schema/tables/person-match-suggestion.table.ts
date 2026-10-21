import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
} from '@immich/sql-tools';
import { PersonTable } from 'src/schema/tables/person.table';

/**
 * A pending question for the user: the face similarity algorithm was not sure whether `personId` is the same
 * person as `suggestedPersonId`, so it asks the user to confirm (merge) or reject (keep separate).
 */
@Table('person_match_suggestion')
@Unique({ columns: ['personId', 'suggestedPersonId'] })
export class PersonMatchSuggestionTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => PersonTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, index: true })
  personId!: string;

  @ForeignKeyColumn(() => PersonTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, index: true })
  suggestedPersonId!: string;

  @Column({ type: 'double precision' })
  distance!: number;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
