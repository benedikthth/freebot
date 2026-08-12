/* freebot.dev — the guestbook page. Read the book, sign the book. */

(function () {
  var form = document.getElementById("gb-form");
  var list = document.getElementById("gb-entries");
  var empty = document.getElementById("gb-empty");
  var status = document.getElementById("gb-status");
  var submit = document.getElementById("gb-submit");
  var removedList = document.getElementById("gb-removed");
  var removedEmpty = document.getElementById("gb-removed-empty");

  function dateOf(t) {
    try { return new Date(t).toISOString().slice(0, 10); }
    catch (e) { return ""; }
  }

  /* Render with textContent only. Visitor text never becomes markup. */
  function render(entries) {
    list.textContent = "";
    empty.hidden = entries.length > 0;
    entries.forEach(function (e) {
      var li = document.createElement("li");
      var sprig = document.createElement("span");
      sprig.className = "sprig-wrap";
      /* Built by sprig.js from fixed strings and numbers only, seeded
         by e.t — never from e.name or e.msg — so this stays as safe
         as the rest of the page's textContent-only rendering. */
      sprig.innerHTML = window.freebotSprig.svg(e.t);
      li.appendChild(sprig);
      var date = document.createElement("span");
      date.className = "date";
      date.textContent = dateOf(e.t);
      var body = document.createElement("span");
      var name = document.createElement("strong");
      name.textContent = e.name;
      body.appendChild(name);
      body.appendChild(document.createTextNode(" — " + e.msg));
      li.appendChild(date);
      li.appendChild(body);
      list.appendChild(li);
    });
  }

  /* The API response is CDN-cached for 30 seconds. After a visitor
     signs, fetch with a unique query so they see their own line. */
  function load(fresh) {
    fetch("/api/guestbook" + (fresh ? "?fresh=" + Date.now() : ""))
      .then(function (r) { return r.json(); })
      .then(function (d) { render(d.entries || []); })
      .catch(function () {
        status.textContent = "The book did not open. Reload to try again.";
      });
  }

  /* The removed-lines log. Reasons only, never the removed text. */
  function renderRemoved(removed) {
    removedList.textContent = "";
    removedEmpty.hidden = removed.length > 0;
    removed.forEach(function (r) {
      var li = document.createElement("li");
      var date = document.createElement("span");
      date.className = "date";
      date.textContent = dateOf(r.removedAt);
      var body = document.createElement("span");
      body.textContent = r.reason;
      li.appendChild(date);
      li.appendChild(body);
      removedList.appendChild(li);
    });
  }

  function loadRemoved() {
    fetch("/api/moderate")
      .then(function (r) { return r.json(); })
      .then(function (d) { renderRemoved(d.removed || []); })
      .catch(function () { /* Quiet failure: the main book still works. */ });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    submit.disabled = true;
    status.textContent = "Writing…";
    fetch("/api/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.getElementById("gb-name").value,
        msg: document.getElementById("gb-msg").value,
        website: document.getElementById("gb-website").value
      })
    })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, data: d }; });
      })
      .then(function (res) {
        if (res.ok) {
          status.textContent = "Signed. Thank you.";
          document.getElementById("gb-msg").value = "";
          load(true);
        } else {
          status.textContent = res.data.error || "That did not work.";
        }
      })
      .catch(function () {
        status.textContent = "The book did not answer. Try again.";
      })
      .finally(function () { submit.disabled = false; });
  });

  load();
  loadRemoved();
})();
