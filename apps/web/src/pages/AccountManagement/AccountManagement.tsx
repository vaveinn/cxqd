import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, Snackbar, Alert, Chip,
  Card, CardContent, LinearProgress, CircularProgress,
} from '@mui/material';
import { AddCircleOutline, PlayArrow } from '@mui/icons-material';
import { useI18n } from '../../i18n';
import { fetch as Fetch } from '../../utils/request';
import { login_api, activity_api } from '../../config/api';
import { generalSign, qrcodeSign, locationSign } from '../../services/signHelper';
import { recordSign } from '../../services/statistics';
import UserCard from '../../components/UserCard/UserCard';
import { RenderLogin, RenderConfig, defaultConfig } from '../../components/ConfigDialog/ConfigDialog';

interface BatchResult {
  name: string;
  phone: string;
  status: 'success' | 'fail' | 'skip';
  message: string;
}

const MAX_USERS = 10;

const AccountManagement: React.FC = () => {
  const { t } = useI18n();
  const [indb, setIndb] = useState<IDBDatabase>();
  const [users, setUsers] = useState<UserParamsType[]>([]);
  const [current, setCurrent] = useState<UserParamsType>();
  const [loaded, setLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'login' | 'config'>('login');
  const [alert, setAlert] = useState({ open: false, message: '' });
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');

  useEffect(() => {
    const request = window.indexedDB.open('ui');
    request.onerror = () => console.log('数据库打开失败');
    request.onsuccess = () => {
      setIndb(request.result);
      const cursorReq = request.result.transaction('user', 'readwrite').objectStore('user').openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          setUsers(prev => [...prev, cursor.value]);
          cursor.continue();
        } else {
          setLoaded(true);
        }
      };
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'phone' });
      }
      if (!db.objectStoreNames.contains('statistics')) {
        db.createObjectStore('statistics', { keyPath: 'id', autoIncrement: true });
      }
    };
  }, []);

  const login = async (phone: string, password: string) => {
    const user = await Fetch(login_api, {
      method: 'POST',
      body: { phone, password }
    });
    if (user !== 'AuthFailed') {
      setDialogOpen(false);
      const newUser: UserParamsType = {
        phone, password,
        name: user.name, _uid: user._uid, uf: user.uf, vc3: user.vc3,
        _d: user._d, fid: user.fid, lv: user.lv,
        date: new Date(),
        monitor: false,
        config: defaultConfig,
      };
      indb!.transaction(['user'], 'readwrite').objectStore('user').put(newUser);
      setUsers(prev => [...prev, newUser]);
      setAlert({ open: true, message: t('account.userAdded') });
    } else {
      setAlert({ open: true, message: t('account.loginFailed') });
    }
  };

  const storeConfig = (target: UserParamsType, config: UserConfig) => {
    const updated = { ...target, config, date: new Date() };
    indb!.transaction(['user'], 'readwrite').objectStore('user').put(updated);
    setUsers(prev => prev.map(u => u.phone === target.phone ? updated : u));
    setDialogOpen(false);
  };

  const batchSignIn = async () => {
    setBatchRunning(true);
    setBatchResults([]);
    setBatchProgress('');

    // Step 1: Detect activities for all users
    const readyUsers: { user: UserParamsType; activity: any }[] = [];
    const skipReasons: BatchResult[] = [];

    for (const user of users) {
      setBatchProgress(`${user.name}: ${t('sign.detecting')}...`);

      try {
        // Re-auth if needed
        let currentUser = user;
        if (Date.now() - new Date(user.date).getTime() > 432000000) {
          const refreshed = await Fetch(login_api, {
            method: 'POST',
            body: { phone: user.phone, password: user.password }
          });
          if (refreshed === 'AuthFailed') {
            skipReasons.push({ name: user.name, phone: user.phone, status: 'skip', message: t('account.batchSkipAuth') });
            continue;
          }
          currentUser = { ...user, ...refreshed, date: new Date() };
        }

        const activity = await Fetch(activity_api, {
          method: 'POST',
          body: { uf: currentUser.uf, _d: currentUser._d, vc3: currentUser.vc3, uid: currentUser._uid }
        });

        if (activity === 'NoActivity' || activity === 'NoCourse') {
          skipReasons.push({ name: user.name, phone: user.phone, status: 'skip', message: t('account.batchSkipNoActivity') });
        } else if (activity === 'AuthRequired') {
          skipReasons.push({ name: user.name, phone: user.phone, status: 'skip', message: t('account.batchSkipAuth') });
        } else {
          readyUsers.push({ user: currentUser, activity });
        }
      } catch {
        skipReasons.push({ name: user.name, phone: user.phone, status: 'skip', message: 'Error' });
      }
    }

    setBatchResults([...skipReasons]);

    if (readyUsers.length === 0) {
      setBatchProgress(t('account.batchComplete').replace('{{success}}', '0').replace('{{fail}}', '0'));
      setBatchRunning(false);
      return;
    }

    // Step 2: Execute sign-in for ready users sequentially
    const results: BatchResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const { user, activity } of readyUsers) {
      setBatchProgress(`${t('account.batchProgress').replace('{{name}}', user.name)}`);

      let res: string;
      try {
        const activeId = activity.activeId;
        const otherId = Number(activity.otherId);

        const preset = user.config?.monitor?.presetAddress?.[0] || { lon: '', lat: '', address: '' };

        switch (otherId) {
          case 0:
          case 3:
          case 5:
            res = await generalSign(user, activeId);
            break;
          case 2:
            res = await qrcodeSign(user, activeId, '', preset.lat, preset.lon, preset.address, '0');
            break;
          case 4:
            res = await locationSign(user, activeId, preset.lat, preset.lon, preset.address);
            break;
          default:
            res = await generalSign(user, activeId);
        }

        const typeMap: Record<number, string> = { 0: 'normal', 2: 'qrcode', 3: 'gesture', 4: 'location', 5: 'gesture' };

        if (res === 'success') {
          successCount++;
          results.push({ name: user.name, phone: user.phone, status: 'success', message: 'success' });
        } else {
          failCount++;
          results.push({ name: user.name, phone: user.phone, status: 'fail', message: res });
        }

        recordSign({
          phone: user.phone, userName: user.name,
          type: typeMap[otherId] || 'normal',
          otherId, activityName: activity.name,
          status: res === 'success' ? 'success' : 'fail',
          message: res, timestamp: Date.now(),
        });
      } catch {
        failCount++;
        results.push({ name: user.name, phone: user.phone, status: 'fail', message: 'Error' });
      }
    }

    setBatchResults(prev => [...prev, ...results]);
    setBatchProgress(t('account.batchComplete').replace('{{success}}', String(successCount)).replace('{{fail}}', String(failCount)));
    setBatchRunning(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 300 }}>
        {t('account.title')}
      </Typography>

      {/* User Cards */}
      <Box sx={{ mb: 3 }}>
        {users.map((user) => (
          <UserCard
            key={user.phone}
            indb={indb as IDBDatabase}
            user={user}
            setUser={setUsers}
            setCurrent={setCurrent}
            setAlert={setAlert}
            onConfigOpen={(u) => { setCurrent(u); setDialogType('config'); setDialogOpen(true); }}
          />
        ))}

        {/* Add Account Button */}
        <Button
          variant="outlined"
          onClick={() => { setDialogType('login'); setDialogOpen(true); }}
          disabled={users.length >= MAX_USERS}
          sx={{
            display: 'inline-flex',
            minWidth: 300,
            maxWidth: 345,
            height: 165,
            borderRadius: 4,
            mb: 2,
            mr: 2,
            flexDirection: 'column',
            gap: 1,
            borderStyle: 'dashed',
          }}
          title={users.length >= MAX_USERS ? t('account.maxReached') : ''}
        >
          <AddCircleOutline sx={{ fontSize: 32 }} />
          <Typography variant="body2">
            {users.length >= MAX_USERS ? t('account.maxReached') : t('account.addAccount')}
          </Typography>
        </Button>
      </Box>

      {/* Batch Sign-in */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('account.batchSign')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {users.length} / {MAX_USERS} users
          </Typography>

          <Button
            variant="contained"
            color="success"
            startIcon={batchRunning ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
            onClick={batchSignIn}
            disabled={batchRunning || users.length === 0}
          >
            {batchRunning ? t('sign.signing') : t('account.batchSign')}
          </Button>

          {batchProgress && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {batchProgress}
              </Typography>
              {batchRunning && <LinearProgress sx={{ borderRadius: 2 }} />}
            </Box>
          )}

          {/* Batch Results */}
          {batchResults.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {batchResults.map((r, i) => (
                <Chip
                  key={i}
                  label={`${r.name}: ${r.message}`}
                  size="small"
                  color={r.status === 'success' ? 'success' : r.status === 'fail' ? 'error' : 'default'}
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        {dialogType === 'login' ? (
          <RenderLogin onOK={login} onCancel={() => setDialogOpen(false)} />
        ) : (
          <RenderConfig current={current as UserParamsType} onOK={storeConfig} onCancel={() => setDialogOpen(false)} />
        )}
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert({ open: false, message: '' })}>
        <Alert severity="info" sx={{ width: '100%' }}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountManagement;
