import React from 'react';
import Tooltip, { type TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';
import type { SxProps, Theme } from '@mui/material/styles';

export interface WrfTooltipProps extends Omit<MuiTooltipProps, 'classes'> {
  className?: string;
  sx?: SxProps<Theme>;
}

export const WrfTooltip = React.forwardRef<HTMLDivElement, WrfTooltipProps>(
  function WrfTooltip({ children, arrow = true, enterDelay = 300, sx, ...rest }, ref) {
    return (
      <Tooltip
        ref={ref}
        arrow={arrow}
        enterDelay={enterDelay}
        slotProps={{
          tooltip: {
            sx: [
              {
                maxWidth: 300,
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                py: 1,
                px: 1.5,
              },
              ...(Array.isArray(sx) ? sx : [sx]),
            ] as SxProps<Theme>,
          },
        }}
        {...rest}
      >
        {children}
      </Tooltip>
    );
  },
);
