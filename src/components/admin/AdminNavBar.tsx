'use client';

import { useRouter } from 'next/navigation';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Home as HomeIcon } from '@mui/icons-material';

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
      </Toolbar>
    </AppBar>
  );
}
