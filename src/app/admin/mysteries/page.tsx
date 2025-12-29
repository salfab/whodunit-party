'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material';
import LoadingScreen from '@/components/LoadingScreen';
import AdminNavBar from '@/components/admin/AdminNavBar';

interface Mystery {
  id: string;
  title: string;
  description: string;
  created_at: string;
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

  const truncateDescription = (description: string, maxLength: number = 100) => {
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
            Télécharger JSON
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
          <TableContainer component={Paper} data-testid="admin-mysteries-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titre</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Créé le</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody data-testid="admin-mysteries-list">
                {mysteries.map((mystery) => (
                  <TableRow key={mystery.id} hover data-testid={`admin-mystery-row-${mystery.id}`}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {mystery.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {truncateDescription(mystery.description)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(mystery.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => router.push(`/admin/mysteries/${mystery.id}/edit`)}
                        title="Edit"
                        data-testid={`admin-edit-mystery-${mystery.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(mystery)}
                        title="Delete"
                        data-testid={`admin-delete-mystery-${mystery.id}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
