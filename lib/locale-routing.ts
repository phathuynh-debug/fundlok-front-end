/**
 * Which public pages have one URL per language, and how those URLs are built.
 *
 * WHY
 * The language used to be a cookie. Googlebot never sends one, so every page
 * was indexed in exactly one language, whichever was the default. Now each
 * public page has a URL per language and names the others with `hreflang`:
 *
 *   Vietnamese (default)  /rate
 *   English               /en/rate
 *
 * Vietnamese keeps the unprefixed URLs: they are the ones already indexed and
 * linked, and Vietnam is the market.
 *
 * ON THESE PAGES THE URL DECIDES THE LANGUAGE, NOT THE COOKIE. A page served
 * at /rate in English to a visitor whose cookie says "en" would contradict its
 * own canonical and hreflang. The cookie still records the visitor's choice
 * and still decides the language of everything NOT listed here (the dashboard,
 * admin, forgot-password, ...), which is not indexed and needs no second URL.
 *
 * Pure and dependency-free on purpose: proxy.ts (edge), server components, the
 * client provider and the sitemap all import it.
 */

export type RouteLocale = "vi" | "en";

export const DEFAULT_ROUTE_LOCALE: RouteLocale = "vi";

/** Prefix for the non-default language. The default has none. */
export const EN_PREFIX = "/en";

/** The visitor's explicit language choice, written only by the switcher. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Set by proxy.ts on requests for a localized page, read by the server to pick
 * the language. Overwritten there on every such request, so a client cannot
 * choose it for these pages by sending the header itself.
 */
export const LOCALE_HEADER = "x-fundlok-locale";

/** The public pages, as their default-language paths. Must match sitemap.ts. */
export const LOCALIZED_PATHS = [
  "/",
  "/why-us",
  "/rate",
  "/faq",
  "/contact",
  "/terms",
  "/login",
] as const;

export function isLocalizedPath(path: string): boolean {
  return (LOCALIZED_PATHS as readonly string[]).includes(path);
}

/**
 * The localized pages that are PRERENDERED, one build per language, under
 * app/[lang]/. Every localized page but /login, which redirects signed-in
 * visitors and so renders per request like the rest of the app.
 */
export const MARKETING_PATHS = [
  "/",
  "/why-us",
  "/rate",
  "/faq",
  "/contact",
  "/terms",
] as const;

/** The [lang] values app/[lang]/ is built for. */
export const MARKETING_LOCALES = [
  "vi",
  "en",
] as const satisfies readonly RouteLocale[];

/**
 * Internal prefix of the Vietnamese build of a marketing page. The public URL
 * has no prefix (/rate); proxy.ts rewrites it to /vi/rate, the route the page
 * was prerendered at. English needs no rewrite: /en/rate is both.
 */
export const VI_PREFIX = "/vi";

export function isMarketingPath(path: string): boolean {
  return (MARKETING_PATHS as readonly string[]).includes(path);
}

/** The app/[lang]/ route a marketing page in `locale` was prerendered at. */
export function marketingRoute(path: string, locale: RouteLocale): string {
  const prefix = locale === "en" ? EN_PREFIX : VI_PREFIX;
  return path === "/" ? prefix : `${prefix}${path}`;
}

/**
 * The public pathname for one `usePathname()` returns.
 *
 * A prerendered marketing page was built at its internal route (/vi/rate), so
 * during that build `usePathname()` returns "/vi/rate", while in the browser,
 * after proxy.ts's rewrite, it returns "/rate". Anything rendered from the raw
 * value would differ between the two and fail hydration. This maps the
 * internal form to the public one, so both sides agree.
 */
export function publicPathname(pathname: string): string {
  if (pathname !== VI_PREFIX && !pathname.startsWith(`${VI_PREFIX}/`)) {
    return pathname;
  }
  const rest = pathname.slice(VI_PREFIX.length) || "/";
  return isMarketingPath(rest) ? rest : pathname;
}

export interface ParsedLocalePath {
  /** The page's default-language path, e.g. "/rate" for "/en/rate". */
  path: string;
  /** The language the URL asks for, or null when the page is not localized. */
  locale: RouteLocale | null;
  /** True when the URL carried the /en prefix. */
  prefixed: boolean;
}

/**
 * Split a request path into page and language.
 *
 * "/en" and "/en/..." are English; anything else is the page itself. A prefixed
 * path that is NOT a localized page (e.g. /en/dashboard) comes back with
 * locale null so the caller can redirect it to the unprefixed URL.
 */
export function parseLocalePath(pathname: string): ParsedLocalePath {
  if (pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)) {
    const rest = pathname.slice(EN_PREFIX.length) || "/";
    const path =
      rest.length > 1 && rest.endsWith("/") ? rest.slice(0, -1) : rest;
    return {
      path,
      locale: isLocalizedPath(path) ? "en" : null,
      prefixed: true,
    };
  }
  return {
    path: pathname,
    locale: isLocalizedPath(pathname) ? DEFAULT_ROUTE_LOCALE : null,
    prefixed: false,
  };
}

/** The URL for `path` in `locale`. Non-localized paths come back unchanged. */
export function localizedPath(path: string, locale: RouteLocale): string {
  if (!isLocalizedPath(path) || locale === DEFAULT_ROUTE_LOCALE) return path;
  return path === "/" ? EN_PREFIX : `${EN_PREFIX}${path}`;
}

/**
 * `localizedPath` for an href that may carry a query or hash, e.g.
 * "/login?mode=register" or "/#process". External and relative hrefs are
 * returned untouched.
 */
export function localizedHref(href: string, locale: RouteLocale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const suffix = cut === -1 ? "" : href.slice(cut);
  return localizedPath(path, locale) + suffix;
}

/**
 * hreflang set for one page. `x-default` points at Vietnamese: the version for
 * a searcher whose language matches neither.
 */
export function languageAlternates(path: string): Record<string, string> {
  return {
    vi: localizedPath(path, "vi"),
    en: localizedPath(path, "en"),
    "x-default": localizedPath(path, DEFAULT_ROUTE_LOCALE),
  };
}
