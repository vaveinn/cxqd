import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  TaskAlt,
  CameraAlt,
  Gesture,
  LocationOn,
  QrCode,
  SmartToy,
  ManageAccounts,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useI18n } from '../../i18n';

const DRAWER_WIDTH = 260;

const navItems = [
  { path: '/normal', icon: <TaskAlt />, key: 'sidebar.normal' },
  { path: '/photo', icon: <CameraAlt />, key: 'sidebar.photo' },
  { path: '/gesture', icon: <Gesture />, key: 'sidebar.gesture' },
  { path: '/location', icon: <LocationOn />, key: 'sidebar.location' },
  { path: '/qrcode', icon: <QrCode />, key: 'sidebar.qrcode' },
  { path: '/qqbot', icon: <SmartToy />, key: 'sidebar.qqbot' },
  { path: '/accounts', icon: <ManageAccounts />, key: 'sidebar.accounts' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Area */}
      <Box
        sx={{
          py: 3,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TaskAlt sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.2,
              fontSize: '1.1rem',
            }}
          >
            {t('app.title')}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}
          >
            v4.3.5
          </Typography>
        </Box>
      </Box>

      {/* Nav Items */}
      <List sx={{ flex: 1, pt: 1.5, px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => {
                navigate(item.path);
                if (isMobile) onClose();
              }}
              sx={{
                py: 1.5,
                mb: 0.5,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                '& .MuiListItemIcon-root': {
                  color: isActive ? '#10B981' : 'rgba(255,255,255,0.4)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={t(item.key)}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}
        >
          © 2024 Chaoxing Sign
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              backgroundColor: 'sidebar',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
