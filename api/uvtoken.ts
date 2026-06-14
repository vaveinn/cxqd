import { request, cookieSerialize } from './_lib/request';
import { PANTOKEN } from './_lib/config';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

  try {
    const body = JSON.parse(await readBody(req));
    const { uf, _d, vc3, uid } = body;

    const result = await request(PANTOKEN, {
      headers: { Cookie: cookieSerialize({ uf, _d, vc3, _uid: uid }) },
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(result.data);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c: any) => { d += c; });
    req.on('end', () => { resolve(d); });
  });
}
