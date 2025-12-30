import path from 'path';
import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const execFileAsync = promisify(execFile);

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const readJsonBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON body');
  }
};

const parseMaybeJson = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Some CLIs may print extra logs even with --output json. Try extracting the JSON slice.
    const firstBrace = Math.min(
      ...[trimmed.indexOf('{'), trimmed.indexOf('[')].filter((n) => n >= 0),
    );
    if (!Number.isFinite(firstBrace)) return null;
    const lastBrace = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
    if (lastBrace <= firstBrace) return null;
    const slice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {
      return null;
    }
  }
};

const parseProjectRefFromSupabaseUrl = (supabaseUrl: string): string | null => {
  try {
    const url = new URL(supabaseUrl);
    const host = url.hostname.toLowerCase();
    if (!host.endsWith('.supabase.co')) return null;
    const ref = host.split('.')[0];
    return ref || null;
  } catch {
    return null;
  }
};

const pickOrgId = (orgs: any[]): string | null => {
  for (const o of orgs) {
    const id = o?.id ?? o?.org_id ?? o?.organization_id ?? o?.slug;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return null;
};

const extractProjectRef = (maybe: any): string | null => {
  const candidates = [
    maybe?.id,
    maybe?.ref,
    maybe?.project_ref,
    maybe?.projectRef,
    maybe?.project?.id,
    maybe?.project?.ref,
    maybe?.project?.project_ref,
    maybe?.project?.projectRef,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
};

const extractServiceRoleKey = (maybe: any): string | null => {
  const list = Array.isArray(maybe) ? maybe : maybe?.keys ?? maybe?.data ?? maybe?.api_keys ?? null;
  if (!Array.isArray(list)) return null;

  for (const k of list) {
    const name = String(k?.name ?? k?.role ?? k?.type ?? '').toLowerCase();
    const key = k?.key ?? k?.api_key ?? k?.apiKey ?? k?.secret ?? k?.value;
    if (typeof key === 'string' && key.trim() && name.includes('service')) return key.trim();
  }
  return null;
};

const randomToken = () => crypto.randomBytes(24).toString('base64url');

const randomPassword = () => {
  // 24 chars, mixed (safe for CLI args)
  return crypto.randomBytes(18).toString('base64url') + 'A1!';
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const openbentoSupabaseDevPlugin = (): Plugin => {
  return {
    name: 'openbento-supabase-dev',
    apply: 'serve',
    configureServer(server) {
      const cwd = server.config.root;

      const runSupabase = async (args: string[]) => {
        return execFileAsync('supabase', args, {
          cwd,
          env: process.env,
          maxBuffer: 10 * 1024 * 1024,
        });
      };

      const verifyState = async (params: { projectRef: string; adminToken?: string; serviceRoleKey: string }) => {
        const supabaseUrl = `https://${params.projectRef}.supabase.co`;
        const checks: Record<string, { ok: boolean; details?: string }> = {};

        // Table exists?
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/openbento_analytics_events?select=id&limit=1`, {
            headers: {
              apikey: params.serviceRoleKey,
              Authorization: `Bearer ${params.serviceRoleKey}`,
            },
          });
          checks.table = { ok: res.ok, details: `${res.status} ${res.statusText}` };
        } catch (e) {
          checks.table = { ok: false, details: e instanceof Error ? e.message : 'Request failed' };
        }

        // Functions deployed?
        const checkFn = async (name: string) => {
          try {
            const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, { method: 'OPTIONS' });
            checks[`fn:${name}`] = { ok: res.ok, details: `${res.status} ${res.statusText}` };
          } catch (e) {
            checks[`fn:${name}`] = { ok: false, details: e instanceof Error ? e.message : 'Request failed' };
          }
        };

        await checkFn('openbento-analytics-track');
        await checkFn('openbento-analytics-admin');

        // Admin token works?
        if (!params.adminToken) {
          checks.adminAuth = { ok: false, details: 'missing adminToken' };
        } else {
          try {
            const res = await fetch(
              `${supabaseUrl}/functions/v1/openbento-analytics-admin?siteId=${encodeURIComponent('openbento_dev')}&days=7`,
              {
                headers: { 'x-openbento-admin-token': params.adminToken },
              },
            );
            checks.adminAuth = { ok: res.ok, details: `${res.status} ${res.statusText}` };
          } catch (e) {
            checks.adminAuth = { ok: false, details: e instanceof Error ? e.message : 'Request failed' };
          }
        }

        return { supabaseUrl, checks };
      };

      server.middlewares.use(async (req, res, next) => {
        try {
          if (!req.url) return next();

          if (req.method === 'POST' && req.url === '/__openbento/supabase/setup') {
            const body = (await readJsonBody(req)) as any;
            const mode: 'existing' | 'create' = body?.mode === 'create' ? 'create' : 'existing';

            const logs: string[] = [];
            const pushLog = (line: string) => logs.push(line);

            const adminToken = typeof body?.adminToken === 'string' && body.adminToken.trim() ? body.adminToken.trim() : randomToken();
            const region = typeof body?.region === 'string' && body.region.trim() ? body.region.trim() : 'eu-west-1';

            let projectRef: string | null = null;
            let createdDbPassword: string | null = null;

            // Ensure CLI exists + login
            {
              const { stdout } = await runSupabase(['--version']);
              pushLog(`supabase ${stdout.trim()}`);
            }

            let orgs: any[] = [];
            try {
              const { stdout } = await runSupabase(['orgs', 'list', '--output', 'json']);
              const parsed = parseMaybeJson(stdout);
              orgs = Array.isArray(parsed) ? parsed : [];
            } catch {
              json(res, 401, {
                ok: false,
                error: 'Supabase CLI is not logged in. Run `supabase login` in your terminal, then retry.',
              });
              return;
            }

            if (mode === 'create') {
              const orgId = typeof body?.orgId === 'string' && body.orgId.trim() ? body.orgId.trim() : pickOrgId(orgs);
              if (!orgId) {
                json(res, 400, { ok: false, error: 'No Supabase organization found. Create one first, then retry.' });
                return;
              }

              const projectName =
                typeof body?.projectName === 'string' && body.projectName.trim()
                  ? body.projectName.trim()
                  : `openbento-analytics-${Date.now()}`;

              const dbPassword =
                typeof body?.dbPassword === 'string' && body.dbPassword.trim() ? body.dbPassword.trim() : randomPassword();

              if (!body?.dbPassword) createdDbPassword = dbPassword;

              pushLog(`Creating Supabase project "${projectName}" (${region})…`);
              const { stdout } = await runSupabase([
                'projects',
                'create',
                projectName,
                '--org-id',
                orgId,
                '--db-password',
                dbPassword,
                '--region',
                region,
                '--output',
                'json',
              ]);

              const parsed = parseMaybeJson(stdout);
              projectRef = extractProjectRef(parsed);
              if (!projectRef) {
                json(res, 500, { ok: false, error: 'Project created, but could not read project ref from CLI output.', logs, raw: stdout });
                return;
              }

              pushLog(`Project ref: ${projectRef}`);

              // Wait for API keys to be available (project warm-up)
              pushLog('Waiting for project to be ready…');
              let ready = false;
              for (let i = 0; i < 20; i++) {
                try {
                  await runSupabase(['projects', 'api-keys', '--project-ref', projectRef, '--output', 'json']);
                  ready = true;
                  break;
                } catch {
                  await sleep(6000);
                }
              }
              if (!ready) {
                json(res, 504, {
                  ok: false,
                  error: 'Project is taking too long to become ready. Wait a bit and try again.',
                  logs,
                  projectRef,
                });
                return;
              }

              // Fill dbPassword for later steps
              body.dbPassword = dbPassword;
            } else {
              projectRef =
                (typeof body?.projectRef === 'string' && body.projectRef.trim() ? body.projectRef.trim() : null) ??
                (typeof body?.supabaseUrl === 'string' && body.supabaseUrl.trim()
                  ? parseProjectRefFromSupabaseUrl(body.supabaseUrl.trim())
                  : null);

              if (!projectRef) {
                json(res, 400, {
                  ok: false,
                  error: 'Missing project ref. Provide a Supabase URL (https://<ref>.supabase.co) or a project ref.',
                });
                return;
              }
            }

            const dbPassword = typeof body?.dbPassword === 'string' && body.dbPassword.trim() ? body.dbPassword.trim() : null;
            if (!dbPassword) {
              json(res, 400, { ok: false, error: 'Database password is required to apply migrations (db push).' });
              return;
            }

            pushLog('Linking project…');
            await runSupabase(['link', '--project-ref', projectRef, '--password', dbPassword]);

            pushLog('Applying migrations (db push)…');
            await runSupabase(['db', 'push', '--password', dbPassword]);

            pushLog('Fetching service role key…');
            const apiKeysRaw = await runSupabase(['projects', 'api-keys', '--project-ref', projectRef, '--output', 'json']);
            const apiKeysJson = parseMaybeJson(apiKeysRaw.stdout);
            const serviceRoleKey = extractServiceRoleKey(apiKeysJson);
            if (!serviceRoleKey) {
              json(res, 500, { ok: false, error: 'Could not find service_role key for this project.', logs });
              return;
            }

            pushLog('Setting Edge Function secrets…');
            await runSupabase([
              'secrets',
              'set',
              `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`,
              `OPENBENTO_ANALYTICS_ADMIN_TOKEN=${adminToken}`,
            ]);

            pushLog('Deploying Edge Functions…');
            await runSupabase([
              'functions',
              'deploy',
              'openbento-analytics-track',
              '--project-ref',
              projectRef,
              '--use-api',
              '--no-verify-jwt',
            ]);
            await runSupabase([
              'functions',
              'deploy',
              'openbento-analytics-admin',
              '--project-ref',
              projectRef,
              '--use-api',
              '--no-verify-jwt',
            ]);

            pushLog('Verifying…');
            const verified = await verifyState({ projectRef, adminToken, serviceRoleKey });

            json(res, 200, {
              ok: true,
              logs,
              projectRef,
              supabaseUrl: verified.supabaseUrl,
              adminToken,
              generatedDbPassword: createdDbPassword,
              checks: verified.checks,
            });
            return;
          }

          if (req.method === 'GET' && req.url.startsWith('/__openbento/supabase/status')) {
            const u = new URL(req.url, 'http://localhost');
            const projectRef =
              u.searchParams.get('projectRef')?.trim() ||
              (u.searchParams.get('supabaseUrl')?.trim()
                ? parseProjectRefFromSupabaseUrl(u.searchParams.get('supabaseUrl')!.trim())
                : null);

            const adminToken = u.searchParams.get('adminToken')?.trim();
            if (!projectRef) {
              json(res, 400, { ok: false, error: 'Missing projectRef or supabaseUrl' });
              return;
            }

            const apiKeysRaw = await runSupabase(['projects', 'api-keys', '--project-ref', projectRef, '--output', 'json']);
            const apiKeysJson = parseMaybeJson(apiKeysRaw.stdout);
            const serviceRoleKey = extractServiceRoleKey(apiKeysJson);
            if (!serviceRoleKey) {
              json(res, 500, { ok: false, error: 'Could not find service_role key for this project.' });
              return;
            }

            const verified = await verifyState({ projectRef, adminToken: adminToken || undefined, serviceRoleKey });

            json(res, 200, {
              ok: true,
              projectRef,
              supabaseUrl: verified.supabaseUrl,
              checks: verified.checks,
              note: adminToken ? undefined : 'adminAuth check skipped (missing adminToken)',
            });
            return;
          }

          return next();
        } catch (e) {
          json(res, 500, { ok: false, error: e instanceof Error ? e.message : 'Internal error' });
          return;
        }
      });
    },
  };
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Base URL pour GitHub Pages (utilise le nom du repo)
      base: process.env.GITHUB_ACTIONS ? '/openbento/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), openbentoSupabaseDevPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
