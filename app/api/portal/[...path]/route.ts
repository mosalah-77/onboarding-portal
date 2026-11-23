import { env } from 'cloudflare:workers';
import { handlePortalRequest } from '@/lib/http';
import { d1Store } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handlePortalRequest(request, { DB: env.DB, BUCKET: d1Store(env.DB), DEMO_ADMIN_TOKEN: env.DEMO_ADMIN_TOKEN });
export const POST = GET;
