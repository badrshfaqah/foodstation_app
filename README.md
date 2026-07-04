# فودستيشن — تطبيق الجوال

تطبيق iOS/Android (Expo + React Native + TypeScript) لعملاء فودستيشن، يتصل بمنصة الحجوزات عبر REST API مستقل (Laravel Sanctum).

هذا المستودع مستقل تماماً عن مستودع الموقع (`foodstation_laravel`) — لا يوجد أي ربط كودي بينهما، والتواصل يتم فقط عبر HTTP عبر `EXPO_PUBLIC_API_URL`. هذا يسمح مستقبلاً ببناء تطبيقات أخرى (لوحات مالكي العلامات، الفرق التشغيلية، إلخ) تتصل بنفس الـ API دون أي اعتماد على هذا المستودع.

## البدء

```bash
npm install
cp .env.example .env   # عدّل EXPO_PUBLIC_API_URL ليشير لعنوان الـ API
npx expo start
```

افتح على محاكي iOS (`i`) أو أندرويد (`a`) أو المتصفح (`w`).

## البنية

- `src/api/` — عميل HTTP (axios) وتخزين التوكن (`expo-secure-store`) ودوال الاتصال بكل مجموعة endpoints (auth، catalog، bookings)
- `src/context/auth-context.tsx` — حالة تسجيل الدخول (OTP بالجوال) على مستوى التطبيق
- `src/app/` — الشاشات (expo-router: file-based routing)
  - `(auth)/login` — تسجيل الدخول
  - `(tabs)/` — الرئيسية، حجوزاتي، حسابي
  - `brand/[slug]`, `booking/[brandSlug]/[packageId]`, `booking-detail/[id]`

## المتبقي قبل الإنتاج

- ربط مزوّد SMS حقيقي (حالياً رمز تحقق ثابت للتطوير، مطابق لآلية الموقع)
- date/time picker حقيقي في شاشة الحجز
- اختبار على محاكي/جهاز iOS و Android فعلي (تم التحقق حتى الآن عبر نسخة الويب فقط)
