import React, { useState, useEffect } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import { useI18n } from '../../i18n';
import { useActivity } from '../../hooks/useActivity';
import { locationSign } from '../../services/signHelper';
import { recordSign } from '../../services/statistics';
import SignForm from '../../components/SignForm/SignForm';

const LocationCheckin: React.FC = () => {
  const { t } = useI18n();
  const { activity, loading, error, detectActivity } = useActivity();
  const [users, setUsers] = useState<UserParamsType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserParamsType | null>(null);
  const [status, setStatus] = useState('');
  const [signing, setSigning] = useState(false);
  const [lon, setLon] = useState('');
  const [lat, setLat] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const request = indexedDB.open('ui');
    request.onsuccess = () => {
      const db = request.result;
      const getAll = db.transaction('user', 'readonly').objectStore('user').getAll();
      getAll.onsuccess = () => {
        const list = getAll.result as UserParamsType[];
        setUsers(list);
        if (list.length > 0) {
          setSelectedUser(list[0]);
          // Pre-fill from config
          const preset = list[0].config?.monitor?.presetAddress?.[0];
          if (preset) { setLon(preset.lon); setLat(preset.lat); setAddress(preset.address); }
        }
      };
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const preset = selectedUser.config?.monitor?.presetAddress?.[0];
      if (preset) { setLon(preset.lon); setLat(preset.lat); setAddress(preset.address); }
    }
  }, [selectedUser]);

  const handleDetect = async () => {
    if (!selectedUser) return;
    setStatus('');
    await detectActivity(selectedUser);
  };

  const handleSign = async () => {
    if (!selectedUser || !activity?.activeId) return;
    setSigning(true);
    const res = await locationSign(selectedUser, activity.activeId, lat, lon, address);
    setSigning(false);

    if (res === 'success') {
      setStatus(t('sign.success'));
    } else {
      setStatus(`${t('sign.failed')}: ${res}`);
    }

    recordSign({
      phone: selectedUser.phone,
      userName: selectedUser.name,
      type: 'location',
      otherId: activity.otherId as number || 4,
      activityName: activity.name,
      status: res === 'success' ? 'success' : 'fail',
      message: res,
      timestamp: Date.now(),
    });
  };

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
              if (user) { setSelectedUser(user); setStatus(''); }
            }}
          >
            {users.map(u => (
              <MenuItem key={u.phone} value={u.phone}>{u.name} ({u.phone})</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <SignForm
        title={t('sidebar.location')}
        activityName={activity?.name || ''}
        otherId={activity?.otherId as number}
        loading={loading}
        signing={signing}
        status={status}
        error={error}
        expectedOtherIds={[4]}
        onDetect={handleDetect}
        onSign={handleSign}
      >
        {activity && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              label={t('sign.longitude')}
              value={lon}
              onChange={(e) => setLon(e.target.value)}
            />
            <TextField
              fullWidth
              margin="dense"
              label={t('sign.latitude')}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
            <TextField
              fullWidth
              margin="dense"
              label={t('sign.address')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Box>
        )}
      </SignForm>
    </Box>
  );
};

export default LocationCheckin;
