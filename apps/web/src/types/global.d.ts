declare module '*.module.css';

declare module '@nuintun/qrcode';

interface UserParamsType {
  phone: string;
  password: string;
  name: string;
  fid: string;
  lv: string;
  uf: string;
  vc3: string;
  _d: string;
  _uid: string;
  date: Date;
  monitor: boolean;
  config: UserConfig;
}

interface UserConfig {
  monitor: MonitorConfig;
  mailing: MailingConfig;
  wework: WeworkBotConfig;
  /** @deprecated */
  cqserver: CQServerConfig;
}

interface AddressItem {
  lon: string;
  lat: string;
  address: string;
}

type PresetAddress = AddressItem[];

interface MonitorConfig {
  delay: number;
  presetAddress: PresetAddress;
}

interface MailingConfig {
  enabled: boolean;
  host: string;
  ssl: boolean;
  port: number;
  user: string;
  pass: string;
  to: string;
}

interface WeworkBotConfig {
  enabled: boolean;
  webhook_url: string;
}

/** @deprecated 旧版QQ机器人配置 */
interface CQServerConfig {
  cq_enabled: boolean;
  ws_url: string;
  target_type: string;
  target_id: number;
}

interface SignRecord {
  id?: number;
  phone: string;
  userName: string;
  type: string;
  otherId: number;
  activityName: string;
  status: 'success' | 'fail';
  message: string;
  timestamp: number;
}
