import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { WrfDataTable } from '../components/DesignSystem';
import type { WrfDataTableColumn } from '../components/DesignSystem';

interface StationRow {
  id: string;
  name: string;
  status: string;
  temperature: number;
  humidity: number;
  lastReported: string;
}

const sampleColumns: WrfDataTableColumn<StationRow>[] = [
  { key: 'name', label: 'Station Name', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'temperature', label: 'Temp (C)', sortable: true },
  { key: 'humidity', label: 'Humidity (%)', sortable: true },
  { key: 'lastReported', label: 'Last Report', sortable: false },
];

const sampleData: StationRow[] = Array.from({ length: 25 }, (_, i) => ({
  id: `station-${i + 1}`,
  name: `Weather Station ${i + 1}`,
  status: i % 5 === 0 ? 'Offline' : 'Active',
  temperature: Math.round((18 + Math.random() * 15) * 10) / 10,
  humidity: Math.round(40 + Math.random() * 50),
  lastReported: i % 5 === 0 ? '2 days ago' : `${Math.floor(Math.random() * 30) + 1}m ago`,
}));

const meta = {
  title: 'DesignSystem/WrfDataTable',
  component: WrfDataTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof WrfDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns: sampleColumns as unknown as WrfDataTableColumn<Record<string, unknown>>[],
    data: sampleData as unknown as Record<string, unknown>[],
    searchable: true,
    exportable: true,
    pagination: true,
    pageSize: 10,
  },
};

export const WithRowClick: Story = {
  args: {
    columns: sampleColumns as unknown as WrfDataTableColumn<Record<string, unknown>>[],
    data: sampleData.slice(0, 5) as unknown as Record<string, unknown>[],
    onRowClick: fn(),
    pagination: false,
  },
};

export const Loading: Story = {
  args: {
    columns: sampleColumns as unknown as WrfDataTableColumn<Record<string, unknown>>[],
    data: [],
    loading: true,
  },
};

export const EmptyState: Story = {
  args: {
    columns: sampleColumns as unknown as WrfDataTableColumn<Record<string, unknown>>[],
    data: [],
    emptyMessage: 'No weather stations registered in this region.',
  },
};

export const NoPagination: Story = {
  args: {
    columns: sampleColumns as unknown as WrfDataTableColumn<Record<string, unknown>>[],
    data: sampleData.slice(0, 3) as unknown as Record<string, unknown>[],
    pagination: false,
    searchable: false,
    exportable: false,
  },
};
