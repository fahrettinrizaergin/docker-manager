import React, { useState, useEffect } from 'react';
import {
  Container as MuiContainer,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Menu,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
  Description as LogsIcon,
  Settings as ConfigIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { Project, Container } from '../types';
import { useAppStore } from '../store/useAppStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`create-tabpanel-${index}`}
      aria-labelledby={`create-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetailEnhanced: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useAppStore();
  const [project, setProject] = useState<Project | null>(selectedProject);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation dialog
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createTabValue, setCreateTabValue] = useState(0);
  const [createFormData, setCreateFormData] = useState<any>({
    // Container
    name: '',
    app_name: '',
    // Database
    db_type: 'postgresql',
    db_name: '',
    db_user: '',
    db_password: '',
    db_root_password: '',
    db_image: '',
    description: '',
    // Compose
    compose_type: 'docker-compose',
    compose_content: '',
  });

  // Container actions menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  // Logs dialog
  const [openLogsDialog, setOpenLogsDialog] = useState(false);
  const [logs, setLogs] = useState('');

  // Delete confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteWithVolumes, setDeleteWithVolumes] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'container' | 'project', id: string } | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      
      if (!project || project.id !== projectId) {
        const projectResponse = await api.getProject(projectId!);
        setProject(projectResponse.data);
        setSelectedProject(projectResponse.data);
      }
      
      const appsResponse = await api.getContainers({ project_id: projectId });
      const apps = appsResponse.data || [];
      setContainers(apps);
      
      // TODO: Load container instances when API is available
      // const containerPromises = apps.map((app: Container) => 
      //   api.getContainerInstances({ container_id: app.id })
      // );
      // const containerResponses = await Promise.all(containerPromises);
      // const allContainers = containerResponses.flatMap((res) => res.data || []);
      // setContainerInstances(allContainers);
    } catch (error: any) {
      console.error('Failed to load project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const refreshContainers = async () => {
    try {
      const appsResponse = await api.getContainers({ project_id: projectId });
      const apps = appsResponse.data || [];
      setContainers(apps);
      
      // TODO: Load container instances when API is available
      // const containerPromises = apps.map((app: Container) => 
      //   api.getContainerInstances({ container_id: app.id })
      // );
      // const containerResponses = await Promise.all(containerPromises);
      // const allContainers = containerResponses.flatMap((res) => res.data || []);
      // setContainerInstances(allContainers);
    } catch (error: any) {
      console.error('Failed to refresh containers:', error);
    }
  };

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setCreateTabValue(0);
    setCreateFormData({
      name: '',
      app_name: '',
      db_type: 'postgresql',
      db_name: '',
      db_user: '',
      db_password: '',
      db_root_password: '',
      db_image: '',
      description: '',
      compose_type: 'docker-compose',
      compose_content: '',
    });
  };

  const handleCreateSubmit = async () => {
    try {
      // Based on the tab, create different types of containers
      switch (createTabValue) {
        case 0: // Container
          await api.createContainer({
            project_id: projectId,
            name: createFormData.name,
            slug: createFormData.app_name || createFormData.name.toLowerCase().replace(/\s+/g, '-'),
            type: 'container',
          });
          toast.success('Container created successfully');
          break;
        case 1: // Database
          // Create database container based on type
          await api.createContainer({
            project_id: projectId,
            name: createFormData.name,
            slug: createFormData.name.toLowerCase().replace(/\s+/g, '-'),
            type: 'container',
            image: createFormData.db_image || getDatabaseDefaultImage(createFormData.db_type),
            description: createFormData.description,
          });
          toast.success('Database container created successfully');
          break;
        case 2: // Compose
          await api.createContainer({
            project_id: projectId,
            name: createFormData.name,
            slug: createFormData.app_name || createFormData.name.toLowerCase().replace(/\s+/g, '-'),
            type: 'docker-compose',
            compose_file: createFormData.compose_content,
          });
          toast.success('Compose application created successfully');
          break;
        case 3: // Template
          // This would deploy from a template
          toast.info('Template deployment not yet implemented');
          break;
      }
      handleCloseCreateDialog();
      loadProjectDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create container');
    }
  };

  const getDatabaseDefaultImage = (type: string) => {
    switch (type) {
      case 'postgresql': return 'postgres:latest';
      case 'mongodb': return 'mongo:latest';
      case 'mariadb': return 'mariadb:latest';
      case 'redis': return 'redis:latest';
      default: return '';
    }
  };

  const handleContainerMenuOpen = (event: React.MouseEvent<HTMLElement>, container: Container) => {
    setAnchorEl(event.currentTarget);
    setSelectedContainer(container);
  };

  const handleContainerMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStartContainer = async (id: string) => {
    try {
      await api.startContainer(id);
      toast.success('Container started successfully');
      refreshContainers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start container');
    }
  };

  const handleStopContainer = async (id: string) => {
    try {
      await api.stopContainer(id);
      toast.success('Container stopped successfully');
      refreshContainers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to stop container');
    }
  };

  const handleRestartContainer = async (id: string) => {
    try {
      await api.restartContainer(id);
      toast.success('Container restarted successfully');
      refreshContainers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to restart container');
    }
  };

  const handleViewLogs = async (containerId: string) => {
    handleContainerMenuClose();
    setOpenLogsDialog(true);
    setLogs('Loading logs...');
    // In a real implementation, this would fetch actual logs
    // For now, show placeholder
    setTimeout(() => {
      setLogs('Container logs would appear here...\nThis feature requires backend implementation.');
    }, 500);
  };

  const handleOpenDeleteDialog = (type: 'container' | 'project', id: string) => {
    setDeleteTarget({ type, id });
    setOpenDeleteDialog(true);
    handleContainerMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteWithVolumes(false);
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'container') {
        // In real implementation, pass deleteWithVolumes parameter
        await api.deleteContainer(deleteTarget.id);
        toast.success('Container deleted successfully');
        refreshContainers();
      } else if (deleteTarget.type === 'project') {
        await api.deleteProject(deleteTarget.id);
        toast.success('Project deleted successfully');
        navigate('/projects');
      }
      handleCloseDeleteDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const handleOpenConfiguration = (containerId: string) => {
    handleContainerMenuClose();
    navigate(`/project/${projectId}/environment/${containerId}`);
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
        <MuiContainer maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </MuiContainer>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <MuiContainer maxWidth="xl">
          <Typography variant="h6" color="error">
            Project not found
          </Typography>
        </MuiContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <MuiContainer maxWidth="xl">
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Create New
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadProjectDetails}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleOpenDeleteDialog('project', project.id)}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Project Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
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
                    <TableCell>Type</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {containers.map((container) => (
                    <TableRow key={container.id}>
                      <TableCell>{container.name}</TableCell>
                      <TableCell>{container.type || '-'}</TableCell>
                      <TableCell>{container.image || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={container.status}
                          color={getStatusColor(container.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleContainerMenuOpen(e, container)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Container Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleContainerMenuClose}
        >
          <MenuItem onClick={() => selectedContainer && handleStartContainer(selectedContainer.id)}>
            <PlayIcon fontSize="small" sx={{ mr: 1 }} /> Start
          </MenuItem>
          <MenuItem onClick={() => selectedContainer && handleStopContainer(selectedContainer.id)}>
            <StopIcon fontSize="small" sx={{ mr: 1 }} /> Stop
          </MenuItem>
          <MenuItem onClick={() => selectedContainer && handleRestartContainer(selectedContainer.id)}>
            <RestartIcon fontSize="small" sx={{ mr: 1 }} /> Restart
          </MenuItem>
          <MenuItem onClick={() => selectedContainer && handleViewLogs(selectedContainer.id)}>
            <LogsIcon fontSize="small" sx={{ mr: 1 }} /> Logs
          </MenuItem>
          <MenuItem onClick={() => selectedContainer && handleOpenConfiguration(selectedContainer.id)}>
            <ConfigIcon fontSize="small" sx={{ mr: 1 }} /> Configuration
          </MenuItem>
          <MenuItem onClick={() => selectedContainer && handleOpenDeleteDialog('container', selectedContainer.id)}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

        {/* Create Container Dialog */}
        <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
          <DialogTitle>Create New Container</DialogTitle>
          <DialogContent>
            <Tabs value={createTabValue} onChange={(e, v) => setCreateTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Container" />
              <Tab label="Database" />
              <Tab label="Compose" />
              <Tab label="Template" />
            </Tabs>

            <TabPanel value={createTabValue} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  fullWidth
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  helperText="Display name for the application"
                />
                <TextField
                  label="App Name"
                  fullWidth
                  value={createFormData.app_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, app_name: e.target.value })}
                  helperText="Used in Swarm (project name will be used as prefix)"
                />
              </Box>
            </TabPanel>

            <TabPanel value={createTabValue} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Database Type"
                  fullWidth
                  value={createFormData.db_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, db_type: e.target.value })}
                >
                  <MenuItem value="postgresql">PostgreSQL</MenuItem>
                  <MenuItem value="mongodb">MongoDB</MenuItem>
                  <MenuItem value="mariadb">MariaDB</MenuItem>
                  <MenuItem value="redis">Redis</MenuItem>
                </TextField>
                <TextField
                  label="Name"
                  fullWidth
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                />
                {(createFormData.db_type === 'postgresql' || createFormData.db_type === 'mariadb') && (
                  <TextField
                    label="Database Name"
                    fullWidth
                    value={createFormData.db_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, db_name: e.target.value })}
                  />
                )}
                <TextField
                  label="User"
                  fullWidth
                  value={createFormData.db_user}
                  onChange={(e) => setCreateFormData({ ...createFormData, db_user: e.target.value })}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={createFormData.db_password}
                  onChange={(e) => setCreateFormData({ ...createFormData, db_password: e.target.value })}
                />
                {createFormData.db_type === 'mariadb' && (
                  <TextField
                    label="Root Password"
                    type="password"
                    fullWidth
                    value={createFormData.db_root_password}
                    onChange={(e) => setCreateFormData({ ...createFormData, db_root_password: e.target.value })}
                  />
                )}
                <TextField
                  label="Image"
                  fullWidth
                  value={createFormData.db_image}
                  onChange={(e) => setCreateFormData({ ...createFormData, db_image: e.target.value })}
                  placeholder={getDatabaseDefaultImage(createFormData.db_type)}
                  helperText="Leave empty for default image"
                />
              </Box>
            </TabPanel>

            <TabPanel value={createTabValue} index={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  fullWidth
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                />
                <TextField
                  label="App Name"
                  fullWidth
                  value={createFormData.app_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, app_name: e.target.value })}
                  helperText="Used in Swarm"
                />
                <TextField
                  select
                  label="Compose Type"
                  fullWidth
                  value={createFormData.compose_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, compose_type: e.target.value })}
                >
                  <MenuItem value="docker-compose">Docker Compose</MenuItem>
                  <MenuItem value="stack">Stack</MenuItem>
                </TextField>
                <TextField
                  label="Compose Content"
                  fullWidth
                  multiline
                  rows={10}
                  value={createFormData.compose_content}
                  onChange={(e) => setCreateFormData({ ...createFormData, compose_content: e.target.value })}
                  placeholder="version: '3.8'\nservices:\n  ..."
                />
              </Box>
            </TabPanel>

            <TabPanel value={createTabValue} index={3}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Template deployment will show a list of predefined containers with a "Create" button for each.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  This feature requires backend implementation.
                </Typography>
              </Box>
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateDialog}>Cancel</Button>
            <Button onClick={handleCreateSubmit} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Logs Dialog */}
        <Dialog open={openLogsDialog} onClose={() => setOpenLogsDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Container Logs</DialogTitle>
          <DialogContent>
            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#fff', fontFamily: 'monospace', maxHeight: 500, overflow: 'auto' }}>
              <pre>{logs}</pre>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLogsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              {deleteTarget?.type === 'container' 
                ? 'Are you sure you want to delete this container?' 
                : 'Are you sure you want to delete this project? This will remove all containers and data.'}
            </Typography>
            {selectedContainer?.status?.toLowerCase() === 'running' && (
              <Typography color="warning.main" sx={{ mt: 2 }}>
                Warning: This container is currently running!
              </Typography>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={deleteWithVolumes}
                  onChange={(e) => setDeleteWithVolumes(e.target.checked)}
                />
              }
              label="Also delete volumes"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </MuiContainer>
    </Layout>
  );
};

export default ProjectDetailEnhanced;
