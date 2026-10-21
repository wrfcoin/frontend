import type { Meta, StoryObj } from '@storybook/react';
import ExampleProposals from '../../components/Governance/ExampleProposals.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ExampleProposals> = {
  title: 'Governance/ExampleProposals',
  component: ExampleProposals,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ExampleProposals component from Governance.',
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
    devLog('ExampleProposals rendered successfully');
  },
};
