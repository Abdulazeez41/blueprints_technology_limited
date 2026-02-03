/**
 * BLUEPRINTS TECHNOLOGY LIMITED
 * Main JavaScript — Interactions & Animations
 */

// ============================================
// UTILITY FUNCTIONS
// ============================================

function throttle(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top <=
      (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
    rect.bottom >= 0
  );
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================

const header = document.querySelector(".site-header");

function handleHeaderScroll() {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 50);
}

window.addEventListener("scroll", throttle(handleHeaderScroll, 100), {
  passive: true,
});
handleHeaderScroll();

// ============================================
// MOBILE MENU TOGGLE
// ============================================

const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-link");

if (mobileMenuToggle && navMenu) {
  mobileMenuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");
    mobileMenuToggle.classList.toggle("is-open", isOpen);
    mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        navMenu.classList.remove("active");
        mobileMenuToggle.classList.remove("is-open");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================

const scrollRevealElements = document.querySelectorAll(".scroll-reveal");

function checkScrollReveal() {
  scrollRevealElements.forEach((element) => {
    if (isInViewport(element)) element.classList.add("visible");
  });
}

checkScrollReveal();
window.addEventListener("scroll", throttle(checkScrollReveal, 100), {
  passive: true,
});

// ============================================
// ACTIVE NAVIGATION LINK
// ============================================

function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  navLinks.forEach((link) => {
    link.classList.remove("active");
    const linkHref = link.getAttribute("href");
    if (
      linkHref === currentPage ||
      (currentPage === "" && linkHref === "index.html")
    ) {
      link.classList.add("active");
    }
  });
}
setActiveNavLink();

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
// HERO DIAGRAM — AUTO ROUTES + BRANCHING SIGNALS
// Supports circle nodes OR <g data-id="A">..</g> nodes.
// ============================================

(function initNetworkFlow() {
  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  if (reduceMotion) return;

  const heroDiagram = document.querySelector(".hero-diagram");
  if (!heroDiagram) return;

  const svg =
    heroDiagram.tagName.toLowerCase() === "svg"
      ? heroDiagram
      : heroDiagram.querySelector("svg");
  if (!svg) return;

  // Accept any SVG element with data-id as a node (circle, g, path, etc.)
  const nodeEls = [...svg.querySelectorAll("[data-id]")];
  const lineEls = [...svg.querySelectorAll("line[data-from][data-to]")];

  if (nodeEls.length < 2 || lineEls.length < 1) return;

  // ---- Node positioning helpers ----
  function getNodeCenter(el) {
    const tag = el.tagName.toLowerCase();

    // Circle: use cx/cy
    if (tag === "circle") {
      return {
        x: Number(el.getAttribute("cx")),
        y: Number(el.getAttribute("cy")),
      };
    }

    // If user provided explicit coordinates (recommended for custom icons)
    const dx = el.getAttribute("data-x");
    const dy = el.getAttribute("data-y");
    if (dx !== null && dy !== null) {
      return { x: Number(dx), y: Number(dy) };
    }

    // Fallback: use bbox center
    const bbox = el.getBBox();
    return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
  }

  // --- Build maps ---
  const nodes = new Map(); // id -> { el, x, y }
  nodeEls.forEach((el) => {
    const id = el.dataset.id;
    if (!id) return;
    const { x, y } = getNodeCenter(el);
    nodes.set(id, { el, x, y });
  });

  const edges = new Map(); // "A|B" -> lineEl
  const adj = new Map(); // id -> Set(neighbors)

  function key(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function addAdj(a, b) {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a).add(b);
  }

  lineEls.forEach((line) => {
    const a = line.dataset.from;
    const b = line.dataset.to;
    if (!a || !b) return;
    if (!nodes.has(a) || !nodes.has(b)) return;

    edges.set(key(a, b), line);
    addAdj(a, b);
    addAdj(b, a);
  });

  const nodeIds = [...nodes.keys()];
  if (nodeIds.length < 2) return;

  // --- Visual helpers ---
  function activateLine(a, b, ms = 140) {
    const line = edges.get(key(a, b));
    if (!line) return;
    line.classList.add("line-active");
    window.setTimeout(() => line.classList.remove("line-active"), ms);
  }

  function hitNode(id, ms = 220) {
    const n = nodes.get(id);
    if (!n) return;
    n.el.classList.add("node-hit");
    window.setTimeout(() => n.el.classList.remove("node-hit"), ms);
  }

  function createDot(radius = 3.5) {
    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    dot.classList.add("signal-dot");
    dot.setAttribute("r", String(radius));
    svg.appendChild(dot);
    return dot;
  }

  function setDotPos(dot, x, y) {
    dot.setAttribute("cx", String(x));
    dot.setAttribute("cy", String(y));
  }

  function randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function chooseNext(current, prev) {
    const neighbors = [...(adj.get(current) || [])];
    if (!neighbors.length) return null;
    const options = prev ? neighbors.filter((n) => n !== prev) : neighbors;
    return options.length ? randChoice(options) : randChoice(neighbors);
  }

  // --- Signals ---
  const signals = [];

  function spawnSignal({
    startId,
    prevId = null,
    speed = 0.22,
    radius = 3.5,
    lifeMs = 14000,
    branchChance = 0.28,
    maxBranches = 1,
  }) {
    const dot = createDot(radius);
    const start = nodes.get(startId);
    if (start) setDotPos(dot, start.x, start.y);

    signals.push({
      dot,
      current: startId,
      prev: prevId,
      next: chooseNext(startId, prevId),
      t: 0,
      speed,
      bornAt: performance.now(),
      lifeMs,
      branchesMade: 0,
      branchChance,
      maxBranches,
    });

    hitNode(startId);
  }

  // Seed multiple signals
  const INITIAL_SIGNALS = 3;
  const BASE_BRANCH_CHANCE = 0.3;

  for (let i = 0; i < INITIAL_SIGNALS; i++) {
    spawnSignal({
      startId: randChoice(nodeIds),
      speed: 0.18 + Math.random() * 0.1,
      radius: 3.2 + Math.random() * 1.2,
      lifeMs: 60000,
      branchChance: BASE_BRANCH_CHANCE,
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
      const x = a.x + (b.x - a.x) * tt;
      const y = a.y + (b.y - a.y) * tt;
      setDotPos(s.dot, x, y);

      activateLine(s.current, s.next, 120);

      if (s.t >= 1) {
        s.prev = s.current;
        s.current = s.next;
        s.t = 0;

        hitNode(s.current, 240);

        const neighbors = [...(adj.get(s.current) || [])];
        const junction = neighbors.length >= 3;

        if (
          junction &&
          s.branchesMade < s.maxBranches &&
          Math.random() < s.branchChance
        ) {
          const branchTo = chooseNext(s.current, s.prev);
          if (branchTo) {
            s.branchesMade++;
            spawnSignal({
              startId: s.current,
              prevId: s.prev,
              speed: Math.max(0.16, s.speed * (0.85 + Math.random() * 0.5)),
              radius: Math.max(2.8, Number(s.dot.getAttribute("r")) - 0.4),
              lifeMs: 9000 + Math.random() * 7000,
              branchChance: 0.18,
              maxBranches: 1,
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
          branchChance: BASE_BRANCH_CHANCE,
          maxBranches: 2,
        });
      }
    }

    requestAnimationFrame(tick);
  }

  // Minimal CSS for signal-dot if you don’t already have it
  if (!document.getElementById("hero-diagram-signal-style")) {
    const style = document.createElement("style");
    style.id = "hero-diagram-signal-style";
    style.textContent = `
      .signal-dot { fill: rgba(255,255,255,0.95); opacity: 0.95; }
    `;
    document.head.appendChild(style);
  }

  requestAnimationFrame(tick);
})();

// ============================================
// CONTACT FORM HANDLING
// ============================================

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const submitButton = this.querySelector(".form-submit");
    const originalText = submitButton ? submitButton.textContent : "Send";

    const formData = {
      name: this.querySelector('input[name="name"]')?.value || "",
      email: this.querySelector('input[name="email"]')?.value || "",
      company: this.querySelector('input[name="company"]')?.value || "",
      subject: this.querySelector('input[name="subject"]')?.value || "",
      message: this.querySelector('textarea[name="message"]')?.value || "",
    };

    if (submitButton) {
      submitButton.textContent = "Sending...";
      submitButton.disabled = true;
    }

    setTimeout(() => {
      const successMessage = document.querySelector(".form-success");
      if (successMessage) successMessage.classList.add("visible");

      contactForm.reset();

      if (submitButton) {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }

      setTimeout(() => {
        if (successMessage) successMessage.classList.remove("visible");
      }, 5000);

      // TODO: replace with real API call later
      // console.log("Form submitted:", formData);
    }, 1200);
  });
}

