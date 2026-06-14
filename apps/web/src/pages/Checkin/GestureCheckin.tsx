import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Chip, LinearProgress, Card, CardContent,
} from '@mui/material';
import { PlayArrow, Search } from '@mui/icons-material';
import { useI18n } from '../../i18n';
import { fetch as Fetch } from '../../utils/request';
import { login_api, activity_api, general_api } from '../../config/api';
import { recordSign } from '../../services/statistics';

interface BatchResult {
  name: string;
  phone: string;
  status: 'success' | 'fail' | 'skip';
  message: string;
}

const GestureCheckin: React.FC = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserParamsType[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'detecting' | 'signing'>('idle');
  const [progress, setProgress] = useState('');
  const [readyUsers, setReadyUsers] = useState<{ user: UserParamsType; activity: any }[]>([]);

  useEffect(() => {
    const request = indexedDB.open('ui');
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('user', 'readonly');
      const store = tx.objectStore('user');
      const getAll = store.getAll();
      getAll.onsuccess = () => {
        setUsers(getAll.result as UserParamsType[]);
        setLoaded(true);
      };
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('user')) db.createObjectStore('user', { keyPath: 'phone' });
    };
  }, []);

  const handleDetect = async () => {
    setPhase('detecting');
    setResults([]);
    setReadyUsers([]);
    const ready: { user: UserParamsType; activity: any }[] = [];
    const skipList: BatchResult[] = [];

    for (const user of users) {
      setProgress(`${user.name}: ${t('sign.detecting')}...`);
      try {
        let currentUser = user;
        if (Date.now() - new Date(user.date).getTime() > 432000000) {
          const refreshed = await Fetch(login_api, {
            method: 'POST',
            body: { phone: user.phone, password: user.password },
          });
          if (refreshed === 'AuthFailed' || refreshed?.error === 'AuthFailed') {
            skipList.push({ name: user.name, phone: user.phone, status: 'skip', message: t('account.batchSkipAuth') });
            continue;
          }
          currentUser = { ...user, ...refreshed, date: new Date() };
        }

        const activity = await Fetch(activity_api, {
          method: 'POST',
          body: { uf: currentUser.uf, _d: currentUser._d, vc3: currentUser.vc3, uid: currentUser._uid },
        });

        if (activity === 'NoActivity' || activity === 'NoCourse') {
          skipList.push({ name: user.name, phone: user.phone, status: 'skip', message: t('account.batchSkipNoActivity') });
        } else if (activity === 'AuthRequired') {
          skipList.push({ name: user.name, phone: user.phone, status: 'skip', message: t('account.batchSkipAuth') });
        } else if (activity?.activeId) {
          const otherId = Number(activity.otherId);
          if ([3, 5].includes(otherId)) {
            ready.push({ user: currentUser, activity });
          } else {
            skipList.push({ name: user.name, phone: user.phone, status: 'skip', message: t('sign.typeMismatch') });
          }
        } else {
          skipList.push({ name: user.name, phone: user.phone, status: 'skip', message: t('common.error') });
        }
      } catch {
        skipList.push({ name: user.name, phone: user.phone, status: 'skip', message: t('common.error') });
      }
    }

    setResults(skipList);
    setReadyUsers(ready);
    setProgress(`${ready.length} ${t('common.ready')}, ${skipList.length} ${t('account.batchSkipNoActivity')}`);
    setPhase('idle');
  };

  const handleSign = async () => {
    setPhase('signing');
    const signResults: BatchResult[] = [];
    let ok = 0, fail = 0;

    for (const { user, activity } of readyUsers) {
      setProgress(`${t('account.batchProgress').replace('{{name}}', user.name)}`);
      try {
        const res = await Fetch(general_api, {
          method: 'POST',
          body: {
            uf: user.uf, _d: user._d, vc3: user.vc3,
            uid: user._uid, fid: user.fid,
            activeId: activity.activeId, name: user.name,
          },
          type: 'text',
        });

        const success = res === 'success';
        signResults.push({
          name: user.name, phone: user.phone,
          status: success ? 'success' : 'fail',
          message: success ? '✅' : res,
        });
        if (success) ok++; else fail++;

        recordSign({
          phone: user.phone, userName: user.name,
          type: 'gesture', otherId: Number(activity.otherId) || 3,
          activityName: activity.name,
          status: success ? 'success' : 'fail',
          message: res, timestamp: Date.now(),
        });
      } catch (e: any) {
        fail++;
        signResults.push({ name: user.name, phone: user.phone, status: 'fail', message: e.message });
      }
    }

    setResults(prev => [...prev, ...signResults]);
    setProgress(t('account.batchComplete').replace('{{success}}', String(ok)).replace('{{fail}}', String(fail)));
    setPhase('idle');
  };

  if (!loaded) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 300 }}>
        {t('sidebar.gesture')}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body1">{users.length} users</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {users.map(u => (
              <Chip key={u.phone} label={`${u.name} (${u.phone})`} size="small" variant="outlined" />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={handleDetect}
              disabled={running || users.length === 0}
            >
              {phase === 'detecting' ? t('sign.detecting') : t('sign.detectActivity')}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={handleSign}
              disabled={running || readyUsers.length === 0}
            >
              {phase === 'signing' ? t('sign.signing') : `${t('sign.signIn')} (${readyUsers.length})`}
            </Button>
          </Box>
          {phase !== 'idle' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{progress}</Typography>
              <LinearProgress sx={{ borderRadius: 2 }} />
            </Box>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('dashboard.recentRecords')}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {results.map((r, i) => (
                <Chip
                  key={i}
                  label={`${r.name}: ${r.message}`}
                  size="small"
                  color={r.status === 'success' ? 'success' : r.status === 'fail' ? 'error' : 'default'}
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GestureCheckin;
