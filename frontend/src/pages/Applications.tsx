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
  MenuItem,
} from '@mui/material';
import {
  Apps as AppsIcon,
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
import { Application } from '../types';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    project_id: '',
    type: 'container' as 'docker-compose' | 'container' | 'template',
    image: '',
    tag: 'latest',
    port: 80,
    internal_port: 80,
  });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await api.getApplications();
      setApplications(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load applications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (app?: Application) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        name: app.name,
        slug: app.slug,
        description: app.description || '',
        project_id: app.project_id,
        type: app.type,
        image: app.image || '',
        tag: app.tag,
        port: app.port || 80,
        internal_port: app.internal_port || 80,
      });
    } else {
      setEditingApp(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        project_id: '',
        type: 'container',
        image: '',
        tag: 'latest',
        port: 80,
        internal_port: 80,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingApp(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingApp) {
        await api.updateApplication(editingApp.id, formData);
        toast.success('Application updated successfully');
      } else {
        await api.createApplication(formData);
        toast.success('Application created successfully');
      }
      handleCloseDialog();
      loadApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save application');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await api.deleteApplication(id);
      toast.success('Application deleted successfully');
      loadApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete application');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.startApplication(id);
      toast.success('Application started successfully');
      loadApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start application');
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.stopApplication(id);
      toast.success('Application stopped successfully');
      loadApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to stop application');
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await api.restartApplication(id);
      toast.success('Application restarted successfully');
      loadApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to restart application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'default';
      case 'deploying':
        return 'info';
      case 'error':
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
            <AppsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Applications
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Application
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
                  <TableCell>Type</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.name}</TableCell>
                      <TableCell>{app.type}</TableCell>
                      <TableCell>{app.image ? `${app.image}:${app.tag}` : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={app.status}
                          color={getStatusColor(app.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleStart(app.id)}
                          disabled={app.status === 'running'}
                        >
                          <PlayIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleStop(app.id)}
                          disabled={app.status === 'stopped'}
                        >
                          <StopIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleRestart(app.id)}
                        >
                          <RefreshIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(app)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(app.id)}
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
            {editingApp ? 'Edit Application' : 'Create Application'}
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
                label="Slug"
                fullWidth
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                helperText="URL-friendly identifier"
              />
              <TextField
                label="Type"
                fullWidth
                select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <MenuItem value="container">Container</MenuItem>
                <MenuItem value="docker-compose">Docker Compose</MenuItem>
                <MenuItem value="template">Template</MenuItem>
              </TextField>
              <TextField
                label="Image"
                fullWidth
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                helperText="Docker image name (e.g., nginx, mysql)"
              />
              <TextField
                label="Tag"
                fullWidth
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Port"
                  type="number"
                  fullWidth
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                />
                <TextField
                  label="Internal Port"
                  type="number"
                  fullWidth
                  value={formData.internal_port}
                  onChange={(e) => setFormData({ ...formData, internal_port: parseInt(e.target.value) })}
                />
              </Box>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingApp ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Applications;
