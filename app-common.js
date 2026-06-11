(function (global) {
  const NAME_KEY = "kaspi_fullName";
  const AVATAR_KEY = "kaspi_avatar";
  const DEFAULT_NAME = "Абильмажин А.";
  const DEFAULT_AVATAR = "avatar.jpg";

  function getName() {
    return localStorage.getItem(NAME_KEY) || DEFAULT_NAME;
  }

  function setName(value) {
    let name = String(value || "").trim();
    if (!name) name = DEFAULT_NAME;
    if (!name.endsWith(".")) name += ".";
    localStorage.setItem(NAME_KEY, name);
    syncRekvizit(name);
    return name;
  }

  function getAvatar() {
    return localStorage.getItem(AVATAR_KEY) || DEFAULT_AVATAR;
  }

  function setAvatar(dataUrl) {
    if (dataUrl) localStorage.setItem(AVATAR_KEY, dataUrl);
  }

  function syncRekvizit(name) {
    try {
      localStorage.setItem("rekvizit1", name);
    } catch (_) {}
  }

  function applyAvatarTo(img) {
    if (!img) return;
    const src = getAvatar();
    img.onerror = function () {
      this.onerror = null;
      this.src = "https://via.placeholder.com/120";
    };
    img.src = src;
  }

  function applyPinAvatar() {
    applyAvatarTo(document.querySelector(".pin-avatar img"));
  }

  function applyProfileRow() {
    const nameEl = document.getElementById("profileName");
    const avatarEl = document.getElementById("profileAvatarImg");
    if (nameEl) nameEl.textContent = getName();
    applyAvatarTo(avatarEl);
  }

  function openSettings() {
    const overlay = document.getElementById("settingsOverlay");
    if (!overlay) return;
    const nameInput = document.getElementById("settingsName");
    const preview = document.getElementById("settingsAvatarPreview");
    if (nameInput) nameInput.value = getName();
    applyAvatarTo(preview);
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSettings() {
    const overlay = document.getElementById("settingsOverlay");
    if (!overlay) return;
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  function saveSettings() {
    const nameInput = document.getElementById("settingsName");
    if (nameInput) setName(nameInput.value);
    applyProfileRow();
    applyPinAvatar();
    closeSettings();
  }

  function initSettingsUI() {
    const profileRow = document.getElementById("profileRow");
    const saveBtn = document.getElementById("settingsSave");
    const cancelBtn = document.getElementById("settingsCancel");
    const fileInput = document.getElementById("avatarFileInput");
    const uploadBtn = document.getElementById("avatarUploadBtn");
    const overlay = document.getElementById("settingsOverlay");

    if (profileRow) profileRow.addEventListener("click", openSettings);
    if (saveBtn) saveBtn.addEventListener("click", saveSettings);
    if (cancelBtn) cancelBtn.addEventListener("click", closeSettings);
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeSettings();
      });
    }
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", function () { fileInput.click(); });
      fileInput.addEventListener("change", function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
          setAvatar(reader.result);
          applyAvatarTo(document.getElementById("settingsAvatarPreview"));
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function initNav(activeTab) {
    document.querySelectorAll(".nav-item[data-tab]").forEach(function (item) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        const tab = item.getAttribute("data-tab");
        if (tab === activeTab) return;
        sessionStorage.setItem("kaspi_tab_nav", "1");
        document.body.classList.add("page-transition-out");
        setTimeout(function () {
          if (tab === "home") location.href = "/";
          else if (tab === "services") location.href = "/serv.html";
        }, 260);
      });
    });
  }

  function initPageEnter() {
    if (sessionStorage.getItem("kaspi_tab_nav") === "1") {
      sessionStorage.removeItem("kaspi_tab_nav");
      document.documentElement.classList.add("page-transition-in");
    }
  }

  global.KaspiProfile = {
    getName,
    setName,
    getAvatar,
    setAvatar,
    applyPinAvatar,
    applyProfileRow,
    initSettingsUI,
    initNav,
    initPageEnter,
  };

  function injectNotifyStyles() {
    if (document.getElementById("kaspi-notify-style")) return;
    var s = document.createElement("style");
    s.id = "kaspi-notify-style";
    s.textContent =
      ".kaspi-notify-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px;animation:knFade .25s ease}" +
      ".kaspi-notify-card{width:min(360px,100%);background:#fff;border-radius:20px;padding:22px 20px 18px;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative;font-family:system-ui,-apple-system,sans-serif}" +
      ".kaspi-notify-close{position:absolute;top:12px;right:12px;width:32px;height:32px;border:none;border-radius:50%;background:#f3f4f6;cursor:pointer;font-size:18px;line-height:1}" +
      ".kaspi-notify-title{font-size:18px;font-weight:800;margin:0 28px 10px 0;color:#111}" +
      ".kaspi-notify-text{font-size:14px;line-height:1.45;color:#4b5563;margin:0;white-space:pre-wrap}" +
      "@keyframes knFade{from{opacity:0}to{opacity:1}}";
    document.head.appendChild(s);
  }

  function showNotification(n, type) {
    if (!n || !n.id) return;
    injectNotifyStyles();
    var old = document.getElementById("kaspiNotifyOverlay");
    if (old) old.remove();
    var overlay = document.createElement("div");
    overlay.id = "kaspiNotifyOverlay";
    overlay.className = "kaspi-notify-overlay";
    overlay.innerHTML =
      '<div class="kaspi-notify-card">' +
      '<button type="button" class="kaspi-notify-close" aria-label="Закрыть">×</button>' +
      '<h3 class="kaspi-notify-title"></h3>' +
      '<p class="kaspi-notify-text"></p></div>';
    overlay.querySelector(".kaspi-notify-title").textContent = n.title || "Уведомление";
    overlay.querySelector(".kaspi-notify-text").textContent = n.text || "";
    function dismiss() {
      overlay.remove();
      fetch("/.netlify/functions/check-access", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dismiss_notify",
          type: type || "global",
          notificationId: n.id,
        }),
      }).catch(function () {});
    }
    overlay.querySelector(".kaspi-notify-close").onclick = dismiss;
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) dismiss();
    });
    document.body.appendChild(overlay);
  }

  async function checkAccessAndNotify(page) {
    if (/\/(bind|blocked|admin)\.html$/i.test(location.pathname)) return null;
    try {
      var url = "/.netlify/functions/check-access?page=" + encodeURIComponent(page || "site");
      var r = await fetch(url, { credentials: "include" });
      if (!r.ok) return null;
      var data = await r.json();
      if (data.notification) {
        showNotification(data.notification, data.notificationType);
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  function initNotifications(page) {
    if (/\/(bind|blocked|admin)\.html$/i.test(location.pathname)) return;
    checkAccessAndNotify(page);
    setInterval(function () {
      checkAccessAndNotify(page);
    }, 45000);
  }

  global.KaspiNotify = {
    showNotification,
    checkAccessAndNotify,
    initNotifications,
  };
})(window);
