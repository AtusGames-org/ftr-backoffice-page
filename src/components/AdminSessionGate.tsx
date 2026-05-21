import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { authStorage } from '../services/authStorage';
import { verifyAdminSession } from '../services/authService';

function AdminSessionGate() {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    let mounted = true;

    const validate = async () => {
      const hasTokens = Boolean(authStorage.getAccessToken() || authStorage.getRefreshToken());
      if (!hasTokens) {
        authStorage.clearSession();
        if (mounted) {
          setStatus('unauthorized');
        }
        return;
      }

      try {
        const session = await verifyAdminSession();
        if (!mounted) {
          return;
        }

        if (session?.is_admin) {
          setStatus('authorized');
        } else {
          authStorage.clearSession();
          setStatus('unauthorized');
        }
      } catch {
        authStorage.clearSession();
        if (mounted) {
          setStatus('unauthorized');
        }
      }
    };

    validate();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (status === 'loading') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default AdminSessionGate;