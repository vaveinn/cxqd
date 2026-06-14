import React, { useState } from 'react';
import { fetch as Fetch } from '../../utils/request';
import enc from 'crypto-js/enc';
import Delete from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useLongPress } from '../../hooks/useLongPress';
import { monitor_stop_api, monitor_start_api } from '../../config/api';
import { useI18n } from '../../i18n';

interface UserCardProps {
  indb: IDBDatabase;
  user: UserParamsType;
  setAlert: (msg: any) => void;
  setCurrent: (target: UserParamsType) => void;
  setUser: (value: React.SetStateAction<any>) => void;
  onConfigOpen: (user: UserParamsType) => void;
  onCardClick?: (user: UserParamsType) => void;
}

function UserCard(props: UserCardProps) {
  const { t } = useI18n();
  const phoneStr = `${props.user.phone.substring(0, 3)} **** **${props.user.phone.substring(9)}`;
  const [once, setOnce] = useState(true);
  const [ref] = useLongPress((pos) => {
    handleSafariContextMenu(pos);
  }, 500);
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const removeUser = () => {
    const request = props.indb.transaction('user', 'readwrite').objectStore('user').delete(props.user.phone);
    request.onsuccess = () => {
      contextMenuClose();
      window.location.reload();
    };
  };

  const configureMonitor = () => {
    contextMenuClose();
    props.setCurrent(props.user);
    props.onConfigOpen(props.user);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null,
    );
  };

  const handleSafariContextMenu = (position: { x: number; y: number }) => {
    setContextMenu(
      contextMenu === null
        ? { mouseX: position.x - 2, mouseY: position.y - 4 }
        : null,
    );
  };

  const contextMenuClose = () => setContextMenu(null);

  const setMonitorState = (target: UserParamsType, value: boolean) => {
    props.setUser((prev: any) => {
      return prev.map((user: UserParamsType) => {
        if (user === target) return { ...user, monitor: value };
        return user;
      });
    });
    const request = props.indb!.transaction(['user'], 'readwrite')
      .objectStore('user')
      .put({
        phone: target.phone, fid: target.fid, vc3: target.vc3, password: target.password,
        _uid: target._uid, _d: target._d, uf: target.uf, name: target.name,
        date: new Date(), monitor: value, lv: target.lv, config: { ...target.config }
      });
    request.onerror = () => { console.log('写入失败'); };
    request.onsuccess = () => { console.log('写入成功'); };
  };

  const toggleMonitor = async () => {
    setLoading(true);
    let reqData: any, reqAPI: string;
    if (props.user.monitor) {
      reqAPI = monitor_stop_api;
    } else {
      reqAPI = monitor_start_api;
      const payload = JSON.stringify({
        credentials: {
          phone: props.user.phone, uf: props.user.uf, _d: props.user._d,
          vc3: props.user.vc3, uid: props.user._uid, lv: props.user.lv, fid: props.user.fid
        },
        config: { ...props.user.config }
      });
      reqData = enc.Utf8.parse(payload).toString(enc.Base64);
    }
    const result = await Fetch(`${reqAPI}/${props.user.phone}`, { method: 'POST', body: reqData });
    switch (result.code) {
      case 200: setMonitorState(props.user, true); break;
      case 201: setMonitorState(props.user, false); break;
      case 202:
        setMonitorState(props.user, false);
        props.setAlert({ open: true, message: '身份过期' });
    }
    setLoading(false);
  };

  const debounced = (fn: () => void, delay: number) => {
    let timeout: any = null;
    return function () {
      if (once) { fn(); setOnce(false); return; }
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(fn, delay);
    };
  };

  const debouncedSetMonitor = debounced(toggleMonitor, 500);

  const handleMonitorChange = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation();
    debouncedSetMonitor();
  };

  return (
    <Card
      sx={{
        display: 'inline-block',
        maxWidth: 345,
        minWidth: 300,
        mb: 2,
        mr: 2,
        verticalAlign: 'bottom',
        cursor: 'pointer',
      }}
      ref={ref}
      onContextMenu={handleContextMenu}
      className="glass-card"
    >
      <CardActionArea onClick={() => props.onCardClick?.(props.user)}>
        <CardContent sx={{ position: 'relative' }}>
          <Typography variant="h5" align="left" component="div">
            <span style={{ fontWeight: 600, color: 'text.primary' }}>{props.user.name}</span>
            <p>{phoneStr}</p>
          </Typography>
          <Typography sx={{ color: 'text.secondary' }} variant="body2" align="right">
            {new Date(props.user.date).toLocaleString()}
          </Typography>
          <Typography
            onClick={handleMonitorChange}
            sx={{
              position: 'absolute',
              top: 17,
              right: 32,
              px: 1,
              py: 0.3,
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '2px dashed',
              borderRadius: 1,
              cursor: 'pointer',
              borderColor: props.user.monitor ? 'success.main' : 'text.secondary',
              color: props.user.monitor ? 'success.main' : 'text.secondary',
              transition: 'all 200ms ease',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            {loading ? '...' : props.user.monitor ? 'ON' : 'OFF'}
          </Typography>
        </CardContent>
      </CardActionArea>
      <Menu
        open={contextMenu !== null}
        onClose={contextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem onClick={removeUser}>
          <ListItemIcon><Delete /></ListItemIcon>
          <ListItemText>{t('account.deleteUser')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={configureMonitor}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText>{t('account.editConfig')}</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}

export default UserCard;
