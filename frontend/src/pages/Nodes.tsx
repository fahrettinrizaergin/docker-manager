import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import Layout from '../components/Layout';

const Nodes: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Nodes
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography>Nodes management - Coming soon</Typography>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Nodes;
