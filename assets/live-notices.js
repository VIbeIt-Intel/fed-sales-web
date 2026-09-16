(function () {
  var office =
    document.currentScript && document.currentScript.getAttribute("data-office")
      ? document.currentScript.getAttribute("data-office")
      : "https://office.fed-online.co.za";
  var url = office.replace(/\/$/, "") + "/api/public/notices";
  var SEEN_KEY = "fed.notices.popup";
  var LIST_KEY = "fed.notices.list";
  var known = {};
  var firstTick = true;
  var popupOpen = false;

  function readSeen() {
    try {
      var raw = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function markSeen(id) {
    var seen = readSeen();
    if (seen.indexOf(id) !== -1) return;
    seen.push(id);
    try {
      sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch (e) {}
  }

  function photosOf(item) {
    var urls = item.imageUrls && item.imageUrls.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
    return urls.filter(function (src) {
      return src && !/^data:/i.test(src);
    });
  }

  function fillCopy(article, item) {
    var urls = photosOf(item);
    if (urls.length) {
      var row = document.createElement("div");
      row.className = "live-notice-photos";
      row.setAttribute("data-photos", urls.join("\n"));
      article.appendChild(row);
    }
    var kicker = document.createElement("p");
    kicker.className = "live-notice-kicker";
    kicker.textContent = "Special";
    var h2 = document.createElement("strong");
    h2.className = "live-notice-title";
    h2.textContent = item.title;
    var p = document.createElement("p");
    p.className = "live-notice-offer";
    p.textContent = item.body;
    var copy = document.createElement("div");
    copy.className = "live-notice-copy";
    copy.appendChild(kicker);
    copy.appendChild(h2);
    copy.appendChild(p);
    article.appendChild(copy);
  }

  function attachPhotos(root) {
    root.querySelectorAll(".live-notice-photos").forEach(function (row) {
      if (row.querySelector("img")) return;
      var urls = (row.getAttribute("data-photos") || "").split("\n").filter(Boolean);
      urls.forEach(function (src) {
        var img = document.createElement("img");
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.src = src;
        row.appendChild(img);
      });
    });
  }

  function noticesSignature(items) {
    return items
      .map(function (item) {
        return [item.id, item.title, item.body, photosOf(item).join(",")].join("\t");
      })
      .join("\n");
  }

  function tickerLine(items) {
    return (
      items
        .map(function (item) {
          return item.title + "   ·   " + item.body;
        })
        .join("     ★     ") + "     ★     "
    );
  }

  function paceTrack(track) {
    var first = track.firstElementChild;
    if (!first) return;
    var width = first.offsetWidth;
    if (!width) return;
    track.style.animationDuration = Math.max(22, width / 44) + "s";
  }

  function renderBanner(items) {
    var host = document.querySelector(".live-notices");
    if (!items.length) {
      if (host) host.remove();
      return;
    }
    var sig = noticesSignature(items);
    if (host && host.getAttribute("data-sig") === sig) return;
    if (!host) {
      host = document.createElement("div");
      host.className = "live-notices";
      host.setAttribute("role", "region");
      host.setAttribute("aria-label", "FED specials");
      var header = document.querySelector("header.top");
      if (header && header.parentNode) header.parentNode.insertBefore(host, header.nextSibling);
      else document.body.insertBefore(host, document.body.firstChild);
    }
    host.setAttribute("data-sig", sig);
    host.innerHTML = "";
    var rail = document.createElement("div");
    rail.className = "live-specials-rail";
    rail.setAttribute("aria-hidden", "true");
    var stamp = document.createElement("span");
    stamp.className = "live-specials-stamp";
    stamp.textContent = "Specials";
    var windowEl = document.createElement("div");
    windowEl.className = "live-specials-window";
    var track = document.createElement("div");
    track.className = "live-specials-track";
    var unit = tickerLine(items);
    var copy = document.createElement("span");
    copy.textContent = unit + unit + unit;
    var clone = copy.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(copy);
    track.appendChild(clone);
    windowEl.appendChild(track);
    rail.appendChild(stamp);
    rail.appendChild(windowEl);
    host.appendChild(rail);
    var row = document.createElement("div");
    row.className = "live-specials-row";
    items.forEach(function (item) {
      var article = document.createElement("article");
      fillCopy(article, item);
      row.appendChild(article);
    });
    host.appendChild(row);
    requestAnimationFrame(function () {
      paceTrack(track);
      attachPhotos(host);
    });
  }

  function closePopup() {
    var modal = document.querySelector(".live-notice-modal");
    if (modal) modal.remove();
    popupOpen = false;
    document.body.classList.remove("live-notice-lock");
  }

  function showPopup(item) {
    if (!item || popupOpen) return;
    popupOpen = true;
    markSeen(item.id);
    var modal = document.createElement("div");
    modal.className = "live-notice-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", item.title);
    var card = document.createElement("article");
    fillCopy(card, item);
    var close = document.createElement("button");
    close.type = "button";
    close.className = "btn";
    close.textContent = "Got it";
    close.addEventListener("click", closePopup);
    card.appendChild(close);
    modal.appendChild(card);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closePopup();
    });
    document.body.classList.add("live-notice-lock");
    document.body.appendChild(modal);
    requestAnimationFrame(function () {
      attachPhotos(card);
    });
  }

  function readListCache() {
    try {
      var raw = JSON.parse(sessionStorage.getItem(LIST_KEY) || "null");
      return Array.isArray(raw) ? raw : null;
    } catch (e) {
      return null;
    }
  }

  function writeListCache(items) {
    try {
      sessionStorage.setItem(LIST_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function apply(items) {
    if (!Array.isArray(items)) items = [];
    writeListCache(items);
    renderBanner(items);
    if (firstTick) {
      items.forEach(function (item) {
        if (item && item.id) known[item.id] = true;
      });
      firstTick = false;
      return;
    }
    var fresh = items.filter(function (item) {
      return item && item.id && !known[item.id] && readSeen().indexOf(item.id) === -1;
    });
    items.forEach(function (item) {
      if (item && item.id) known[item.id] = true;
    });
    if (fresh.length) showPopup(fresh[0]);
  }

  function load() {
    var pending = window.__fedNotices;
    window.__fedNotices = null;
    return (pending || fetch(url).then(function (res) {
      return res.ok ? res.json() : [];
    }))
      .then(apply)
      .catch(function () {
        if (!document.querySelector(".live-notices article")) renderBanner([]);
      });
  }

  var cached = readListCache();
  if (cached && cached.length) renderBanner(cached);

  load();
  setInterval(load, 12000);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closePopup();
  });
})();
