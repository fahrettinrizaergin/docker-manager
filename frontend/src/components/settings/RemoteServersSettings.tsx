import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

interface Server {
  id: number;
  name: string;
  ip: string;
  status: 'connected' | 'disconnected';
}

const RemoteServersSettings: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [servers, setServers] = useState<Server[]>([
    { id: 1, name: 'Production Node 1', ip: '192.168.1.100', status: 'connected' },
    { id: 2, name: 'Staging Node', ip: '192.168.1.101', status: 'disconnected' },
  ]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentServer, setCurrentServer] = useState<Partial<Server>>({});

  const handleOpenDialog = (server?: Server) => {
    if (server) {
      setCurrentServer(server);
    } else {
      setCurrentServer({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentServer({});
  };

  const handleSave = () => {
    toast.success('Server saved successfully (Mock)');
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    toast.success('Server deleted successfully (Mock)');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Remote Servers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Server
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {servers.map((server) => (
              <TableRow key={server.id}>
                <TableCell>{server.name}</TableCell>
                <TableCell>{server.ip}</TableCell>
                <TableCell>
                  <Chip
                    icon={server.status === 'connected' ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={server.status}
                    color={server.status === 'connected' ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(server)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(server.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentServer.id ? 'Edit Server' : 'Add New Server'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Server Name"
              fullWidth
              value={currentServer.name || ''}
              onChange={(e) => setCurrentServer({ ...currentServer, name: e.target.value })}
            />
            <TextField
              label="IP Address"
              fullWidth
              value={currentServer.ip || ''}
              onChange={(e) => setCurrentServer({ ...currentServer, ip: e.target.value })}
            />
            <TextField
              label="SSH Key / Password"
              type="password"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RemoteServersSettings;
