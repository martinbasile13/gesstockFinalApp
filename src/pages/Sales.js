import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Sales = () => {
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ventas
      </Typography>
      <Typography variant="body1">
        Aquí podrás gestionar tus ventas y facturación.
      </Typography>
    </Paper>
  );
};

export default Sales; 