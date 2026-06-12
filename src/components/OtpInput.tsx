'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Box, styled } from '@mui/material';

const InputBox = styled('input')(({ theme }) => ({
  width: '46px',
  height: '54px',
  fontSize: '23px',
  fontWeight: 900,
  textAlign: 'center',
  textTransform: 'uppercase',
  border: '1px solid rgba(184, 150, 95, 0.46)',
  borderRadius: 6,
  backgroundColor: 'rgba(7, 8, 10, 0.42)',
  color: theme.palette.text.primary,
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: '"Bahnschrift Condensed", "Bahnschrift SemiCondensed", "Arial Narrow", "Arial Black", sans-serif',
  letterSpacing: '0.02em',
  boxShadow: 'inset 0 0 18px rgba(0, 0, 0, 0.28)',
  flexShrink: 1,
  minWidth: '32px',
  
  '&:focus': {
    borderColor: theme.palette.secondary.main,
    boxShadow: `0 0 0 2px ${theme.palette.secondary.main}24, inset 0 0 22px rgba(0, 0, 0, 0.34)`,
    backgroundColor: 'rgba(7, 8, 10, 0.64)',
  },
  
  '&:disabled': {
    backgroundColor: 'rgba(7, 8, 10, 0.24)',
    color: theme.palette.text.secondary,
    borderColor: 'rgba(184, 150, 95, 0.24)',
    cursor: 'not-allowed',
  },
  
  [theme.breakpoints.down('sm')]: {
    width: '39px',
    height: '48px',
    fontSize: '20px',
  },
}));

interface OtpInputProps {
  length: number;
  value: string;
  // eslint-disable-next-line no-unused-vars -- type-level parameter name
  onChange: (value: string) => void;
  disabled?: boolean;
  'data-testid'?: string;
}

export default function OtpInput({
  length,
  value,
  onChange,
  disabled = false,
  'data-testid': dataTestId,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount if empty
    if (!value && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    // When value is populated externally (e.g., from URL param), focus the next empty input
    if (value && value.length < length) {
      const nextIndex = value.length;
      inputRefs.current[nextIndex]?.focus();
    } else if (value && value.length === length) {
      // All filled, focus the last one
      inputRefs.current[length - 1]?.focus();
    }
  }, [value, length]);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow alphanumeric characters
    const sanitized = inputValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (sanitized.length === 0) {
      // Handle deletion
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));
      return;
    }

    if (sanitized.length === 1) {
      // Single character input
      const newValue = value.split('');
      newValue[index] = sanitized;
      const result = newValue.join('').slice(0, length);
      onChange(result);

      // Move to next input
      if (index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Handle paste of multiple characters
      handlePaste(index, sanitized);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (startIndex: number, pastedText: string) => {
    const sanitized = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const chars = sanitized.split('').slice(0, length);
    
    const newValue = value.split('');
    chars.forEach((char, i) => {
      const targetIndex = startIndex + i;
      if (targetIndex < length) {
        newValue[targetIndex] = char;
      }
    });
    
    const result = newValue.join('').slice(0, length);
    onChange(result);

    // Focus the next empty input or the last filled one
    const nextEmptyIndex = result.length;
    const targetIndex = Math.min(nextEmptyIndex, length - 1);
    inputRefs.current[targetIndex]?.focus();
  };

  const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    handlePaste(0, pastedText);
  };

  const handleClick = (index: number) => {
    // When clicking on an input, select its content
    inputRefs.current[index]?.select();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 0.5, sm: 1 },
        justifyContent: 'center',
        flexWrap: 'nowrap',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
      data-testid={dataTestId}
    >
      {Array.from({ length }).map((_, index) => (
        <InputBox
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="text"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePasteEvent}
          onClick={() => handleClick(index)}
          disabled={disabled}
          data-testid={index === 0 ? 'game-code-input' : undefined}
        />
      ))}
    </Box>
  );
}
