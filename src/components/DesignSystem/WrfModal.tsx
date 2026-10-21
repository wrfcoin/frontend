import React from 'react';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import type { SxProps, Theme } from '@mui/material/styles';

export interface WrfModalProps extends Omit<DialogProps, 'title'> {
  /** Modal header title */
  title?: React.ReactNode;
  /** Actions rendered in the footer */
  actions?: React.ReactNode;
  /** Called when the user requests closing (ESC, backdrop click, close button) */
  onClose?: (event: {}, reason: 'backdropClick' | 'escapeKeyDown' | 'closeButton') => void;
  /** Show the close icon button in the header */
  showCloseButton?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

export const WrfModal = React.forwardRef<HTMLDivElement, WrfModalProps>(
  function WrfModal(
    {
      title,
      actions,
      onClose,
      showCloseButton = true,
      children,
      sx,
      ...rest
    },
    ref,
  ) {
    const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
      onClose?.(event, reason);
    };

    const handleCloseButton = () => {
      onClose?.({}, 'closeButton' as any);
    };

    return (
      <Dialog
        ref={ref}
        onClose={handleClose}
        aria-labelledby={title ? 'wrf-modal-title' : undefined}
        sx={sx}
        {...rest}
      >
        {title && (
          <DialogTitle
            id="wrf-modal-title"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 600,
              pr: showCloseButton ? 6 : 3,
            }}
          >
            {title}
            {showCloseButton && (
              <IconButton
                aria-label="close"
                onClick={handleCloseButton}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.text.secondary,
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
        )}

        <DialogContent dividers={!!title}>{children}</DialogContent>

        {actions && <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>}
      </Dialog>
    );
  },
);
