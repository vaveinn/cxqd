import React, { useEffect, useState } from 'react';
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField, FormControlLabel, FormGroup, Switch, Divider, Box, IconButton,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useI18n } from '../../i18n';

export const defaultConfig: UserConfig = {
  monitor: {
    delay: 0,
    presetAddress: [{ lon: '113.516288', lat: '34.817038', address: '安徽省蚌埠市蚌埠坦克学院' }]
  },
  mailing: {
    enabled: false, host: 'smtp.qq.com', ssl: true, port: 465,
    user: 'sender@qq.com', pass: '', to: 'receiver@qq.com'
  },
  wework: {
    enabled: false, webhook_url: ''
  },
  cqserver: {
    cq_enabled: false, ws_url: 'ws://127.0.0.1:8080', target_type: 'private', target_id: 1001
  }
};

// ---- Login Dialog ----
interface RenderLoginProps {
  onOK: (phone: string, password: string) => Promise<any>;
  onCancel: () => void;
}

export const RenderLogin: React.FC<RenderLoginProps> = (props) => {
  const { t } = useI18n();
  const [loginform, setLoginForm] = useState({ phone: '', pwd: '' });
  const [okDisabled, setOkDisabled] = useState(false);

  const onOK = async () => {
    setOkDisabled(true);
    await props.onOK(loginform.phone, loginform.pwd);
    setOkDisabled(false);
  };

  return (
    <>
      <DialogTitle>{t('login.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('login.description')}</DialogContentText>
        <TextField autoFocus margin="dense" id="phone" label={t('login.phone')}
          value={loginform.phone} type="tel"
          onChange={(e) => setLoginForm(prev => ({ ...prev, phone: e.target.value }))}
          fullWidth variant="standard" />
        <TextField margin="dense" id="pwd" label={t('login.password')}
          value={loginform.pwd} type="password"
          onChange={(e) => setLoginForm(prev => ({ ...prev, pwd: e.target.value }))}
          fullWidth variant="standard" />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onOK} disabled={okDisabled}>{t('common.confirm')}</Button>
      </DialogActions>
    </>
  );
};

// ---- Config Dialog ----
interface RenderConfigProps {
  current: UserParamsType;
  onOK: (target: UserParamsType, config: UserConfig) => void;
  onCancel: () => void;
}

export const RenderConfig: React.FC<RenderConfigProps> = (props) => {
  const { t } = useI18n();
  const [config, setConfig] = useState<UserConfig>({ ...defaultConfig });
  const [presetAddress, setPresetAddress] = useState<PresetAddress>([...defaultConfig.monitor.presetAddress]);

  useEffect(() => {
    if (props.current.config !== undefined) {
      setConfig(props.current.config);
      setPresetAddress(props.current.config.monitor.presetAddress || []);
    }
  }, [props.current]);

  const onOK = () => {
    props.onOK(props.current, {
      ...config,
      monitor: { ...config.monitor, presetAddress }
    });
  };

  const addPresetAddress = () => {
    setPresetAddress(prev => {
      prev.push({ lon: '', lat: '', address: '' });
      return [...prev];
    });
  };

  const removePresetAddress = (i: number) => {
    setPresetAddress(prev => {
      prev.splice(i, 1);
      return [...prev];
    });
  };

  return (
    <>
      <DialogTitle>{t('config.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('config.description')}</DialogContentText>
        <Box sx={{ my: 2 }} display="flex" flexDirection="column">
          <Divider><Chip label={t('config.signInfo')} /></Divider>
          <TextField margin="dense" id="delay" label={t('config.delay')}
            value={config.monitor.delay} type="number"
            onChange={(e) => setConfig(prev => ({ ...prev, monitor: { ...prev.monitor, delay: Number(e.target.value) } }))}
            fullWidth variant="outlined" />
          {presetAddress.map((preset, i) => (
            <Box key={i} display="flex">
              <Box flex={1}>
                <Box display="flex" gap={1}>
                  <TextField fullWidth margin="dense" variant="outlined" label={t('sign.longitude')}
                    value={preset.lon}
                    onChange={(e) => { presetAddress[i].lon = e.target.value; setPresetAddress([...presetAddress]); }} />
                  <TextField fullWidth margin="dense" variant="outlined" label={t('sign.latitude')}
                    value={preset.lat}
                    onChange={(e) => { presetAddress[i].lat = e.target.value; setPresetAddress([...presetAddress]); }} />
                </Box>
                <TextField margin="dense" label={t('sign.address')} value={preset.address}
                  onChange={(e) => { presetAddress[i].address = e.target.value; setPresetAddress([...presetAddress]); }}
                  fullWidth variant="outlined" />
              </Box>
              {i !== 0 && (
                <IconButton sx={{ alignSelf: 'center', ml: 1, color: 'error.main' }} onClick={() => removePresetAddress(i)}>
                  <Delete />
                </IconButton>
              )}
            </Box>
          ))}
          <Button variant="text" onClick={addPresetAddress}><Add /></Button>
        </Box>
        <Box sx={{ my: 2 }}>
          <Divider><Chip label={t('config.email')} /></Divider>
          <FormGroup sx={{ flexDirection: 'row' }}>
            <FormControlLabel label={t('config.emailEnable')}
              control={<Switch checked={config.mailing.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, mailing: { ...prev.mailing, enabled: e.target.checked } }))} />} />
            <FormControlLabel label={t('config.emailSsl')}
              control={<Switch checked={config.mailing.ssl}
                onChange={(e) => setConfig(prev => ({ ...prev, mailing: { ...prev.mailing, ssl: e.target.checked } }))} />} />
          </FormGroup>
          <TextField margin="dense" id="host" label={t('config.emailHost')} value={config.mailing.host}
            onChange={(e) => setConfig(prev => ({ ...prev, mailing: { ...prev.mailing, host: e.target.value } }))}
            fullWidth variant="outlined" />
          <TextField margin="dense" id="port" label={t('config.emailPort')} value={config.mailing.port} type="number"
            onChange={(e) => setConfig(prev => ({ ...prev, mailing: { ...prev.mailing, port: Number(e.target.value) } }))}
            fullWidth variant="outlined" />
          <TextField margin="dense" id="user" label={t('config.emailSender')} value={config.mailing.user} type="email"
            onChange={(e) => setConfig(prev => ({ ...prev, mailing: { ...prev.mailing, user: e.target.value } }))}
            fullWidth variant="outlined" />
          <TextField margin="dense" id="pass" label={t('config.emailPass')} value={config.mailing.pass}
            onChange={(e) => setConfig(prev => ({ ...prev, mailing: { ...prev.mailing, pass: e.target.value } }))}
            fullWidth variant="outlined" />
          <TextField margin="dense" id="to" label={t('config.emailReceiver')} value={config.mailing.to} type="email"
            onChange={(e) => setConfig(prev => ({ ...prev, mailing: { ...prev.mailing, to: e.target.value } }))}
            fullWidth variant="outlined" />
        </Box>
        <Box sx={{ my: 2 }}>
          <Divider><Chip label="企业微信机器人" /></Divider>
          <FormGroup sx={{ alignSelf: 'start' }}>
            <FormControlLabel label={t('qqbot.enable')}
              control={<Switch checked={config.wework.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, wework: { ...prev.wework, enabled: e.target.checked } }))} />} />
          </FormGroup>
          <TextField margin="dense" id="webhook_url" label={t('qqbot.webhookUrl')} value={config.wework.webhook_url}
            helperText={t('qqbot.webhookHint')}
            onChange={(e) => setConfig(prev => ({ ...prev, wework: { ...prev.wework, webhook_url: e.target.value } }))}
            fullWidth variant="outlined"
            placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..." />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onOK}>{t('common.confirm')}</Button>
      </DialogActions>
    </>
  );
};
