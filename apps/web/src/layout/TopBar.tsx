import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Translate,
  LightMode,
  DarkMode,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useI18n } from '../../i18n';
import { useThemeMode } from '../../theme/ThemeContext';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { t, lang, setLang } = useI18n();
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="sticky" elevation={0} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ minHeight: 64 }}>
        {isMobile && (
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 1, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Language Toggle */}
        <Tooltip title={t('topbar.language')}>
          <IconButton
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            sx={{
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              px: 1.5,
              gap: 0.5,
              mr: 1,
              transition: 'all 200ms ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.main' + '15',
              },
            }}
          >
            <Translate sx={{ fontSize: 18 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
              {lang === 'en' ? '中' : 'EN'}
            </Typography>
          </IconButton>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip title={t('topbar.theme')}>
          <IconButton
            onClick={toggleMode}
            sx={{
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              transition: 'all 200ms ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.main' + '15',
              },
            }}
          >
            {mode === 'dark' ? (
              <LightMode sx={{ fontSize: 20 }} />
            ) : (
              <DarkMode sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
