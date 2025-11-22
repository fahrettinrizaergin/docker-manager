import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Layout from '../components/Layout';

const Settings: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Settings
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography>Settings - Coming soon</Typography>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Settings;
