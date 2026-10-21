import { CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { PersonTable } from 'src/schema/tables/person.table';

/**
 * Marks people whose cover photo was picked by the user. All other people automatically use their latest photo
 * as cover.
 */
@Table('person_custom_cover')
export class PersonCustomCoverTable {
  @ForeignKeyColumn(() => PersonTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  personId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
