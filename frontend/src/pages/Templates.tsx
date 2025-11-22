import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import Layout from '../components/Layout';

const Templates: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <ViewModuleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Templates
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography>Templates library - Coming soon</Typography>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Templates;
