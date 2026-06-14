// API 路径 — 开发时走本地代理，Vercel 部署时走 Serverless Functions
const baseUrl = import.meta.env.DEV
  ? `http://${window.location.hostname}:5000`
  : '/api';

export const login_api = baseUrl + '/login';
export const activity_api = baseUrl + '/activity';
export const general_api = baseUrl + '/general';
export const photo_api = baseUrl + '/photo';
export const qrcode_api = baseUrl + '/qrcode';
export const location_api = baseUrl + '/location';
export const uvtoken_api = baseUrl + '/uvtoken';
export const upload_api = baseUrl + '/upload';
export const ocr_api = baseUrl + '/qrocr';
export const monitor_status_api = baseUrl + '/monitor/status';
export const monitor_start_api = baseUrl + '/monitor/start';
export const monitor_stop_api = baseUrl + '/monitor/stop';
