import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
  maxHeight: '90vh',
  overflow: 'auto'
};

const CompanyModal = ({ open, handleClose }) => {
  const { supabase, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    social: '',
    address: '',
    cuit: '',
  });

  useEffect(() => {
    if (open && user) {
      fetchCompanyData();
    }
  }, [open, user]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('companys')
        .select('*')
        .eq('id_profile', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          social: data.social || '',
          address: data.address || '',
          cuit: data.cuit || '',
        });
      }
    } catch (error) {
      console.error('Error al cargar los datos de la empresa:', error);
      setError('Error al cargar los datos de la empresa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: existingCompany } = await supabase
        .from('companys')
        .select('id')
        .eq('id_profile', user.id)
        .single();

      let result;
      if (existingCompany) {
        // Actualizar empresa existente
        result = await supabase
          .from('companys')
          .update({
            name: formData.name,
            email: formData.email,
            social: formData.social,
            address: formData.address,
            cuit: formData.cuit
          })
          .eq('id_profile', user.id);
      } else {
        // Crear nueva empresa
        result = await supabase
          .from('companys')
          .insert([{
            id_profile: user.id,
            name: formData.name,
            email: formData.email,
            social: formData.social,
            address: formData.address,
            cuit: formData.cuit
          }]);
      }

      if (result.error) throw result.error;
      
      setSuccess('Datos de la empresa guardados exitosamente');
      setTimeout(() => {
        handleClose();
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error al guardar los datos de la empresa:', error);
      setError('Error al guardar los datos de la empresa: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-company"
    >
      <Box sx={style}>
        <Typography id="modal-company" variant="h6" component="h2" gutterBottom>
          Datos de la Empresa
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre de la Empresa"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Redes Sociales"
                  name="social"
                  value={formData.social}
                  onChange={handleChange}
                  placeholder="Enlaces a redes sociales separados por comas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CUIT"
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default CompanyModal; 