/**
 * BLUEPRINTS TECHNOLOGY LIMITED
 * Main JavaScript v2.0 — Modern Interactions & Animations
 */

(function () {
  "use strict";

  // ============================================
  // PAGE LOADER
  // ============================================

  const pageLoader = document.getElementById("pageLoader");

  function hideLoader() {
    document.body.classList.add("page-ready");
    if (pageLoader) pageLoader.classList.add("hidden");
  }

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader);
  }

  // ============================================
  // INTERSECTION OBSERVER — SCROLL REVEAL
  // ============================================

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  document
    .querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale, .scroll-reveal")
    .forEach((el) => revealObserver.observe(el));

  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================

  const header = document.querySelector(".site-header");
  let lastScroll = 0;

  function handleHeaderScroll() {
    if (!header) return;
    const scrollY = window.scrollY;
    header.classList.toggle("scrolled", scrollY > 30);
    lastScroll = scrollY;
  }

  window.addEventListener("scroll", handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // ============================================
  // MOBILE MENU TOGGLE
  // ============================================

  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const navMenu = document.querySelector(".nav-menu");

  function closeMobileMenu() {
    if (!mobileMenuToggle || !navMenu) return;
    navMenu.classList.remove("active");
    mobileMenuToggle.classList.remove("is-open");
    mobileMenuToggle.setAttribute("aria-expanded", "false");
  }

  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle("active");
      mobileMenuToggle.classList.toggle("is-open", isOpen);
      mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          closeMobileMenu();
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 768 &&
        navMenu.classList.contains("active") &&
        !navMenu.contains(e.target) &&
        !mobileMenuToggle.contains(e.target)
      ) {
        closeMobileMenu();
      }
    });
  }

  // ============================================
  // ACTIVE NAVIGATION LINK
  // ============================================

  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (
      href === currentPage ||
      (currentPage === "" && href === "index.html")
    ) {
      link.classList.add("active");
    }
  });

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href && href !== "#") {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerHeight = header ? header.offsetHeight : 0;
          const targetPosition =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            headerHeight -
            20;
          window.scrollTo({ top: targetPosition, behavior: "smooth" });
        }
      }
    });
  });

  // ============================================
  // HERO STAT COUNTER ANIMATION
  // ============================================

  const statNumbers = document.querySelectorAll(".hero-stat-number");

  if (statNumbers.length > 0) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNumbers.forEach((el) => statObserver.observe(el));
  }

  function animateCounter(el) {
    const text = el.textContent.trim();
    const match = text.match(/^([\d.]+)(.*)$/);
    if (!match) return;

    const endValue = parseFloat(match[1]);
    const suffix = match[2];
    const duration = 1800;
    const startTime = performance.now();
    const isDecimal = text.includes(".");

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = endValue * eased;

      el.textContent = (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ============================================
  // HERO DIAGRAM — NETWORK SIGNAL ANIMATION
  // ============================================

  (function initNetworkFlow() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    const heroDiagram = document.querySelector(".hero-diagram");
    if (!heroDiagram) return;

    const svg =
      heroDiagram.tagName.toLowerCase() === "svg"
        ? heroDiagram
        : heroDiagram.querySelector("svg");
    if (!svg) return;

    const nodeEls = [...svg.querySelectorAll("[data-id]")];
    const lineEls = [...svg.querySelectorAll("line[data-from][data-to]")];
    if (nodeEls.length < 2 || lineEls.length < 1) return;

    function getNodeCenter(el) {
      if (el.tagName.toLowerCase() === "circle") {
        return { x: Number(el.getAttribute("cx")), y: Number(el.getAttribute("cy")) };
      }
      const dx = el.getAttribute("data-x");
      const dy = el.getAttribute("data-y");
      if (dx !== null && dy !== null) return { x: Number(dx), y: Number(dy) };
      const bbox = el.getBBox();
      return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
    }

    const nodes = new Map();
    nodeEls.forEach((el) => {
      const id = el.dataset.id;
      if (!id) return;
      const { x, y } = getNodeCenter(el);
      nodes.set(id, { el, x, y });
    });

    const edges = new Map();
    const adj = new Map();
    const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

    lineEls.forEach((line) => {
      const a = line.dataset.from;
      const b = line.dataset.to;
      if (!a || !b || !nodes.has(a) || !nodes.has(b)) return;
      edges.set(key(a, b), line);
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a).add(b);
      adj.get(b).add(a);
    });

    const nodeIds = [...nodes.keys()];
    if (nodeIds.length < 2) return;

    function randChoice(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function chooseNext(current, prev) {
      const neighbors = [...(adj.get(current) || [])];
      if (!neighbors.length) return null;
      const options = prev ? neighbors.filter((n) => n !== prev) : neighbors;
      return options.length ? randChoice(options) : randChoice(neighbors);
    }

    function activateLine(a, b, ms = 140) {
      const line = edges.get(key(a, b));
      if (!line) return;
      line.classList.add("line-active");
      setTimeout(() => line.classList.remove("line-active"), ms);
    }

    function hitNode(id, ms = 220) {
      const n = nodes.get(id);
      if (!n) return;
      n.el.classList.add("node-hit");
      setTimeout(() => n.el.classList.remove("node-hit"), ms);
    }

    function createDot(radius = 3.5) {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.classList.add("signal-dot");
      dot.setAttribute("r", String(radius));
      svg.appendChild(dot);
      return dot;
    }

    const signals = [];

    function spawnSignal({ startId, prevId = null, speed = 0.22, radius = 3.5, lifeMs = 14000, branchChance = 0.28, maxBranches = 1 }) {
      const dot = createDot(radius);
      const start = nodes.get(startId);
      if (start) {
        dot.setAttribute("cx", String(start.x));
        dot.setAttribute("cy", String(start.y));
      }

      signals.push({
        dot, current: startId, prev: prevId,
        next: chooseNext(startId, prevId), t: 0, speed,
        bornAt: performance.now(), lifeMs,
        branchesMade: 0, branchChance, maxBranches,
      });
      hitNode(startId);
    }

    const INITIAL_SIGNALS = 3;

    for (let i = 0; i < INITIAL_SIGNALS; i++) {
      spawnSignal({
        startId: randChoice(nodeIds),
        speed: 0.18 + Math.random() * 0.1,
        radius: 3.2 + Math.random() * 1.2,
        lifeMs: 60000,
        branchChance: 0.3,
        maxBranches: 2,
      });
    }

    let last = performance.now();

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        if (Number.isFinite(s.lifeMs) && now - s.bornAt > s.lifeMs) {
          s.dot.remove();
          signals.splice(i, 1);
          continue;
        }

        if (!s.next) s.next = chooseNext(s.current, s.prev);
        if (!s.next) continue;

        s.t += s.speed * dt;
        const a = nodes.get(s.current);
        const b = nodes.get(s.next);
        if (!a || !b) continue;

        const tt = Math.min(s.t, 1);
        s.dot.setAttribute("cx", String(a.x + (b.x - a.x) * tt));
        s.dot.setAttribute("cy", String(a.y + (b.y - a.y) * tt));

        activateLine(s.current, s.next, 120);

        if (s.t >= 1) {
          s.prev = s.current;
          s.current = s.next;
          s.t = 0;
          hitNode(s.current, 240);

          const neighbors = [...(adj.get(s.current) || [])];
          if (neighbors.length >= 3 && s.branchesMade < s.maxBranches && Math.random() < s.branchChance) {
            const branchTo = chooseNext(s.current, s.prev);
            if (branchTo) {
              s.branchesMade++;
              spawnSignal({
                startId: s.current, prevId: s.prev,
                speed: Math.max(0.16, s.speed * (0.85 + Math.random() * 0.5)),
                radius: Math.max(2.8, Number(s.dot.getAttribute("r")) - 0.4),
                lifeMs: 9000 + Math.random() * 7000,
                branchChance: 0.18, maxBranches: 1,
              });
            }
          }

          s.next = chooseNext(s.current, s.prev);
        }
      }

      if (signals.length === 0) {
        for (let k = 0; k < INITIAL_SIGNALS; k++) {
          spawnSignal({
            startId: randChoice(nodeIds),
            speed: 0.18 + Math.random() * 0.1,
            radius: 3.2 + Math.random() * 1.2,
            lifeMs: Infinity,
            branchChance: 0.3,
            maxBranches: 2,
          });
        }
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  })();

  // ============================================
  // CONTACT FORM HANDLING
  // ============================================

  const contactForm = document.querySelector(".contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitButton = this.querySelector(".form-submit");
      const successEl = document.querySelector(".form-success");
      const errorEl = document.querySelector(".form-error");
      const originalText = submitButton ? submitButton.textContent : "Send Message";

      if (successEl) successEl.classList.remove("visible");
      if (errorEl) errorEl.classList.remove("visible");

      if (submitButton) {
        submitButton.textContent = "Sending...";
        submitButton.disabled = true;
      }

      try {
        const formData = new FormData(contactForm);
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          if (successEl) successEl.classList.add("visible");
          contactForm.reset();
          setTimeout(() => {
            if (successEl) successEl.classList.remove("visible");
          }, 6000);
        } else {
          if (errorEl) errorEl.classList.add("visible");
        }
      } catch {
        if (errorEl) errorEl.classList.add("visible");
      } finally {
        if (submitButton) {
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }
      }
    });
  }

  // ============================================
  // LAZY IMAGES
  // ============================================

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll("img[data-src]").forEach((img) => imageObserver.observe(img));
  }

  // ============================================
  // SMOOTH PAGE TRANSITIONS
  // ============================================

  function isInternalLink(link) {
    if (!link.href) return false;
    if (link.target === "_blank") return false;
    if (link.hasAttribute("download")) return false;
    if (link.href.startsWith("mailto:") || link.href.startsWith("tel:")) return false;
    if (link.href.includes("#") && link.pathname === window.location.pathname) return false;
    try {
      const url = new URL(link.href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  document.addEventListener("click", function (e) {
    const link = e.target.closest("a");
    if (!link || !isInternalLink(link)) return;

    e.preventDefault();
    const dest = link.href;

    closeMobileMenu();

    document.body.classList.add("page-leaving");
    if (pageLoader) {
      pageLoader.classList.remove("hidden");
    }

    setTimeout(() => {
      window.location.href = dest;
    }, 300);
  });

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      closeMobileMenu();
      document.body.classList.remove("page-leaving");
      hideLoader();
    }
  });

  // ============================================
  // CONSOLE BRANDING
  // ============================================

  console.log(
    "%cBLUEPRINTS TECHNOLOGY LIMITED",
    "font-size: 18px; font-weight: bold; color: #0c2d48; font-family: system-ui;"
  );
  console.log(
    "%cEngineering reliable software solutions",
    "font-size: 12px; color: #2dd4a8;"
  );
})();
