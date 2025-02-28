import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import moment from 'moment';

const Clients = () => {
  const { supabase, user } = useAuth();
  const { darkMode } = useTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingClient, setEditingClient] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id_profile', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('Error al cargar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredClients = clients.filter(client =>
    client.name_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedClients = filteredClients.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleEditClick = (client) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditingClient(null);
    setIsEditDialogOpen(false);
  };

  const handleEditSave = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name_client: editingClient.name_client,
          email_client: editingClient.email_client,
          branch: editingClient.branch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClient.id)
        .eq('id_profile', user.id);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: 'Cliente actualizado exitosamente',
        severity: 'success',
      });
      handleEditClose();
      fetchClients();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar cliente: ' + error.message,
        severity: 'error',
      });
    }
  };

  const handleDeleteClick = async (clientId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId)
          .eq('id_profile', user.id);

        if (error) throw error;

        setSnackbar({
          open: true,
          message: 'Cliente eliminado exitosamente',
          severity: 'success',
        });
        fetchClients();
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        setSnackbar({
          open: true,
          message: 'Error al eliminar cliente: ' + error.message,
          severity: 'error',
        });
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ 
      bgcolor: 'background.default',
      minHeight: '100vh',
      p: 3,
      color: 'text.primary'
    }}>
      <Typography variant="h4" gutterBottom>
        Clientes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Dialog 
        open={isEditDialogOpen} 
        onClose={handleEditClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
          }
        }}
      >
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={editingClient?.name_client || ''}
            onChange={(e) => setEditingClient({ ...editingClient, name_client: e.target.value })}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' },
              },
            }}
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={editingClient?.email_client || ''}
            onChange={(e) => setEditingClient({ ...editingClient, email_client: e.target.value })}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' },
              },
            }}
          />
          <TextField
            margin="dense"
            label="Sucursal"
            fullWidth
            value={editingClient?.branch || ''}
            onChange={(e) => setEditingClient({ ...editingClient, branch: e.target.value })}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>
            Cancelar
          </Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ 
        p: 2,
        mb: 2,
        bgcolor: 'background.paper',
        color: 'text.primary'
      }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, email o sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: 'text.primary',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
              '&.Mui-focused fieldset': { borderColor: '#1976d2' },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>Sucursal</TableCell>
                <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>Fecha de Registro</TableCell>
                <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>Última Actualización</TableCell>
                <TableCell align="center" sx={{ color: 'text.primary', fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                    Cargando clientes...
                  </TableCell>
                </TableRow>
              ) : paginatedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell sx={{ color: 'text.primary' }}>{client.name_client}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{client.email_client}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{client.branch}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      {moment(client.created_at).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      {moment(client.updated_at).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small"
                        sx={{ color: '#1976d2', mr: 1 }}
                        onClick={() => handleEditClick(client)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        sx={{ color: '#d32f2f' }}
                        onClick={() => handleDeleteClick(client.id)}
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

        <TablePagination
          component="div"
          count={filteredClients.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: 'text.primary',
            '.MuiTablePagination-selectIcon': { color: 'text.primary' },
            '.MuiTablePagination-select': { color: 'text.primary' },
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Clients; 