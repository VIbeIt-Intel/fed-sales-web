(function () {
  var office =
    document.currentScript && document.currentScript.getAttribute("data-office")
      ? document.currentScript.getAttribute("data-office")
      : "https://fed-sales-office.vercel.app";
  var url = office.replace(/\/$/, "") + "/api/public/notices";
  var SEEN_KEY = "fed.notices.popup";
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
    if (item.imageUrls && item.imageUrls.length) return item.imageUrls;
    return item.imageUrl ? [item.imageUrl] : [];
  }

  function fillCopy(article, item) {
    var urls = photosOf(item);
    if (urls.length) {
      var row = document.createElement("div");
      row.className = "live-notice-photos";
      urls.forEach(function (src) {
        var img = document.createElement("img");
        img.src = src;
        img.alt = "";
        row.appendChild(img);
      });
      article.appendChild(row);
    }
    var kicker = document.createElement("p");
    kicker.className = "live-notice-kicker";
    kicker.textContent = "Special";
    var h2 = document.createElement("strong");
    h2.textContent = item.title;
    var p = document.createElement("p");
    p.textContent = item.body;
    var copy = document.createElement("div");
    copy.className = "live-notice-copy";
    copy.appendChild(kicker);
    copy.appendChild(h2);
    copy.appendChild(p);
    article.appendChild(copy);
  }

  function renderBanner(items) {
    var host = document.querySelector(".live-notices");
    if (!items.length) {
      if (host) host.remove();
      return;
    }
    if (!host) {
      host = document.createElement("div");
      host.className = "live-notices";
      host.setAttribute("role", "region");
      host.setAttribute("aria-label", "FED specials");
      var header = document.querySelector("header.top");
      if (header && header.parentNode) header.parentNode.insertBefore(host, header.nextSibling);
      else document.body.insertBefore(host, document.body.firstChild);
    }
    host.innerHTML = "";
    items.forEach(function (item) {
      var article = document.createElement("article");
      fillCopy(article, item);
      host.appendChild(article);
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
  }

  function tick() {
    fetch(url, { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : [];
      })
      .then(function (items) {
        if (!Array.isArray(items)) items = [];
        renderBanner(items);
        if (firstTick) {
          items.forEach(function (item) {
            known[item.id] = true;
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
      })
      .catch(function () {});
  }

  tick();
  setInterval(tick, 12000);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closePopup();
  });
})();
