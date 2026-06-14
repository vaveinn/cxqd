import { request, cookieSerialize } from './_lib/request';
import { PPTSIGN } from './_lib/config';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

  try {
    const body = JSON.parse(await readBody(req));
    const { uf, _d, vc3, uid, fid, activeId, name, enc, lat, lon, address, altitude } = body;

    const urlParams = `${PPTSIGN}?enc=${enc}&name=${encodeURIComponent(name)}&activeId=${activeId}&uid=${uid}&clientip=&location=${encodeURIComponent(JSON.stringify({ result: '1', address: address || '', latitude: Number(lat) || -1, longitude: Number(lon) || -1, altitude: altitude || '0' }))}&latitude=-1&longitude=-1&fid=${fid}&appType=15`;
    const result = await request(urlParams, {
      headers: { Cookie: cookieSerialize({ uf, _d, vc3, _uid: uid, fid }) },
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(result.data === 'success' ? 'success' : result.data);
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
