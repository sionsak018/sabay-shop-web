import { useEffect } from 'react';

const SITE_NAME = 'Sabay Shop';
const JSON_LD_ID = 'seo-json-ld';

function upsertMeta(attr: 'name' | 'property', key: string, content?: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function absoluteUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (typeof window === 'undefined') return value;
  return `${window.location.origin}${value.startsWith('/') ? '' : '/'}${value}`;
}

export interface SeoOptions {
  /** Page title, without the site suffix. */
  title?: string;
  description?: string;
  /** Path (e.g. `/products/12`) or absolute URL. Defaults to the current URL. */
  canonical?: string;
  image?: string | null;
  type?: 'website' | 'article' | 'product' | 'profile';
  /** Ask crawlers not to index this page (e.g. internal search results). */
  noindex?: boolean;
  /** Structured data (schema.org). */
  jsonLd?: Record<string, unknown> | null;
}

/**
 * Lightweight replacement for a head manager: keeps `document.title`, the
 * common social/SEO meta tags, the canonical link and an optional JSON-LD
 * block in sync with the current route.
 */
export function useSeo({ title, description, canonical, image, type = 'website', noindex = false, jsonLd }: SeoOptions) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', type);
    upsertMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow');
    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
    }
    const url = absoluteUrl(canonical) || window.location.href;
    upsertLink('canonical', url);
    upsertMeta('property', 'og:url', url);
    const absImage = absoluteUrl(image);
    upsertMeta('name', 'twitter:card', absImage ? 'summary_large_image' : 'summary');
    if (absImage) {
      upsertMeta('property', 'og:image', absImage);
      upsertMeta('name', 'twitter:image', absImage);
    }
  }, [title, description, canonical, image, type, noindex, jsonLdString]);

  useEffect(() => {
    let el = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
    if (jsonLdString) {
      if (!el) {
        el = document.createElement('script');
        el.id = JSON_LD_ID;
        el.type = 'application/ld+json';
        document.head.appendChild(el);
      }
      el.textContent = jsonLdString;
    } else if (el) {
      el.remove();
    }
  }, [jsonLdString]);
}
