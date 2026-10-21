import React from 'react';

interface WrfInputProps {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: boolean;
  errorMessage?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  value?: any;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: string;
  sx?: Record<string, any>;
  [key: string]: any;
}

declare const WrfInput: React.FC<WrfInputProps>;
export default WrfInput;
