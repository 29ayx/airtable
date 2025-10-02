export interface TableColumn {
  id: string;
  name: string;
  type: string;
  order: number;
}

export interface TableRow {
  id: string;
  order?: number;
  createdAt?: string | Date;
  [columnId: string]: string | number | Date | undefined;
}

export interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
  table?: {
    id: string;
    name: string;
    baseId: string;
  };
}

export interface CellUpdate {
  rowId: string;
  columnId: string;
  value: string;
}

export interface TableMutation {
  mutate: (variables: any) => void;
}

export interface TableMutations {
  addRowMutation: TableMutation;
  deleteRowMutation: TableMutation;
  addColumnMutation: TableMutation;
  deleteColumnMutation: TableMutation;
  updateColumnNameMutation: TableMutation;
  updateCellMutation: TableMutation;
}
