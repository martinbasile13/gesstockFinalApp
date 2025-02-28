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
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as SaleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import ProductSelector from '../components/quotes/ProductSelector';
import { jsPDF } from 'jspdf';
import TicketGenerator from '../components/TicketGenerator';
import { useTheme } from '../context/ThemeContext';

const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');
const os = window.require('os');

const POS = () => {
  const { darkMode } = useTheme();
  const { supabase, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
  });
  const [selectedIVA, setSelectedIVA] = useState(21);
  const [error, setError] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [clients, setClients] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [paymentMethods, setPaymentMethods] = useState(['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia']);
  const [currentBranch, setCurrentBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [billNumber, setBillNumber] = useState('');
  const barcodeInputRef = useRef(null);
  const saleRef = useRef(null);
  const [successDialog, setSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const ticketRef = useRef(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCompanyData();
      fetchClients();
      fetchBranches();
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
      setCurrentBranch(data.branch); // Establecer la sucursal actual
    } catch (error) {
      console.error('Error al cargar datos de la empresa:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id_profile', user.id);

      if (error) throw error;
      setClients(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    // Aquí implementaremos la lógica para cargar los métodos de pago
    // Por ahora usaremos algunos métodos predefinidos
    setPaymentMethods(['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia']);
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('branch')
        .eq('id_profile', user.id);

      if (error) throw error;
      const uniqueBranches = [...new Set(data.map(item => item.branch))];
      setBranches(uniqueBranches);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      if (product.branch !== currentBranch) {
        setError('Este producto pertenece a otra sucursal');
        return;
      }
      addProductToSale(product);
      setBarcodeInput('');
    } else {
      setError('Producto no encontrado');
    }
  };

  const addProductToSale = (product) => {
    if (product.stock <= 0) {
      setError(`No hay stock disponible para ${product.name}`);
      return;
    }

    setSaleItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          setError(`No hay suficiente stock de ${product.name}`);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, saleItemId: uuidv4() }];
    });
  };

  const handleQuantityChange = (saleItemId, change) => {
    setSaleItems(prev =>
      prev.map(item => {
        if (item.saleItemId === saleItemId) {
          const newQuantity = item.quantity + change;
          const product = products.find(p => p.id === item.id);
          if (newQuantity > product.stock) {
            setError(`No hay suficiente stock de ${item.name}`);
            return item;
          }
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (saleItemId) => {
    setSaleItems(prev => prev.filter(item => item.saleItemId !== saleItemId));
  };

  const calculateTotals = () => {
    const subtotal = saleItems.reduce((acc, item) => 
      acc + (item.price_sale * item.quantity), 0
    );
    const iva = subtotal * (selectedIVA / 100);
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const generateBillNumber = async () => {
    const date = moment().format('YYYYMMDD');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${date}${random}`;
  };

  const handleAddPaymentMethod = () => {
    if (newPaymentMethod && !paymentMethods.includes(newPaymentMethod)) {
      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      setPaymentMethod(newPaymentMethod);
      setNewPaymentMethod('');
    }
  };

  const validateStock = () => {
    for (const item of saleItems) {
      const product = products.find(p => p.id === item.id);
      if (!product || item.quantity > product.stock) {
        setError(`Stock insuficiente para ${item.name}`);
        return false;
      }
    }
    return true;
  };

  const clearForm = () => {
    setSaleItems([]);
    setClientData({ name: '', email: '' });
    setPaymentMethod('');
    setBarcodeInput('');
    setSelectedIVA(21);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const createOrUpdateClient = async () => {
    try {
      if (!clientData.name || !clientData.email || !user?.id) return null;

      // Buscar si el cliente ya existe
      const { data: existingClient } = await supabase
        .from('clients')
        .select('*')
        .eq('email_client', clientData.email)
        .eq('id_profile', user.id)
        .maybeSingle();

      if (existingClient) {
        // Actualizar cliente existente
        const { data, error } = await supabase
          .from('clients')
          .update({
            name_client: clientData.name,
            email_client: clientData.email,
            branch: currentBranch,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingClient.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        return data;
      } else {
        // Crear nuevo cliente
        const { data, error } = await supabase
          .from('clients')
          .insert([{
            id_profile: user.id,
            name_client: clientData.name,
            email_client: clientData.email,
            branch: currentBranch,
            created_at: new Date().toISOString(),
            products_buy: []
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error al crear/actualizar cliente:', error);
      return null;
    }
  };

  const generatePDF = async (billData) => {
    try {
      console.log('Iniciando generación de imagen...');
      const content = document.getElementById('bill-preview');
      
      if (!content) {
        throw new Error('No se encontró el elemento bill-preview');
      }

      // Crear un contenedor temporal
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = content.innerHTML;
      document.body.appendChild(tempContainer);

      // Aplicar estilos necesarios al contenedor temporal
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '20px';
      tempContainer.style.width = content.offsetWidth + 'px';
      tempContainer.style.height = content.offsetHeight + 'px';
      tempContainer.style.display = 'block';
      tempContainer.style.visibility = 'visible';

      // Copiar los estilos computados del original al temporal
      const styles = window.getComputedStyle(content);
      for (let style of styles) {
        tempContainer.style[style] = styles.getPropertyValue(style);
      }

      // Asegurarse de que las imágenes y fuentes estén cargadas
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remover elementos interactivos
      const elementsToRemove = tempContainer.querySelectorAll('button, .MuiIconButton-root');
      elementsToRemove.forEach(el => el.remove());

      console.log('Generando canvas...');
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        width: content.offsetWidth,
        height: content.offsetHeight,
        onclone: (document, element) => {
          element.style.visibility = 'visible';
          element.style.display = 'block';
          element.style.position = 'relative';
          element.style.left = '0';
        }
      });
      
      // Limpiar el contenedor temporal
      document.body.removeChild(tempContainer);
      
      // Convertir canvas a base64 PNG
      console.log('Convirtiendo canvas a PNG...');
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      console.log('Imagen convertida exitosamente');
      
      return { imageBase64, canvas };
    } catch (error) {
      console.error('Error detallado al generar imagen:', error);
      throw new Error('Error al generar imagen: ' + error.message);
    }
  };

  const generateSale = async () => {
    try {
      if (!validateStock()) return;
      if (saleItems.length === 0) {
        setError('Agregue productos a la venta');
        return;
      }
      if (!paymentMethod) {
        setError('Seleccione un método de pago');
        return;
      }

      setLoading(true);
      setError('');

      // Generar número de factura
      const newBillNumber = await generateBillNumber();
      setBillNumber(newBillNumber);

      // Crear datos de la venta
      const { subtotal, iva: ivaAmount, total } = calculateTotals();
      const saleData = {
        billNumber: newBillNumber,
        clientName: clientData.name || 'Consumidor Final',
        items: saleItems,
        subtotal,
        iva: selectedIVA,
        ivaAmount,
        total,
        paymentMethod
      };

      // Generar factura y ticket
      const { imageBase64, canvas } = await generatePDF(saleData);

      // Crear directorio de facturas si no existe
      const desktopPath = path.join(os.homedir(), 'Desktop');
      const desktopEsPath = path.join(os.homedir(), 'Escritorio');
      let facturasDir;

      if (fs.existsSync(desktopEsPath)) {
        facturasDir = path.join(desktopEsPath, 'Facturas');
      } else {
        facturasDir = path.join(desktopPath, 'Facturas');
      }

      if (!fs.existsSync(facturasDir)) {
        fs.mkdirSync(facturasDir);
      }

      // Primero insertar en la tabla bill y obtener el ID
      const { data: billData, error: billError } = await supabase
        .from('bill')
        .insert([
          {
            id_profile: user.id,
            number: newBillNumber,
            client_name: clientData.name || 'Consumidor Final',
            client_email: clientData.email || '',
            products: saleItems,
            total_amount: total.toString(),
            created_at: new Date().toISOString(),
            branch: currentBranch,
            payment_method: paymentMethod,
            status: 'completed',
            image_url: canvas.toDataURL('image/png')
          }
        ])
        .select()
        .single();

      if (billError) throw billError;

      // Guardar venta en la tabla sales usando el ID de la factura
      const { error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            id_profile: user.id,
            number: newBillNumber,
            name_client: clientData.name || 'Consumidor Final',
            email_client: clientData.email || '',
            products_sales: saleItems,
            amount: total,
            created_at: new Date().toISOString(),
            id_factura: billData.id,
            branch: currentBranch,
            method: paymentMethod,
            status: 'completed',
            image_url: canvas.toDataURL('image/png')
          }
        ]);

      if (saleError) throw saleError;

      // Actualizar stock
      for (const item of saleItems) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);

        if (stockError) throw stockError;
      }

      // Guardar factura PDF en la carpeta Facturas
      const doc = new jsPDF();
      const imgWidth = doc.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      const pdfPath = path.join(facturasDir, `factura-${newBillNumber}.pdf`);
      const pdfData = doc.output();
      fs.writeFileSync(pdfPath, pdfData, 'binary');

      // Generar e imprimir ticket
      const ticketContent = document.getElementById('ticket-content');
      if (ticketContent) {
        const ticketCanvas = await html2canvas(ticketContent, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });

        // Enviar a imprimir en la impresora térmica
        const printerName = 'XPrinter'; // Nombre de tu impresora
        const ticketDataUrl = ticketCanvas.toDataURL('image/png');
        
        // Enviar a imprimir usando IPC
        ipcRenderer.send('print-ticket', {
          printerName,
          content: ticketDataUrl
        });
      }

      // Mostrar mensaje de éxito y diálogo
      setSuccessMessage('Venta realizada con éxito. La factura se ha guardado en la carpeta Facturas.');
      setSuccessDialog(true);

      // Limpiar formulario
      clearForm();
      
      // Actualizar productos
      await fetchProducts();

    } catch (error) {
      console.error('Error al generar la venta:', error);
      setError('Error al generar la venta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, iva, total } = calculateTotals();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      p: 3,
      bgcolor: 'background.default',
      color: 'text.primary'
    }}>
      <Typography variant="h4" gutterBottom>
        Punto de Venta
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Panel de Control */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            bgcolor: 'background.paper',
            color: 'text.primary'
          }}>
            <Typography variant="h6" gutterBottom>
              Datos del Cliente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Sucursal</InputLabel>
                  <Select
                    value={currentBranch}
                    label="Sucursal"
                    onChange={(e) => setCurrentBranch(e.target.value)}
                    required
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch} value={branch}>
                        {branch}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre/Empresa *"
                  value={clientData.name}
                  onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email *"
                  value={clientData.email}
                  onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Agregar Productos
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Código de Barras
                </Typography>
                <form onSubmit={handleBarcodeSubmit}>
                  <TextField
                    fullWidth
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    inputRef={barcodeInputRef}
                  />
                </form>
              </Box>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => setShowProductSelector(true)}
                sx={{ mb: 2 }}
              >
                BUSCAR PRODUCTOS
              </Button>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  IVA %
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={selectedIVA}
                  onChange={(e) => setSelectedIVA(Number(e.target.value))}
                  inputProps={{ 
                    min: 0,
                    max: 100,
                    step: "0.1"
                  }}
                  helperText="Ingrese el porcentaje de IVA (0-100)"
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Método de Pago
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Método de Pago"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                  <MenuItem value="nuevo">+ Agregar Nuevo Método</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Grid>

        {/* Vista Previa */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            p: 3, 
            bgcolor: 'background.paper',
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Vista Previa</Typography>
              <Button
                variant="contained"
                startIcon={<SaleIcon />}
                onClick={generateSale}
                disabled={saleItems.length === 0 || loading}
              >
                {loading ? 'Procesando...' : 'GENERAR VENTA'}
              </Button>
            </Box>

            <Box id="bill-preview" sx={{ bgcolor: 'white', p: 4, color: 'black' }}>
              {/* Encabezado */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {companyData?.name || 'empresa de basilee'}
                </Typography>
                <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  FACTURA
                </Typography>
              </Box>

              {/* Datos de Empresa y Cliente */}
              <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Datos de la Empresa
                  </Typography>
                  <Typography>{companyData?.email || 'basile@gmail.com'}</Typography>
                  <Typography>CUIT: {companyData?.cuit || '3123122312'}</Typography>
                  <Typography>{companyData?.address || 'avellaneda'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Datos del Cliente
                  </Typography>
                  <Typography>{clientData.name}</Typography>
                  <Typography>{clientData.email}</Typography>
                  <Typography>Fecha: {moment().format('DD/MM/YYYY')}</Typography>
                </Grid>
              </Grid>

              {/* Tabla de Productos */}
              <Box sx={{ mb: 4 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1976d2' }}>
                      <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>Nombre</th>
                      <th style={{ padding: '12px', color: 'white', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ padding: '12px', color: 'white', textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ padding: '12px', color: 'white', textAlign: 'right' }}>Importe</th>
                      <th style={{ padding: '12px', color: 'white', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                          No hay productos agregados
                        </td>
                      </tr>
                    ) : (
                      saleItems.map((item) => (
                        <tr key={item.saleItemId}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{item.name}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleQuantityChange(item.saleItemId, -1)}
                                sx={{ 
                                  bgcolor: '#f5f5f5',
                                  '&:hover': { bgcolor: '#e0e0e0' }
                                }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => handleQuantityChange(item.saleItemId, 1)}
                                sx={{ 
                                  bgcolor: '#f5f5f5',
                                  '&:hover': { bgcolor: '#e0e0e0' }
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', textAlign: 'right' }}>${item.price_sale.toFixed(2)}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', textAlign: 'right' }}>${(item.price_sale * item.quantity).toFixed(2)}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveItem(item.saleItemId)}
                              sx={{ 
                                color: '#d32f2f',
                                '&:hover': { 
                                  bgcolor: 'rgba(211, 47, 47, 0.04)',
                                  color: '#b71c1c'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Box>

              {/* Totales */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                <table style={{ width: '300px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'left' }}>Subtotal:</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'left' }}>IVA ({selectedIVA}%):</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>${iva.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'left', color: '#1976d2', fontWeight: 'bold' }}>TOTAL:</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#1976d2', fontWeight: 'bold' }}>${total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </Box>

              {/* Método de pago */}
              <Typography sx={{ mt: 2, fontStyle: 'italic', color: '#666' }}>
                Método de pago: {paymentMethod}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Selector de Productos */}
      <ProductSelector
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        products={products.filter(p => p.branch === currentBranch)}
        onProductSelect={addProductToSale}
      />

      {/* Diálogo de éxito */}
      <Dialog
        open={successDialog}
        onClose={() => setSuccessDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 40, mb: 1 }} />
            <Typography variant="h6">
              ¡Venta Realizada con Éxito!
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', textAlign: 'center', my: 2 }}>
            {successMessage}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            La factura se ha descargado automáticamente
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => setSuccessDialog(false)}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vista previa de documentos */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vista previa de Factura
            </Typography>
            <Box ref={saleRef} sx={{ border: '1px solid #ddd', p: 2 }}>
              {/* Contenido actual de la factura */}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vista previa de Ticket
            </Typography>
            <TicketGenerator
              ref={ticketRef}
              saleData={{
                billNumber: billNumber || 'XXXX',
                clientName: clientData.name || 'Consumidor Final',
                items: saleItems,
                subtotal: calculateTotals().subtotal,
                iva: selectedIVA,
                ivaAmount: calculateTotals().iva,
                total: calculateTotals().total,
                paymentMethod: paymentMethod
              }}
              companyData={companyData}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default POS; 