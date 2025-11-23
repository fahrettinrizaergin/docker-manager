import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import FolderIcon from '@mui/icons-material/Folder';
import AppsIcon from '@mui/icons-material/Apps';
import StorageIcon from '@mui/icons-material/Storage';
import Layout from '../components/Layout';
import api from '../services/api';

interface DashboardStats {
  users?: number;
  organizations: number;
  projects: number;
  containers: number;
  active_containers: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.getDashboardStats();
      setStats(response.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to Docker Manager - Your comprehensive container orchestration platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {stats && (
          <Grid container spacing={3}>
            {stats.users !== undefined && (
              <Grid item xs={12} md={6} lg={3}>
                <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <BusinessIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6" color="primary">Users</Typography>
                  <Typography variant="h3">{stats.users}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total users
                  </Typography>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <BusinessIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="primary">Organizations</Typography>
                <Typography variant="h3">{stats.organizations}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active organizations
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FolderIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="primary">Projects</Typography>
                <Typography variant="h3">{stats.projects}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total projects
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AppsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="primary">Containers</Typography>
                <Typography variant="h3">{stats.containers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total containers
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <StorageIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="success.main">Active Containers</Typography>
                <Typography variant="h3">{stats.active_containers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently running
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <StorageIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="primary">Containers</Typography>
                <Typography variant="h3">{stats.containers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total containers
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                <Typography variant="body2" color="text.secondary">
                  No recent activity to display
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Layout>
  );
};

export default Dashboard;
