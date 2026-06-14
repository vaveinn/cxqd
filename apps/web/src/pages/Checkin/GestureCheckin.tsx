import React, { useState, useEffect } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { useI18n } from '../../i18n';
import { useActivity } from '../../hooks/useActivity';
import { generalSign } from '../../services/signHelper';
import { recordSign } from '../../services/statistics';
import SignForm from '../../components/SignForm/SignForm';

const GestureCheckin: React.FC = () => {
  const { t } = useI18n();
  const { activity, loading, error, detectActivity } = useActivity();
  const [users, setUsers] = useState<UserParamsType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserParamsType | null>(null);
  const [status, setStatus] = useState('');
  const [signing, setSigning] = useState(false);

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
    await detectActivity(selectedUser);
  };

  const handleSign = async () => {
    if (!selectedUser || !activity?.activeId) return;
    setSigning(true);
    const res = await generalSign(selectedUser, activity.activeId);
    setSigning(false);

    if (res === 'success') {
      setStatus(t('sign.success'));
    } else {
      setStatus(`${t('sign.failed')}: ${res}`);
    }

    const typeMap: Record<number, string> = { 3: 'gesture', 5: 'gesture' };
    recordSign({
      phone: selectedUser.phone,
      userName: selectedUser.name,
      type: typeMap[activity.otherId as number] || 'gesture',
      otherId: activity.otherId as number || 3,
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
        title={t('sidebar.gesture')}
        activityName={activity?.name || ''}
        otherId={activity?.otherId as number}
        loading={loading}
        signing={signing}
        status={status}
        error={error}
        expectedOtherIds={[3, 5]}
        onDetect={handleDetect}
        onSign={handleSign}
      />
    </Box>
  );
};

export default GestureCheckin;
