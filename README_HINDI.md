# ARUN HACKER — Vercel + Supabase (Android phone se setup)

Is project mein Vercel serverless API aur Supabase PostgreSQL database ka setup diya gaya hai. Purane local SQLite database ki zaroorat nahi hai.

## Is ZIP mein kya hai?
- `public/index.html` — website frontend
- `api/[...path].js` — register/login, number search, spam reports, favorites aur history API
- `supabase/schema.sql` — database tables banane ka SQL
- `vercel.json` — Vercel config
- `.env.example` — required environment variables ke naam (real secret nahi)

## Step 1 — Supabase database banayein
1. Browser mein https://supabase.com kholkar sign up/login karein.
2. New project banayein. Database password safe jagah note karein.
3. Project ready hone ke baad left menu mein **SQL Editor** kholein.
4. **New query** par tap karein.
5. Is repository ki `supabase/schema.sql` file kholkar poora SQL copy karein aur SQL Editor mein paste karein.
6. **Run** dabayein. Tables `app_users`, `favorites`, `searches`, `spam_reports` ban jayengi.

## Step 2 — Supabase credentials nikalein
Supabase project mein **Project Settings → API** (ya **API Keys**) kholein.
- Project URL: `SUPABASE_URL`
- `service_role` / secret server key: `SUPABASE_SERVICE_ROLE_KEY`

Service role key bahut sensitive hai. Ise website HTML, GitHub file, chat, ya kisi public jagah par paste NA karein. Sirf Vercel Environment Variables mein rakhein.

## Step 3 — GitHub par files upload karein
1. ZIP download karke phone ke Files app se Extract karein.
2. GitHub repository kholein → **Add file → Upload files**.
3. Extracted folder ke andar ki files/folders upload karein. Folder structure aisa ho:
   - `api/[...path].js`
   - `public/index.html`
   - `supabase/schema.sql`
   - `package.json`, `vercel.json`, `.gitignore`, `README_HINDI.md`, `.env.example`
4. Root par `public` aur `api` folders hone chahiye; unke andar extra outer folder nahi hona chahiye.
5. **Commit changes** dabayein.
6. Purani `server.js` file agar repository mein hai to delete kar sakte hain; is Vercel version ko uski zaroorat nahi.

## Step 4 — Vercel import aur environment variables
1. https://vercel.com par GitHub se login karein.
2. **Add New → Project** → apni repository **Import** karein.
3. Framework preset **Other** rehne dein; Build Command aur Output Directory blank/default reh sakte hain.
4. Deploy karne se pehle **Environment Variables** mein ye 3 variables add karein:
   - `SUPABASE_URL` = Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service role/secret key
   - `JWT_SECRET` = apna random secret, kam-se-kam 32 characters. Example format: `arun-` ke baad 40+ random letters/numbers; is example ko seedha use na karein.
5. Variables Production, Preview aur Development mein set karein (kam se kam Production zaroor).
6. **Deploy** dabayein. Agar baad mein environment variables badlein, Vercel mein redeploy karein.

## Step 5 — Test
Deployment URL par website kholein.
- Register: email aur 8+ character password
- Logout/login test karein
- Number search aur spam report test karein
- Login karke favorite save karein, phir refresh/login ke baad favorites/history check karein
- API health test: apne domain ke end mein `/api/health` lagayein. Response mein `ok: true` aana chahiye.

## Zaroori limitations
- Ye website kisi number ka asli naam, address, Aadhaar details, ya live location khud se nahi nikaal sakti. Caller ID ke liye authorized provider aur lawful data access chahiye.
- Call Now sirf aapke phone ka normal dialer kholta hai; webpage chupke se call nahi kar sakta.
- Spam reports user-submitted hain; unhe verified facts na samjhein.
- Publicly deploy karne se pehle spam/report endpoints ke liye rate limiting aur moderation add karna behtar hai.

Agar Supabase dashboard mein key names thode alag hon, project ka **Project URL** aur server-side **service role/secret key** hi use karein. `anon`/publishable key ko `SUPABASE_SERVICE_ROLE_KEY` mein mat daalein.
