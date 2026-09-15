(function () {
  var office =
    document.currentScript && document.currentScript.getAttribute("data-office")
      ? document.currentScript.getAttribute("data-office")
      : "https://office.fed-online.co.za";
  var slugMatch = location.pathname.match(/\/products\/([a-z0-9-]+)\.html/i);
  var slug =
    (document.currentScript && document.currentScript.getAttribute("data-slug")) ||
    (slugMatch ? slugMatch[1] : "");
  if (!slug) return;

  function addPricelistButtons() {
    var catalog = document.querySelector(".catalog");
    if (!catalog || catalog.querySelector(".catalog-pricelist")) return;
    var stamp = catalog.querySelector(".catalog-stamp");
    var actions = document.createElement("p");
    actions.className = "catalog-pricelist";
    var download = document.createElement("a");
    download.className = "btn";
    download.href =
      office.replace(/\/$/, "") + "/api/public/pricelist?slug=" + encodeURIComponent(slug);
    download.textContent = "Download this price list";
    var full = document.createElement("a");
    full.className = "btn-ghost";
    full.href = office.replace(/\/$/, "") + "/api/public/pricelist";
    full.textContent = "Full FED price list";
    actions.appendChild(download);
    actions.appendChild(full);
    if (stamp && stamp.parentNode) stamp.parentNode.insertBefore(actions, stamp.nextSibling);
    else (catalog.querySelector(".catalog-wrap") || catalog).appendChild(actions);
  }

  addPricelistButtons();

  fetch(office.replace(/\/$/, "") + "/api/public/catalogue?slug=" + encodeURIComponent(slug))
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (data) {
      if (!data || !data.groups || !data.groups.length) return;
      var catalog = document.querySelector(".catalog");
      if (!catalog) return;
      catalog.querySelectorAll(".catalog-group, .catalog-empty").forEach(function (node) {
        node.remove();
      });
      var stamp = catalog.querySelector(".catalog-stamp");
      if (stamp) stamp.textContent = "Live list from the FED office";
      addPricelistButtons();
      data.groups.forEach(function (group) {
        var section = document.createElement("section");
        section.className = "catalog-group";
        var h2 = document.createElement("h2");
        h2.textContent = group.name;
        section.appendChild(h2);
        var scroll = document.createElement("div");
        scroll.className = "catalog-scroll";
        var table = document.createElement("table");
        table.className = "catalog-table";
        table.innerHTML =
          "<thead><tr><th scope=\"col\">Product</th><th scope=\"col\">Pack</th><th scope=\"col\">Indicative price</th></tr></thead>";
        var tbody = document.createElement("tbody");
        group.products.forEach(function (product) {
          var tr = document.createElement("tr");
          var name = document.createElement("td");
          if (product.imageUrl) {
            var img = document.createElement("img");
            img.src = product.imageUrl;
            img.alt = "";
            img.width = 48;
            img.height = 48;
            img.className = "live-thumb";
            name.appendChild(img);
          }
          var label = document.createElement("span");
          label.textContent = product.name;
          name.appendChild(label);
          if (product.sku) {
            var code = document.createElement("span");
            code.className = "code";
            code.textContent = product.sku;
            name.appendChild(document.createTextNode(" "));
            name.appendChild(code);
          }
          var pack = document.createElement("td");
          pack.className = "pack";
          pack.textContent = product.packSize + (product.unitNote ? " " + product.unitNote : "");
          var price = document.createElement("td");
          price.className = "price";
          price.textContent = product.price;
          tr.appendChild(name);
          tr.appendChild(pack);
          tr.appendChild(price);
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        scroll.appendChild(table);
        section.appendChild(scroll);
        catalog.appendChild(section);
      });
    })
    .catch(function () {});
})();
