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

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/gesstockFinalApp.git
```

2. Instalar dependencias:
```bash
cd gesstockFinalApp
npm install
```

3. Crear archivo .env con las variables de entorno necesarias:
```env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. Iniciar la aplicación en modo desarrollo:
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

Link del proyecto: [https://github.com/tu-usuario/gesstockFinalApp](https://github.com/tu-usuario/gesstockFinalApp) 