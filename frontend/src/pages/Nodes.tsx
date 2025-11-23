import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Terminal as TerminalIcon,
  MoreVert as MoreVertIcon,
  CleaningServices as CleaningServicesIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

interface Node {
  id: string;
  name: string;
  host: string;
  description: string;
  status: string;
  use_ssh: boolean;
  ssh_user: string;
  ssh_port: number;
}

const Nodes: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    description: '',
    use_ssh: false,
    ssh_user: 'root',
    ssh_port: 22,
  });

  // Actions Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Prune Dialog State
  const [openPruneDialog, setOpenPruneDialog] = useState(false);
  const [pruneType, setPruneType] = useState('system');

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      setLoading(true);
      const response = await api.getNodes();
      setNodes(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load nodes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (node?: Node) => {
    if (node) {
      setEditingNode(node);
      setFormData({
        name: node.name,
        host: node.host,
        description: node.description || '',
        use_ssh: node.use_ssh,
        ssh_user: node.ssh_user || 'root',
        ssh_port: node.ssh_port || 22,
      });
    } else {
      setEditingNode(null);
      setFormData({
        name: '',
        host: '',
        description: '',
        use_ssh: false,
        ssh_user: 'root',
        ssh_port: 22,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNode(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingNode) {
        await api.updateNode(editingNode.id, formData);
        toast.success('Node updated successfully');
      } else {
        await api.createNode(formData);
        toast.success('Node created successfully');
      }
      handleCloseDialog();
      loadNodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save node');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this node?')) {
      return;
    }

    try {
      await api.deleteNode(id);
      toast.success('Node deleted successfully');
      loadNodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete node');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, nodeId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedNodeId(nodeId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNodeId(null);
  };

  const handleTestConnection = async () => {
    if (!selectedNodeId) return;
    handleMenuClose();
    try {
      await api.testNodeConnection(selectedNodeId);
      toast.success('Connection successful');
      loadNodes(); // Refresh status
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Connection failed');
    }
  };

  const handleReloadRedis = async () => {
    if (!selectedNodeId) return;
    handleMenuClose();
    try {
      await api.reloadNodeRedis(selectedNodeId);
      toast.success('Redis reloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reload Redis');
    }
  };

  const handleOpenPruneDialog = () => {
    handleMenuClose();
    setOpenPruneDialog(true);
  };

  const handlePrune = async () => {
    if (!selectedNodeId) return;
    try {
      await api.pruneNode(selectedNodeId, pruneType);
      toast.success(`Prune ${pruneType} successful`);
      setOpenPruneDialog(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Prune failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Nodes
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Node
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Host</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No nodes found
                    </TableCell>
                  </TableRow>
                ) : (
                  nodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell>{node.name}</TableCell>
                      <TableCell>{node.host}</TableCell>
                      <TableCell>
                        <Chip
                          icon={node.status === 'online' ? <CheckCircleIcon /> : <ErrorIcon />}
                          label={node.status}
                          color={getStatusColor(node.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{node.description}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Test Connection">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedNodeId(node.id);
                              handleTestConnection();
                            }}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(node)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(node.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, node.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleTestConnection}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} /> Reload / Ping
          </MenuItem>
          <MenuItem onClick={() => toast.info('Terminal coming soon')}>
            <TerminalIcon fontSize="small" sx={{ mr: 1 }} /> Terminal
          </MenuItem>
          <MenuItem onClick={handleReloadRedis}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} /> Reload Redis
          </MenuItem>
          <MenuItem onClick={handleOpenPruneDialog}>
            <CleaningServicesIcon fontSize="small" sx={{ mr: 1 }} /> Prune / Clean
          </MenuItem>
        </Menu>

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingNode ? 'Edit Node' : 'Add Node'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                label="Host"
                fullWidth
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                required
                helperText="e.g., tcp://1.2.3.4:2375 or unix:///var/run/docker.sock"
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingNode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Prune Dialog */}
        <Dialog open={openPruneDialog} onClose={() => setOpenPruneDialog(false)}>
          <DialogTitle>Clean / Prune Node</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, minWidth: 300 }}>
              <FormControl fullWidth>
                <InputLabel>Prune Type</InputLabel>
                <Select
                  value={pruneType}
                  label="Prune Type"
                  onChange={(e) => setPruneType(e.target.value)}
                >
                  <MenuItem value="system">System (All unused)</MenuItem>
                  <MenuItem value="images">Unused Images</MenuItem>
                  <MenuItem value="containers">Stopped Containers</MenuItem>
                  <MenuItem value="volumes">Unused Volumes</MenuItem>
                  <MenuItem value="networks">Unused Networks</MenuItem>
                  <MenuItem value="builder">Build Cache</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPruneDialog(false)}>Cancel</Button>
            <Button onClick={handlePrune} variant="contained" color="error">
              Prune
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Nodes;
