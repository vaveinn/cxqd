import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select,
  MenuItem, TextField, Button, Switch, FormControlLabel, Snackbar, Alert,
  Link,
} from '@mui/material';
import { useI18n } from '../../i18n';
import { defaultConfig } from '../../components/ConfigDialog/ConfigDialog';

const QqBotBinding: React.FC = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserParamsType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserParamsType | null>(null);
  const [config, setConfig] = useState<UserConfig>({ ...defaultConfig });
  const [saved, setSaved] = useState(false);

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
          if (list[0].config) setConfig({ ...defaultConfig, ...list[0].config, wework: { ...defaultConfig.wework, ...(list[0].config.wework || {}) } });
        }
      };
    };
  }, []);

  useEffect(() => {
    if (selectedUser?.config) {
      setConfig({ ...defaultConfig, ...selectedUser.config, wework: { ...defaultConfig.wework, ...(selectedUser.config.wework || {}) } });
    }
  }, [selectedUser]);

  const handleSave = () => {
    if (!selectedUser) return;
    const request = indexedDB.open('ui');
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('user', 'readwrite');
      const store = tx.objectStore('user');
      store.put({
        ...selectedUser,
        config,
        date: new Date(),
      });
      tx.oncomplete = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      };
    };
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 300 }}>
        {t('qqbot.title')}
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>{t('sign.selectUser')}</InputLabel>
        <Select
          value={selectedUser?.phone || ''}
          label={t('sign.selectUser')}
          onChange={(e) => {
            const user = users.find(u => u.phone === e.target.value);
            if (user) setSelectedUser(user);
          }}
        >
          {users.map(u => (
            <MenuItem key={u.phone} value={u.phone}>{u.name} ({u.phone})</MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedUser && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              在企业微信群聊中添加机器人，获取 Webhook 地址后填入下方即可。签到检测和结果会自动推送到群聊。
            </Typography>

            <FormControlLabel
              label={t('qqbot.enable')}
              control={
                <Switch
                  checked={config.wework.enabled}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    wework: { ...prev.wework, enabled: e.target.checked }
                  }))}
                />
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              margin="dense"
              label={t('qqbot.webhookUrl')}
              helperText={t('qqbot.webhookHint')}
              value={config.wework.webhook_url}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                wework: { ...prev.wework, webhook_url: e.target.value }
              }))}
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              sx={{ mt: 1 }}
            />

            <Button
              variant="contained"
              onClick={handleSave}
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              {t('qqbot.saveConfig')}
            </Button>
          </CardContent>
        </Card>
      )}

      {!selectedUser && users.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              {t('sign.noUser')}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {t('qqbot.configSaved')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QqBotBinding;
