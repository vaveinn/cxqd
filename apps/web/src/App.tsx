import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { AppThemeProvider } from './theme/ThemeContext';
import { I18nProvider } from './i18n';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import NormalCheckin from './pages/Checkin/NormalCheckin';
import PhotoCheckin from './pages/Checkin/PhotoCheckin';
import GestureCheckin from './pages/Checkin/GestureCheckin';
import LocationCheckin from './pages/Checkin/LocationCheckin';
import QrcodeCheckin from './pages/Checkin/QrcodeCheckin';
import QqBotBinding from './pages/QqBotBinding/QqBotBinding';
import AccountManagement from './pages/AccountManagement/AccountManagement';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="normal" element={<NormalCheckin />} />
        <Route path="photo" element={<PhotoCheckin />} />
        <Route path="gesture" element={<GestureCheckin />} />
        <Route path="location" element={<LocationCheckin />} />
        <Route path="qrcode" element={<QrcodeCheckin />} />
        <Route path="qqbot" element={<QqBotBinding />} />
        <Route path="accounts" element={<AccountManagement />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppThemeProvider>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppThemeProvider>
    </I18nProvider>
  );
}

export default App;
