import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { lookup } from 'node:dns/promises';
import { existsSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ProviderInterface } from './types.js';

const execFileAsync = promisify(execFile);

const homeWrapper = join(homedir(), 'agent-browser.sh');
// Prefer the Termux wrapper (sets TMPDIR), fall back to a PATH-installed agent-browser (Linux/macOS)
const DEFAULT_BIN = existsSync(homeWrapper) ? homeWrapper : 'agent-browser';

const TMPDIR = process.env.TMPDIR || join(homedir(), 'usr', 'tmp');

// --- SSRF protection -------------------------------------------------------
// Agents must never be able to point the browser at internal infrastructure.
const PRIVATE_HOST = /^(localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|::1|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|169\.254(\.\d{1,3}){2})$/;
const PRIVATE_CIDR_172 = /^172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}$/;

function isPrivateIp(ip: string): boolean {
  const v = ip.replace(/^\[|\]$/g, '').toLowerCase();
  if (v === '::1') return true;
  if (v.includes(':')) return false; // other IPv6 - not a private v4 form
  return PRIVATE_HOST.test(v) || PRIVATE_CIDR_172.test(v);
}

async function assertPublicUrl(raw: string): Promise<string> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed');
  }
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (isPrivateIp(host)) {
    throw new Error('Blocked: private/loopback address');
  }
  try {
    const addrs = await lookup(host, { all: true });
    for (const a of addrs) {
      if (isPrivateIp(a.address)) {
        throw new Error('Blocked: host resolves to a private address');
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Blocked:')) throw e;
    // DNS failure - let the browser try; it may resolve via its own config
  }
  return u.toString();
}

// --- Concurrency -----------------------------------------------------------
// agent-browser runs a single Chromium daemon, so all calls must serialize.
let queue: Promise<unknown> = Promise.resolve();

function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

// --- Snapshot parsing ------------------------------------------------------
interface SnapElement {
  type: string;
  text: string;
  ref?: string;
  attrs?: Record<string, string>;
}

function parseSnapshot(out: string): SnapElement[] {
  const elements: SnapElement[] = [];
  // lines look like: '- heading "Example Domain" [level=1, ref=e1]'
  const re = /^\s*-\s+(\w+)\s+"((?:[^"\\]|\\.)*)"(?:\s+\[([^\]]+)\])?/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(out)) !== null) {
    const attrs: Record<string, string> = {};
    if (m[3]) {
      for (const part of m[3].split(',')) {
        const kv = part.trim().split('=');
        if (kv.length === 2) attrs[kv[0].trim()] = kv[1].trim();
      }
    }
    elements.push({ type: m[1], text: m[2], ref: attrs['ref'], attrs });
  }
  return elements;
}

// --- Provider --------------------------------------------------------------
export class BrowserProvider implements ProviderInterface {
  name = 'browser';
  private bin: string;
  private timeoutMs: number;

  constructor(bin: string = process.env.AGENT_BROWSER_BIN || DEFAULT_BIN, timeoutMs = 90000) {
    this.bin = bin;
    this.timeoutMs = timeoutMs;
  }

  async handle(action: string, params: any): Promise<any> {
    switch (action) {
      case 'open':
        return serialized(() => this.open(params?.url));
      case 'snapshot':
        return serialized(() => this.snapshot(!!params?.interactive));
      case 'click':
        return serialized(() => this.click(params?.ref));
      case 'fill':
        return serialized(() => this.fill(params?.ref, params?.value));
      case 'extract':
        return serialized(() => this.extract(params?.script));
      case 'screenshot':
        return serialized(() => this.screenshot());
      case 'close':
        return serialized(() => this.close());
      default:
        throw new Error(`Unknown browser action: ${action}`);
    }
  }

  private async run(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.bin, args, {
        timeout: this.timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, TMPDIR },
      });
      return stdout;
    } catch (e: any) {
      const msg = (e?.stderr || e?.stdout || e?.message || '').toString().trim();
      throw new Error(`agent-browser failed: ${msg.slice(0, 500)}`);
    }
  }

  private async open(url: string) {
    if (!url) throw new Error('url is required');
    const safeUrl = await assertPublicUrl(url);
    const out = await this.run(['open', safeUrl]);
    return { ok: true, url: safeUrl, note: out.trim().slice(0, 300) };
  }

  private async snapshot(interactive: boolean) {
    const out = await this.run(interactive ? ['snapshot', '-i'] : ['snapshot']);
    return { elements: parseSnapshot(out), raw: out.slice(0, 8000) };
  }

  private async click(ref: string) {
    if (!ref || !/^@?e\d+$/.test(ref)) throw new Error('ref must be like @e1');
    const out = await this.run(['click', ref]);
    return { ok: true, note: out.trim().slice(0, 300) };
  }

  private async fill(ref: string, value: string) {
    if (!ref || !/^@?e\d+$/.test(ref)) throw new Error('ref must be like @e1');
    if (value === undefined) throw new Error('value is required');
    // --value handles long/multiline content without shell-quoting issues
    const args = value.length > 200 ? ['fill', ref, '--value', String(value)] : ['fill', ref, String(value)];
    const out = await this.run(args);
    return { ok: true, note: out.trim().slice(0, 300) };
  }

  private async extract(script: string) {
    if (!script) throw new Error('script is required');
    const out = await this.run(['eval', script]);
    try {
      return { ok: true, data: JSON.parse(out) };
    } catch {
      return { ok: true, text: out.slice(0, 10000) };
    }
  }

  private async screenshot() {
    const path = join(tmpdir(), `agentcart-${Date.now()}.png`);
    try {
      await this.run(['screenshot', path]);
      const buf = await readFile(path);
      if (buf.length > 3 * 1024 * 1024) throw new Error('screenshot too large');
      return { ok: true, format: 'png', base64: buf.toString('base64'), bytes: buf.length };
    } finally {
      unlink(path).catch(() => undefined);
    }
  }

  private async close() {
    await this.run(['close']);
    return { ok: true };
  }
}
