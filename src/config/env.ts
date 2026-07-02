// Single, explicit base URL (change this when switching environments)
// export const API_BASE_URL = 'http://192.168.184.136:5000/api';
export const API_BASE_URL = 'https://civilsadda.com/api';

export const getServerBaseUrl = () => {
  if (API_BASE_URL.endsWith('/api')) return API_BASE_URL.slice(0, -4);
  return API_BASE_URL;
};

export const resolveImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${getServerBaseUrl()}${url}`;
};

export const RAZORPAY_KEY_ID = 'rzp_live_SxXDn7VRuygfjd';

export const GOOGLE_WEB_CLIENT_ID = '325249100903-5puamtbh6v17aum7ur2s53u8as698h3u.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = '325249100903-p21f59boqqdmmoflqtivspv1ir1v3v4d.apps.googleusercontent.com';



