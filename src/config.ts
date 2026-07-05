// رابط الـ API الافتراضي — عدّل هذا السطر مباشرة لتغيير أي بيئة يتصل بها التطبيق افتراضياً.
// ملاحظة: 127.0.0.1/localhost يعمل فقط من نفس الجهاز (متصفح الويب أو محاكي iOS) — لا يعمل من جوال حقيقي
// أو محاكي أندرويد (استخدم 10.0.2.2 للأخير، أو IP الشبكة للجهاز الحقيقي).
const DEFAULT_API_URL = 'http://127.0.0.1:8000/api';

// EXPO_PUBLIC_API_URL في ملف .env يطغى على القيمة أعلاه دون تعديل الكود (مفيد لو كل عضو فريق يشتغل على بيئة مختلفة).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

/** عنوان السيرفر بدون مسار /api، لبناء روابط الملفات المرفوعة (storage). */
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/** رابط سياسة الخصوصية على الموقع الرسمي (ثابت بغض النظر عن بيئة الـ API الحالية). */
export const PRIVACY_POLICY_URL = 'https://order.foodstation.sa/privacy';

const FALLBACK_COVER_IMAGE = 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80';

/** يحوّل مسار ملف مرفوع (من الموديل) لرابط كامل قابل للعرض، مع صورة افتراضية إذا ما فيه صورة. */
export function storageUrl(path: string | null | undefined): string {
  if (!path) return FALLBACK_COVER_IMAGE;
  if (path.startsWith('http')) return path;
  return `${SERVER_BASE_URL}/storage/${path}`;
}
