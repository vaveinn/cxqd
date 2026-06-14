import React, { useState, useEffect, useRef } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem, Button, Typography, CircularProgress,
} from '@mui/material';
import { useI18n } from '../../i18n';
import { useActivity } from '../../hooks/useActivity';
import { getuvToken, photoSign, uploadFile } from '../../services/signHelper';
import { recordSign } from '../../services/statistics';
import SignForm from '../../components/SignForm/SignForm';

const PhotoCheckin: React.FC = () => {
  const { t } = useI18n();
  const { activity, loading, error, detectActivity } = useActivity();
  const [users, setUsers] = useState<UserParamsType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserParamsType | null>(null);
  const [status, setStatus] = useState('');
  const [signing, setSigning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSign = async () => {
    if (!selectedUser || !activity?.activeId || !photoFile) return;
    setSigning(true);
    setUploading(true);

    try {
      const token = await getuvToken(selectedUser);
      const uploadResult = await uploadFile(selectedUser, photoFile, token);
      const objectId = JSON.parse(uploadResult).objectId;
      setUploading(false);

      const res = await photoSign(selectedUser, activity.activeId, objectId);
      setSigning(false);

      if (res === 'success') {
        setStatus(t('sign.success'));
      } else {
        setStatus(`${t('sign.failed')}: ${res}`);
      }

      recordSign({
        phone: selectedUser.phone,
        userName: selectedUser.name,
        type: 'photo',
        otherId: activity.otherId as number || 0,
        activityName: activity.name,
        status: res === 'success' ? 'success' : 'fail',
        message: res,
        timestamp: Date.now(),
      });
    } catch (e) {
      setSigning(false);
      setUploading(false);
      setStatus(`${t('sign.failed')}: upload error`);
    }
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
        title={t('sidebar.photo')}
        activityName={activity?.name || ''}
        otherId={activity?.otherId as number}
        loading={loading}
        signing={signing || uploading}
        status={status}
        error={error}
        expectedOtherIds={[0]}
        onDetect={handleDetect}
        onSign={handleSign}
      >
        {activity && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={signing}
              fullWidth
              sx={{ mb: 2 }}
            >
              {photoFile ? t('sign.photoSelected') : t('sign.uploadPhoto')}
            </Button>
            {photoPreview && (
              <Box
                component="img"
                src={photoPreview}
                alt="preview"
                sx={{
                  width: '100%',
                  maxHeight: 200,
                  objectFit: 'cover',
                  borderRadius: 2,
                  mb: 1,
                }}
              />
            )}
            {uploading && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">Uploading...</Typography>
              </Box>
            )}
          </Box>
        )}
      </SignForm>
    </Box>
  );
};

export default PhotoCheckin;
