import { useEffect } from "react";
import { SITE_NAME } from "./config";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Sets the title, description, Open Graph tags and robots directive for a page. */
export function usePageMeta(title: string, description?: string, opts: { noindex?: boolean } = {}) {
  useEffect(() => {
    const full = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
    document.title = full;
    setMeta("property", "og:title", full);
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }
    setMeta("name", "robots", opts.noindex ? "noindex, nofollow" : "index, follow");
    let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.rel = "canonical";
      document.head.appendChild(canon);
    }
    canon.href = window.location.origin + window.location.pathname;
  }, [title, description, opts.noindex]);
}
