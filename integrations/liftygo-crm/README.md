# אינטגרציה עם Liftygo CRM ([Itay-binder/CRM](https://github.com/Itay-binder/CRM))

נתיב הקליטה יושב תחת `/api/ingest/...` כדי שיכבדו אוטומטית את כותרת הטננט `x-crm-tenant-database-id` (כמו בשאר נתיבי ה-ingest ב-CRM).

## מה להעתיק לריפו ה-CRM

העתק את הקובץ:

- [`app/api/ingest/call-insights/route.ts`](./app/api/ingest/call-insights/route.ts)

לתוך אותו נתיב בפרויקט [Itay-binder/CRM](https://github.com/Itay-binder/CRM).

## משתני סביבה ב-Vercel (CRM)

הוסף ל-`.env` / Vercel (אותו ערך כמו ב-Cloud Run של ה-backend):

- `CRM_HMAC_SECRET` — חתימת HMAC על גוף הבקשה (מזהה `X-Signature-SHA256`).

ה-backend כבר שולח `X-Signature-SHA256` עם אותו סוד (`CRM_HMAC_SECRET` בצד השרת).

## Firestore

מסמכים נשמרים בקולקציה `call_insights` עם מזהה מסמך = `idempotency_key` (מניעת כפילויות).

שדות `analysis` מהשרת: `summary_short`, `tab1_general_summary`, `tab2_personal_analysis`, `tab3_recommendations`, `document_markdown` (Markdown מוכן להדבקה ל-Google Docs), `confidence`.

## אפליקציית האיסוף והשרת

קוד ה-Android וה-backend המומלץ לפריסה נמצא בריפו נפרד:

- [Itay-binder/AISALESAPP](https://github.com/Itay-binder/AISALESAPP) (ריפו ריק כרגע — מתאים לדחיפת `android-app/` + `backend/` מהמונורפו המקומי)

ב-Cloud Run הגדר:

- `CRM_WEBHOOK_URL` = `https://<הדומיין של ה-CRM>/api/ingest/call-insights`
- `CRM_TENANT_DATABASE_ID` = מזהה מסד ה-Firestore של העסק (אם לא `(default)`)
