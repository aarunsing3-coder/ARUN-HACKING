# ARUN HACKER LINKVERSE PRO

## Features included
- URL/text to QR code and PNG download
- Scan QR from an uploaded image
- Image resize and export to JPG, PNG, WebP
- Multiple paper photos combined into a multi-page PDF
- Basic grayscale/high-contrast enhancement
- Optional best-effort OCR (internet required; handwriting accuracy is not guaranteed)

## Deploy using Android + GitHub + Vercel
1. Extract this ZIP on your phone.
2. Upload `public/index.html`, `package.json`, `vercel.json`, and `README_HINDI.md` to the root of your GitHub repository. Keep `index.html` inside the `public` folder.
3. Import the repository into Vercel and deploy.
4. Open the website and test QR generation, QR scan, image conversion, and PDF creation.

## Cloud upload / link shortener status
Cloud file upload and real short links are intentionally shown as not configured. A real file-to-link service requires a storage provider and a secure backend API, with validation, size limits, and abuse prevention. A public Project URL alone is not enough. Never put a Supabase service-role/secret key in frontend JavaScript or GitHub. Configure secrets only in Vercel Environment Variables and implement the server-side endpoint before enabling upload buttons.

## Notes
- QR/PDF libraries are loaded from public CDNs; an internet connection is needed.
- OCR is best-effort and may fail to recognize handwriting, especially Hindi.
- Do not upload confidential documents to public file storage.
