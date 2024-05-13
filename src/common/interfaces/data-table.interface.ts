import { OperatorEnum, SortEnum } from '../enums';

export interface IDataTable {
  filterBy?: string;
  filterOperator?: OperatorEnum;
  filterValue?: string;
  sortBy?: string;
  sortOrder?: SortEnum;
  pageIndex?: number;
  pageSize?: number;
}
