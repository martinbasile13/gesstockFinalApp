import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

const Dashboard = () => {
  const { user, signOut, supabase } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error al cargar el perfil:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, supabase]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GesStock
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Perfil del Usuario */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar sx={{ width: 100, height: 100, mb: 2 }}>
                  <PersonIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {profile?.full_name || 'Usuario'}
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  {user?.email}
                </Typography>
                <Divider sx={{ width: '100%', my: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  Rol: {profile?.role || 'Usuario'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Miembro desde: {new Date(profile?.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Información General */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Bienvenido al Panel de Control
              </Typography>
              <Typography variant="body1" paragraph>
                Desde aquí podrás gestionar todo lo relacionado con tu inventario y ver las estadísticas de tu negocio.
              </Typography>
              <Typography variant="body1">
                Estado de la cuenta: <strong>Activa</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Última actualización: {new Date().toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard; 