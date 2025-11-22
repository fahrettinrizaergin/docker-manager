import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Folder as FolderIcon,
  Apps as AppsIcon,
  ChevronRight as ChevronRightIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { Organization, Project, Application } from '../types';

const Explorer: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const response = await api.getOrganizations();
      setOrganizations(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load organizations');
      console.error(error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadProjects = async (orgId: string) => {
    try {
      setLoadingProjects(true);
      const response = await api.getProjects({ organization_id: orgId });
      setProjects(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load projects');
      console.error(error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadApplications = async (projectId: string) => {
    try {
      setLoadingApps(true);
      const response = await api.getApplications({ project_id: projectId });
      setApplications(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load applications');
      console.error(error);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setSelectedProject(null);
    setProjects([]);
    setApplications([]);
    loadProjects(org.id);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setApplications([]);
    loadApplications(project.id);
  };

  const handleBackToOrgs = () => {
    setSelectedOrg(null);
    setSelectedProject(null);
    setProjects([]);
    setApplications([]);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setApplications([]);
  };

  const handleStartApp = async (id: string) => {
    try {
      await api.startApplication(id);
      toast.success('Application started successfully');
      if (selectedProject) {
        loadApplications(selectedProject.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start application');
    }
  };

  const handleStopApp = async (id: string) => {
    try {
      await api.stopApplication(id);
      toast.success('Application stopped successfully');
      if (selectedProject) {
        loadApplications(selectedProject.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to stop application');
    }
  };

  const handleRestartApp = async (id: string) => {
    try {
      await api.restartApplication(id);
      toast.success('Application restarted successfully');
      if (selectedProject) {
        loadApplications(selectedProject.id);
      }
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Resource Explorer
          </Typography>
          
          {/* Breadcrumbs */}
          <Breadcrumbs separator={<ChevronRightIcon fontSize="small" />} sx={{ mt: 2 }}>
            <Link
              component="button"
              variant="body1"
              onClick={handleBackToOrgs}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Organizations
            </Link>
            {selectedOrg && (
              <Link
                component="button"
                variant="body1"
                onClick={handleBackToProjects}
                sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
              >
                <BusinessIcon sx={{ mr: 0.5 }} fontSize="small" />
                {selectedOrg.name}
              </Link>
            )}
            {selectedProject && (
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                <FolderIcon sx={{ mr: 0.5 }} fontSize="small" />
                {selectedProject.name}
              </Typography>
            )}
          </Breadcrumbs>
        </Box>

        <Grid container spacing={3}>
          {/* Left Panel - Organizations or Projects */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                {selectedOrg ? (
                  <>
                    <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Projects
                  </>
                ) : (
                  <>
                    <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Organizations
                  </>
                )}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Organizations List */}
              {!selectedOrg && (
                <>
                  {loadingOrgs ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : organizations.length === 0 ? (
                    <Typography color="text.secondary" align="center">
                      No organizations found
                    </Typography>
                  ) : (
                    <List>
                      {organizations.map((org) => (
                        <ListItem key={org.id} disablePadding>
                          <ListItemButton onClick={() => handleSelectOrganization(org)}>
                            <ListItemIcon>
                              <BusinessIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={org.name}
                              secondary={org.description || 'No description'}
                            />
                            <ChevronRightIcon />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </>
              )}

              {/* Projects List */}
              {selectedOrg && !selectedProject && (
                <>
                  {loadingProjects ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : projects.length === 0 ? (
                    <Typography color="text.secondary" align="center">
                      No projects found
                    </Typography>
                  ) : (
                    <List>
                      {projects.map((project) => (
                        <ListItem key={project.id} disablePadding>
                          <ListItemButton onClick={() => handleSelectProject(project)}>
                            <ListItemIcon>
                              <FolderIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={project.name}
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip label={project.status} size="small" />
                                  {project.description && (
                                    <Typography variant="caption">{project.description}</Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ChevronRightIcon />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </>
              )}
            </Paper>
          </Grid>

          {/* Right Panel - Applications/Containers */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
              {selectedProject ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    <AppsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Applications & Containers
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {loadingApps ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : applications.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <AppsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary">
                        No applications found in this project
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {applications.map((app) => (
                        <Grid item xs={12} key={app.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box>
                                  <Typography variant="h6" component="div">
                                    {app.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
                                    <Chip
                                      label={app.status}
                                      color={getStatusColor(app.status) as any}
                                      size="small"
                                    />
                                    <Chip label={app.type} size="small" variant="outlined" />
                                  </Box>
                                  {app.image && (
                                    <Typography variant="body2" color="text.secondary">
                                      Image: {app.image}:{app.tag}
                                    </Typography>
                                  )}
                                  {app.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {app.description}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </CardContent>
                            <CardActions>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleStartApp(app.id)}
                                disabled={app.status === 'running'}
                                title="Start"
                              >
                                <PlayIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleStopApp(app.id)}
                                disabled={app.status === 'stopped'}
                                title="Stop"
                              >
                                <StopIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleRestartApp(app.id)}
                                title="Restart"
                              >
                                <RefreshIcon />
                              </IconButton>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Select a Project
                  </Typography>
                  <Typography color="text.secondary">
                    {selectedOrg
                      ? 'Choose a project from the left panel to view its applications'
                      : 'First select an organization, then select a project to view applications'}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Explorer;
