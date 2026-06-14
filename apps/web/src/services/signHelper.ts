import { Decoder } from '@nuintun/qrcode';
import { general_api, location_api, ocr_api, photo_api, qrcode_api, upload_api, uvtoken_api } from '../config/api';
import { fetch as Fetch } from '../utils/request';

export const generalSign = async (userParams: UserParamsType, activeId: number | undefined) => {
  const result = await Fetch(general_api, {
    method: 'POST',
    body: {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid,
      fid: userParams.fid,
      activeId: activeId,
      name: userParams.name,
    },
    type: 'text'
  });
  return result;
};

export const photoSign = async (userParams: UserParamsType, activeId: number | undefined, objectId: string) => {
  const result = await Fetch(photo_api, {
    method: 'POST',
    body: {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid,
      fid: userParams.fid,
      activeId: activeId,
      name: userParams.name,
      objectId: objectId,
    },
    type: 'text'
  });
  return result;
};

export const qrcodeSign = async (userParams: UserParamsType, activeId: number | undefined, enc: string, lat: string, lon: string,
  address: string, altitude: string) => {
  const result = await Fetch(qrcode_api, {
    method: 'POST',
    body: {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid,
      fid: userParams.fid,
      activeId: activeId,
      name: userParams.name,
      enc: enc,
      lat: lat,
      lon: lon,
      address: address,
      altitude
    },
    type: 'text'
  });
  return result;
};

export const locationSign = async (
  userParams: UserParamsType,
  activeId: number | undefined,
  lat: string,
  lon: string,
  address: string
) => {
  const result = await Fetch(location_api, {
    method: 'POST',
    body: {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid,
      fid: userParams.fid,
      activeId: activeId,
      name: userParams.name,
      lat: lat,
      lon: lon,
      address: address,
    },
    type: 'text'
  });
  return result;
};

export const getuvToken = async (userParams: UserParamsType) => {
  const token = await Fetch(uvtoken_api, {
    method: 'POST',
    body: {
      uf: userParams.uf,
      _d: userParams._d,
      uid: userParams._uid,
      vc3: userParams.vc3,
    },
    type: 'json'
  });
  return token._token;
};

// Browser-based QR decode using @nuintun/qrcode
export const parseEnc = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const url = window.URL || window.webkitURL;
    const img = new Image();
    const qrcode = new Decoder();
    img.src = url.createObjectURL(file);
    qrcode
      .scan(img.src)
      .then((result: any) => {
        const enc_start = result.data.indexOf('enc=') + 4;
        const rs = result.data.substring(enc_start, result.data.indexOf('&', enc_start));
        resolve(rs);
      })
      .catch((reason: any) => {
        console.log(reason);
        resolve('识别失败');
      });
  });
};

// Decode enc from QR data URL string (for camera-based scanning)
export const parseEncFromUrl = (qrData: string): string => {
  try {
    const enc_start = qrData.indexOf('enc=') + 4;
    const enc_end = qrData.indexOf('&', enc_start);
    if (enc_end === -1) return qrData.substring(enc_start);
    return qrData.substring(enc_start, enc_end);
  } catch {
    return '';
  }
};

export const uploadFile = async (userParams: UserParamsType, inputFile: File, token: string) => {
  const data = new FormData();
  data.append('uf', userParams.uf);
  data.append('_d', userParams._d);
  data.append('_uid', userParams._uid);
  data.append('vc3', userParams.vc3);
  data.append('file', inputFile);

  const res = await Fetch(upload_api + `?_token=${token}`, {
    method: 'POST',
    body: data
  });
  return res;
};

export const showResultWithTransition = (cb_setStatus: (res: string) => void, value: string) => {
  const signBtn = document.getElementById('sign-btn') as HTMLButtonElement;
  if (signBtn) signBtn.disabled = true;
  cb_setStatus(value);
};
