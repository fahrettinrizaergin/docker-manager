import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
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
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Storage as ContainerIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { Container as ContainerType } from '../types';

const Containers: React.FC = () => {
  const [containers, setContainers] = useState<ContainerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContainer, setEditingContainer] = useState<ContainerType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    application_id: '',
    node_id: '',
  });

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      setLoading(true);
      const response = await api.getContainers();
      setContainers(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load containers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (container?: ContainerType) => {
    if (container) {
      setEditingContainer(container);
      setFormData({
        name: container.name,
        image: container.image || '',
        application_id: container.application_id,
        node_id: container.node_id,
      });
    } else {
      setEditingContainer(null);
      setFormData({
        name: '',
        image: '',
        application_id: '',
        node_id: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContainer(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingContainer) {
        await api.updateContainer(editingContainer.id, formData);
        toast.success('Container updated successfully');
      } else {
        await api.createContainer(formData);
        toast.success('Container created successfully');
      }
      handleCloseDialog();
      loadContainers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save container');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this container?')) {
      return;
    }

    try {
      await api.deleteContainer(id);
      toast.success('Container deleted successfully');
      loadContainers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete container');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.startContainer(id);
      toast.success('Container started successfully');
      loadContainers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start container');
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.stopContainer(id);
      toast.success('Container stopped successfully');
      loadContainers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to stop container');
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await api.restartContainer(id);
      toast.success('Container restarted successfully');
      loadContainers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to restart container');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'success';
      case 'stopped':
      case 'exited':
        return 'default';
      case 'starting':
      case 'created':
        return 'info';
      case 'error':
      case 'dead':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            <ContainerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Containers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Container
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {containers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No containers found
                    </TableCell>
                  </TableRow>
                ) : (
                  containers.map((container) => (
                    <TableRow key={container.id}>
                      <TableCell>{container.name}</TableCell>
                      <TableCell>{container.image}</TableCell>
                      <TableCell>
                        <Chip
                          label={container.status}
                          color={getStatusColor(container.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{container.ip_address || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleStart(container.id)}
                          disabled={container.status?.toLowerCase() === 'running'}
                        >
                          <PlayIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleStop(container.id)}
                          disabled={container.status?.toLowerCase() !== 'running'}
                        >
                          <StopIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleRestart(container.id)}
                        >
                          <RefreshIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(container)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(container.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingContainer ? 'Edit Container' : 'Create Container'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                label="Image"
                fullWidth
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                helperText="Docker image name (e.g., nginx:latest, mysql:8.0)"
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingContainer ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Containers;
