'use client';

import { Box, Container, Typography, Button, IconButton, MenuItem, Select } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { type Locale } from '@/i18n/request';

export default function Home() {
  const t = useTranslations();
  const [locale, setLocale] = useState<Locale>('fr');

  // Load locale from cookie on mount
  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale | undefined;
    
    if (cookieLocale) {
      setLocale(cookieLocale);
    }
  }, []);

  const handleLanguageChange = async (newLocale: Locale) => {
    setLocale(newLocale);
    
    // Set cookie via API route
    try {
      await fetch('/api/set-locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: newLocale }),
      });
      
      // Reload page to apply new locale
      window.location.reload();
    } catch (error) {
      console.error('Failed to set locale:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Select
          value={locale}
          onChange={(e) => handleLanguageChange(e.target.value as Locale)}
          size="small"
          sx={{
            minWidth: 100,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
          }}
        >
          <MenuItem value="fr">🇫🇷 FR</MenuItem>
          <MenuItem value="en">🇬🇧 EN</MenuItem>
          <MenuItem value="es">🇪🇸 ES</MenuItem>
        </Select>
        <IconButton
          component={Link}
          href="/admin/mysteries"
          color="primary"
          size="large"
          aria-label={t('home.admin')}
        >
          <SettingsIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h2" component="h1" textAlign="center">
          🔍 {t('home.title')}
        </Typography>
        <Typography variant="h5" textAlign="center" color="text.secondary">
          {t('home.subtitle')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            href="/create-room"
            data-testid="create-room-button"
          >
            {t('home.createRoom')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            href="/join"
            data-testid="join-game-button"
          >
            {t('home.joinRoom')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
