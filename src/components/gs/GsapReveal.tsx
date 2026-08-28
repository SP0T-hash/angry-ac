"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

// Revela os filhos diretos com um stagger sutil (fade + leve subida).
// Deliberadamente contido: durações curtas, easing suave, sem movimento exagerado.
// Respeita prefers-reduced-motion (sem animação, conteúdo já visível).
export default function GsapReveal({
  children,
  className,
  stagger = 0.05,
  y = 10,
  duration = 0.5,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  as?: "div" | "section" | "ul" | "main";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(el.children) as HTMLElement[];
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(items, {
        opacity: 0,
        y,
        duration,
        ease: "power2.out",
        stagger,
        clearProps: "transform",
      });
    }, el);

    return () => ctx.revert();
  }, [stagger, y, duration]);

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref as any} className={className}>
      {children}
    </Component>
  );
}