// ============================================
// PROCESS / TIMELINE ANIMATIONS
// ============================================

const processSteps = document.querySelectorAll(".process-step");
function animateProcessSteps() {
  processSteps.forEach((step, index) => {
    if (isInViewport(step)) {
      setTimeout(() => {
        step.style.opacity = "0";
        step.style.transform = "translateY(20px)";
        step.style.transition =
          "opacity 0.6s ease-out, transform 0.6s ease-out";
        setTimeout(() => {
          step.style.opacity = "1";
          step.style.transform = "translateY(0)";
        }, 50);
      }, index * 150);
    }
  });
}
if (processSteps.length > 0) {
  window.addEventListener("scroll", throttle(animateProcessSteps, 100), {
    passive: true,
  });
  animateProcessSteps();
}

const timelineItems = document.querySelectorAll(".timeline-item");
function animateTimelineItems() {
  timelineItems.forEach((item, index) => {
    if (isInViewport(item)) {
      setTimeout(() => {
        item.style.opacity = "0";
        item.style.transform = "translateX(-20px)";
        item.style.transition =
          "opacity 0.6s ease-out, transform 0.6s ease-out";
        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateX(0)";
        }, 50);
      }, index * 200);
    }
  });
}
if (timelineItems.length > 0) {
  window.addEventListener("scroll", throttle(animateTimelineItems, 100), {
    passive: true,
  });
  animateTimelineItems();
}

// ============================================
// PERFORMANCE OPTIMIZATION
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

  document
    .querySelectorAll("img[data-src]")
    .forEach((img) => imageObserver.observe(img));
}

// ============================================
// PAGE LOAD ANIMATION
// (Better done in CSS, but leaving your behavior intact)
// ============================================

window.addEventListener("load", () => {
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.4s ease-out";
  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 10);
});

// ============================================
// CONSOLE BRANDING
// ============================================

console.log(
  "%cBLUEPRINTS TECHNOLOGY LIMITED",
  "font-size: 18px; font-weight: bold; color: #0F1B34; font-family: serif;",
);
console.log(
  "%cEngineering reliable software solutions",
  "font-size: 12px; color: #5A8F89;",
);

// ============================================
// EXPORT FOR POTENTIAL MODULE USE
// ============================================

if (typeof module !== "undefined" && module.exports) {
  module.exports = { throttle, isInViewport, checkScrollReveal };
}
