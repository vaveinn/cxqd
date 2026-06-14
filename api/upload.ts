import { request, cookieSerialize } from './_lib/request';
import { PANUPLOAD } from './_lib/config';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

  try {
    const token = new URL(req.url, 'http://localhost').searchParams.get('_token') || '';
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    await new Promise<void>((resolve) => req.on('end', resolve));
    const buffer = Buffer.concat(chunks);

    // Parse multipart form data
    const contentType: string = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'No multipart boundary' }));
    }
    const boundary = boundaryMatch[1];
    const parts = parseMultipart(buffer, boundary);

    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let fileName = '1.png';

    for (const part of parts) {
      const disposition = part.headers['content-disposition'] || '';
      const nameMatch = disposition.match(/name="([^"]+)"/);
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      if (nameMatch) {
        if (filenameMatch) {
          fileBuffer = part.data;
          fileName = filenameMatch[1];
        } else {
          fields[nameMatch[1]] = part.data.toString('utf8');
        }
      }
    }

    if (!fileBuffer) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'No file uploaded' }));
    }

    // Upload to Chaoxing
    const cookies = { uf: fields.uf, _d: fields._d, vc3: fields.vc3, _uid: fields._uid };

    // Build multipart request to Chaoxing
    const chaoxingBoundary = '----ChaoxingUpload' + Date.now();
    const CRLF = '\r\n';
    const bodyParts: Buffer[] = [];

    bodyParts.push(Buffer.from(`--${chaoxingBoundary}${CRLF}`));
    bodyParts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`));
    bodyParts.push(Buffer.from(`Content-Type: image/png${CRLF}${CRLF}`));
    bodyParts.push(fileBuffer);
    bodyParts.push(Buffer.from(`${CRLF}--${chaoxingBoundary}${CRLF}`));
    bodyParts.push(Buffer.from(`Content-Disposition: form-data; name="puid"${CRLF}${CRLF}`));
    bodyParts.push(Buffer.from(cookies._uid));
    bodyParts.push(Buffer.from(`${CRLF}--${chaoxingBoundary}--${CRLF}`));

    const multipartBody = Buffer.concat(bodyParts);

    const result = await request(
      `${PANUPLOAD}?_from=mobilelearn&_token=${token}`,
      {
        method: 'POST',
        headers: {
          'Cookie': cookieSerialize(cookies),
          'Content-Type': `multipart/form-data; boundary=${chaoxingBoundary}`,
        },
      },
      multipartBody
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(result.data);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
}

interface MultipartPart {
  headers: Record<string, string>;
  data: Buffer;
}

function parseMultipart(buffer: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const str = buffer.toString('binary');
  const boundaryDelimiter = '--' + boundary;
  const sections = str.split(boundaryDelimiter);

  for (const section of sections) {
    if (section.startsWith('--') || section.trim() === '') continue;

    const headerEnd = section.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headerSection = section.substring(0, headerEnd);
    const bodySection = section.substring(headerEnd + 4);
    // Remove trailing \r\n
    const cleanBody = bodySection.endsWith('\r\n') ? bodySection.slice(0, -2) : bodySection;

    const headers: Record<string, string> = {};
    const headerLines = headerSection.split('\r\n');
    for (const line of headerLines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        headers[line.substring(0, colonIdx).toLowerCase()] = line.substring(colonIdx + 1).trim();
      }
    }

    parts.push({ headers, data: Buffer.from(cleanBody, 'binary') });
  }

  return parts;
}
