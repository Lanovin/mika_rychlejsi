"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("revealed");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    const observeAll = () => {
      const elements = document.querySelectorAll<HTMLElement>(".reveal-on-scroll:not(.revealed)");
      elements.forEach((element) => observer.observe(element));
    };

    // Initial sweep — synchronous so navigation never leaves content hidden behind
    // an observer that fired before the new page's DOM was attached.
    observeAll();

    // Re-observe after the next two animation frames in case streaming SSR or
    // late-mounting client components added new .reveal-on-scroll nodes.
    const raf1 = window.requestAnimationFrame(() => {
      const raf2 = window.requestAnimationFrame(observeAll);
      // Store second id so it can be cancelled too.
      (window as unknown as { __mikaRevealRaf2?: number }).__mikaRevealRaf2 = raf2;
    });

    // Safety net: if anything (hydration error, layout shift) keeps elements
    // hidden after 1.2 s, force-reveal them so users never see a blank page.
    const safetyTimer = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".reveal-on-scroll:not(.revealed)")
        .forEach((el) => el.classList.add("revealed"));
    }, 1200);

    return () => {
      window.cancelAnimationFrame(raf1);
      const raf2 = (window as unknown as { __mikaRevealRaf2?: number }).__mikaRevealRaf2;
      if (typeof raf2 === "number") window.cancelAnimationFrame(raf2);
      window.clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}