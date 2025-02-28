import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Reports = () => {
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reportes
      </Typography>
      <Typography variant="body1">
        Aquí podrás ver y generar reportes de tu negocio.
      </Typography>
    </Paper>
  );
};

export default Reports; 