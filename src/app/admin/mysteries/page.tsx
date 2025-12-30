'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Upload as UploadIcon, ImageNotSupported as NoImageIcon } from '@mui/icons-material';
import LoadingScreen from '@/components/LoadingScreen';
import AdminNavBar from '@/components/admin/AdminNavBar';

interface Mystery {
  id: string;
  title: string;
  description: string;
  created_at: string;
  image_path: string | null;
}

export default function MysteriesPage() {
  const router = useRouter();
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mysteryToDelete, setMysteryToDelete] = useState<Mystery | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMysteries();
  }, []);

  const loadMysteries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/mysteries');
      if (!response.ok) {
        throw new Error('Failed to load mysteries');
      }
      const data = await response.json();
      setMysteries(data.mysteries || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load mysteries');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (mystery: Mystery) => {
    setMysteryToDelete(mystery);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mysteryToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/mysteries/${mysteryToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete mystery');
      }

      setMysteries(mysteries.filter((m) => m.id !== mysteryToDelete.id));
      setDeleteDialogOpen(false);
      setMysteryToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete mystery');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMysteryToDelete(null);
  };

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  if (loading) {
    return <LoadingScreen message="Chargement des mystères" />;
  }

  return (
    <Container maxWidth="lg">
      <AdminNavBar 
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Mystères', href: null },
        ]}
      />
      
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" data-testid="admin-mysteries-title" sx={{ mb: 2 }}>
          Mystères
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => router.push('/admin/mysteries/upload')}
            data-testid="admin-upload-button"
          >
            Uploader un mystère
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/admin/mysteries/new/edit')}
            data-testid="admin-new-mystery-button"
          >
            Nouveau Mystère
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {mysteries.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun mystère trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Créez votre premier mystère pour commencer
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/mysteries/new/edit')}
            >
              Créer un Mystère
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3} data-testid="admin-mysteries-list">
            {mysteries.map((mystery) => (
              <Grid item xs={12} sm={6} md={4} key={mystery.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                  data-testid={`admin-mystery-row-${mystery.id}`}
                >
                  {mystery.image_path ? (
                    <CardMedia
                      component="img"
                      image={mystery.image_path}
                      alt={mystery.title}
                      sx={{ 
                        objectFit: 'cover',
                        width: '100%',
                        height: 'auto',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        backgroundColor: 'grey.300',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 1,
                        color: 'grey.600',
                      }}
                    >
                      <NoImageIcon sx={{ fontSize: 60 }} />
                      <Typography variant="caption">Pas d'image</Typography>
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ flexGrow: 1, pr: 1 }}>
                        {mystery.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => router.push(`/admin/mysteries/${mystery.id}/edit`)}
                          title="Modifier"
                          data-testid={`admin-edit-mystery-${mystery.id}`}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(mystery)}
                          title="Supprimer"
                          data-testid={`admin-delete-mystery-${mystery.id}`}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {mystery.description && (
                      <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                        {truncateDescription(mystery.description)}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Créé le {new Date(mystery.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} data-testid="admin-delete-dialog">
        <DialogTitle>Supprimer le Mystère</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer "{mysteryToDelete?.title}" ? Cette action ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting} data-testid="admin-delete-cancel">
            Annuler
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting} data-testid="admin-delete-confirm">
            {deleting ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
