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
  Folder as FolderIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { Project } from '../types';
import { useAppStore } from '../store/useAppStore';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { selectedOrganization, setSelectedProject } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    organization_id: '',
    status: 'active' as 'active' | 'archived' | 'suspended',
  });

  useEffect(() => {
    loadProjects();
  }, [selectedOrganization]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      if (!selectedOrganization) {
        setProjects([]);
        return;
      }
      const response = await api.getProjects({ organization_id: selectedOrganization.id });
      setProjects(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load projects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    navigate(`/projects/${project.id}`);
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        slug: project.slug,
        description: project.description || '',
        organization_id: project.organization_id,
        status: project.status,
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        organization_id: selectedOrganization?.id || '',
        status: 'active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, formData);
        toast.success('Project updated successfully');
      } else {
        await api.createProject(formData);
        toast.success('Project created successfully');
      }
      handleCloseDialog();
      loadProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await api.deleteProject(id);
      toast.success('Project deleted successfully');
      loadProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'archived':
        return 'default';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1">
              <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Projects
            </Typography>
            {selectedOrganization && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Organization: {selectedOrganization.name}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={!selectedOrganization}
          >
            Create Project
          </Button>
        </Box>

        {!selectedOrganization ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Please select an organization from the top bar to view projects
            </Typography>
          </Paper>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.slug}</TableCell>
                      <TableCell>{project.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={project.status}
                          color={getStatusColor(project.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewProject(project)}
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(project)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(project.id)}
                          title="Delete"
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

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingProject ? 'Edit Project' : 'Create Project'}
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
              {editingProject ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Projects;
