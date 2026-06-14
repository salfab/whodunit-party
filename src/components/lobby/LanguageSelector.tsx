'use client';

import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface LanguageSelectorProps {
  value: string;
  // eslint-disable-next-line no-unused-vars -- type-level parameter name
  onChange: (language: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
];

export function LanguageSelector({ value, onChange, compact = false, disabled = false }: LanguageSelectorProps) {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  const selectedLanguage = LANGUAGES.find((language) => language.code === value);

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: compact ? 66 : 160,
        ...(compact
          ? {
              '& .MuiOutlinedInput-root': {
                minHeight: 38,
              },
            }
          : {}),
        '& .MuiSelect-select': compact
          ? {
              py: 0.62,
              pr: '26px !important',
              fontWeight: 800,
              fontSize: '0.78rem',
              textTransform: 'uppercase',
            }
          : undefined,
      }}
    >
      {!compact && <InputLabel id="language-select-label">Langue</InputLabel>}
      <Select
        labelId={compact ? undefined : 'language-select-label'}
        value={value}
        label={compact ? undefined : 'Langue'}
        onChange={handleChange}
        disabled={disabled}
        inputProps={compact ? { 'aria-label': 'Langue' } : undefined}
        renderValue={compact ? () => selectedLanguage?.code.toUpperCase() || value.toUpperCase() : undefined}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
