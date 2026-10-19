(() => {
  "use strict";

  const d = document;
  const root = d.documentElement;
  const PHONE = "381616669378";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  if (window.CSS && CSS.supports("animation-timeline: view()")) root.classList.add("sdt");

  /* Theme */
  const themeBtn = d.querySelector("[data-theme-toggle]");
  const systemDark = matchMedia("(prefers-color-scheme: dark)");
  const currentTheme = () => root.dataset.theme || (systemDark.matches ? "dark" : "light");
  const syncTheme = () => {
    const theme = currentTheme();
    themeBtn.setAttribute("aria-label", theme === "dark" ? "Uključi svetlu temu" : "Uključi tamnu temu");
    if (root.dataset.theme) {
      const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
      d.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
    }
  };
  themeBtn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("hm-tema", next); } catch (e) { /* storage unavailable */ }
    syncTheme();
  });
  systemDark.addEventListener("change", syncTheme);
  syncTheme();

  /* Header turns solid once the hero is behind it; mobile call bar shows between hero and contact */
  const header = d.querySelector("[data-header]");
  const hero = d.querySelector("[data-hero]");
  const bar = d.querySelector("[data-mobile-bar]");
  const contact = d.querySelector("[data-contact]");
  let heroInView = true;
  let contactInView = false;
  const syncBar = () => bar.classList.toggle("is-visible", !heroInView && !contactInView);

  new IntersectionObserver(([entry]) => {
    heroInView = entry.isIntersecting;
    header.classList.toggle("is-solid", !heroInView);
    syncBar();
  }, { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` }).observe(hero);

  new IntersectionObserver(([entry]) => {
    contactInView = entry.isIntersecting;
    syncBar();
  }, { rootMargin: "0px 0px -20% 0px" }).observe(contact);

  /* Mobile menu */
  const menu = d.querySelector("[data-menu]");
  const openBtn = d.querySelector("[data-menu-open]");
  const closeBtn = d.querySelector("[data-menu-close]");
  let lastFocus = null;
  let hideTimer = 0;

  const onMenuKey = (e) => {
    if (e.key === "Escape") { closeMenu(true); return; }
    if (e.key !== "Tab") return;
    const items = [...menu.querySelectorAll("a, button")];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  function openMenu() {
    clearTimeout(hideTimer);
    lastFocus = d.activeElement;
    menu.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    root.style.overflow = "hidden";
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("is-open")));
    closeBtn.focus();
    d.addEventListener("keydown", onMenuKey);
  }

  function closeMenu(restoreFocus) {
    menu.classList.remove("is-open");
    openBtn.setAttribute("aria-expanded", "false");
    root.style.overflow = "";
    d.removeEventListener("keydown", onMenuKey);
    hideTimer = setTimeout(() => { menu.hidden = true; }, reduceMotion.matches ? 0 : 350);
    if (restoreFocus && lastFocus) lastFocus.focus();
  }

  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", () => closeMenu(true));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(false); });
  matchMedia("(min-width: 1120px)").addEventListener("change", (e) => {
    if (e.matches && !menu.hidden) closeMenu(false);
  });

  /* Reveal on scroll */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      revealer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  d.querySelectorAll("[data-reveal], [data-observe]").forEach((el) => revealer.observe(el));

  /* Statement: wrap words so they can ink in as they scroll into view */
  const statement = d.querySelector("[data-split]");
  if (statement) {
    let index = 0;
    [...statement.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = d.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(" "); return; }
          const word = d.createElement("span");
          word.className = "word";
          word.style.setProperty("--wi", index++);
          word.textContent = part;
          frag.append(word);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.style.setProperty("--wi", index++);
      }
    });
    if (!root.classList.contains("sdt")) revealer.observe(statement);
  }

  /* Services: the sticky frame follows whichever service sits in the middle of the screen */
  const services = [...d.querySelectorAll(".svc")];
  const frames = [...d.querySelectorAll("[data-frame]")];
  const setService = (i) => {
    services.forEach((s, k) => s.classList.toggle("is-active", k === i));
    frames.forEach((f, k) => f.classList.toggle("is-active", k === i));
  };
  const serviceWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setService(services.indexOf(entry.target));
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  services.forEach((s, i) => {
    serviceWatcher.observe(s);
    s.addEventListener("focusin", () => setService(i));
  });

  /* Garage finishes */
  const finishes = [...d.querySelectorAll(".finish")];
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let hoverTimer = 0;
  const setFinish = (btn) => finishes.forEach((f) => f.setAttribute("aria-pressed", String(f === btn)));
  finishes.forEach((f) => {
    f.addEventListener("click", () => setFinish(f));
    f.addEventListener("focus", () => setFinish(f));
    f.addEventListener("pointerenter", () => {
      if (!finePointer.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => setFinish(f), 120);
    });
    f.addEventListener("pointerleave", () => clearTimeout(hoverTimer));
  });

  /* Inquiry form: validates, then hands a ready-made message to Viber, WhatsApp or SMS */
  const form = d.querySelector("[data-form]");
  const nameInput = form.elements.ime;
  const phoneInput = form.elements.telefon;
  const status = form.querySelector("[data-status]");
  const statusText = form.querySelector("[data-status-text]");

  const validName = (v) => v.trim().length >= 2;
  const validPhone = (v) => /^[\d\s+()/.-]+$/.test(v.trim()) && (v.match(/\d/g) || []).length >= 6;
  const setError = (input, invalid) => {
    input.setAttribute("aria-invalid", String(invalid));
    d.getElementById(`${input.id}-err`).hidden = !invalid;
  };
  [[nameInput, validName], [phoneInput, validPhone]].forEach(([input, check]) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") setError(input, !check(input.value));
    });
    input.addEventListener("blur", () => {
      if (input.value.trim()) setError(input, !check(input.value));
    });
  });

  d.querySelectorAll("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      const box = [...form.querySelectorAll('input[name="usluga"]')].find((b) => b.value === link.dataset.service);
      if (box) box.checked = true;
    });
  });

  const composeMessage = () => {
    const f = form.elements;
    const picked = [...form.querySelectorAll('input[name="usluga"]:checked')].map((b) => b.value);
    const lines = ["Zdravo, šaljem upit sa sajta Hausmajstor."];
    if (picked.length) lines.push(`Zanima me: ${picked.join(", ")}`);
    lines.push(`Ime: ${f.ime.value.trim()}`, `Telefon: ${f.telefon.value.trim()}`);
    if (f.mesto.value.trim()) lines.push(`Mesto: ${f.mesto.value.trim()}`);
    if (f.mere.value.trim()) lines.push(`Okvirne mere: ${f.mere.value.trim()}`);
    if (f.poruka.value.trim()) lines.push("", f.poruka.value.trim());
    return lines.join("\n");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameOk = validName(nameInput.value);
    const phoneOk = validPhone(phoneInput.value);
    setError(nameInput, !nameOk);
    setError(phoneInput, !phoneOk);
    if (!nameOk || !phoneOk) {
      status.hidden = true;
      (nameOk ? phoneInput : nameInput).focus();
      return;
    }

    const channel = (e.submitter && e.submitter.value) || "viber";
    const message = composeMessage();
    const text = encodeURIComponent(message);
    let note;

    if (channel === "whatsapp") {
      window.open(`https://wa.me/${PHONE}?text=${text}`, "_blank", "noopener");
      note = "Otvorili smo WhatsApp sa pripremljenom porukom. Proverite je i pošaljite.";
    } else if (channel === "sms") {
      window.location.href = `sms:+${PHONE}?&body=${text}`;
      note = "Otvorili smo poruke sa pripremljenim tekstom. Proverite ga i pošaljite.";
    } else {
      let copied = false;
      try { await navigator.clipboard.writeText(message); copied = true; } catch (err) { /* clipboard blocked */ }
      window.location.href = `viber://chat?number=%2B${PHONE}&draft=${text}`;
      note = copied
        ? "Otvaramo Viber. Tekst upita je kopiran, pa ga nalepite u razgovor ako se ne pojavi sam."
        : "Otvaramo Viber. Ako se tekst upita ne pojavi, ukratko ga prepišite.";
    }

    statusText.textContent = `${note} Ako se aplikacija nije otvorila, pozovite 061 666 9378.`;
    status.hidden = false;
  });

  d.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
