import Router from '@koa/router';
import { ChildProcess, fork } from 'child_process';
import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import multiparty from 'multiparty';
import serverless from 'serverless-http';
import { preSign, traverseCourseActivity } from './functions/activity';
import { GeneralSign } from './functions/general';
import { LocationSign } from './functions/location';
import { PhotoSign, uploadPhoto } from './functions/photo';
import { QRCodeSign } from './functions/qrcode';
import { QrCodeScan } from './functions/tencent.qrcode';
import { getAccountInfo, getCourses, getPanToken, userLogin } from './functions/user';
import { getJsonObject } from './utils/file';
const ENVJSON = getJsonObject('env.json');

const app = new Koa();
const router = new Router();
const processMap = new Map<string, ChildProcess>();

router.get('/', async (ctx) => {
  ctx.body = '<h1 style="text-align: center">Welcome, chaoxing-sign-cli API service is running.</h1>';
});

router.post('/login', async (ctx) => {
  const { phone, password } = ctx.request.body as any;
  const params = await userLogin(phone, password);
  // 登陆失败
  if (typeof params === 'string') {
    ctx.body = params;
    return;
  }
  params.name = (await getAccountInfo(params)) || '获取失败';
  console.log(ctx.request.body);
  ctx.body = params;
});

router.post('/activity', async (ctx) => {
  const { uid, _d, vc3, uf } = ctx.request.body as any;
  const courses = await getCourses(uid, _d, vc3);
  // 身份凭证过期
  if (typeof courses === 'string') {
    ctx.body = courses;
    return;
  }
  const activity = await traverseCourseActivity({
    courses,
    uf: uf,
    _d: _d,
    _uid: uid,
    vc3: vc3,
  });
  // 无活动
  if (typeof activity === 'string') {
    ctx.body = activity;
    return;
  }
  // 对活动进行预签
  await preSign({
    uf,
    _d,
    vc3,
    _uid: uid,
    ...activity,
  });
  console.log(uid);
  ctx.body = activity;
});

