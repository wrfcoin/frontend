import React, { useState, useCallback } from 'react';
import Tabs, { type TabsProps } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

export interface WrfTabItem {
  label: string;
  value: string;
  icon?: React.ReactElement;
  disabled?: boolean;
}

export interface WrfTabsProps extends Omit<TabsProps, 'value' | 'onChange'> {
  /** Tab definitions */
  items: WrfTabItem[];
  /** Currently selected tab value */
  value?: string;
  /** Default selected tab (uncontrolled mode) */
  defaultValue?: string;
  /** Callback on tab change */
  onChange?: (value: string) => void;
  className?: string;
  sx?: SxProps<Theme>;
}

export interface WrfTabPanelProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export function WrfTabPanel({ value, activeValue, children, sx }: WrfTabPanelProps) {
  if (value !== activeValue) return null;

  return (
    <Box
      role="tabpanel"
      id={`wrf-tabpanel-${value}`}
      aria-labelledby={`wrf-tab-${value}`}
      sx={[{ pt: 2 }, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}
    >
      {children}
    </Box>
  );
}

export const WrfTabs = React.forwardRef<HTMLDivElement, WrfTabsProps>(
  function WrfTabs(
    { items, value: controlledValue, defaultValue, onChange, sx, ...rest },
    ref,
  ) {
    const [internalValue, setInternalValue] = useState(
      defaultValue ?? items[0]?.value ?? '',
    );
    const activeValue = controlledValue ?? internalValue;

    const handleChange = useCallback(
      (_: React.SyntheticEvent, newValue: string) => {
        if (controlledValue === undefined) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      },
      [controlledValue, onChange],
    );

    return (
      <Tabs
        ref={ref}
        value={activeValue}
        onChange={handleChange}
        sx={[
          {
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
        {...rest}
      >
        {items.map((item) => (
          <Tab
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            iconPosition="start"
            disabled={item.disabled}
            id={`wrf-tab-${item.value}`}
            aria-controls={`wrf-tabpanel-${item.value}`}
          />
        ))}
      </Tabs>
    );
  },
);
