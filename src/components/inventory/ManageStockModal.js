import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
};

const ManageStockModal = ({ open, handleClose, onStockUpdated, userId }) => {
  const { supabase } = useAuth();
  const [formData, setFormData] = useState({
    barcode: '',
    operation: 'add',
    quantity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchProduct = async () => {
    if (!formData.barcode || !userId) return;
    
    try {
      setError('');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', formData.barcode)
        .eq('id_profile', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProduct(data);
      } else {
        setError('Producto no encontrado');
        setProduct(null);
      }
    } catch (error) {
      console.error('Error al buscar el producto:', error);
      setError('Error al buscar el producto: ' + error.message);
      setProduct(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product || !userId) return;

    setLoading(true);
    setError('');
    try {
      const newStock = formData.operation === 'add' 
        ? product.stock + Number(formData.quantity)
        : product.stock - Number(formData.quantity);

      if (newStock < 0) {
        setError('No hay suficiente stock para realizar esta operación');
        return;
      }

      const { error } = await supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
        .eq('id_profile', userId);

      if (error) throw error;
      
      onStockUpdated();
      handleClose();
      setFormData({
        barcode: '',
        operation: 'add',
        quantity: 0,
      });
      setProduct(null);
      setError('');
    } catch (error) {
      console.error('Error al actualizar el stock:', error);
      setError('Error al actualizar el stock: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-manage-stock"
    >
      <Box sx={style}>
        <Typography id="modal-manage-stock" variant="h6" component="h2" gutterBottom>
          Gestionar Stock
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Código de Barras"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  autoFocus
                  required
                />
                <Button onClick={searchProduct} variant="outlined">
                  Buscar
                </Button>
              </Box>
            </Grid>

            {product && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    Producto: {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stock actual: {product.stock}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Operación</InputLabel>
                    <Select
                      name="operation"
                      value={formData.operation}
                      label="Operación"
                      onChange={handleChange}
                      required
                    >
                      <MenuItem value="add">Sumar Stock</MenuItem>
                      <MenuItem value="subtract">Restar Stock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !product}
            >
              {loading ? 'Actualizando...' : 'Actualizar Stock'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default ManageStockModal; 