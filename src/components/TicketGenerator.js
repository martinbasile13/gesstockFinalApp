import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { jsPDF } from 'jspdf';
import moment from 'moment';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';

const { ipcRenderer } = window.require('electron');

// Configuración de logs
function log(...args) {
  console.log('[Renderer Process]', ...args);
}

const TicketGenerator = forwardRef(({ saleData, companyData }, ref) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isPrinting, setIsPrinting] = useState(false);

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const generatePDF = () => {
    try {
      log('Generando PDF del ticket...');
      
      // Crear nuevo documento PDF
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 297] // Ancho de 80mm, alto ajustable
      });

      // Configurar fuente
      doc.setFont('Courier');
      doc.setFontSize(10);

      // Posición inicial
      let y = 10;
      const leftMargin = 5;
      const lineHeight = 5;

      // Función helper para añadir líneas de texto
      const addLine = (text) => {
        doc.text(text, leftMargin, y);
        y += lineHeight;
      };

      // Encabezado
      doc.setFontSize(12);
      addLine(companyData?.name?.toUpperCase() || '');
      doc.setFontSize(10);
      addLine(companyData?.address || '');
      addLine(`CUIT: ${companyData?.cuit || ''}`);
      addLine('--------------------------------');

      // Información de la venta
      addLine(`Fecha: ${moment().format('DD/MM/YY HH:mm')}`);
      addLine(`Ticket: #${saleData.billNumber}`);
      addLine(`Cliente: ${saleData.clientName}`);
      addLine('--------------------------------');
      addLine('CANT DESCRIPCION         PRECIO');

      // Productos
      saleData.items.forEach(item => {
        addLine(`${item.quantity.toString().padStart(4)} ${item.name.padEnd(18).substring(0,18)} ${(item.price_sale * item.quantity).toFixed(2).padStart(7)}`);
        addLine(`     ${item.price_sale.toFixed(2).padStart(7)} x unidad`);
      });

      // Totales
      addLine('--------------------------------');
      addLine(`SUBTOTAL:      ${saleData.subtotal.toFixed(2).padStart(12)}`);
      addLine(`IVA ${saleData.iva}%:      ${saleData.ivaAmount.toFixed(2).padStart(12)}`);
      addLine(`TOTAL:         ${saleData.total.toFixed(2).padStart(12)}`);
      addLine('--------------------------------');
      addLine(`FORMA DE PAGO: ${saleData.paymentMethod}`);
      addLine('--------------------------------');
      addLine('');
      addLine('     ¡GRACIAS POR SU COMPRA!');

      return doc;
    } catch (error) {
      log('Error al generar PDF:', error);
      throw error;
    }
  };

  const handleDownload = () => {
    try {
      const doc = generatePDF();
      doc.save(`ticket-${saleData.billNumber}.pdf`);
      
      setSnackbar({
        open: true,
        message: 'Ticket PDF descargado exitosamente',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al generar el PDF: ' + error.message,
        severity: 'error'
      });
    }
  };

  const printTicket = async () => {
    try {
      setIsPrinting(true);
      log('Iniciando proceso de impresión...');
      log('Datos de la compañía:', companyData);
      log('Datos de la venta:', saleData);

      // Preparar los datos para la impresión
      const ticketData = {
        companyName: companyData?.name?.toUpperCase() || '',
        address: companyData?.address || '',
        cuit: companyData?.cuit || '',
        date: moment().format('DD/MM/YY HH:mm'),
        billNumber: saleData.billNumber,
        clientName: saleData.clientName,
        items: saleData.items,
        subtotal: saleData.subtotal,
        iva: saleData.iva,
        ivaAmount: saleData.ivaAmount,
        total: saleData.total,
        paymentMethod: saleData.paymentMethod
      };

      log('Datos del ticket preparados:', ticketData);
      log('Enviando solicitud de impresión al proceso principal...');

      // Enviar solicitud de impresión al proceso principal
      ipcRenderer.send('print-ticket', { content: ticketData });

      // Escuchar la respuesta
      ipcRenderer.once('print-ticket-response', (event, response) => {
        log('Respuesta recibida del proceso principal:', response);
        
        if (response.success) {
          log('Impresión exitosa');
          setSnackbar({
            open: true,
            message: 'Ticket impreso correctamente',
            severity: 'success'
          });
        } else {
          log('Error en la respuesta:', response.error);
          throw new Error(response.error || 'Error desconocido al imprimir');
        }
        setIsPrinting(false);
      });

    } catch (error) {
      log('Error al imprimir:', error);
      setSnackbar({
        open: true,
        message: 'Error al imprimir: ' + error.message,
        severity: 'error'
      });
      setIsPrinting(false);
    }
  };

  const handlePrint = async () => {
    try {
      log('Iniciando handlePrint');
      await printTicket();
    } catch (error) {
      log('Error en handlePrint:', error);
      setIsPrinting(false);
      setSnackbar({
        open: true,
        message: 'Error al preparar la impresión: ' + error.message,
        severity: 'error'
      });
    }
  };

  useImperativeHandle(ref, () => ({
    generateTicket: handleDownload,
    printTicket: handlePrint
  }));

  const ticketContent = `
${companyData?.name?.toUpperCase() || ''}
${companyData?.address || ''}
CUIT: ${companyData?.cuit || ''}
--------------------------------
Fecha: ${moment().format('DD/MM/YY HH:mm')}
Ticket: #${saleData.billNumber}
Cliente: ${saleData.clientName}
--------------------------------
CANT DESCRIPCION         PRECIO
${saleData.items.map(item => 
`${item.quantity.toString().padStart(4)} ${item.name.padEnd(18).substring(0,18)} ${(item.price_sale * item.quantity).toFixed(2).padStart(7)}
     ${item.price_sale.toFixed(2).padStart(7)} x unidad`).join('\n')}
--------------------------------
SUBTOTAL:      ${saleData.subtotal.toFixed(2).padStart(12)}
IVA ${saleData.iva}%:      ${saleData.ivaAmount.toFixed(2).padStart(12)}
TOTAL:         ${saleData.total.toFixed(2).padStart(12)}
--------------------------------
FORMA DE PAGO: ${saleData.paymentMethod}
--------------------------------

     ¡GRACIAS POR SU COMPRA!`;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      mt: 2,
      p: 2,
      border: '1px solid #ddd',
      borderRadius: 1,
      backgroundColor: '#fff'
    }}>
      <Box 
        id="ticket-content" 
        component="pre"
        sx={{
          width: '302px',
          margin: 0,
          padding: '5px',
          fontFamily: 'Courier, monospace',
          fontSize: '12px',
          lineHeight: '14px',
          whiteSpace: 'pre',
          backgroundColor: '#fff',
          color: '#000',
          border: 'none',
          boxShadow: 'none'
        }}
      >
        {ticketContent}
      </Box>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={isPrinting}
        >
          Descargar PDF
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          color="primary"
          disabled={isPrinting}
        >
          {isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket'}
        </Button>
      </Box>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default TicketGenerator;