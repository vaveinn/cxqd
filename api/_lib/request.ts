import https from 'https';
import http from 'http';

export interface RequestOptions {
  headers?: Record<string, string>;
  method?: string;
}

export interface ResponseType {
  data: string;
  headers: Record<string, string | string[] | undefined>;
  statusCode?: number;
}

/** Make an HTTP request (works in Vercel serverless) */
export function request(url: string, options: RequestOptions = {}, payload?: any): Promise<ResponseType> {
  options.method = options.method || 'GET';
  const protocol = url.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    let data = '';
    const req = protocol.request(url, { headers: options.headers, method: options.method }, (res) => {
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        resolve({ data, headers: res.headers as Record<string, string | string[] | undefined>, statusCode: res.statusCode });
      });
      res.on('error', reject);
    });

    req.on('error', reject);

    if (options.method === 'POST' && payload) {
      if (typeof payload === 'object') req.write(JSON.stringify(payload));
      else req.write(payload);
    }
    req.end();
  });
}

/** Serialize cookie params into a cookie header string */
export function cookieSerialize(args: Record<string, string | undefined>): string {
  const parts: string[] = [];
  if (args.fid) parts.push(`fid=${args.fid}`);
  if (args.uf) parts.push(`uf=${args.uf}`);
  if (args._d) parts.push(`_d=${args._d}`);
  const uid = args._uid || args.UID;
  if (uid) parts.push(`UID=${uid}`);
  if (args.vc3) parts.push(`vc3=${args.vc3}`);
  return parts.join('; ');
}
