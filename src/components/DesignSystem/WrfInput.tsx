import React from 'react';
import TextField, { type TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import type { SxProps, Theme } from '@mui/material/styles';

export interface WrfInputProps
  extends Omit<MuiTextFieldProps, 'variant' | 'size'> {
  /** Label displayed above the input */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: React.ReactNode;
  /** Error state + message */
  error?: boolean;
  errorMessage?: string;
  /** Prefix icon or element */
  prefixIcon?: React.ReactNode;
  /** Suffix icon or element */
  suffixIcon?: React.ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

export const WrfInput = React.forwardRef<HTMLInputElement, WrfInputProps>(
  function WrfInput(
    {
      label,
      helperText,
      error,
      errorMessage,
      prefixIcon,
      suffixIcon,
      sx,
      slotProps,
      ...rest
    },
    ref,
  ) {
    const resolvedHelperText = error && errorMessage ? errorMessage : helperText;

    const inputSlotProps: MuiTextFieldProps['slotProps'] = {
      ...slotProps,
      input: {
        ...(slotProps?.input as object),
        ...(prefixIcon
          ? { startAdornment: <InputAdornment position="start">{prefixIcon}</InputAdornment> }
          : {}),
        ...(suffixIcon
          ? { endAdornment: <InputAdornment position="end">{suffixIcon}</InputAdornment> }
          : {}),
      },
    };

    return (
      <TextField
        inputRef={ref}
        variant="outlined"
        size="small"
        label={label}
        helperText={resolvedHelperText}
        error={error}
        fullWidth
        slotProps={inputSlotProps}
        sx={sx}
        {...rest}
      />
    );
  },
);
