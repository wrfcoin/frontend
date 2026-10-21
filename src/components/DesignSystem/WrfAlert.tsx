import React from 'react';
import Alert, { type AlertProps } from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import type { SxProps, Theme } from '@mui/material/styles';

export interface WrfAlertProps extends Omit<AlertProps, 'action'> {
  /** Title displayed at the top of the alert */
  title?: string;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when the alert is dismissed */
  onDismiss?: () => void;
  /** Action button label */
  actionLabel?: string;
  /** Callback for the action button */
  onAction?: () => void;
  className?: string;
  sx?: SxProps<Theme>;
}

export const WrfAlert = React.forwardRef<HTMLDivElement, WrfAlertProps>(
  function WrfAlert(
    {
      severity = 'info',
      title,
      dismissible = false,
      onDismiss,
      actionLabel,
      onAction,
      children,
      sx,
      ...rest
    },
    ref,
  ) {
    const action = actionLabel ? (
      <Button color="inherit" size="small" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : undefined;

    return (
      <Alert
        ref={ref}
        severity={severity}
        onClose={dismissible ? onDismiss : undefined}
        action={action}
        sx={[
          { alignItems: 'flex-start' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
        {...rest}
      >
        {title && <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>}
        {children}
      </Alert>
    );
  },
);
