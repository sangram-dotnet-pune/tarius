export const SECTION_IDS = ["home", "story", "quality", "faq", "contact"] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const HEADER_OFFSET = 96;

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value);
}

export function setHash(id: string) {
  if (typeof window === "undefined") return;
  const next =
    id && id !== "home"
      ? `${window.location.pathname}${window.location.search}#${id}`
      : `${window.location.pathname}${window.location.search}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== next) {
    window.history.replaceState(null, "", next);
  }
}

export function scrollToSection(id: string) {
  let attempts = 0;
  const tryScroll = () => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      setHash(id);
    } else if (attempts < 60) {
      attempts += 1;
      window.setTimeout(tryScroll, 50);
    }
  };
  window.setTimeout(tryScroll, 50);
}

export function scrollToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`
  );
}
