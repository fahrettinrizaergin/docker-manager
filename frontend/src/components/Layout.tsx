import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Menu,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Storage as StorageIcon,
  ViewModule as ViewModuleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';
import { Organization, Project } from '../types';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [openOrgDialog, setOpenOrgDialog] = useState(false);
  const [openDeleteOrgDialog, setOpenDeleteOrgDialog] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    description: '',
  });
  const navigate = useNavigate();
  const { selectedOrganization, setSelectedOrganization, selectedProject, setSelectedProject } = useAppStore();

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      loadProjects(selectedOrganization.id);
    } else {
      setProjects([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganization]);

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const response = await api.getOrganizations();
      const orgs = response.data || [];
      setOrganizations(orgs);

      // If no organization is selected, select the first one
      if (!selectedOrganization && orgs.length > 0) {
        setSelectedOrganization(orgs[0]);
      }
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadProjects = async (organizationId: string) => {
    try {
      setLoadingProjects(true);
      const response = await api.getProjects({ organization_id: organizationId });
      setProjects(response.data || []);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setSelectedOrganization(org);
      setSelectedProject(null);
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    navigate(`/projects/${project.id}`);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleProfile = () => {
    handleCloseUserMenu();
    navigate('/settings');
  };

  const handleOpenOrgDialog = () => {
    setOrgFormData({ name: '', description: '' });
    setOpenOrgDialog(true);
  };

  const handleCloseOrgDialog = () => {
    setOpenOrgDialog(false);
    setOrgFormData({ name: '', description: '' });
  };

  const handleCreateOrganization = async () => {
    try {
      const trimmedName = orgFormData.name.trim();
      if (!trimmedName) {
        toast.error('Organization name is required');
        return;
      }

      // Generate a clean slug: trim, lowercase, replace spaces with hyphens, remove special chars
      const slug = trimmedName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Ensure slug is not empty after sanitization
      if (!slug) {
        toast.error('Organization name must contain at least one alphanumeric character');
        return;
      }

      const response = await api.createOrganization({
        name: trimmedName,
        description: orgFormData.description,
        slug: slug,
      });

      toast.success('Organization created successfully');
      handleCloseOrgDialog();

      // Reload organizations first, then select the new one
      await loadOrganizations();

      // Select the newly created organization using the response data
      if (response.id) {
        setSelectedOrganization(response);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create organization');
    }
  };

  const handleOpenDeleteOrgDialog = () => {
    setOpenDeleteOrgDialog(true);
  };

  const handleCloseDeleteOrgDialog = () => {
    setOpenDeleteOrgDialog(false);
  };

  const handleDeleteOrganization = async () => {
    try {
      if (!selectedOrganization) {
        toast.error('No organization selected');
        return;
      }

      await api.deleteOrganization(selectedOrganization.id);
      toast.success('Organization deleted successfully');
      handleCloseDeleteOrgDialog();

      // Reload organizations and select the first one
      await loadOrganizations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete organization');
    }
  };

  // Check if organization can be deleted (must have at least one organization remaining)
  const canDeleteOrganization = selectedOrganization && organizations.length > 1;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Organizations', icon: <BusinessIcon />, path: '/organizations' },
    { text: 'Nodes', icon: <StorageIcon />, path: '/nodes' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ mr: 3 }}>
            Docker Manager
          </Typography>

          {/* Organization Selector with Add/Delete buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              {
                organizations.length === 0 && !loadingOrgs ? (
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={() => navigate('/organizations')}
                    sx={{ ml: 1 }}
                    title="Add Organization"
                  >
                    <AddIcon /> Add Organization
                  </IconButton>
                ) : (
                  <Select
                    value={selectedOrganization?.id || ''}
                    onChange={(e) => handleOrganizationChange(e.target.value)}
                    displayEmpty
                    size="small"
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '.MuiSvgIcon-root': {
                        color: 'white',
                      },
                    }}
                  >
                    {loadingOrgs ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} />
                      </MenuItem>
                    ) : organizations.length === 0 ? (
                      <MenuItem value="">No organizations</MenuItem>
                    ) : (
                      organizations.map((org) => (
                        <MenuItem key={org.id} value={org.id}>
                          {org.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                )
              }
            </FormControl>
            {/* <IconButton
              color="inherit"
              size="small"
              onClick={handleOpenOrgDialog}
              sx={{ ml: 1 }}
              title="Add Organization"
            >
              <AddIcon />
            </IconButton> */}
            {canDeleteOrganization && (
              <IconButton
                color="inherit"
                size="small"
                onClick={handleOpenDeleteOrgDialog}
                sx={{ ml: 0.5 }}
                title="Delete Organization"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>

          <IconButton onClick={handleOpenUserMenu} color="inherit">
            {user.avatar ? (
              <Avatar src={user.avatar} alt={user.username} sx={{ width: 32, height: 32 }} />
            ) : (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            )}
          </IconButton>

          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">{user.first_name} {user.last_name}</Typography>
                <Typography variant="body2" color="text.secondary">{user.email}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/settings')}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
          </List>

          {/* Projects Section */}
          {selectedOrganization && (
            <>
              <Divider />
              <List>
                <ListItem>
                  <ListItemText
                    primary="Projects"
                    primaryTypographyProps={{
                      variant: 'subtitle2',
                      color: 'text.secondary',
                      fontWeight: 'bold',
                    }}
                  />
                  <ListItemButton
                    onClick={() => navigate('/projects')}
                    sx={{
                      width: 'auto',
                      minWidth: 'auto',
                      maxWidth: '35px',
                      px: 1,
                      py: 0.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 'auto' }}>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
                {loadingProjects ? (
                  <ListItem>
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <CircularProgress size={20} />
                    </Box>
                  </ListItem>
                ) : projects.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      secondary="No projects"
                      secondaryTypographyProps={{
                        align: 'center'
                      }}
                    />
                  </ListItem>
                ) : (
                  projects.map((project) => (
                    <ListItem key={project.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleProjectClick(project)}
                        selected={selectedProject?.id === project.id}
                      >
                        <ListItemIcon>
                          <FolderIcon />
                        </ListItemIcon>
                        <ListItemText primary={project.name} />
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
            </>
          )}
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: drawerOpen ? 0 : `-${drawerWidth}px`,
          transition: (theme) =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Create Organization Dialog */}
      <Dialog open={openOrgDialog} onClose={handleCloseOrgDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Organization</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Organization Name"
              fullWidth
              value={orgFormData.name}
              onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
              required
              autoFocus
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={orgFormData.description}
              onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrgDialog}>Cancel</Button>
          <Button onClick={handleCreateOrganization} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={openDeleteOrgDialog} onClose={handleCloseDeleteOrgDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Organization</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedOrganization?.name}</strong>?
            This action cannot be undone and will delete all associated projects and containers.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteOrgDialog}>Cancel</Button>
          <Button onClick={handleDeleteOrganization} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
