import type { Meta, StoryObj } from '@storybook/react';
import ParameterList from '../../Governance/ParameterList.jsx';

const meta: Meta<typeof ParameterList> = {
  title: 'Components/Governance/ParameterList',
  component: ParameterList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
