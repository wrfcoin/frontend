import React from 'react';

interface WrfDataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string | number;
}

interface WrfDataTableProps {
  columns?: WrfDataTableColumn[];
  data?: any[];
  loading?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  sx?: Record<string, any>;
  [key: string]: any;
}

declare const WrfDataTable: React.FC<WrfDataTableProps>;
export default WrfDataTable;
