import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import Layout from '../components/Layout';

const Projects: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Projects
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography>Projects management - Coming soon</Typography>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Projects;
