import { env } from 'cloudflare:workers';
import { handlePortalRequest, type PortalEnv } from '@/lib/http';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handlePortalRequest(request, env as PortalEnv);
export const POST = GET;
