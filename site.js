// Small progressive enhancements. The pages read fine without any of this.
(() => {
  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Theme toggle: follows the system until the visitor picks one ---- */
  const themeButton = $(".theme-toggle");
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const labelThemeButton = () =>
    themeButton?.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
  themeButton?.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    labelThemeButton();
  });
  labelThemeButton();

  /* ---- Top bar: show the name and a rule once the visitor scrolls ---- */
  const topbar = $(".topbar");
  const onScroll = () => topbar?.classList.toggle("scrolled", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mark the section in view in the nav ---- */
  const navLinks = $$('.nav a[href^="#"]');
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          navLinks.forEach((a) =>
            a.toggleAttribute("aria-current", a.getAttribute("href") === `#${entry.target.id}`)
          );
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---- Coreference clusters in the bio ---- */
  const bio = $("#bio");
  const showAll = $("#show-all");
  if (bio) {
    const light = (cluster) => (cluster ? (bio.dataset.active = cluster) : delete bio.dataset.active);
    let pinned = null; // a tapped cluster stays lit on touch screens

    for (const mention of $$(".m", bio)) {
      const cluster = mention.dataset.c;
      mention.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && light(cluster));
      mention.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && light(pinned));
      mention.addEventListener("focus", () => light(cluster));
      mention.addEventListener("blur", () => light(pinned));
      mention.addEventListener("click", () => {
        pinned = pinned === cluster ? null : cluster;
        light(pinned);
      });
    }

    const setShowAll = (on) => {
      on ? (bio.dataset.all = "") : delete bio.dataset.all;
      showAll?.setAttribute("aria-pressed", String(on));
      if (showAll) showAll.textContent = on ? "Hide" : "Show all";
    };
    showAll?.addEventListener("click", () => setShowAll(!("all" in bio.dataset)));

    // One short demo on load, so visitors notice the phrases are interactive.
    if (!reducedMotion) {
      setTimeout(() => light("me"), 700);
      setTimeout(() => { if (bio.dataset.active === "me" && !pinned) light(null); }, 2200);
    }
  }

  /* ---- Expandable panels (abstract, BibTeX) ---- */
  for (const button of $$("[data-toggle]")) {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    });
  }

  /* ---- Copy buttons ---- */
  const toast = $(".toast");
  let toastTimer;
  const say = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  };

  for (const button of $$(".copy")) {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy ?? $("code", document.getElementById(button.dataset.copyFrom))?.textContent;
      try {
        await navigator.clipboard.writeText(text);
        say(button.dataset.copy ? "Email address copied" : "BibTeX copied");
      } catch (e) {
        say("Couldn't copy. Select the text and copy it manually.");
      }
    });
  }

  /* ---- CV: print / save as PDF ---- */
  $("#print-cv")?.addEventListener("click", () => print());
})();
