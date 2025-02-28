import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import AddProductModal from '../components/inventory/AddProductModal';
import ManageStockModal from '../components/inventory/ManageStockModal';
import EditProductModal from '../components/inventory/EditProductModal';

const Inventory = () => {
  const { supabase, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openStockModal, setOpenStockModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchProducts = async () => {
    try {
      setError('');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id_profile', user.id)
        .order('name');

      if (error) throw error;
      setProducts(data);

      // Extraer categorías y sucursales únicas del usuario actual
      const uniqueCategories = [...new Set(data.map(product => product.category))];
      const uniqueBranches = [...new Set(data.map(product => product.branch))];
      
      setCategories(uniqueCategories);
      setBranches(uniqueBranches);
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      setError('Error al cargar los productos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      setError('');
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('id_profile', user.id);

      if (error) throw error;
      
      await fetchProducts();
      alert('Producto eliminado con éxito');
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      setError('Error al eliminar el producto: ' + error.message);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setOpenEditModal(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesBranch = !branchFilter || product.branch === branchFilter;
    
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calcular productos paginados
  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando productos...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Inventario</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<InventoryIcon />}
            onClick={() => setOpenStockModal(true)}
            sx={{ mr: 2 }}
          >
            Gestionar Stock
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddModal(true)}
          >
            Nuevo Producto
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Buscar por nombre o código"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={categoryFilter}
              label="Categoría"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Sucursal</InputLabel>
            <Select
              value={branchFilter}
              label="Sucursal"
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch} value={branch}>
                  {branch}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {products.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography color="text.secondary">
              No hay productos registrados. ¡Comienza agregando uno!
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Código de Barras</TableCell>
                    <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Nombre</TableCell>
                    <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Descripción</TableCell>
                    <TableCell align="right" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Stock</TableCell>
                    <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Categoría</TableCell>
                    <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Sucursal</TableCell>
                    <TableCell align="right" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>IVA %</TableCell>
                    <TableCell align="right" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Precio Costo</TableCell>
                    <TableCell align="right" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Precio Venta</TableCell>
                    <TableCell align="right" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Precio + IVA</TableCell>
                    <TableCell align="center" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell sx={{ fontSize: '0.95rem' }}>{product.barcode}</TableCell>
                      <TableCell sx={{ fontSize: '0.95rem' }}>{product.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.95rem' }}>{product.description}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.95rem' }}>{product.stock}</TableCell>
                      <TableCell sx={{ fontSize: '0.95rem' }}>{product.category}</TableCell>
                      <TableCell sx={{ fontSize: '0.95rem' }}>{product.branch}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.95rem' }}>{product.iva}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.95rem' }}>${product.price_cost}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.95rem' }}>${product.price_sale}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.95rem' }}>${(product.price_sale + (product.price_sale * (product.iva / 100))).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEdit(product)}
                            >
                              <EditIcon sx={{ fontSize: '1.2rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(product.id)}
                            >
                              <DeleteIcon sx={{ fontSize: '1.2rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </Paper>

      <AddProductModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onProductAdded={fetchProducts}
        categories={categories}
        branches={branches}
        userId={user?.id}
      />

      <ManageStockModal
        open={openStockModal}
        handleClose={() => setOpenStockModal(false)}
        onStockUpdated={fetchProducts}
        userId={user?.id}
      />

      <EditProductModal
        open={openEditModal}
        handleClose={() => {
          setOpenEditModal(false);
          setSelectedProduct(null);
        }}
        onProductUpdated={fetchProducts}
        categories={categories}
        branches={branches}
        userId={user?.id}
        product={selectedProduct}
      />
    </Box>
  );
};

export default Inventory; 