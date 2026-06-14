type FetchType = (url: string, params?: FetchParams) => Promise<any>;
type FetchParams = {
  headers?: {
    [index: string]: any;
  };
  method?: 'POST' | 'GET';
  body?: any;
  type?: 'json' | 'text';
};

export const fetch: FetchType = (url, params = {}) => {
  !params.type && (params.type = 'json');
  !params.method && (params.method = 'GET');
  !params.headers && (params.headers = {});

  if (!params.headers['Content-Type'] && Object.prototype.toString.call(params.body) === '[object Object]') {
    params.headers['Content-Type'] = 'application/json';
    params.body = JSON.stringify(params.body);
  }

  return new Promise((resolve) => {
    globalThis.fetch(url, { ...params }).then(res => {
      const ct = res.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) return res.json();
      if (ct.includes('text/plain') || ct.includes('text/html')) return res.text();
      // Fallback: try text, then json
      return res.text().then((t: string) => {
        try { return JSON.parse(t); } catch { return t; }
      });
    }).then(val => {
      resolve(val);
    }).catch(() => {
      resolve(null);
    });
  });
};
