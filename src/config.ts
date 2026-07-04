import { Platform } from 'react-native';

// أثناء التطوير: محاكي أندرويد يحتاج 10.0.2.2 للوصول لجهاز التطوير، ومحاكي iOS يستخدم localhost.
// على جهاز حقيقي أو للإنتاج عرّف EXPO_PUBLIC_API_URL في ملف .env بعنوان السيرفر الفعلي.
const DEV_HOST = Platform.select({ android: '10.0.2.2', default: 'localhost' });

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEV_HOST}:8000/api`;
