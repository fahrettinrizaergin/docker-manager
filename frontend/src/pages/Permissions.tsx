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
  MenuItem,
  FormControlLabel,
  Checkbox,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { UserPermission } from '../types';

const Permissions: React.FC = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<UserPermission | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    resource_type: 'organization' as 'organization' | 'project' | 'application' | 'container',
    resource_id: '',
    permissions: {
      read: false,
      write: false,
      delete: false,
      deploy: false,
      manage: false,
    },
    expires_at: '',
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      // Get current user to load their permissions
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        const response = await api.getUserPermissions(user.id);
        setPermissions(response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load permissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (permission?: UserPermission) => {
    if (permission) {
      setEditingPermission(permission);
      const perms = JSON.parse(permission.permissions || '[]');
      setFormData({
        user_id: permission.user_id,
        resource_type: permission.resource_type,
        resource_id: permission.resource_id,
        permissions: {
          read: perms.includes('read'),
          write: perms.includes('write'),
          delete: perms.includes('delete'),
          deploy: perms.includes('deploy'),
          manage: perms.includes('manage'),
        },
        expires_at: permission.expires_at || '',
      });
    } else {
      setEditingPermission(null);
      setFormData({
        user_id: '',
        resource_type: 'organization',
        resource_id: '',
        permissions: {
          read: false,
          write: false,
          delete: false,
          deploy: false,
          manage: false,
        },
        expires_at: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPermission(null);
  };

  const handleSubmit = async () => {
    try {
      const permissionsList = Object.entries(formData.permissions)
        .filter(([_, enabled]) => enabled)
        .map(([perm]) => perm);

      if (editingPermission) {
        await api.updatePermission(editingPermission.id, {
          permissions: permissionsList,
          expires_at: formData.expires_at || undefined,
        });
        toast.success('Permission updated successfully');
      } else {
        await api.grantPermission({
          user_id: formData.user_id,
          resource_type: formData.resource_type,
          resource_id: formData.resource_id,
          permissions: permissionsList,
          expires_at: formData.expires_at || undefined,
        });
        toast.success('Permission granted successfully');
      }
      handleCloseDialog();
      loadPermissions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save permission');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    try {
      await api.deletePermission(id);
      toast.success('Permission deleted successfully');
      loadPermissions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete permission');
    }
  };

  const parsePermissions = (permsJson: string): string[] => {
    try {
      return JSON.parse(permsJson || '[]');
    } catch {
      return [];
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Permissions Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Grant Permission
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
                  <TableCell>Resource Type</TableCell>
                  <TableCell>Resource ID</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Granted At</TableCell>
                  <TableCell>Expires At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No permissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <Chip label={permission.resource_type} size="small" color="primary" />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {permission.resource_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {parsePermissions(permission.permissions).map((perm) => (
                          <Chip
                            key={perm}
                            label={perm}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                            color="default"
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        {new Date(permission.granted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {permission.expires_at
                          ? new Date(permission.expires_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(permission)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(permission.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingPermission ? 'Edit Permission' : 'Grant Permission'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!editingPermission && (
                <>
                  <TextField
                    label="User ID"
                    fullWidth
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                    helperText="UUID of the user"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Resource Type</InputLabel>
                    <Select
                      value={formData.resource_type}
                      label="Resource Type"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          resource_type: e.target.value as any,
                        })
                      }
                    >
                      <MenuItem value="organization">Organization</MenuItem>
                      <MenuItem value="project">Project</MenuItem>
                      <MenuItem value="application">Application</MenuItem>
                      <MenuItem value="container">Container</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Resource ID"
                    fullWidth
                    value={formData.resource_id}
                    onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
                    required
                    helperText="UUID of the resource"
                  />
                </>
              )}

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Permissions
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.read}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, read: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Read"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.write}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, write: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Write"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.delete}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, delete: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Delete"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.deploy}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, deploy: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Deploy"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.permissions.manage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, manage: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Manage"
                />
              </Box>

              <TextField
                label="Expires At (Optional)"
                type="datetime-local"
                fullWidth
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty for no expiration"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingPermission ? 'Update' : 'Grant'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Permissions;
