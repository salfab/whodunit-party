'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Home as HomeIcon, Key as KeyIcon } from '@mui/icons-material';
import { getStoredAdminSecret, storeAdminSecret } from '@/lib/admin-client';

interface Breadcrumb {
  label: string;
  href: string | null;
}

interface AdminNavBarProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  showHome?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export default function AdminNavBar({
  title,
  breadcrumbs,
  showHome = true,
  showBack = false,
  onBack,
}: AdminNavBarProps) {
  const router = useRouter();
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [hasSecret, setHasSecret] = useState(false);

  // Read localStorage after mount only, to keep server and client renders identical.
  useEffect(() => {
    setHasSecret(getStoredAdminSecret() !== null);
  }, []);

  const handleSecretOpen = () => {
    setSecretInput(getStoredAdminSecret() ?? '');
    setSecretDialogOpen(true);
  };

  const handleSecretSave = () => {
    storeAdminSecret(secretInput);
    setSecretDialogOpen(false);
    // Reload so data fetched on mount (e.g. the edit page) retries with the new secret.
    window.location.reload();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    router.push('/');
  };

  return (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0}
      sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        {showHome && (
          <IconButton
            edge="start"
            onClick={handleHome}
            aria-label="Retour à l'accueil"
            data-testid="admin-nav-home"
          >
            <HomeIcon />
          </IconButton>
        )}

        {showBack && (
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label="Retour"
            data-testid="admin-nav-back"
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {breadcrumbs && breadcrumbs.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {breadcrumbs.map((crumb, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {crumb.href ? (
                  <Typography
                    component="a"
                    onClick={() => router.push(crumb.href!)}
                    sx={{
                      cursor: 'pointer',
                      color: 'text.secondary',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {crumb.label}
                  </Typography>
                ) : (
                  <Typography color="text.primary" fontWeight="medium">
                    {crumb.label}
                  </Typography>
                )}
                {index < breadcrumbs.length - 1 && (
                  <Typography color="text.secondary">/</Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {title && !breadcrumbs && (
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        )}

        <Tooltip title={hasSecret ? 'Secret admin enregistré' : 'Saisir le secret admin'}>
          <IconButton
            onClick={handleSecretOpen}
            color={hasSecret ? 'default' : 'warning'}
            aria-label="Secret admin"
            data-testid="admin-secret-button"
            sx={{ ml: 'auto' }}
          >
            <KeyIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Dialog
        open={secretDialogOpen}
        onClose={() => setSecretDialogOpen(false)}
        data-testid="admin-secret-dialog"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Secret admin</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Requis pour créer, modifier, supprimer ou uploader des mystères. Il est conservé dans
            ce navigateur uniquement.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Secret"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSecretSave();
            }}
            data-testid="admin-secret-input"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSecretDialogOpen(false)} data-testid="admin-secret-cancel">
            Annuler
          </Button>
          <Button onClick={handleSecretSave} variant="contained" data-testid="admin-secret-save">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
