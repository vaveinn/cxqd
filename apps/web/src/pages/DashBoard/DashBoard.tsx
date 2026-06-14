import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Today,
  PieChart,
} from '@mui/icons-material';
import { useI18n } from '../../i18n';
import { getStatistics, type SignRecord } from '../../services/statistics';
import StatCard from '../../components/StatCard/StatCard';

const Dashboard: React.FC = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState<{
    totalSuccess: number;
    totalFail: number;
    todayCount: number;
    byType: Record<string, { success: number; fail: number }>;
    recentRecords: SignRecord[];
  }>({ totalSuccess: 0, totalFail: 0, todayCount: 0, byType: {}, recentRecords: [] });

  useEffect(() => {
    const load = async () => {
      const s = await getStatistics();
      setStats(s);
    };
    load();
  }, []);

  const successRate = stats.totalSuccess + stats.totalFail > 0
    ? Math.round((stats.totalSuccess / (stats.totalSuccess + stats.totalFail)) * 100)
    : 0;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      normal: 'signType.normal',
      photo: 'signType.photo',
      gesture: 'signType.gesture',
      location: 'signType.location',
      qrcode: 'signType.qrcode',
    };
    return t(map[type] || type);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 300 }}>
        {t('dashboard.title')}
      </Typography>

      {/* Top stat cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<CheckCircle />}
            label={t('dashboard.totalSuccess')}
            value={stats.totalSuccess}
            color="success"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<Cancel />}
            label={t('dashboard.totalFail')}
            value={stats.totalFail}
            color="error"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<Today />}
            label={t('dashboard.todayCount')}
            value={stats.todayCount}
            color="info"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<PieChart />}
            label={t('dashboard.successRate')}
            value={`${successRate}%`}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* By-type stats */}
      {Object.keys(stats.byType).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('dashboard.byType')}
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(stats.byType).map(([type, counts]) => (
                <Grid item xs={6} sm={4} md={2.4} key={type}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {getTypeLabel(type)}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {counts.success}
                    </Typography>
                    <Typography variant="caption" color="error.main">
                      {counts.fail > 0 ? `${counts.fail} failed` : ''}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recent Records */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('dashboard.recentRecords')}
          </Typography>
          {stats.recentRecords.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              {t('dashboard.noRecords')}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('dashboard.tableTime')}</TableCell>
                    <TableCell>{t('dashboard.tableUser')}</TableCell>
                    <TableCell>{t('dashboard.tableType')}</TableCell>
                    <TableCell>{t('dashboard.tableStatus')}</TableCell>
                    <TableCell>{t('dashboard.tableDetail')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatTime(record.timestamp)}
                      </TableCell>
                      <TableCell>{record.userName}</TableCell>
                      <TableCell>{getTypeLabel(record.type)}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.status === 'success' ? t('common.success') : t('common.error')}
                          size="small"
                          color={record.status === 'success' ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {record.message || record.activityName}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
