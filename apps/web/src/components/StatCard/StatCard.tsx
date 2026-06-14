import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'success' | 'error' | 'info' | 'warning';
}

const colorMap = {
  success: '#10B981',
  error: '#EF4444',
  info: '#3B82F6',
  warning: '#F59E0B',
};

const bgColorMap = {
  success: 'rgba(16, 185, 129, 0.1)',
  error: 'rgba(239, 68, 68, 0.1)',
  info: 'rgba(59, 130, 246, 0.1)',
  warning: 'rgba(245, 158, 11, 0.1)',
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <Card className="glass-card" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: bgColorMap[color],
              color: colorMap[color],
              flexShrink: 0,
              '& .MuiSvgIcon-root': { fontSize: 24 },
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.8rem', mb: 0.5 }}
            >
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