router.post('/qrcode', async (ctx) => {
  const { name, fid, uid, activeId, uf, _d, vc3, enc, lat, lon, address, altitude } = ctx.request.body as any;
  const res = await QRCodeSign({
    enc,
    name,
    fid,
    _uid: uid,
    activeId,
    uf,
    _d,
    vc3,
    lat,
    lon,
    address,
    altitude
  });
  console.log(name, uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/location', async (ctx) => {
  const { uf, _d, vc3, name, uid, lat, lon, fid, address, activeId } = ctx.request.body as any;
  const res = await LocationSign({
    uf,
    _d,
    vc3,
    name,
    address,
    activeId,
    _uid: uid,
    lat,
    lon,
    fid,
  });
  console.log(name, uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/general', async (ctx) => {
  const { uf, _d, vc3, name, activeId, uid, fid } = ctx.request.body as any;
  const res = await GeneralSign({
    uf,
    _d,
    vc3,
    name,
    activeId,
    _uid: uid,
    fid,
  });
  console.log(name, uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/uvtoken', async (ctx) => {
  const { uf, _d, uid, vc3 } = ctx.request.body as any;
  const res = await getPanToken({
    uf,
    _d,
    _uid: uid,
    vc3,
  });
  ctx.body = JSON.parse(res); // 获得的是个JSON字符串，需转换
});

router.post('/upload', async (ctx) => {
  const form = new multiparty.Form();
  const fields: any = {};
  const data: any[] = [];

  const result = await new Promise((resolve) => {
    // 解析到part时，判断是否为文件
    form.on('part', (part: any) => {
      if (part.filename !== undefined) {
        // 存入data数组
        part.on('data', (chunk: any) => {
          data.push(chunk);
        });
        // 存完继续
        part.on('close', () => {
          part.resume();
        });
      }
    });
    // 解析遇到文本时
    form.on('field', (name: string, str: string) => {
      fields[name] = str;
    });
    // 解析完成后
    form.on('close', async () => {
      const buffer = Buffer.concat(data);
      const res = await uploadPhoto({
        uf: fields['uf'],
        _d: fields['_d'],
        _uid: fields['_uid'],
        vc3: fields['vc3'],
        token: ctx.query._token as string,
        buffer,
      });
      resolve(res);
      // console.log(res);
    });
    // 解析请求表单
    form.parse(ctx.req);
  });
  ctx.body = result;
});

router.post('/photo', async (ctx) => {
  const { uf, _d, uid, vc3, name, activeId, fid, objectId } = ctx.request.body as any;
  const res = await PhotoSign({
    uf,
    _d,
    vc3,
    name,
    activeId,
    _uid: uid,
    fid,
    objectId,
  });
  console.log(name, uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/qrocr', async (ctx) => {
  const form = new multiparty.Form();
  const data: any[] = [];
  const result = await new Promise((resolve) => {
    form.on('part', (part: any) => {
      if (part.filename !== undefined) {
        part.on('data', (chunk: any) => {
          data.push(chunk);
        });
        part.on('close', () => {
          part.resume();
        });
      }
    });
    form.on('close', async () => {
      const buffer = Buffer.concat(data);
      const base64str = buffer.toString('base64');
      let res: any;
      try {
        res = await QrCodeScan(base64str, 'base64');
        const url = res.CodeResults[0].Url;
        const enc_start = url.indexOf('enc=') + 4;
        const result = url.substring(enc_start, url.indexOf('&', enc_start));
        resolve(result);
      } catch (error) {
        resolve('识别失败');
      }
    });
    form.parse(ctx.req);
  });
  ctx.body = result;
});

// 200:监听中，201:未监听，202:登录失败
router.get('/monitor/status/:phone', (ctx) => {
  // 状态为正在监听
  if (processMap.get(ctx.params.phone)) {
    ctx.body = { code: 200, msg: 'Monitoring' };
  } else {
    ctx.body = { code: 201, msg: 'Suspended' };
  }
});

router.post('/monitor/stop/:phone', (ctx) => {
  const phone = ctx.params.phone;
  const process_monitor = processMap.get(phone);
  if (process_monitor !== undefined) {
    process_monitor.kill('SIGKILL');
    processMap.delete(phone);
  }
  ctx.body = { code: 201, msg: 'Suspended' };
});

// base64字串需包含 credentials, monitor, mailing, wework 内容
router.post('/monitor/start/:phone', async (ctx) => {
  if (processMap.get(ctx.params.phone) !== undefined) {
    ctx.body = { code: 200, msg: 'Already started' };
    return;
  }
  const process_monitor = fork(process.argv[1].endsWith('ts') ? 'monitor.ts' : 'monitor.js',
    ['--auth', ctx.params.phone, ctx.request.rawBody],
    {
      cwd: __dirname,
      detached: false,
      stdio: [null, null, null, 'ipc'],
    }
  );
  const response = await new Promise((resolve) => {
    process_monitor.on('message', (msg) => {
      switch (msg) {
        case 'success': {
          processMap.set(ctx.params.phone, process_monitor);
          resolve({ code: 200, msg: 'Started Successfully' });
          break;
        }
        case 'authfail': {
          resolve({ code: 202, msg: 'Authencation Failed' });
          break;
        }
        case 'notconfigured': {
          resolve({ code: 203, msg: 'Not Configured' });
          break;
        }
      }
    });
  });
  ctx.body = response;
});

app.use(bodyparser({ enableTypes: ['json', 'form', 'text'] }));
app.use(async (ctx, next) => {
  await next();
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  if (ctx.method === 'OPTIONS') {
    ctx.set('Access-Control-Max-Age', '300');
    ctx.body = '';
  }
});
app.use(router.routes());

// Ctrl + C 终止程序
process.on('SIGINT', () => {
  processMap.forEach((pcs) => {
    pcs.kill('SIGINT');
  });
  process.exit();
});

// 若在服务器，直接运行
if (!ENVJSON.env.SERVERLESS)
  app.listen(5000, () => {
    console.log('API Server: http://localhost:5000');
    // 24/7 全自动：启动时自动为所有已配置用户开启监听
    autoStartAllMonitors();
  });

/** 24/7 全自动监听：服务启动时自动为所有已存储且有配置的用户启动监听 */
async function autoStartAllMonitors() {
  const data = getJsonObject('configs/storage.json');
  const users = data.users || [];
  if (users.length === 0) {
    console.log('[自动监听] 无已存储用户，跳过自动启动');
    return;
  }
  console.log(`[自动监听] 检测到 ${users.length} 个用户，开始自动启动监听...`);
  for (const user of users) {
    const phone = user.phone;
    // 跳过已在监听中的用户
    if (processMap.has(phone)) {
      console.log(`[自动监听] ${phone} 已在监听中，跳过`);
      continue;
    }
    // 检查是否有配置
    if (!user.monitor && !user.config?.monitor) {
      console.log(`[自动监听] ${phone} 未配置监听信息，跳过`);
      continue;
    }
    try {
      // 构建认证信息
      const payload = JSON.stringify({
        credentials: {
          phone: user.phone || user.params?.phone,
          uf: user.params?.uf,
          _d: user.params?._d,
          vc3: user.params?.vc3,
          uid: user.params?._uid,
          lv: user.params?.lv,
          fid: user.params?.fid,
        },
        config: user.config || { monitor: user.monitor, mailing: user.mailing, cqserver: user.cqserver },
      });
      const base64Payload = Buffer.from(payload).toString('base64');

      const process_monitor = fork(
        'monitor.js',
        ['--auth', phone, base64Payload],
        {
          cwd: __dirname,
          detached: false,
          stdio: [null, null, null, 'ipc'],
        }
      );

      const result = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`[自动监听] ${phone} 启动超时`);
          resolve(false);
        }, 30000);

        process_monitor.on('message', (msg) => {
          clearTimeout(timeout);
          if (msg === 'success') {
            processMap.set(phone, process_monitor);
            console.log(`[自动监听] ${phone} 监听已启动`);
            resolve(true);
          } else {
            console.log(`[自动监听] ${phone} 启动失败: ${msg}`);
            resolve(false);
          }
        });

        process_monitor.on('exit', (code) => {
          clearTimeout(timeout);
          processMap.delete(phone);
          console.log(`[自动监听] ${phone} 进程退出 (code: ${code})，30秒后重试...`);
          // 进程退出后自动重启
          setTimeout(() => {
            if (!processMap.has(phone)) {
              restartSingleMonitor(phone);
            }
          }, 30000);
        });
      });

      if (!result) {
        process_monitor.kill('SIGKILL');
      }
    } catch (e) {
      console.log(`[自动监听] ${phone} 启动异常: ${e}`);
    }
  }
  console.log('[自动监听] 全部用户启动完成');
}

