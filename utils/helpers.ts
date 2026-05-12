import { Page } from '@playwright/test';

 
export function capturePostRequests(page: Page): { urls: string[] } {
  const captured = { urls: [] as string[] };
  page.on('request', req => {
    if (req.method() === 'POST') captured.urls.push(req.url());
  });
  return captured;
}

 
export function filterProfileRequests(urls: string[]): string[] {
  const noise = [
    'firebaseremoteconfig.googleapis.com',
    'firebase.googleapis.com',
    'analytics',
    'telemetry',
    'sentry',
  ];
  return urls.filter(u => !noise.some(n => u.includes(n)));
}

export function randomEmail(): string {
  const ts = Date.now();
  return `test.user.${ts}@qa-example.com`;
}
 
export function randomPhone(): string {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

 
export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}