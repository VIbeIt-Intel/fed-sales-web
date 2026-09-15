(function () {
  var office =
    document.currentScript && document.currentScript.getAttribute("data-office")
      ? document.currentScript.getAttribute("data-office")
      : "https://office.fed-online.co.za";
  var form = document.querySelector(".product-search");
  var input = form && form.querySelector("input");
  var hits = document.querySelector(".product-hits");
  var list = document.querySelector(".product-list");
  if (!form || !input || !hits || !list) return;

  var timer = 0;
  var last = 0;
  var seq = 0;

  function packOf(item) {
    return (item.packSize || "") + (item.unitNote ? " " + item.unitNote : "");
  }

  function showCategories() {
    hits.hidden = true;
    hits.innerHTML = "";
    list.hidden = false;
  }

  function render(items, query) {
    list.hidden = true;
    hits.hidden = false;
    hits.innerHTML = "";
    var status = document.createElement("p");
    status.className = "product-hits-status";
    status.setAttribute("role", "status");
    if (!items.length) {
      status.textContent = "No product on the live list matches “" + query + "”.";
      hits.appendChild(status);
      return;
    }
    status.textContent =
      items.length === 1 ? "1 product on the live list." : items.length + " products on the live list.";
    hits.appendChild(status);
    var ul = document.createElement("ul");
    ul.className = "product-hits-list";
    items.forEach(function (item) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "products/" + encodeURIComponent(item.slug) + ".html";
      if (item.imageUrl) {
        var img = document.createElement("img");
        img.src = item.imageUrl;
        img.alt = "";
        img.width = 64;
        img.height = 64;
        a.appendChild(img);
      }
      var copy = document.createElement("span");
      copy.className = "copy";
      var kicker = document.createElement("span");
      kicker.className = "kicker";
      kicker.textContent = item.category || "";
      var strong = document.createElement("strong");
      strong.textContent = item.name;
      var meta = document.createElement("small");
      var bits = [packOf(item), item.sku].filter(Boolean);
      meta.textContent = bits.join(" · ");
      copy.appendChild(kicker);
      copy.appendChild(strong);
      if (bits.length) copy.appendChild(meta);
      a.appendChild(copy);
      var price = document.createElement("span");
      price.className = "price";
      price.textContent = item.price;
      a.appendChild(price);
      li.appendChild(a);
      ul.appendChild(li);
    });
    hits.appendChild(ul);
  }

  function lookup(query) {
    var id = ++seq;
    hits.hidden = false;
    list.hidden = true;
    hits.innerHTML = '<p class="product-hits-status" role="status">Looking up the live list…</p>';
    fetch(office.replace(/\/$/, "") + "/api/public/catalogue?q=" + encodeURIComponent(query), { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : { matches: [] };
      })
      .then(function (data) {
        if (id !== seq) return;
        render(Array.isArray(data.matches) ? data.matches : [], query);
      })
      .catch(function () {
        if (id !== seq) return;
        hits.innerHTML = '<p class="product-hits-status" role="status">Could not reach the live list. Try again.</p>';
      });
  }

  function onQuery() {
    var query = input.value.replace(/\s+/g, " ").trim();
    window.clearTimeout(timer);
    if (query.length < 2) {
      seq += 1;
      showCategories();
      return;
    }
    timer = window.setTimeout(function () {
      if (query === last && !hits.hidden) return;
      last = query;
      lookup(query);
    }, 220);
  }

  input.addEventListener("input", onQuery);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    window.clearTimeout(timer);
    var query = input.value.replace(/\s+/g, " ").trim();
    if (query.length < 2) {
      showCategories();
      return;
    }
    last = query;
    lookup(query);
  });
})();
