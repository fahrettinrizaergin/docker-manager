import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
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

        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" color="primary">Organizations</Typography>
              <Typography variant="h3">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Active organizations
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" color="primary">Projects</Typography>
              <Typography variant="h3">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Total projects
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" color="primary">Applications</Typography>
              <Typography variant="h3">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Running applications
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" color="primary">Nodes</Typography>
              <Typography variant="h3">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Connected nodes
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
      </Container>
    </Layout>
  );
};

export default Dashboard;
