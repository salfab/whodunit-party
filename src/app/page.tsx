'use client';

import { Box, Container, Button, IconButton, MenuItem, Select } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { type Locale } from '@/i18n/request';

export default function Home() {
  const t = useTranslations();
  const [locale, setLocale] = useState<Locale>('fr');

  // Load locale from cookie on mount
  useEffect(() => {
    const cookieLocale = globalThis.document.cookie
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
          top: { xs: 12, sm: 18 },
          right: { xs: 12, sm: 18 },
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
            minWidth: 86,
            bgcolor: 'rgba(7, 8, 10, 0.45)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'secondary.main',
            },
          }}
        >
          <MenuItem value="fr">FR</MenuItem>
          <MenuItem value="en">EN</MenuItem>
          <MenuItem value="es">ES</MenuItem>
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
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 3, sm: 4 },
          py: { xs: 8, sm: 10 },
        }}
      >
        <Box
          sx={{ 
            position: 'relative',
            filter: 'drop-shadow(0px 18px 42px rgba(0, 0, 0, 0.82))',
            display: 'flex',
            width: 'calc(100% + 28px)',
            maxWidth: 540,
            marginLeft: '-14px',
            marginRight: '-14px',
          }}
        >
          <Image 
            src="/logo.png" 
            alt={t('home.title')} 
            width={300}
            height={150}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            priority
          />
        </Box>
        
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
            mt: { xs: 1, sm: 3 },
          }}
        >
          <Button
            variant="contained"
            size="large"
            href="/create-room"
            data-testid="create-room-button"
            sx={{ minHeight: 52 }}
          >
            {t('home.createRoom')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            href="/join"
            data-testid="join-game-button"
            sx={{ minHeight: 52 }}
          >
            {t('home.joinRoom')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

