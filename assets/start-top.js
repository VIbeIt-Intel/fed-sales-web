history.scrollRestoration = "manual";
(function () {
  var KEY = "fed-section-nav";
  var fromNav = false;
  try {
    fromNav = sessionStorage.getItem(KEY) === "1";
    sessionStorage.removeItem(KEY);
  } catch (e) {}
  var reload = false;
  try {
    var nav = performance.getEntriesByType("navigation")[0];
    reload = !!(nav && nav.type === "reload");
  } catch (e) {}
  var honorHash = fromNav && !!location.hash && !reload;

  function toTop() {
    var html = document.documentElement;
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (err) {
      window.scrollTo(0, 0);
    }
    html.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    html.style.scrollBehavior = prev;
  }

  function pinTop() {
    toTop();
    requestAnimationFrame(function () {
      toTop();
      setTimeout(toTop, 0);
      setTimeout(toTop, 100);
      setTimeout(toTop, 300);
    });
  }

  function stripHash() {
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  if (!honorHash) {
    stripHash();
    pinTop();
  }

  window.addEventListener("pageshow", function (e) {
    if (e.persisted || !honorHash) {
      if (!honorHash) stripHash();
      pinTop();
    }
  });
  window.addEventListener("load", function () {
    if (!honorHash) pinTop();
  });

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target;
      while (el && el.nodeName !== "A") el = el.parentElement;
      if (!el) return;
      var href = el.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#") return;
      try {
        var url = new URL(el.href);
        if (url.origin === location.origin && url.hash && url.hash !== "#") {
          sessionStorage.setItem(KEY, "1");
        }
      } catch (err) {}
    },
    true
  );
})();
