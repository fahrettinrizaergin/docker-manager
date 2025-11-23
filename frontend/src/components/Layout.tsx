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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Storage as StorageIcon,
  CloudQueue as CloudQueueIcon,
  ViewModule as ViewModuleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  ExploreOutlined as ExploreIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
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

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Explorer', icon: <ExploreIcon />, path: '/explorer' },
    { text: 'Nodes', icon: <StorageIcon />, path: '/nodes' },
    { text: 'Deployments', icon: <CloudQueueIcon />, path: '/deployments' },
    { text: 'Templates', icon: <ViewModuleIcon />, path: '/templates' },
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
          
          {/* Organization Selector */}
          <FormControl sx={{ minWidth: 200, mr: 2 }}>
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
          </FormControl>

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
          
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/settings')}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
          </List>
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
    </Box>
  );
};

export default Layout;
