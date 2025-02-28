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
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
  maxHeight: '90vh',
  overflow: 'auto'
};

const AddProductModal = ({ open, handleClose, onProductAdded, categories = [], branches = [], userId }) => {
  const { supabase } = useAuth();
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    stock: 0,
    category: '',
    branch: '',
    iva: 21,
    price_cost: 0,
    price_sale: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [showNewBranchField, setShowNewBranchField] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category' && value === 'nueva') {
      setShowNewCategoryField(true);
      return;
    }
    if (name === 'branch' && value === 'nueva') {
      setShowNewBranchField(true);
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePriceWithIva = () => {
    const price = Number(formData.price_sale);
    const iva = Number(formData.iva);
    return price + (price * (iva / 100));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError('Error: Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const finalCategory = showNewCategoryField ? newCategory : formData.category;
      const finalBranch = showNewBranchField ? newBranch : formData.branch;

      const { error } = await supabase
        .from('products')
        .insert([{
          id_profile: userId,
          barcode: formData.barcode,
          name: formData.name,
          description: formData.description,
          stock: formData.stock,
          category: finalCategory,
          branch: finalBranch,
          iva: formData.iva,
          price_cost: formData.price_cost,
          price_sale: formData.price_sale,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      onProductAdded();
      handleClose();
      setFormData({
        barcode: '',
        name: '',
        description: '',
        stock: 0,
        category: '',
        branch: '',
        iva: 21,
        price_cost: 0,
        price_sale: 0
      });
      setNewCategory('');
      setNewBranch('');
      setShowNewCategoryField(false);
      setShowNewBranchField(false);
    } catch (error) {
      console.error('Error al agregar el producto:', error);
      setError('Error al agregar el producto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-add-product"
    >
      <Box sx={style}>
        <Typography id="modal-add-product" variant="h6" component="h2" gutterBottom>
          Agregar Nuevo Producto
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código de Barras"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                autoFocus
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={showNewCategoryField ? 12 : 6}>
              {showNewCategoryField ? (
                <TextField
                  fullWidth
                  label="Nueva Categoría"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <Button 
                        onClick={() => {
                          setShowNewCategoryField(false);
                          setNewCategory('');
                        }}
                      >
                        Cancelar
                      </Button>
                    ),
                  }}
                />
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    label="Categoría"
                    onChange={handleChange}
                    required
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                    <MenuItem value="nueva">+ Agregar Nueva Categoría</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={showNewBranchField ? 12 : 6}>
              {showNewBranchField ? (
                <TextField
                  fullWidth
                  label="Nueva Sucursal"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <Button 
                        onClick={() => {
                          setShowNewBranchField(false);
                          setNewBranch('');
                        }}
                      >
                        Cancelar
                      </Button>
                    ),
                  }}
                />
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Sucursal</InputLabel>
                  <Select
                    name="branch"
                    value={formData.branch}
                    label="Sucursal"
                    onChange={handleChange}
                    required
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch} value={branch}>
                        {branch}
                      </MenuItem>
                    ))}
                    <MenuItem value="nueva">+ Agregar Nueva Sucursal</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="IVA %"
                name="iva"
                value={formData.iva}
                onChange={handleChange}
                required
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Precio de Costo"
                name="price_cost"
                value={formData.price_cost}
                onChange={handleChange}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Precio de Venta"
                name="price_sale"
                value={formData.price_sale}
                onChange={handleChange}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Precio de Venta + IVA"
                value={calculatePriceWithIva()}
                disabled
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Agregando...' : 'Agregar Producto'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddProductModal; 