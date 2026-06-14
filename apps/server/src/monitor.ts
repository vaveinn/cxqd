import fs from 'fs';
import jsdom from 'jsdom';
import { blue, red } from 'kolorist';
import path from 'path';
import prompts from 'prompts';
import WebSocket from 'ws';
import { getPPTActiveInfo, getSignType, preSign, preSign2, speculateType } from './functions/activity';
import WeworkBot from './functions/wework';
import { GeneralSign, GeneralSign_2 } from './functions/general';
import { LocationSign, LocationSign_2 } from './functions/location';
import { getObjectIdFromcxPan, PhotoSign, PhotoSign_2 } from './functions/photo';
import { getIMParams, getLocalUsers, userLogin } from './functions/user';
import { getJsonObject, getStoredUser, storeUser } from './utils/file';
import { delay } from './utils/helper';
import { sendEmail } from './utils/mailer';
import { PromptsOptions, addressPrompts, monitorPromptsQuestions } from './configs/prompts';
const JSDOM = new jsdom.JSDOM('', { url: 'https://im.chaoxing.com/webim/me' });
(globalThis.window as any) = JSDOM.window;
(globalThis.WebSocket as any) = WebSocket;
globalThis.navigator = JSDOM.window.navigator;
globalThis.location = JSDOM.window.location;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const webIM = require('./utils/websdk3.1.4.js').default;

const WebIMConfig = {
  xmppURL: 'https://im-api-vip6-v2.easecdn.com/ws',
  apiURL: 'https://a1-vip6.easecdn.com',
  appkey: 'cx-dev#cxstudy',
  Host: 'easemob.com',
  https: true,
  isHttpDNS: false,
  isMultiLoginSessions: true,
  isAutoLogin: true,
  isWindowSDK: false,
  isSandBox: false,
  isDebug: false,
  autoReconnectNumMax: 9999,   // 24/7 无限重连
  autoReconnectInterval: 5,     // 断开后 5 秒重连
  isWebRTC: false,
  heartBeatWait: 4500,
  delivery: false,
};

const conn = new webIM.connection({
  isMultiLoginSessions: WebIMConfig.isMultiLoginSessions,
  https: WebIMConfig.https,
  url: WebIMConfig.xmppURL,
  apiUrl: WebIMConfig.apiURL,
  isAutoLogin: WebIMConfig.isAutoLogin,
  heartBeatWait: WebIMConfig.heartBeatWait,
  autoReconnectNumMax: WebIMConfig.autoReconnectNumMax,
  autoReconnectInterval: WebIMConfig.autoReconnectInterval,
  appKey: WebIMConfig.appkey,
  isHttpDNS: WebIMConfig.isHttpDNS,
});

