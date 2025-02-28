const { app, BrowserWindow, protocol, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

// Configuración de logs
function log(...args) {
  console.log('[Main Process]', ...args);
}

// Mantener una referencia global a la ventana principal
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Configurar el protocolo file para manejar las rutas de React Router
  protocol.registerFileProtocol('file', (request, callback) => {
    const url = request.url.replace('file:///', '');
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      console.error(error);
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

// Inicialización de la aplicación
app.whenReady().then(() => {
  log('Aplicación iniciada');
  createWindow();

  // Registrar el manejador para obtener impresoras
  ipcMain.on('get-printers', (event) => {
    try {
      if (!mainWindow || !mainWindow.webContents) {
        throw new Error('La ventana principal no está disponible');
      }
      const printers = mainWindow.webContents.getPrinters();
      log('Impresoras disponibles:', printers.map(p => p.name));
      event.reply('get-printers-response', { success: true, printers });
    } catch (error) {
      log('Error al obtener impresoras:', error);
      event.reply('get-printers-response', { 
        success: false, 
        error: error.message 
      });
    }
  });

  // Manejador para imprimir tickets
  ipcMain.on('print-ticket', async (event, data) => {
    try {
      log('Recibida solicitud de impresión');
      log('Tipo de data:', typeof data);
      log('Data completa:', JSON.stringify(data, null, 2));

      // Validar que tenemos los datos necesarios
      if (!data || !data.content) {
        throw new Error('No se recibieron datos válidos para la impresión');
      }

      // Crear una ventana oculta para la impresión
      const printWindow = new BrowserWindow({
        width: 300,
        height: 600,
        show: false
      });

      // Generar el HTML del ticket con estilos específicos para impresión
      const ticketHtml = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @media print {
                @page {
                  margin: 0;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                }
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                padding: 3mm;
                max-width: 80mm;
                margin: 0 auto;
              }
              .company-name {
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 3mm;
              }
              .info-line {
                margin-bottom: 1mm;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 2mm 0;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1mm;
                white-space: nowrap;
                overflow: hidden;
              }
              .item span:first-child {
                flex: 1;
                margin-right: 2mm;
              }
              .item span:last-child {
                flex-shrink: 0;
              }
              .totals {
                margin-top: 2mm;
                text-align: right;
              }
              .footer {
                text-align: center;
                margin-top: 4mm;
                padding-bottom: 2mm;
              }
            </style>
          </head>
          <body>
            <div class="company-name">${data.content.companyName}</div>
            <div class="info-line">${data.content.address}</div>
            <div class="info-line">CUIT: ${data.content.cuit}</div>
            <div class="divider"></div>
            <div class="info-line">Fecha: ${data.content.date}</div>
            <div class="info-line">Ticket #: ${data.content.billNumber}</div>
            <div class="info-line">Cliente: ${data.content.clientName}</div>
            <div class="divider"></div>
            <div>CANT DESCRIPCION         PRECIO</div>
            ${data.content.items.map(item => `
              <div class="item">
                <span>${item.quantity.toString().padStart(4)} ${item.name.padEnd(18).substring(0,18)}</span>
                <span>${(item.price_sale * item.quantity).toFixed(2).padStart(7)}</span>
              </div>
              <div class="item">
                <span>     ${item.price_sale.toFixed(2).padStart(7)} x unidad</span>
              </div>
            `).join('')}
            <div class="divider"></div>
            <div class="totals">
              <div>SUBTOTAL: ${data.content.subtotal.toFixed(2).padStart(12)}</div>
              <div>IVA ${data.content.iva}%: ${data.content.ivaAmount.toFixed(2).padStart(12)}</div>
              <div>TOTAL: ${data.content.total.toFixed(2).padStart(12)}</div>
            </div>
            <div class="divider"></div>
            <div class="info-line">FORMA DE PAGO: ${data.content.paymentMethod}</div>
            <div class="divider"></div>
            <div class="footer">¡GRACIAS POR SU COMPRA!</div>
          </body>
        </html>
      `;

      log('Cargando contenido HTML...');
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ticketHtml)}`);

      // Obtener lista de impresoras
      const printers = printWindow.webContents.getPrinters();
      const xprinter = printers.find(p => p.name.toLowerCase().includes('xprinter'));

      log('Preparando opciones de impresión...');
      const options = {
        silent: false,
        printBackground: true,
        deviceName: xprinter ? xprinter.name : undefined,
        margins: {
          marginType: 'none'
        }
      };

      // En Windows, podemos especificar el tamaño de página
      if (process.platform === 'win32') {
        options.pageSize = {
          width: 80000, // 80mm en micrones
          height: 297000 // Altura aproximada A4 en micrones
        };
      }

      log('Iniciando impresión con opciones:', options);
      printWindow.webContents.print(options, (success, reason) => {
        log('Resultado de impresión:', success ? 'éxito' : `error: ${reason}`);
        if (success) {
          event.reply('print-ticket-response', { success: true });
        } else {
          event.reply('print-ticket-response', { 
            success: false, 
            error: `Error al imprimir: ${reason}` 
          });
        }
        setTimeout(() => printWindow.close(), 1000);
      });

    } catch (error) {
      log('Error al preparar la impresión:', error);
      log('Stack trace:', error.stack);
      event.reply('print-ticket-response', { 
        success: false, 
        error: error.message 
      });
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 