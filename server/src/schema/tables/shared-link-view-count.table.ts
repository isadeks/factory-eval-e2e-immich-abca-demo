import { Column, ForeignKeyColumn, Generated, Table } from '@immich/sql-tools';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';

@Table('shared_link_view_count')
export class SharedLinkViewCountTable {
  @ForeignKeyColumn(() => SharedLinkTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  sharedLinkId!: string;

  @Column({ type: 'integer', default: 0 })
  viewCount!: Generated<number>;
}
