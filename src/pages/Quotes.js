import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import ProductSelector from '../components/quotes/ProductSelector';

const Quotes = () => {
  const { supabase, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [clientData, setClientData] = useState({
    name: '',
    address: '',
    phone: '',
    cif: ''
  });
  const [selectedIVA, setSelectedIVA] = useState(21);
  const [error, setError] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const barcodeInputRef = useRef(null);
  const pdfRef = useRef(null);
  const [paymentConditions, setPaymentConditions] = useState('Transferencia bancaria, tarjeta de crédito o efectivo');
  const [validityDays, setValidityDays] = useState(30);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Cargar productos y datos de la empresa al montar
  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCompanyData();
    }
  }, [user]);

  // Auto-enfoque en input de código de barras
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id_profile', user.id);

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar productos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('companys')
        .select('*')
        .eq('id_profile', user.id)
        .single();

      if (error) throw error;
      setCompanyData(data);
    } catch (error) {
      console.error('Error al cargar datos de la empresa:', error);
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      addProductToBudget(product);
      setBarcodeInput('');
    } else {
      setError('Producto no encontrado');
    }
  };

  const addProductToBudget = (product) => {
    setBudgetItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, budgetItemId: uuidv4() }];
    });
  };

  const handleQuantityChange = (budgetItemId, change) => {
    setBudgetItems(prev =>
      prev.map(item => {
        if (item.budgetItemId === budgetItemId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (budgetItemId) => {
    setBudgetItems(prev => prev.filter(item => item.budgetItemId !== budgetItemId));
  };

  const calculateTotals = () => {
    const subtotal = budgetItems.reduce((acc, item) => 
      acc + (item.price_sale * item.quantity), 0
    );
    const iva = subtotal * (selectedIVA / 100);
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const generatePDF = async () => {
    if (!companyData) {
      setError('No hay datos de la empresa configurados');
      return;
    }

    if (budgetItems.length === 0) {
      setError('Agregue productos al presupuesto');
      return;
    }

    if (!clientData.name || !clientData.address) {
      setError('Complete los datos del cliente');
      return;
    }

    try {
      const content = pdfRef.current;
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: true,
        onclone: (document) => {
          const element = document.querySelector('#pdf-content');
          if (element) {
            element.style.height = 'auto';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`presupuesto_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setError('Error al generar PDF: ' + error.message);
    }
  };

  const { subtotal, iva, total } = calculateTotals();

  const PdfContent = () => (
    <Box id="pdf-content" sx={{ 
      width: '210mm', 
      minHeight: '297mm', 
      p: 4, 
      bgcolor: 'white',
      color: 'black'
    }}>
      {/* Encabezado con Logo y Título */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #1976d2'
      }}>
        <Typography variant="h4" sx={{ 
          color: '#1976d2',
          fontWeight: 'bold'
        }}>
          {companyData?.name || 'empresa de basilee'}
        </Typography>
        <Typography variant="h4" sx={{ 
          color: '#1976d2',
          fontWeight: 'bold'
        }}>
          PRESUPUESTO
        </Typography>
      </Box>

      {/* Información de Empresa y Cliente en dos columnas */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={6}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold', 
            mb: 2,
            color: '#333'
          }}>
            Datos de la Empresa
          </Typography>
          <Typography>{companyData?.email || 'basile@gmail.com'}</Typography>
          <Typography>CUIT: {companyData?.cuit || '3123122312'}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold', 
            mb: 2,
            color: '#333'
          }}>
            Datos del Cliente
          </Typography>
          <Typography>{clientData.name}</Typography>
          <Typography>{clientData.address}</Typography>
          {clientData.phone && <Typography>Tel: {clientData.phone}</Typography>}
          {clientData.cif && <Typography>CIF/NIF: {clientData.cif}</Typography>}
        </Grid>
      </Grid>

      {/* Tabla de Productos */}
      <Box sx={{ mb: 4, width: '100%' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          marginBottom: '20px'
        }}>
          <thead>
            <tr>
              <th style={{ 
                backgroundColor: '#2196f3',
                color: 'white',
                padding: '12px',
                textAlign: 'left',
                width: '40%',
                fontSize: '16px'
              }}>
                Nombre
              </th>
              <th style={{ 
                backgroundColor: '#2196f3',
                color: 'white',
                padding: '12px',
                textAlign: 'center',
                width: '15%',
                fontSize: '16px'
              }}>
                Cantidad
              </th>
              <th style={{ 
                backgroundColor: '#2196f3',
                color: 'white',
                padding: '12px',
                textAlign: 'right',
                width: '20%',
                fontSize: '16px'
              }}>
                Precio Unit.
              </th>
              <th style={{ 
                backgroundColor: '#2196f3',
                color: 'white',
                padding: '12px',
                textAlign: 'right',
                width: '25%',
                fontSize: '16px'
              }}>
                Importe
              </th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.map((item) => (
              <tr key={item.budgetItemId}>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '14px'
                }}>
                  {item.name}
                </td>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  {item.quantity}
                </td>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '14px',
                  textAlign: 'right'
                }}>
                  ${item.price_sale.toFixed(2)}
                </td>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '14px',
                  textAlign: 'right'
                }}>
                  ${(item.price_sale * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Totales */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        mb: 4
      }}>
        <table style={{ 
          width: '300px',
          borderCollapse: 'collapse'
        }}>
          <tbody>
            <tr>
              <td style={{ 
                padding: '8px',
                fontWeight: 'bold',
                color: '#666',
                textAlign: 'left'
              }}>
                Subtotal:
              </td>
              <td style={{ 
                padding: '8px',
                color: '#666',
                textAlign: 'right'
              }}>
                ${subtotal.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style={{ 
                padding: '8px',
                fontWeight: 'bold',
                color: '#666',
                textAlign: 'left'
              }}>
                IVA ({selectedIVA}%):
              </td>
              <td style={{ 
                padding: '8px',
                color: '#666',
                textAlign: 'right'
              }}>
                ${iva.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style={{ 
                padding: '8px',
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#2196f3',
                textAlign: 'left'
              }}>
                TOTAL:
              </td>
              <td style={{ 
                padding: '8px',
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#2196f3',
                textAlign: 'right'
              }}>
                ${total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </Box>

      {/* Condiciones y Validez */}
      <Box sx={{ mt: 4 }}>
        {paymentConditions && (
          <Typography variant="body1" sx={{ 
            color: '#666',
            fontStyle: 'italic'
          }}>
            Condiciones de pago: {paymentConditions}
          </Typography>
        )}
        <Typography variant="body1" sx={{ 
          color: '#666',
          fontStyle: 'italic',
          mt: 1
        }}>
          Este presupuesto tiene una validez de {validityDays} días a partir de la fecha de emisión.
        </Typography>
        {additionalNotes && (
          <Typography variant="body1" sx={{ 
            color: '#666',
            mt: 2
          }}>
            {additionalNotes}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Generar Presupuesto
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Panel de Control */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Datos del Cliente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre/Empresa"
                  value={clientData.name}
                  onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={clientData.address}
                  onChange={(e) => setClientData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={clientData.phone}
                  onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CIF/NIF"
                  value={clientData.cif}
                  onChange={(e) => setClientData(prev => ({ ...prev, cif: e.target.value }))}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Agregar Productos
              </Typography>
              <form onSubmit={handleBarcodeSubmit}>
                <TextField
                  fullWidth
                  label="Código de Barras"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  inputRef={barcodeInputRef}
                  sx={{ mb: 2 }}
                />
              </form>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => setShowProductSelector(true)}
                sx={{ mb: 2 }}
              >
                Buscar Productos
              </Button>
              <FormControl fullWidth>
                <TextField
                  fullWidth
                  type="number"
                  label="IVA %"
                  value={selectedIVA}
                  onChange={(e) => setSelectedIVA(Number(e.target.value))}
                  inputProps={{ 
                    min: 0,
                    max: 100,
                    step: "0.1"
                  }}
                  helperText="Ingrese el porcentaje de IVA (0-100)"
                />
              </FormControl>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Textos del Presupuesto
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Condiciones de Pago"
                    value={paymentConditions}
                    onChange={(e) => setPaymentConditions(e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Días de Validez"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notas Adicionales"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Ingrese notas adicionales para el presupuesto (opcional)"
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Vista Previa y Edición */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Vista Previa</Typography>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={generatePDF}
                disabled={budgetItems.length === 0}
              >
                Generar PDF
              </Button>
            </Box>

            {/* Encabezado con datos de la empresa */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {companyData?.name || 'Nombre de la Empresa'}
                </Typography>
                <Typography>
                  {companyData?.address || 'Dirección de la Empresa'}
                </Typography>
                <Typography>
                  {companyData?.email || 'Email de la Empresa'}
                </Typography>
                <Typography>
                  CUIT: {companyData?.cuit || 'CUIT de la Empresa'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6">PRESUPUESTO</Typography>
                <Typography>
                  Fecha: {moment().format('DD/MM/YYYY')}
                </Typography>
                <Typography>
                  Válido hasta: {moment().add(30, 'days').format('DD/MM/YYYY')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Datos del Cliente */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cliente
              </Typography>
              <Typography>{clientData.name}</Typography>
              <Typography>{clientData.address}</Typography>
              {clientData.phone && <Typography>Tel: {clientData.phone}</Typography>}
              {clientData.cif && <Typography>CIF/NIF: {clientData.cif}</Typography>}
            </Box>

            {/* Tabla de edición de productos en la vista previa */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio Unit.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>IVA %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budgetItems.length > 0 ? (
                    budgetItems.map((item) => (
                      <TableRow key={item.budgetItemId}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.budgetItemId, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.budgetItemId, 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">${item.price_sale.toFixed(2)}</TableCell>
                        <TableCell align="right">{selectedIVA}%</TableCell>
                        <TableCell align="right">
                          ${(item.price_sale * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(item.budgetItemId)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        No hay productos agregados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totales */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Table size="small" sx={{ width: 'auto' }}>
                <TableBody>
                  <TableRow>
                    <TableCell>Subtotal:</TableCell>
                    <TableCell align="right">${subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>IVA ({selectedIVA}%):</TableCell>
                    <TableCell align="right">${iva.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="h6">Total:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6">${total.toFixed(2)}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Contenido oculto para el PDF */}
      <Box sx={{ position: 'absolute', left: '-9999px' }}>
        <Box ref={pdfRef}>
          <PdfContent />
        </Box>
      </Box>

      {/* Selector de Productos */}
      <ProductSelector
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        products={products}
        onProductSelect={addProductToBudget}
      />
    </Box>
  );
};

export default Quotes; 