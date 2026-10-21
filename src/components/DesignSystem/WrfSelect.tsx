import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectProps as MuiSelectProps } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import type { SxProps, Theme } from '@mui/material/styles';

export interface WrfSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface WrfSelectProps
  extends Omit<MuiSelectProps, 'variant'> {
  label?: string;
  helperText?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
  options?: WrfSelectOption[];
  className?: string;
  sx?: SxProps<Theme>;
}

export const WrfSelect = React.forwardRef<HTMLDivElement, WrfSelectProps>(
  function WrfSelect(
    {
      label,
      helperText,
      error,
      errorMessage,
      options = [],
      children,
      fullWidth = true,
      size = 'small',
      sx,
      ...rest
    },
    ref,
  ) {
    const resolvedHelperText = error && errorMessage ? errorMessage : helperText;

    return (
      <FormControl ref={ref} fullWidth={fullWidth} size={size} error={error} sx={sx}>
        {label && <InputLabel>{label}</InputLabel>}
        <Select label={label} {...rest}>
          {options.length > 0
            ? options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </MenuItem>
            ))
            : children}
        </Select>
        {resolvedHelperText && <FormHelperText>{resolvedHelperText}</FormHelperText>}
      </FormControl>
    );
  },
);
