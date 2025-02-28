# GesStock App

Aplicación de gestión de inventario y punto de venta desarrollada con Electron y React.

## Características

- Gestión de inventario
- Punto de venta (POS)
- Gestión de clientes
- Generación de presupuestos
- Impresión de tickets
- Reportes y estadísticas
- Sistema de autenticación
- Interfaz moderna y responsive

## Tecnologías Utilizadas

- Electron
- React
- Material-UI
- Supabase (Base de datos y autenticación)
- Node.js
- JavaScript/ES6+

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)
- Git

### Requisitos adicionales para Windows
- Python 2.7 o superior
- Visual Studio Build Tools
- Drivers de la impresora térmica (si se usa)

## Instalación

### Pasos generales

1. Clonar el repositorio:
```bash
git clone https://github.com/martinbasile13/gesstockFinalApp.git
cd gesstockFinalApp
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo .env con las variables de entorno necesarias:
```env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### Configuración específica para Windows

1. Instalar herramientas de construcción de Windows:
```bash
npm install --global windows-build-tools
```

2. Si hay problemas con módulos nativos:
```bash
npm install --global node-gyp
```

3. Asegurarse de tener instalados los drivers de la impresora térmica

4. En caso de problemas con la impresión:
   - Verificar que la impresora esté configurada como predeterminada
   - Comprobar que los permisos de Windows permitan la impresión desde aplicaciones
   - Asegurarse de que el tamaño de papel esté configurado correctamente

### Iniciar la aplicación

```bash
npm run electron-dev
```

## Scripts Disponibles

- `npm start`: Inicia la aplicación React
- `npm run electron-dev`: Inicia la aplicación en modo desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run electron-pack`: Empaqueta la aplicación para distribución

## Estructura del Proyecto

```
gesstockFinalApp/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── styles/
│   ├── App.js
│   └── index.js
├── main.js
└── package.json
```

## Solución de Problemas Comunes

### Windows
1. Error "node-gyp":
   - Ejecutar `npm install --global windows-build-tools`
   - Asegurarse de tener Python instalado

2. Problemas de impresión:
   - Verificar la configuración de la impresora en Windows
   - Comprobar que el driver esté correctamente instalado
   - Ajustar el tamaño de papel en la configuración de Windows

3. Errores de módulos nativos:
   - Ejecutar `npm rebuild`
   - Verificar la versión de Node.js

## Contribuir

1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter)

Link del proyecto: [https://github.com/martinbasile13/gesstockFinalApp](https://github.com/martinbasile13/gesstockFinalApp) 