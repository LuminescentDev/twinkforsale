type RevealKind = "rise" | "slide" | "media" | "tilt" | "drop" | "wordmark" | "draw" | "fill";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_OVERSHOOT = "cubic-bezier(0.34, 1.4, 0.64, 1)";

function keyframesFor(element: Element, kind: RevealKind): { frames: Keyframe[]; options: KeyframeAnimationOptions } {
  // Animate towards the element's resting transform so rotated or offset
  // elements (the tilt card) land exactly where CSS places them.
  const rest = getComputedStyle(element).transform;
  const end = rest === "none" ? "none" : rest;
  const delay = Math.min(Number((element as HTMLElement).dataset.revealDelay ?? 0), 240);

  switch (kind) {
    case "slide":
      return {
        frames: [{ opacity: 0, transform: "translateX(32px)" }, { opacity: 1, transform: end }],
        options: { duration: 550, easing: EASE_OUT, delay },
      };
    case "media":
      return {
        frames: [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: end }],
        options: { duration: 600, easing: EASE_OUT, delay },
      };
    case "tilt":
      return {
        frames: [
          { opacity: 0, transform: "translateY(24px) rotate(0deg)" },
          { opacity: 1, transform: "translateY(0) rotate(0deg)", offset: 0.45 },
          { opacity: 1, transform: end },
        ],
        options: { duration: 900, easing: EASE_OVERSHOOT, delay },
      };
    case "drop":
      return {
        frames: [{ opacity: 0, transform: "translateY(-16px)" }, { opacity: 1, transform: end }],
        options: { duration: 550, easing: EASE_OUT, delay },
      };
    case "wordmark":
      return {
        frames: [{ opacity: 0, transform: "translateY(40%)" }, { opacity: 1, transform: end }],
        options: { duration: 700, easing: EASE_OUT, delay },
      };
    case "draw": {
      const length = (element as SVGPathElement).getTotalLength?.() ?? 1000;
      return {
        frames: [
          { strokeDasharray: `${length}`, strokeDashoffset: `${length}` },
          { strokeDasharray: `${length}`, strokeDashoffset: "0" },
        ],
        options: { duration: 700, easing: "cubic-bezier(0.65, 0, 0.35, 1)", delay },
      };
    }
    case "fill":
      return {
        frames: [{ transform: "scaleX(0.04)" }, { transform: end }],
        options: { duration: 500, easing: "cubic-bezier(0.65, 0, 0.35, 1)", delay },
      };
    default:
      return {
        frames: [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: end }],
        options: { duration: 600, easing: EASE_OUT, delay },
      };
  }
}

/**
 * Play each `[data-reveal]` group once as it nears the viewport. CSS keeps
 * every element in its final state; only elements still below the viewport
 * at install time are prepared, so nothing already visible is ever hidden.
 */
export function installReveals(root: ParentNode = document): () => void {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new Map<Element, Animation>();
  const elements = [...root.querySelectorAll<HTMLElement | SVGElement>("[data-reveal]")];

  const finish = (element: HTMLElement | SVGElement) => {
    element.dataset.revealPlayed = "true";
    animations.get(element)?.cancel();
    animations.delete(element);
  };

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const element = entry.target as HTMLElement | SVGElement;
              observer?.unobserve(element);
              element.dataset.revealPlayed = "true";
              if (reduced.matches || document.visibilityState === "hidden" || entry.boundingClientRect.bottom <= 0) {
                finish(element);
              } else {
                animations.get(element)?.play();
              }
            }
          },
          { threshold: 0, rootMargin: "0px 0px 96px 0px" },
        )
      : undefined;

  // A fast scroll can jump past an element without it ever intersecting.
  // Anything already above the viewport is settled so it is never left hidden.
  let frame = 0;
  const settlePassed = () => {
    frame = 0;
    for (const [element] of animations) {
      if (element.getBoundingClientRect().bottom <= 0) {
        observer?.unobserve(element);
        finish(element as HTMLElement | SVGElement);
      }
    }
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(settlePassed);
  };
  addEventListener("scroll", onScroll, { passive: true });

  const stop = () => {
    observer?.disconnect();
    removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
    elements.forEach(finish);
  };
  const onPreference = () => {
    if (reduced.matches) stop();
  };
  reduced.addEventListener("change", onPreference);

  for (const element of elements) {
    if (element.dataset.revealPlayed === "true") continue;
    const rect = element.getBoundingClientRect();
    if (
      reduced.matches ||
      !observer ||
      !element.animate ||
      rect.top < innerHeight ||
      document.visibilityState === "hidden"
    ) {
      finish(element);
      continue;
    }
    const { frames, options } = keyframesFor(element, (element.dataset.reveal as RevealKind) || "rise");
    const animation = element.animate(frames, { ...options, fill: "backwards" });
    animation.pause();
    animation.onfinish = () => finish(element);
    animations.set(element, animation);
    observer.observe(element);
  }

  return () => {
    stop();
    reduced.removeEventListener("change", onPreference);
  };
}
