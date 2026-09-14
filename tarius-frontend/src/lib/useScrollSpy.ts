"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HEADER_OFFSET, SECTION_IDS, isSectionId, setHash } from "./scroll";

export function useScrollSpy() {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (pathname !== "/") {
      const reset = window.setTimeout(() => setActiveId(""), 0);
      return () => window.clearTimeout(reset);
    }

    let disposed = false;
    let frame = 0;
    let sections: HTMLElement[] = [];

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (sections.length === 0) return;

        const probe = window.scrollY + HEADER_OFFSET + 1;
        let current = sections[0].id;
        for (const section of sections) {
          if (section.offsetTop <= probe) current = section.id;
        }

        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
        if (atBottom) current = sections[sections.length - 1].id;

        setActiveId(current);
        setHash(current);
      });
    };

    const findSections = () => {
      if (disposed) return;
      sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
        (el): el is HTMLElement => Boolean(el)
      );

      if (sections.length === 0) {
        window.setTimeout(findSections, 100);
        return;
      }

      const hash = window.location.hash.replace("#", "");
      if (isSectionId(hash)) {
        window.setTimeout(() => {
          if (disposed) return;
          const el = document.getElementById(hash);
          if (!el) return;
          const top =
            el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
          window.scrollTo({ top: Math.max(top, 0), behavior: "auto" });
          onScroll();
        }, 120);
      } else {
        onScroll();
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    };

    findSections();

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return activeId;
}
