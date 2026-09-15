export function contentSecurityPolicy(nonce: string, development: boolean, https = true): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' ${development ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    // Next Image and accessible popovers set dimensions as style attributes.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.googleusercontent.com",
    "font-src 'self'",
    `connect-src 'self'${development ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://www.google.com",
    ...(development || !https ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function setSecurityHeaders(
  headers: Headers,
  csp: string,
  https: boolean,
  demo: boolean,
): void {
  headers.set("Content-Security-Policy", csp);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("X-Frame-Options", "DENY");
  if (https) headers.set("Strict-Transport-Security", "max-age=31536000");
  if (demo) headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
}
