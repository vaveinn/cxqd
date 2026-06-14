import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Typography, Button, TextField,
} from '@mui/material';
import { useI18n } from '../../i18n';
import { useActivity } from '../../hooks/useActivity';
import { qrcodeSign, parseEncFromUrl, parseEnc } from '../../services/signHelper';
import { recordSign } from '../../services/statistics';
import SignForm from '../../components/SignForm/SignForm';
import CameraScanner from '../../components/CameraScanner/CameraScanner';

const QrcodeCheckin: React.FC = () => {
  const { t } = useI18n();
  const { activity, loading, error, detectActivity } = useActivity();
  const [users, setUsers] = useState<UserParamsType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserParamsType | null>(null);
  const [status, setStatus] = useState('');
  const [signing, setSigning] = useState(false);
  const [enc, setEnc] = useState('');
  const [autoLoop, setAutoLoop] = useState(true);
  const [useCamera, setUseCamera] = useState(true);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    const request = indexedDB.open('ui');
    request.onsuccess = () => {
      const db = request.result;
      const getAll = db.transaction('user', 'readonly').objectStore('user').getAll();
      getAll.onsuccess = () => {
        const list = getAll.result as UserParamsType[];
        setUsers(list);
        if (list.length > 0) setSelectedUser(list[0]);
      };
    };
  }, []);

  const handleDetect = async () => {
    if (!selectedUser) return;
    setStatus('');
    setEnc('');
    await detectActivity(selectedUser);
  };

  const getLocationFromConfig = (): { lon: string; lat: string; address: string } => {
    const preset = selectedUser?.config?.monitor?.presetAddress?.[0];
    return {
      lon: preset?.lon || '',
      lat: preset?.lat || '',
      address: preset?.address || '',
    };
  };

  const doSign = useCallback(async (encValue: string) => {
    if (!selectedUser || !activity?.activeId) return false;
    setSigning(true);
    const loc = getLocationFromConfig();
    const res = await qrcodeSign(
      selectedUser, activity.activeId, encValue,
      loc.lat, loc.lon, loc.address, '0'
    );
    setSigning(false);

    if (res === 'success') {
      setStatus(t('sign.success'));
      recordSign({
        phone: selectedUser.phone, userName: selectedUser.name,
        type: 'qrcode', otherId: 2, activityName: activity.name,
        status: 'success', message: 'success',
        timestamp: Date.now(),
      });
      return true;
    } else {
      setStatus(`${t('sign.failed')}: ${res}`);
      recordSign({
        phone: selectedUser.phone, userName: selectedUser.name,
        type: 'qrcode', otherId: 2, activityName: activity.name,
        status: 'fail', message: res,
        timestamp: Date.now(),
      });
      return false;
    }
  }, [selectedUser, activity, t]);

  const handleScan = useCallback(async (scannedEnc: string) => {
    setEnc(scannedEnc);
    setScanCount(c => c + 1);
    if (autoLoop) {
      const success = await doSign(scannedEnc);
      if (!success) {
        // Reset for re-scan (status will show fail briefly, then camera resumes)
        setTimeout(() => {
          if (autoLoop) setStatus('');
        }, 2000);
      }
    }
  }, [autoLoop, doSign]);

  const handleManualSign = async () => {
    if (!enc) return;
    await doSign(enc);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseEnc(file);
    if (result && result !== '识别失败') {
      setEnc(result);
      if (autoLoop) {
        await doSign(result);
      }
    } else {
      setStatus('QR decode failed');
    }
  };

  const loc = getLocationFromConfig();

  return (
    <Box>
      <Box sx={{ maxWidth: 560, mx: 'auto', mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>{t('sign.selectUser')}</InputLabel>
          <Select
            value={selectedUser?.phone || ''}
            label={t('sign.selectUser')}
            onChange={(e) => {
              const user = users.find(u => u.phone === e.target.value);
              if (user) { setSelectedUser(user); setStatus(''); setEnc(''); }
            }}
          >
            {users.map(u => (
              <MenuItem key={u.phone} value={u.phone}>{u.name} ({u.phone})</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <SignForm
        title={t('sidebar.qrcode')}
        activityName={activity?.name || ''}
        otherId={activity?.otherId as number}
        loading={loading}
        signing={signing}
        status={status}
        error={error}
        expectedOtherIds={[2]}
        onDetect={handleDetect}
        onSign={handleManualSign}
      >
        {activity && (
          <Box sx={{ mt: 2 }}>
            {/* Location info (from config, read-only) */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Location from config: {loc.lon}, {loc.lat} — {loc.address || '(not set)'}
            </Typography>

            {/* Scanned ENC display */}
            {enc && (
              <TextField
                fullWidth
                margin="dense"
                label="ENC"
                value={enc}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
            )}

            {/* Scan count */}
            {scanCount > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Scans: {scanCount}
              </Typography>
            )}

            {/* Auto-loop toggle */}
            <FormControlLabel
              control={
                <Switch checked={autoLoop} onChange={(e) => setAutoLoop(e.target.checked)} />
              }
              label={t('sign.autoLoop')}
              sx={{ mb: 2 }}
            />

            {/* Camera/File toggle */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <Button
                variant={useCamera ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setUseCamera(true)}
              >
                Camera
              </Button>
              <Button
                variant={!useCamera ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setUseCamera(false)}
              >
                File Upload
              </Button>
            </Box>

            {/* Camera Scanner */}
            {useCamera && (
              <CameraScanner
                onScan={handleScan}
                autoLoop={autoLoop}
                disabled={signing}
              />
            )}

            {/* File Upload Fallback */}
            {!useCamera && (
              <Box sx={{ textAlign: 'center' }}>
                <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                  {t('sign.scanQrCode')}
                  <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
                </Button>
                <TextField
                  fullWidth
                  margin="dense"
                  label={t('sign.manualEnc')}
                  placeholder={t('sign.encPlaceholder')}
                  value={enc}
                  onChange={(e) => setEnc(e.target.value)}
                />
              </Box>
            )}
          </Box>
        )}
      </SignForm>
    </Box>
  );
};

export default QrcodeCheckin;