/** 重启单个用户的监听进程 */
async function restartSingleMonitor(phone: string) {
  const data = getJsonObject('configs/storage.json');
  const user = data.users?.find((u: any) => u.phone === phone);
  if (!user) return;

  console.log(`[自动重启] 正在重启 ${phone} 的监听...`);
  try {
    const payload = JSON.stringify({
      credentials: {
        phone: user.phone || user.params?.phone,
        uf: user.params?.uf,
        _d: user.params?._d,
        vc3: user.params?.vc3,
        uid: user.params?._uid,
        lv: user.params?.lv,
        fid: user.params?.fid,
      },
      config: user.config || { monitor: user.monitor, mailing: user.mailing, cqserver: user.cqserver },
    });
    const base64Payload = Buffer.from(payload).toString('base64');

    const process_monitor = fork(
      'monitor.js',
      ['--auth', phone, base64Payload],
      {
        cwd: __dirname,
        detached: false,
        stdio: [null, null, null, 'ipc'],
      }
    );

    const result = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 30000);
      process_monitor.on('message', (msg) => {
        clearTimeout(timeout);
        if (msg === 'success') {
          processMap.set(phone, process_monitor);
          resolve(true);
        }
        resolve(false);
      });
      process_monitor.on('exit', (code) => {
        clearTimeout(timeout);
        processMap.delete(phone);
        console.log(`[自动重启] ${phone} 再次退出 (code: ${code})，30秒后再试...`);
        setTimeout(() => {
          if (!processMap.has(phone)) restartSingleMonitor(phone);
        }, 30000);
      });
    });

    if (result) {
      console.log(`[自动重启] ${phone} 重启成功`);
    } else {
      console.log(`[自动重启] ${phone} 重启失败，30秒后重试`);
      process_monitor.kill('SIGKILL');
      setTimeout(() => restartSingleMonitor(phone), 30000);
    }
  } catch (e) {
    console.log(`[自动重启] ${phone} 异常: ${e}`);
  }
}

// 导出云函数
export const main = serverless(app);
export const handler = main;
export const main_handler = main;
