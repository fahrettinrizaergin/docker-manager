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
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { Project, Container, Application } from '../types';
import { useAppStore } from '../store/useAppStore';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useAppStore();
  const [project, setProject] = useState<Project | null>(selectedProject);
  const [applications, setApplications] = useState<Application[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProjectDetails();
    }
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Load project details
      if (!project || project.id !== projectId) {
        const projectResponse = await api.getProject(projectId!);
        setProject(projectResponse.data);
        setSelectedProject(projectResponse.data);
      }
      
      // Load applications for the project
      const appsResponse = await api.getApplications({ project_id: projectId });
      const apps = appsResponse.data || [];
      setApplications(apps);
      
      // Load containers for all applications in the project
      const containerPromises = apps.map((app) => 
        api.getContainers({ application_id: app.id })
      );
      const containerResponses = await Promise.all(containerPromises);
      const allContainers = containerResponses.flatMap((res) => res.data || []);
      setContainers(allContainers);
    } catch (error: any) {
      console.error('Failed to load project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartContainer = async (id: string) => {
    try {
      await api.startContainer(id);
      toast.success('Container started successfully');
      loadProjectDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start container');
    }
  };

  const handleStopContainer = async (id: string) => {
    try {
      await api.stopContainer(id);
      toast.success('Container stopped successfully');
      loadProjectDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to stop container');
    }
  };

  const handleRestartContainer = async (id: string) => {
    try {
      await api.restartContainer(id);
      toast.success('Container restarted successfully');
      loadProjectDetails();
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

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <Container maxWidth="xl">
          <Typography variant="h6" color="error">
            Project not found
          </Typography>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1">
              <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {project.name}
            </Typography>
            {project.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {project.description}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProjectDetails}
          >
            Refresh
          </Button>
        </Box>

        {/* Project Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">Applications</Typography>
                <Typography variant="h3">{applications.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total applications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">Containers</Typography>
                <Typography variant="h3">{containers.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total containers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">Running</Typography>
                <Typography variant="h3">
                  {containers.filter(c => c.status?.toLowerCase() === 'running').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active containers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Containers Table */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Containers</Typography>
          </Box>
          {containers.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No containers found in this project
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Application</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {containers.map((container) => (
                    <TableRow key={container.id}>
                      <TableCell>{container.name}</TableCell>
                      <TableCell>{container.application?.name || '-'}</TableCell>
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
                          onClick={() => handleStartContainer(container.id)}
                          disabled={container.status?.toLowerCase() === 'running'}
                          title="Start"
                        >
                          <PlayIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleStopContainer(container.id)}
                          disabled={container.status?.toLowerCase() !== 'running'}
                          title="Stop"
                        >
                          <StopIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleRestartContainer(container.id)}
                          title="Restart"
                        >
                          <RestartIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Applications Table */}
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Applications</Typography>
          </Box>
          {applications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No applications found in this project
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Layout>
  );
};

export default ProjectDetail;
