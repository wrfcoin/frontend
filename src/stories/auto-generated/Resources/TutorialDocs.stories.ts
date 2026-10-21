import type { Meta, StoryObj } from '@storybook/react';
import TutorialDocs from '../../components/Resources/TutorialDocs.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof TutorialDocs> = {
  title: 'Resources/TutorialDocs',
  component: TutorialDocs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for TutorialDocs component from Resources.',
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
    devLog('TutorialDocs rendered successfully');
  },
};
