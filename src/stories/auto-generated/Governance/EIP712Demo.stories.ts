import type { Meta, StoryObj } from '@storybook/react';
import EIP712Demo from '../../components/Governance/EIP712Demo.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof EIP712Demo> = {
  title: 'Governance/EIP712Demo',
  component: EIP712Demo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for EIP712Demo component from Governance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};

export const Interactive: Story = {
  args: {
    // No props detected
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    devLog('EIP712Demo rendered successfully');
  },
};
