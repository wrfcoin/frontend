// WrfDataTable - Data table with search, sort, pagination, and CSV export
import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WrfSkeleton from './WrfSkeleton';
import WrfEmptyState from './WrfEmptyState';
import { colors, borderRadius, spacing } from './tokens-compat';

const cellSx = {
  color: colors.text.primary,
  borderBottom: `1px solid ${colors.border.default}`,
  padding: `${spacing.sm}px ${spacing.md}px`,
  fontSize: '0.875rem',
};

const headerCellSx = {
  ...cellSx,
  color: colors.text.secondary,
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  backgroundColor: colors.bg.primary,
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const WrfDataTable = ({
  columns = [],
  data = [],
  searchable = false,
  exportable = false,
  pagination = true,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  sx = {},
  ...props
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(0);

  // Filter data by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(query);
      }),
    );
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate
  const totalPages = pagination ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;
  const paginatedData = pagination
    ? sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : sortedData;

  // Reset page when data or search changes
  useMemo(() => {
    setCurrentPage(0);
  }, [searchQuery, data]);

  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    },
    [sortKey],
  );

  const handleExportCSV = useCallback(() => {
    const headers = columns.map((col) => col.label).join(',');
    const rows = sortedData.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key];
          if (val == null) return '';
          const str = String(val);
          // Escape CSV values containing commas, quotes, or newlines
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(','),
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [columns, sortedData]);

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          backgroundColor: colors.bg.secondary,
          borderRadius: `${borderRadius.lg}px`,
          border: `1px solid ${colors.border.default}`,
          padding: `${spacing.lg}px`,
          ...sx,
        }}
      >
        <WrfSkeleton variant="table-row" count={pageSize > 5 ? 5 : pageSize} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: colors.bg.secondary,
        borderRadius: `${borderRadius.lg}px`,
        border: `1px solid ${colors.border.default}`,
        overflow: 'hidden',
        ...sx,
      }}
      {...props}
    >
      {/* Toolbar */}
      {(searchable || exportable) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${spacing.sm}px ${spacing.md}px`,
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          {searchable ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: colors.bg.primary,
                borderRadius: `${borderRadius.md}px`,
                padding: `${spacing.xs}px ${spacing.sm}px`,
                flex: 1,
                maxWidth: 320,
              }}
            >
              <SearchIcon sx={{ color: colors.text.muted, fontSize: 18, mr: 1 }} />
              <InputBase
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  color: colors.text.primary,
                  fontSize: '0.875rem',
                  '& input::placeholder': {
                    color: colors.text.muted,
                    opacity: 1,
                  },
                }}
              />
            </Box>
          ) : (
            <Box />
          )}
          {exportable && (
            <IconButton
              onClick={handleExportCSV}
              size="small"
              sx={{ color: colors.text.secondary, '&:hover': { color: colors.text.primary } }}
              aria-label="Export to CSV"
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    ...headerCellSx,
                    cursor: col.sortable ? 'pointer' : 'default',
                    '&:hover': col.sortable
                      ? { color: colors.text.primary }
                      : {},
                  }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDirection === 'asc' ? (
                        <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                      ) : (
                        <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                      )
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={row.id || rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: onRowClick
                        ? 'rgba(59, 130, 246, 0.04)'
                        : 'transparent',
                    },
                    '&:last-child td': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={cellSx}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ ...cellSx, borderBottom: 'none' }}>
                  <WrfEmptyState
                    variant={searchQuery ? 'search' : 'no-data'}
                    title={searchQuery ? 'No results found' : undefined}
                    description={searchQuery ? `No results match "${searchQuery}"` : emptyMessage}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && sortedData.length > pageSize && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${spacing.sm}px ${spacing.md}px`,
            borderTop: `1px solid ${colors.border.default}`,
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
            {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, sortedData.length)}{' '}
            of {sortedData.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconButton
              size="small"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              sx={{
                color: colors.text.secondary,
                '&.Mui-disabled': { color: colors.text.muted, opacity: 0.4 },
              }}
              aria-label="Previous page"
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, mx: 1 }}>
              {currentPage + 1} / {totalPages}
            </Typography>
            <IconButton
              size="small"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              sx={{
                color: colors.text.secondary,
                '&.Mui-disabled': { color: colors.text.muted, opacity: 0.4 },
              }}
              aria-label="Next page"
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WrfDataTable;
