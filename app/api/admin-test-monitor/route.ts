import { NextRequest, NextResponse } from 'next/server';

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api').replace(/\/$/, '');
const MONITOR_SECRET = process.env.ADMIN_MONITOR_SECRET || process.env.CRON_SECRET || '';

const ACCOUNTS = {
  client: { email: 'test@evercleanapp.com', password: 'password', role: 'CLIENT' },
  pro: { email: 'evercleanpro@evercleanapp.com', password: 'password', role: 'PROFESSIONAL' },
  admin: { email: 'notifications@evercleanapp.com', password: 'password', role: 'ADMIN' },
};

type CheckResult = {
  name: string;
  ok: boolean;
  status?: number;
  ms: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data?: any;
  error?: string;
};

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text.slice(0, 500) };
  }
}

async function timed<T>(fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const data = await fn();
    return { data, ms: Date.now() - start };
  } catch (error: any) {
    return { error: error?.message || String(error), ms: Date.now() - start };
  }
}

async function login(kind: keyof typeof ACCOUNTS): Promise<CheckResult & { token?: string }> {
  const account = ACCOUNTS[kind];
  const result = await timed(async () => {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: account.email, password: account.password }),
      cache: 'no-store',
    });
    const data = await readJson(res);
    return { res, data };
  });

  if (result.error) {
    return { name: `login_${kind}`, ok: false, ms: result.ms, severity: 'CRITICAL', error: result.error };
  }

  const { res, data } = result.data as any;
  const token = data.token || data.accessToken;
  const ok = res.ok && Boolean(token) && (!data.role || data.role === account.role);

  return {
    name: `login_${kind}`,
    ok,
    status: res.status,
    ms: result.ms,
    severity: ok ? 'LOW' : 'CRITICAL',
    token,
    data: { role: data.role, email: account.email, tokenReceived: Boolean(token) },
    error: ok ? undefined : data.error || 'Token or role mismatch',
  };
}

async function apiCheck(name: string, path: string, token?: string, severity: CheckResult['severity'] = 'MEDIUM'): Promise<CheckResult> {
  const result = await timed(async () => {
    const res = await fetch(API + path, {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      cache: 'no-store',
    });
    const data = await readJson(res);
    return { res, data };
  });

  if (result.error) return { name, ok: false, ms: result.ms, severity, error: result.error };

  const { res, data } = result.data as any;
  return {
    name,
    ok: res.ok,
    status: res.status,
    ms: result.ms,
    severity: res.ok ? 'LOW' : severity,
    data,
    error: res.ok ? undefined : data.error || res.statusText,
  };
}

async function createAlert(summary: any) {
  try {
    await fetch(API + '/webhooks/n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'SYSTEM_MONITOR_FAILED',
        source: 'everclean_sentinel',
        severity: summary.severity,
        payload: {
          message: `EverClean Sentinel detected ${summary.failedCount} failed check(s)`,
          summary,
        },
      }),
      cache: 'no-store',
    });
  } catch {
    // Do not fail the monitor because alert delivery failed.
  }
}

function authorized(req: NextRequest) {
  if (!MONITOR_SECRET) return true;
  const auth = req.headers.get('authorization') || '';
  const headerSecret = req.headers.get('x-monitor-secret') || '';
  return auth === `Bearer ${MONITOR_SECRET}` || headerSecret === MONITOR_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized monitor request' }, { status: 401 });
  }

  const full = req.nextUrl.searchParams.get('full') === '1';
  const checks: CheckResult[] = [];

  const client = await login('client');
  const pro = await login('pro');
  const admin = await login('admin');
  checks.push(client, pro, admin);

  if (pro.token) checks.push(await apiCheck('messages_unread_pro', '/messages/unread', pro.token, 'MEDIUM'));
  if (admin.token) {
    checks.push(await apiCheck('admin_bookings', '/bookings?limit=5', admin.token, 'HIGH'));
    checks.push(await apiCheck('admin_professionals', '/professionals', admin.token, 'HIGH'));
    checks.push(await apiCheck('admin_alerts', '/admin/alerts', admin.token, 'MEDIUM'));
  }

  if (full && client.token && pro.token) {
    const booking = await timed(async () => {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 1);
      scheduledAt.setHours(10, 0, 0, 0);

      const res = await fetch(API + '/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + client.token },
        body: JSON.stringify({
          service_type: 'HOUSE_CLEANING',
          state: 'NJ',
          city: 'Elizabeth',
          address: '227 Magnolia Avenue',
          zip_code: '07206',
          sqft: 900,
          bedrooms: 2,
          bathrooms: 1,
          kitchens: 1,
          frequency: 'ONE_TIME',
          scheduledAt: scheduledAt.toISOString(),
          final_estimated_price: 144,
        }),
        cache: 'no-store',
      });
      const data = await readJson(res);
      return { res, data };
    });

    if (booking.error) {
      checks.push({ name: 'full_booking_create', ok: false, ms: booking.ms, severity: 'HIGH', error: booking.error });
    } else {
      const { res, data } = booking.data as any;
      const bookingId = data.id || data.booking?.id || data.data?.id;
      checks.push({
        name: 'full_booking_create',
        ok: res.ok && Boolean(bookingId),
        status: res.status,
        ms: booking.ms,
        severity: res.ok && bookingId ? 'LOW' : 'HIGH',
        data: { bookingId, response: data },
        error: res.ok && bookingId ? undefined : data.error || 'Booking ID missing',
      });

      if (bookingId) {
        checks.push(await apiCheck('full_available_jobs', '/bookings/available', pro.token, 'HIGH'));

        const claim = await timed(async () => {
          const res = await fetch(API + `/bookings/${bookingId}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + pro.token },
            body: JSON.stringify({ scheduledAt: new Date(Date.now() + 86400000).toISOString(), hourlyRate: 18 }),
            cache: 'no-store',
          });
          const data = await readJson(res);
          return { res, data };
        });
        if (claim.error) checks.push({ name: 'full_claim_job', ok: false, ms: claim.ms, severity: 'HIGH', error: claim.error });
        else {
          const { res, data } = claim.data as any;
          checks.push({ name: 'full_claim_job', ok: res.ok, status: res.status, ms: claim.ms, severity: res.ok ? 'LOW' : 'HIGH', data, error: res.ok ? undefined : data.error });
        }
      }
    }
  }

  const failed = checks.filter((c) => !c.ok);
  const severity = failed.some((c) => c.severity === 'CRITICAL')
    ? 'CRITICAL'
    : failed.some((c) => c.severity === 'HIGH')
      ? 'HIGH'
      : failed.some((c) => c.severity === 'MEDIUM')
        ? 'MEDIUM'
        : 'LOW';

  const summary = {
    ok: failed.length === 0,
    severity,
    checkedAt: new Date().toISOString(),
    mode: full ? 'full' : 'light',
    totalChecks: checks.length,
    failedCount: failed.length,
    failed: failed.map((c) => ({ name: c.name, status: c.status, severity: c.severity, error: c.error })),
    checks,
  };

  if (!summary.ok) await createAlert(summary);

  return NextResponse.json(summary, { status: summary.ok ? 200 : 207 });
}
