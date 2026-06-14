import { desEncrypt } from './_lib/crypto';
import { request } from './_lib/request';
import { LOGIN } from './_lib/config';

const DefaultParams = {
  fid: '-1', pid: '-1', refer: 'http%3A%2F%2Fi.chaoxing.com',
  _blank: '1', t: true, vc3: '', _uid: '', _d: '', uf: '', lv: '',
};

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

  try {
    const body = await readBody(req);
    const { phone, password } = JSON.parse(body);

    // DES encrypt password
    const encrypted = desEncrypt(password, 'u2oh6Vu^HWe40fj');

    const formdata = `uname=${phone}&password=${encrypted}&fid=-1&t=true&refer=https%253A%252F%252Fi.chaoxing.com&forbidotherlogin=0&validate=`;

    const result = await request(LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }, formdata);

    if (JSON.parse(result.data).status) {
      const cookies = result.headers['set-cookie'];
      if (!cookies) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: 'AuthFailed' }));
      }

      const cookieList = Array.isArray(cookies) ? cookies : [cookies];
      const map = new Map<string, string>();
      for (const c of cookieList) {
        const eq = c.indexOf('=');
        const semi = c.indexOf(';');
        const name = c.substring(0, eq);
        const value = c.substring(eq + 1, semi);
        map.set(name, value);
      }

      const loginResult = { ...DefaultParams, ...Object.fromEntries(map.entries()), phone };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(loginResult));
    }

    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'AuthFailed' }));
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: e.message }));
  }
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => { resolve(data); });
  });
}
