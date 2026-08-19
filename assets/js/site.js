/* ==========================================================================
   APIQR — site behaviour. Progressive enhancement only: every page works
   with JavaScript disabled.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- current year ---------- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mnav = document.getElementById("mobile-nav");
  if (toggle && mnav) {
    var setNav = function (open) {
      mnav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setNav(!mnav.classList.contains("open"));
    });

    /* a tap inside the panel that is not a link keeps it open */
    mnav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
      else e.stopPropagation();
    });

    /* anywhere else on the page dismisses it */
    document.addEventListener("click", function () {
      if (mnav.classList.contains("open")) setNav(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mnav.classList.contains("open")) {
        setNav(false);
        toggle.focus();
      }
    });

    /* the panel is only reachable below 1040px; leaving it open past that
       breakpoint would hide it while aria-expanded still claimed it was open */
    var wide = window.matchMedia("(min-width: 1041px)");
    var onWide = function (m) { if (m.matches) setNav(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ---------- platform screenshot tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".shot-tab"));
  if (tabs.length) {
    var select = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  }

  /* ---------- compliance self-check ---------- */
  var checklist = document.querySelector(".checklist");
  if (checklist) {
    var boxes = checklist.querySelectorAll('input[type="checkbox"]');
    var score = checklist.querySelector(".check-score");
    var update = function () {
      var done = 0;
      boxes.forEach(function (b) { if (b.checked) done++; });
      if (!score) return;
      score.textContent = done + " of " + boxes.length + " in place";
      score.classList.toggle("done", done === boxes.length);
    };
    boxes.forEach(function (b) { b.addEventListener("change", update); });
    update();
  }

  /* ---------- table of contents scrollspy ---------- */
  var toc = document.querySelector(".toc");
  if (toc && "IntersectionObserver" in window) {
    var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
    var targets = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    if (targets.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      }, { rootMargin: "-96px 0px -70% 0px", threshold: 0 });
      targets.forEach(function (t) { spy.observe(t); });
    }
  }

  /* ---------- enquiry form ----------
     No back end is wired yet. Until the client confirms the destination
     inbox or CRM, the form validates, then hands off to thank-you.html so
     the conversion is measurable. Replace the submit handler with a real
     POST when the endpoint exists.                                        */
  var form = document.querySelector("form.enquiry");
  if (form) {
    form.addEventListener("submit", function (e) {
      var trap = form.querySelector('input[name="website"]');
      if (trap && trap.value) { e.preventDefault(); return; }
      if (!form.checkValidity()) return;          // let the browser report it
      e.preventDefault();
      window.location.href = "thank-you.html";
    });
  }

  /* ---------- image lightbox ----------
     Screens are dense, so let people open one full size. The trigger is added
     by script: without JS the images are simply images, which is correct. */
  var zoomables = document.querySelectorAll(".shot-frame img, .gallery figure img");
  if (zoomables.length) {
    var lb = document.createElement("div");
    lb.className = "lb";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Image viewer");
    lb.innerHTML =
      '<button class="lb-close" type="button" aria-label="Close image viewer">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
      '<figure class="lb-fig"><img alt=""><figcaption class="lb-cap"></figcaption></figure>';
    document.body.appendChild(lb);

    var lbImg   = lb.querySelector("img");
    var lbCap   = lb.querySelector(".lb-cap");
    var lbClose = lb.querySelector(".lb-close");
    var lastFocus = null;

    function open(img) {
      lastFocus = document.activeElement;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      // caption, best source first: the tab panel's own heading, then a
      // figcaption, then the alt text
      var panel = img.closest(".shot-panel");
      var fig   = img.closest("figure");
      var cap   = fig && fig.querySelector("figcaption:not(.lb-cap)");
      if (panel && panel.querySelector(".shot-info h3")) {
        var lead = panel.querySelector(".shot-info > p");
        lbCap.innerHTML = "<b>" + panel.querySelector(".shot-info h3").textContent + "</b>" +
                          (lead ? lead.textContent : "");
      } else if (cap) {
        lbCap.innerHTML = cap.innerHTML;
      } else {
        lbCap.textContent = img.alt || "";
      }
      lb.hidden = false;
      document.body.classList.add("lb-open");
      lbClose.focus();
    }

    function close() {
      lb.hidden = true;
      document.body.classList.remove("lb-open");
      lbImg.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    zoomables.forEach(function (img) {
      img.classList.add("zoomable");
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "View larger: " + (img.alt || "screen"));
      img.addEventListener("click", function () { open(img); });
      img.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        open(img);
      });
    });

    // an affordance only makes sense once the behaviour exists, so add it here
    document.querySelectorAll(".shot-panel").forEach(function (panel) {
      var frame = panel.querySelector(".shot-frame");
      if (!frame || panel.querySelector(".zoom-hint")) return;
      var h = document.createElement("p");
      h.className = "zoom-hint";
      h.innerHTML =
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/>' +
        '<path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg> Click the screen to enlarge';
      frame.insertAdjacentElement("afterend", h);
    });

    lbClose.addEventListener("click", close);
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target === lb.querySelector(".lb-fig")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") { close(); return; }
      // simple focus trap: the close button is the only control in here
      if (e.key === "Tab") { e.preventDefault(); lbClose.focus(); }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealables = document.querySelectorAll(".reveal");
  var bars = document.querySelector(".bars");

  if (reduce || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll(".bar-fill").forEach(function (b) { b.style.width = b.dataset.w; });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  revealables.forEach(function (el) { io.observe(el); });

  if (bars) {
    var bo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".bar-fill").forEach(function (b, i) {
          setTimeout(function () { b.style.width = b.dataset.w; }, i * 180);
        });
        bo.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    bo.observe(bars);
  }
})();