async function configure(phone: string) {
  const config = getStoredUser(phone);
  let local = false;
  console.log(blue('自动签到支持 [普通/手势/拍照/签到码/位置]'));
  if (config?.monitor) {
    local = (
      await prompts(
        {
          type: 'confirm',
          name: 'local',
          message: '是否用本地缓存的签到信息?',
          initial: true,
        },
        PromptsOptions
      )
    ).local;
  }
  // 若不使用本地，则配置并写入本地
  if (!local) {
    const presetAddress = await addressPrompts();
    const response = await prompts(monitorPromptsQuestions, PromptsOptions);
    const monitor: any = {};
    const mailing: any = {};
    const wework: any = {};
    monitor.delay = response.delay;
    monitor.lon = response.lon;
    monitor.lat = response.lat;
    monitor.presetAddress = presetAddress;
    mailing.enabled = response.mail;
    mailing.host = response.host;
    mailing.ssl = response.ssl;
    mailing.port = response.port;
    mailing.user = response.user;
    mailing.pass = response.pass;
    mailing.to = response.to;
    wework.enabled = response.wework_enabled !== undefined ? response.wework_enabled : response.cq_enabled;
    wework.webhook_url = response.webhook_url || response.ws_url || '';
    config!.monitor = monitor;
    config!.mailing = mailing;
    config!.wework = wework;

    const data = getJsonObject('configs/storage.json');
    for (let i = 0; i < data.users.length; i++) {
      if (data.users[i].phone === phone) {
        data.users[i].monitor = monitor;
        data.users[i].mailing = mailing;
        data.users[i].wework = wework;
        break;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    fs.writeFile(path.join(__dirname, './configs/storage.json'), JSON.stringify(data), 'utf8', () => { });
  }

  return JSON.parse(JSON.stringify({ mailing: config!.mailing, monitor: config!.monitor, wework: config!.wework }));
}

async function Sign(realname: string, params: UserCookieType & { tuid: string; }, config: any, activity: Activity) {
  let result = null;
  // 群聊签到，无课程
  if (!activity.courseId) {
    const page = await preSign2({ ...activity, ...params, chatId: activity.chatId as string });
    const activityType = speculateType(page);
    switch (activityType) {
      case 'general': {
        result = await GeneralSign_2({ activeId: activity.activeId, ...params });
        break;
      }
      case 'photo': {
        const objectId = await getObjectIdFromcxPan(params);
        if (objectId === null) return null;
        result = await PhotoSign_2({ objectId, activeId: activity.activeId, ...params });
        break;
      }
      case 'location': {
        result = await LocationSign_2({
          name: realname,
          presetAddress: config.presetAddress,
          activeId: activity.activeId,
          ...params,
        });
        break;
      }
      case 'qr': {
        result = '[二维码]请发送二维码照片';
        console.log(red('二维码签到，需人工干预！'));
        break;
      }
    }
    return result;
  }

  // 课程签到
  await preSign({ ...activity, ...params });
  switch (activity.otherId) {
    case 2: {
      // 二维码签到
      result = '[二维码]请发送二维码照片';
      console.log(red('二维码签到，需人工干预！'));
      break;
    }
    case 4: {
      // 位置签到
      result = await LocationSign({
        name: realname,
        presetAddress: config.presetAddress,
        activeId: activity.activeId,
        ...params,
      });
      break;
    }
    case 3: {
      // 手势签到
      result = await GeneralSign({ name: realname, activeId: activity.activeId, ...params });
      break;
    }
    case 5: {
      // 签到码签到
      result = await GeneralSign({ name: realname, activeId: activity.activeId, ...params });
      break;
    }
    case 0: {
      if (activity.ifphoto === 0) {
        result = await GeneralSign({ name: realname, activeId: activity.activeId, ...params });
        break;
      } else {
        const objectId = await getObjectIdFromcxPan(params);
        if (objectId === null) return null;
        result = await PhotoSign({ name: realname, activeId: activity.activeId, objectId, ...params });
        break;
      }
    }
  }
  return result;
}

process.on('SIGINT', () => {
  process.exit(0);
});

// 开始运行
(async () => {
  let params: any = {};
  let config: any = {};
  // 若凭证由命令参数传来，直接解析赋值；否则，直接用户名密码登录获取凭证
  if (process.argv[2] === '--auth') {
    const auth_config = JSON.parse(Buffer.from(process.argv[4], 'base64').toString('utf8'));
    params.phone = auth_config.credentials.phone;
    params.uf = auth_config.credentials.uf;
    params._d = auth_config.credentials._d;
    params.vc3 = auth_config.credentials.vc3;
    params._uid = auth_config.credentials.uid;
    params.lv = auth_config.credentials.lv;
    params.fid = auth_config.credentials.fid;
    config.monitor = { ...auth_config.config.monitor };
    config.mailing = { ...auth_config.config.mailing };
    config.wework = auth_config.config.wework || (auth_config.config.cqserver ? { enabled: auth_config.config.cqserver.cq_enabled, webhook_url: auth_config.config.cqserver.ws_url } : {});
  } else {
    // 打印本地用户列表，并返回用户数量
    const userItem = (
      await prompts(
        { type: 'select', name: 'userItem', message: '选择用户', choices: getLocalUsers(), initial: 0 },
        PromptsOptions
      )
    ).userItem;
    // 手动登录
    if (userItem === -1) {
      const phone = (await prompts({ type: 'text', name: 'phone', message: '手机号' }, PromptsOptions)).phone;
      const password = (await prompts({ type: 'password', name: 'password', message: '密码' }, PromptsOptions)).password;
      // 登录获取各参数
      params = await userLogin(phone, password);
      if (params === 'AuthFailed') process.exit(0);
      storeUser(phone, { phone, params }); // 储存到本地
      params.phone = phone;
    } else {
      // 使用本地储存的参数
      const user = getJsonObject('configs/storage.json').users[userItem];
      params = user.params;
      params.phone = user.phone;
    }
    // 手动配置签到信息
    config = await configure(params.phone);
  }

  // 获取IM参数（带重试）
  let IM_Params: IMParamsType | 'AuthFailed';
  let imRetries = 0;
  do {
    IM_Params = await getIMParams(params as UserCookieType);
    if (IM_Params === 'AuthFailed') {
      imRetries++;
      console.log(red(`[${new Date().toLocaleString()}] 获取IM参数失败，第 ${imRetries} 次重试（5分钟后）...`));
      if (imRetries >= 144) { // 12小时仍失败则通知父进程
        if (process.send) process.send('authfail');
        imRetries = 0; // 重置计数继续重试
      }
      await delay(300); // 等5分钟再重试
    }
  } while (IM_Params === 'AuthFailed');
  params.tuid = IM_Params.myTuid;
  params.name = IM_Params.myName;

  let weworkBot: WeworkBot | null = null;
  const WEB_URL = getJsonObject('env.json').web?.url || 'http://localhost:3000';
  // 企业微信机器人：仅需 Webhook URL，无需长连接
  if (config.wework?.enabled && config.wework?.webhook_url) {
    weworkBot = new WeworkBot(config.wework.webhook_url, WEB_URL);
    console.log(blue(`[企业微信] 已配置 Webhook，面板地址: ${WEB_URL}`));
  } else if (config.cqserver?.cq_enabled && config.cqserver?.ws_url) {
    // 兼容旧版 QQ 机器人配置
    weworkBot = new WeworkBot(config.cqserver.ws_url, WEB_URL);
    console.log(blue('[企业微信] 兼容旧版配置'));
  }

  conn.open({
    apiUrl: WebIMConfig.apiURL,
    user: IM_Params.myTuid,
    accessToken: IM_Params.myToken,
    appKey: WebIMConfig.appkey,
  });

  let reconnectAttempts = 0;

  conn.listen({
    onOpened: () => {
      reconnectAttempts = 0;
      console.log(blue(`[${new Date().toLocaleString()}] 监听已连接`));
      if (process.send) process.send('success');
    },
    onClosed: () => {
      reconnectAttempts++;
      console.log(red(`[${new Date().toLocaleString()}] 连接断开，第 ${reconnectAttempts} 次重连（SDK自动重连中）...`));
      // 24/7 运行：不断开，SDK 会自动重连
      if (reconnectAttempts >= 9999) {
        console.log(red('[致命] 重连次数过多，重启进程'));
        process.exit(1);
      }
    },
    onTextMessage: async (message: any) => {
      if (message?.ext?.attachment?.att_chat_course?.url.includes('sign')) {
        const IM_CourseInfo = {
          aid: message.ext.attachment.att_chat_course.aid,
          classId: message.ext.attachment.att_chat_course?.courseInfo?.classid,
          courseId: message.ext.attachment.att_chat_course?.courseInfo?.courseid,
        };
        const PPTActiveInfo = await getPPTActiveInfo({ activeId: IM_CourseInfo.aid, ...(params as UserCookieType) });

        const signType = getSignType(PPTActiveInfo);
        const now = new Date().toLocaleString('zh-CN');

        // 签到 & 推送消息
        // 企业微信：模板卡片（带签到按钮）
        if (weworkBot) {
          weworkBot.sendTemplateCard({
            title: '📋 检测到签到活动',
            user: IM_Params.myName,
            signType,
            time: now,
            delay: config.monitor.delay,
          });
        }

        await delay(config.monitor.delay);
        const result = await Sign(IM_Params.myName, params, config.monitor, {
          classId: IM_CourseInfo.classId,
          courseId: IM_CourseInfo.courseId,
          activeId: IM_CourseInfo.aid,
          otherId: PPTActiveInfo.otherId,
          ifphoto: PPTActiveInfo.ifphoto,
          chatId: message?.to,
        });
        const resultTime = new Date().toLocaleString('zh-CN');

        // 邮件推送签到结果
        if (config.mailing?.enabled) {
          sendEmail({
            aid: IM_CourseInfo.aid,
            uid: params._uid,
            realname: IM_Params.myName,
            status: result,
            mailing: config.mailing,
          });
        }
        // 企业微信：签到结果推送（模板卡片 + 按钮）
        if (weworkBot) {
          const ok = result === 'success';
          weworkBot.sendTemplateCard({
            title: ok ? '✅ 签到成功' : '❌ 签到失败',
            user: IM_Params.myName,
            signType,
            time: resultTime,
            status: ok ? undefined : result,
            statusOk: ok,
          });
        }

      }
    },
    onError: (msg: string) => {
      console.log(red(`[${new Date().toLocaleString()}] 发生异常: ${msg}`));
      // 24/7 运行：只记录错误，不退出进程，SDK 会自动重连
    },
  });

  const hasBot = weworkBot || config.wework?.enabled || config.cqserver?.cq_enabled;
  console.log(blue(`[24/7 监听中] ${new Date().toLocaleString()} ${hasBot ? '| 企业微信已配置' : ''} ${config.mailing?.enabled ? '| 邮件已开启' : ''}`));
})();
