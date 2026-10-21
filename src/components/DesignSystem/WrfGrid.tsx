import React from 'react';
import Grid, { type GridProps as MuiGridProps } from '@mui/material/Grid';
import Container, { type ContainerProps as MuiContainerProps } from '@mui/material/Container';
import type { SxProps, Theme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// WrfGrid - replaces Bootstrap row/col-* grid system
// ---------------------------------------------------------------------------

export interface WrfGridProps extends MuiGridProps {
  className?: string;
  sx?: SxProps<Theme>;
}

export const WrfGrid = React.forwardRef<HTMLDivElement, WrfGridProps>(
  function WrfGrid({ children, sx, ...rest }, ref) {
    return (
      <Grid ref={ref} sx={sx} {...rest}>
        {children}
      </Grid>
    );
  },
);

// ---------------------------------------------------------------------------
// WrfContainer - replaces Bootstrap container class
// ---------------------------------------------------------------------------

export interface WrfContainerProps extends MuiContainerProps {
  className?: string;
  sx?: SxProps<Theme>;
}

export const WrfContainer = React.forwardRef<HTMLDivElement, WrfContainerProps>(
  function WrfContainer({ children, maxWidth = 'lg', sx, ...rest }, ref) {
    return (
      <Container ref={ref} maxWidth={maxWidth} sx={sx} {...rest}>
        {children}
      </Container>
    );
  },
);
