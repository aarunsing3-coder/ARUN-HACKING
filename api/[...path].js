const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET;
let supabase;
function db() {
  if (!supabaseUrl || !serviceKey || !jwtSecret || jwtSecret.length < 32) {
    const err = new Error('Server setup incomplete. Add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a 32+ character JWT_SECRET in Vercel Environment Variables.');
    err.status = 503; throw err;
  }
  if (!supabase) supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return supabase;
}
function send(res, status, body) { res.status(status).json(body); }
function phoneClean(value) { return typeof value === 'string' ? value.trim().replace(/[^\d+]/g, '').slice(0, 20) : ''; }
function validPhone(phone) { const n = phone.replace(/\D/g, ''); return n.length >= 7 && n.length <= 15; }
function bearer(req) { const h = req.headers.authorization || ''; return h.startsWith('Bearer ') ? h.slice(7) : ''; }
function userFrom(req) {
  const token = bearer(req);
  if (!token) return null;
  try { return jwt.verify(token, jwtSecret); } catch { return null; }
}
function route(req) {
  const raw = req.query && req.query.path;
  const parts = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return '/' + parts.join('/');
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') { res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS'); return res.status(204).end(); }
  try {
    const supa = db();
    const path = route(req);
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (path === '/health' && req.method === 'GET') return send(res, 200, { ok: true, app: 'ARUN HACKER Call Suite', database: 'configured' });

    if (path === '/register' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'Valid email required.' });
      if (password.length < 8 || password.length > 128) return send(res, 400, { error: 'Password must be 8–128 characters.' });
      const { data: existing, error: findErr } = await supa.from('app_users').select('id').eq('email', email).maybeSingle();
      if (findErr) throw findErr;
      if (existing) return send(res, 409, { error: 'Email already registered.' });
      const hash = await bcrypt.hash(password, 12);
      const { data: user, error } = await supa.from('app_users').insert({ email, password_hash: hash }).select('id,email').single();
      if (error) { if (error.code === '23505') return send(res, 409, { error: 'Email already registered.' }); throw error; }
      const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
      return send(res, 201, { token, user });
    }

    if (path === '/login' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const { data: user, error } = await supa.from('app_users').select('id,email,password_hash').eq('email', email).maybeSingle();
      if (error) throw error;
      if (!user || !(await bcrypt.compare(password, user.password_hash))) return send(res, 401, { error: 'Email or password incorrect.' });
      const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
      return send(res, 200, { token, user: { id: user.id, email: user.email } });
    }

    if (path === '/search' && req.method === 'POST') {
      const phone = phoneClean(body.phone);
      if (!validPhone(phone)) return send(res, 400, { error: 'Enter a valid phone number (7–15 digits).' });
      const user = userFrom(req);
      if (bearer(req) && !user) return send(res, 401, { error: 'Session expired. Please log in again.' });
      const { error: insertErr } = await supa.from('searches').insert({ user_id: user ? user.id : null, phone });
      if (insertErr) throw insertErr;
      const { data: rows, error } = await supa.from('spam_reports').select('category').eq('phone', phone);
      if (error) throw error;
      const counts = {};
      (rows || []).forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
      const categories = Object.entries(counts).map(([category, count]) => ({ category, count })).sort((a,b) => b.count-a.count);
      return send(res, 200, { phone, callerId: null, callerIdMessage: 'Verified caller name is not available until an authorized Caller ID provider is connected.', spam: { reports: (rows || []).length, categories }, disclaimer: 'Results only reflect reports submitted to this website; they are not a verified identity or a guarantee.' });
    }

    if (path === '/spam-report' && req.method === 'POST') {
      const phone = phoneClean(body.phone);
      const allowed = ['Telemarketing', 'Scam suspected', 'Robocall', 'Unwanted calls'];
      const category = String(body.category || '');
      const note = String(body.note || '').trim().slice(0, 240);
      if (!validPhone(phone)) return send(res, 400, { error: 'Enter a valid phone number.' });
      if (!allowed.includes(category)) return send(res, 400, { error: 'Choose a valid report category.' });
      const { error } = await supa.from('spam_reports').insert({ phone, category, note });
      if (error) throw error;
      return send(res, 201, { ok: true, message: 'Report saved. Community-submitted reports are not independently verified.' });
    }

    const user = userFrom(req);
    if (['/favorites', '/history'].includes(path) || path.startsWith('/favorites/')) {
      if (!user) return send(res, 401, { error: 'Login required.' });
    }
    if (path === '/favorites' && req.method === 'POST') {
      const phone = phoneClean(body.phone);
      const label = String(body.label || '').trim().slice(0, 60);
      if (!validPhone(phone)) return send(res, 400, { error: 'Enter a valid phone number.' });
      const { error } = await supa.from('favorites').insert({ user_id: user.id, phone, label });
      if (error) { if (error.code === '23505') return send(res, 409, { error: 'This number is already in favorites.' }); throw error; }
      return send(res, 201, { ok: true });
    }
    if (path === '/favorites' && req.method === 'GET') {
      const { data, error } = await supa.from('favorites').select('id,phone,label,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return send(res, 200, data || []);
    }
    const favMatch = path.match(/^\/favorites\/([0-9a-f-]{36})$/i);
    if (favMatch && req.method === 'DELETE') {
      const { data, error } = await supa.from('favorites').delete().eq('id', favMatch[1]).eq('user_id', user.id).select('id');
      if (error) throw error;
      if (!data || !data.length) return send(res, 404, { error: 'Favorite not found.' });
      return send(res, 200, { ok: true });
    }
    if (path === '/history' && req.method === 'GET') {
      const { data, error } = await supa.from('searches').select('phone,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return send(res, 200, data || []);
    }
    return send(res, 404, { error: 'API route not found.' });
  } catch (e) {
    console.error('API error:', e && (e.message || e.code || e));
    const status = e.status || 500;
    return send(res, status, { error: status === 503 ? e.message : 'Server error. Check Supabase tables and Vercel environment variables.' });
  }
};
