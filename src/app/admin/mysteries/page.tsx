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
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h3" component="h1">
            Mysteries
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => router.push('/admin/mysteries/upload')}
            >
              Upload JSON
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/mysteries/new/edit')}
            >
              New Mystery
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {mysteries.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No mysteries found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create your first mystery to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/mysteries/new/edit')}
            >
              Create Mystery
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mysteries.map((mystery) => (
                  <TableRow key={mystery.id} hover>
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
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(mystery)}
                        title="Delete"
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

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Mystery</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{mysteryToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
