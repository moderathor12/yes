/**
 * Youth Environment Society (YES) — Accessibility Assistant Widget
 * Lightweight, zero-dependency, fully accessible and bilingual (EN/AZ).
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'yes_a11y_settings';

  var SCALES = [90, 100, 110, 120, 130];

  var defaultSettings = {
    scale: 100,
    highContrast: false,
    highlightLinks: false,
    dyslexicFont: false,
    readableSpacing: false,
    reduceMotion: false
  };

  // Safe storage helper
  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return Object.assign({}, defaultSettings, parsed);
      }
    } catch (e) {
      // localStorage not accessible or corrupted
    }
    return Object.assign({}, defaultSettings);
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // Storage unavailable
    }
  }

  // Detect language: check HTML lang, URL path, or yes_lang key
  function getLang() {
    var docLang = (document.documentElement.lang || '').toLowerCase();
    if (docLang.startsWith('az')) return 'az';
    if (window.location.pathname.indexOf('/az/') !== -1) return 'az';
    try {
      var saved = localStorage.getItem('yes_lang');
      if (saved === 'az') return 'az';
    } catch (e) {}
    return 'en';
  }

  var translations = {
    en: {
      btnText: 'Accessibility',
      openBtn: 'Open accessibility settings',
      closeBtn: 'Close accessibility settings',
      title: 'Accessibility Settings',
      textSize: 'Text Size',
      decrease: 'A-',
      reset: '100%',
      increase: 'A+',
      highContrast: 'High Contrast',
      highContrastDesc: 'Increase contrast & optimize colors',
      highlightLinks: 'Highlight Links',
      highlightLinksDesc: 'Underline and emphasize all links',
      dyslexicFont: 'Readable Font',
      dyslexicFontDesc: 'High-legibility font stack',
      readableSpacing: 'Text Spacing',
      readableSpacingDesc: 'Increase letter and line spacing',
      reduceMotion: 'Reduce Motion',
      reduceMotionDesc: 'Stop animations & transitions',
      resetAll: 'Reset All Settings',
      brandFoot: 'YES Accessibility Assistant',
      scaleAnnounce: function(s) { return 'Text size set to ' + s + '%'; },
      contrastAnnounce: function(on) { return 'High contrast ' + (on ? 'enabled' : 'disabled'); },
      linksAnnounce: function(on) { return 'Highlight links ' + (on ? 'enabled' : 'disabled'); },
      fontAnnounce: function(on) { return 'Readable font ' + (on ? 'enabled' : 'disabled'); },
      spacingAnnounce: function(on) { return 'Text spacing ' + (on ? 'enabled' : 'disabled'); },
      motionAnnounce: function(on) { return 'Reduce motion ' + (on ? 'enabled' : 'disabled'); },
      resetAnnounce: 'All accessibility settings have been reset to default.'
    },
    az: {
      btnText: 'Əlçatanlıq',
      openBtn: 'Əlçatanlıq parametrlərini aç',
      closeBtn: 'Əlçatanlıq parametrlərini bağla',
      title: 'Əlçatanlıq Parametrləri',
      textSize: 'Mətn Ölçüsü',
      decrease: 'A-',
      reset: '100%',
      increase: 'A+',
      highContrast: 'Yüksək Kontrast',
      highContrastDesc: 'Kontrastı artır və rəngləri tənzimlə',
      highlightLinks: 'Keçidləri Vurğula',
      highlightLinksDesc: 'Bütün keçidlərin altını xətlə',
      dyslexicFont: 'Rahat Oxu Şrifti',
      dyslexicFontDesc: 'Oxunması asan olan şrift rejimi',
      readableSpacing: 'Mətn Aralığı',
      readableSpacingDesc: 'Sətir və hərf aralığını artır',
      reduceMotion: 'Hərəkəti Azalt',
      reduceMotionDesc: 'Animasiya və hərəkətləri dayandır',
      resetAll: 'Bütün Parametrləri Sıfırla',
      brandFoot: 'YES Əlçatanlıq Köməkçisi',
      scaleAnnounce: function(s) { return 'Mətn ölçüsü ' + s + '% edildi'; },
      contrastAnnounce: function(on) { return 'Yüksək kontrast ' + (on ? 'aktivləşdirildi' : 'deaktiv edildi'); },
      linksAnnounce: function(on) { return 'Keçidlərin vurğulanması ' + (on ? 'aktivləşdirildi' : 'deaktiv edildi'); },
      fontAnnounce: function(on) { return 'Rahat oxu şrifti ' + (on ? 'aktivləşdirildi' : 'deaktiv edildi'); },
      spacingAnnounce: function(on) { return 'Mətn aralığı ' + (on ? 'aktivləşdirildi' : 'deaktiv edildi'); },
      motionAnnounce: function(on) { return 'Hərəkətin azaldılması ' + (on ? 'aktivləşdirildi' : 'deaktiv edildi'); },
      resetAnnounce: 'Bütün əlçatanlıq parametrləri sıfırlandı.'
    }
  };

  // State
  var settings = loadSettings();
  var lang = getLang();
  var t = translations[lang] || translations.en;

  // Check OS prefers-reduced-motion
  if (!settings.reduceMotion) {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        settings.reduceMotion = true;
      }
    } catch (e) {}
  }

  // Fast-apply classes to documentElement to avoid FOUC
  function applyClasses() {
    var doc = document.documentElement;

    // Clear old scales
    SCALES.forEach(function(s) {
      doc.classList.remove('yes-a11y-scale-' + s);
    });
    if (settings.scale && settings.scale !== 100) {
      doc.classList.add('yes-a11y-scale-' + settings.scale);
    }

    doc.classList.toggle('yes-a11y-high-contrast', !!settings.highContrast);
    doc.classList.toggle('yes-a11y-highlight-links', !!settings.highlightLinks);
    doc.classList.toggle('yes-a11y-dyslexic-font', !!settings.dyslexicFont);
    doc.classList.toggle('yes-a11y-readable-spacing', !!settings.readableSpacing);
    doc.classList.toggle('yes-a11y-reduce-motion', !!settings.reduceMotion);

    updateTriggerActiveState();
  }

  // Apply immediately when script runs
  applyClasses();

  // SVG Icons
  var ICONS = {
    access: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="24" cy="24" r="19" stroke="#ffffff" stroke-width="2.6" fill="none" /><circle cx="24" cy="14" r="3.6" fill="#ffffff" /><path d="M12.5 19.8 C15.5 19 19.5 18.2 24 18.2 C28.5 18.2 32.5 19 35.5 19.8 C36.6 20.1 37.2 21.2 36.9 22.3 C36.6 23.4 35.5 24 34.4 23.7 C31.8 23 28.5 22.4 25.6 22.2 V26.5 L30.8 35.8 C31.4 36.8 31 38.1 30 38.7 C29 39.3 27.7 38.9 27.1 37.9 L24 32.2 L20.9 37.9 C20.3 38.9 19 39.3 18 38.7 C17 38.1 16.6 36.8 17.2 35.8 L22.4 26.5 V22.2 C19.5 22.4 16.2 23 13.6 23.7 C12.5 24 11.4 23.4 11.1 22.3 C10.8 21.2 11.4 20.1 12.5 19.8 Z" fill="#ffffff" /></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>',
    textSize: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"/></svg>',
    contrast: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14v12c3.31 0 6-2.69 6-6s-2.69-6-6-6z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
    font: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.93 13.5h4.14L12 7.98 9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/></svg>',
    spacing: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4h20v2H2V4zm0 14h20v2H2v-2zm7-7h6v2H9v-2zm-5 1l3-3v2h10V9l3 3-3 3v-2H7v2l-3-3z"/></svg>',
    motion: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>'
  };

  var elements = {};

  function isAnySettingActive() {
    return settings.scale !== 100 ||
      settings.highContrast ||
      settings.highlightLinks ||
      settings.dyslexicFont ||
      settings.readableSpacing ||
      settings.reduceMotion;
  }

  function updateTriggerActiveState() {
    if (elements.widgetWrap) {
      elements.widgetWrap.classList.toggle('yes-a11y-has-active', isAnySettingActive());
    }
  }

  function announce(msg) {
    if (elements.srStatus) {
      elements.srStatus.textContent = '';
      setTimeout(function() {
        elements.srStatus.textContent = msg;
      }, 50);
    }
  }

  function updateUIState() {
    if (!elements.panel) return;

    if (elements.scaleVal) {
      elements.scaleVal.textContent = settings.scale + '%';
    }

    var toggles = [
      { key: 'highContrast', el: elements.toggleContrast, row: elements.rowContrast },
      { key: 'highlightLinks', el: elements.toggleLinks, row: elements.rowLinks },
      { key: 'dyslexicFont', el: elements.toggleFont, row: elements.rowFont },
      { key: 'readableSpacing', el: elements.toggleSpacing, row: elements.rowSpacing },
      { key: 'reduceMotion', el: elements.toggleMotion, row: elements.rowMotion }
    ];

    toggles.forEach(function(item) {
      if (item.el) {
        item.el.checked = !!settings[item.key];
        item.el.setAttribute('aria-checked', !!settings[item.key] ? 'true' : 'false');
      }
      if (item.row) {
        item.row.classList.toggle('is-active', !!settings[item.key]);
      }
    });

    updateTriggerActiveState();
  }

  function setScale(newScale) {
    if (SCALES.indexOf(newScale) === -1) return;
    settings.scale = newScale;
    applyClasses();
    saveSettings(settings);
    updateUIState();
    announce(t.scaleAnnounce(newScale));
  }

  function changeScale(direction) {
    var currentIndex = SCALES.indexOf(settings.scale);
    if (currentIndex === -1) currentIndex = 1; // default to 100
    var nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < SCALES.length) {
      setScale(SCALES[nextIndex]);
    }
  }

  function toggleFeature(key, announceFn) {
    settings[key] = !settings[key];
    applyClasses();
    saveSettings(settings);
    updateUIState();
    if (announceFn) {
      announce(announceFn(settings[key]));
    }
  }

  function resetAll() {
    settings = Object.assign({}, defaultSettings);
    applyClasses();
    saveSettings(settings);
    updateUIState();
    announce(t.resetAnnounce);
  }

  function openPanel() {
    if (!elements.panel) {
      renderWidget();
    }
    if (!elements.panel || !elements.trigger) return;
    elements.panel.removeAttribute('hidden');
    void elements.panel.offsetHeight; // trigger reflow for smooth CSS animation
    elements.panel.classList.add('yes-a11y-open');
    elements.trigger.setAttribute('aria-expanded', 'true');
    // Focus close button
    setTimeout(function() {
      if (elements.closeBtn) elements.closeBtn.focus();
    }, 60);
  }

  function closePanel() {
    if (!elements.panel || !elements.trigger) return;
    elements.panel.classList.remove('yes-a11y-open');
    elements.trigger.setAttribute('aria-expanded', 'false');
    setTimeout(function() {
      if (elements.panel && !elements.panel.classList.contains('yes-a11y-open')) {
        elements.panel.setAttribute('hidden', '');
      }
    }, 260);
    elements.trigger.focus();
  }

  function togglePanel() {
    if (elements.panel && elements.panel.classList.contains('yes-a11y-open')) {
      closePanel();
    } else {
      openPanel();
    }
  }

  // Global toggle function
  window.yesA11yToggle = function() {
    togglePanel();
  };

  function renderWidget() {
    if (document.getElementById('yes-a11y-widget')) return;
    if (!document.body) return;

    // Check if css is linked, if not inject it safely
    var existingCss = document.querySelector('link[href*="accessibility.css"]');
    if (!existingCss) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'css/accessibility.css';
      document.head.appendChild(link);
    }

    var widgetWrap = document.createElement('div');
    widgetWrap.id = 'yes-a11y-widget';
    elements.widgetWrap = widgetWrap;

    // Screen reader live region
    var sr = document.createElement('div');
    sr.className = 'yes-a11y-sr-only';
    sr.setAttribute('aria-live', 'polite');
    sr.setAttribute('aria-atomic', 'true');
    elements.srStatus = sr;
    widgetWrap.appendChild(sr);

    // Floating Button (Circular blue button with universal access icon)
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'yes-a11y-trigger';
    btn.id = 'yes-a11y-trigger-btn';
    btn.setAttribute('aria-label', t.openBtn);
    btn.setAttribute('title', t.btnText);
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'yes-a11y-dialog');
    btn.innerHTML =
      '<span class="yes-a11y-trigger-icon">' + ICONS.access + '</span>' +
      '<span class="yes-a11y-badge" aria-hidden="true"></span>';
    btn.addEventListener('click', togglePanel);
    elements.trigger = btn;
    widgetWrap.appendChild(btn);

    // Dialog Panel
    var panel = document.createElement('div');
    panel.id = 'yes-a11y-dialog';
    panel.className = 'yes-a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'yes-a11y-title-id');
    panel.setAttribute('hidden', '');
    elements.panel = panel;

    // Panel Header
    var header = document.createElement('div');
    header.className = 'yes-a11y-header';
    header.innerHTML =
      '<div class="yes-a11y-title-wrap">' +
        '<div class="yes-a11y-icon-pill" aria-hidden="true">' + ICONS.access + '</div>' +
        '<h2 class="yes-a11y-title" id="yes-a11y-title-id">' + t.title + '</h2>' +
      '</div>' +
      '<button type="button" class="yes-a11y-close" id="yes-a11y-close-btn" aria-label="' + t.closeBtn + '">' +
        ICONS.close +
      '</button>';
    panel.appendChild(header);

    // Panel Body
    var body = document.createElement('div');
    body.className = 'yes-a11y-body';

    // 1. Text Size Card
    var textCard = document.createElement('div');
    textCard.className = 'yes-a11y-card';
    textCard.innerHTML =
      '<div class="yes-a11y-card-header">' +
        '<div class="yes-a11y-card-label">' + ICONS.textSize + ' <span>' + t.textSize + '</span></div>' +
        '<span class="yes-a11y-value-badge" id="yes-a11y-scale-val">' + settings.scale + '%</span>' +
      '</div>' +
      '<div class="yes-a11y-btn-group">' +
        '<button type="button" class="yes-a11y-btn" id="yes-a11y-btn-dec" aria-label="' + t.decrease + '">' + t.decrease + '</button>' +
        '<button type="button" class="yes-a11y-btn" id="yes-a11y-btn-reset-scale" aria-label="' + t.reset + '">' + t.reset + '</button>' +
        '<button type="button" class="yes-a11y-btn" id="yes-a11y-btn-inc" aria-label="' + t.increase + '">' + t.increase + '</button>' +
      '</div>';
    body.appendChild(textCard);

    // Helper for toggle rows
    function createToggleRow(id, title, desc, iconSvg, checked) {
      var row = document.createElement('div');
      row.className = 'yes-a11y-toggle-item' + (checked ? ' is-active' : '');
      row.innerHTML =
        '<div class="yes-a11y-toggle-info">' +
          '<div class="yes-a11y-toggle-icon" aria-hidden="true">' + iconSvg + '</div>' +
          '<div class="yes-a11y-toggle-text">' +
            '<div class="yes-a11y-toggle-title">' + title + '</div>' +
            '<div class="yes-a11y-toggle-desc">' + desc + '</div>' +
          '</div>' +
        '</div>' +
        '<label class="yes-a11y-switch" for="' + id + '">' +
          '<input type="checkbox" id="' + id + '" role="switch" ' + (checked ? 'checked aria-checked="true"' : 'aria-checked="false"') + '>' +
          '<span class="yes-a11y-slider" aria-hidden="true"></span>' +
        '</label>';
      return row;
    }

    // 2. High Contrast
    var rowContrast = createToggleRow('yes-a11y-chk-contrast', t.highContrast, t.highContrastDesc, ICONS.contrast, settings.highContrast);
    body.appendChild(rowContrast);
    elements.rowContrast = rowContrast;

    // 3. Highlight Links
    var rowLinks = createToggleRow('yes-a11y-chk-links', t.highlightLinks, t.highlightLinksDesc, ICONS.link, settings.highlightLinks);
    body.appendChild(rowLinks);
    elements.rowLinks = rowLinks;

    // 4. Dyslexic Font
    var rowFont = createToggleRow('yes-a11y-chk-font', t.dyslexicFont, t.dyslexicFontDesc, ICONS.font, settings.dyslexicFont);
    body.appendChild(rowFont);
    elements.rowFont = rowFont;

    // 5. Readable Spacing
    var rowSpacing = createToggleRow('yes-a11y-chk-spacing', t.readableSpacing, t.readableSpacingDesc, ICONS.spacing, settings.readableSpacing);
    body.appendChild(rowSpacing);
    elements.rowSpacing = rowSpacing;

    // 6. Reduce Motion
    var rowMotion = createToggleRow('yes-a11y-chk-motion', t.reduceMotion, t.reduceMotionDesc, ICONS.motion, settings.reduceMotion);
    body.appendChild(rowMotion);
    elements.rowMotion = rowMotion;

    panel.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'yes-a11y-footer';
    footer.innerHTML =
      '<button type="button" class="yes-a11y-reset-btn" id="yes-a11y-btn-reset-all">' +
        ICONS.reset + ' <span>' + t.resetAll + '</span>' +
      '</button>' +
      '<div class="yes-a11y-brand-foot">' + t.brandFoot + '</div>';
    panel.appendChild(footer);

    widgetWrap.appendChild(panel);
    document.body.appendChild(widgetWrap);

    // Save element references
    elements.closeBtn = document.getElementById('yes-a11y-close-btn');
    elements.scaleVal = document.getElementById('yes-a11y-scale-val');
    elements.btnDec = document.getElementById('yes-a11y-btn-dec');
    elements.btnResetScale = document.getElementById('yes-a11y-btn-reset-scale');
    elements.btnInc = document.getElementById('yes-a11y-btn-inc');
    elements.toggleContrast = document.getElementById('yes-a11y-chk-contrast');
    elements.toggleLinks = document.getElementById('yes-a11y-chk-links');
    elements.toggleFont = document.getElementById('yes-a11y-chk-font');
    elements.toggleSpacing = document.getElementById('yes-a11y-chk-spacing');
    elements.toggleMotion = document.getElementById('yes-a11y-chk-motion');
    elements.btnResetAll = document.getElementById('yes-a11y-btn-reset-all');

    // Event Listeners
    elements.closeBtn.addEventListener('click', closePanel);

    elements.btnDec.addEventListener('click', function() { changeScale(-1); });
    elements.btnResetScale.addEventListener('click', function() { setScale(100); });
    elements.btnInc.addEventListener('click', function() { changeScale(1); });

    // Toggles (clicking row or checkbox)
    function bindToggle(row, input, key, fn) {
      row.addEventListener('click', function(e) {
        if (e.target !== input) {
          e.preventDefault();
          toggleFeature(key, fn);
        }
      });
      input.addEventListener('change', function() {
        toggleFeature(key, fn);
      });
    }

    bindToggle(rowContrast, elements.toggleContrast, 'highContrast', t.contrastAnnounce);
    bindToggle(rowLinks, elements.toggleLinks, 'highlightLinks', t.linksAnnounce);
    bindToggle(rowFont, elements.toggleFont, 'dyslexicFont', t.fontAnnounce);
    bindToggle(rowSpacing, elements.toggleSpacing, 'readableSpacing', t.spacingAnnounce);
    bindToggle(rowMotion, elements.toggleMotion, 'reduceMotion', t.motionAnnounce);

    elements.btnResetAll.addEventListener('click', resetAll);

    // Keyboard navigation: Escape key closes panel
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panel.classList.contains('yes-a11y-open')) {
        closePanel();
      }
    });

    // Close on click outside panel
    document.addEventListener('click', function(e) {
      if (panel.classList.contains('yes-a11y-open')) {
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
          var navBtn = document.querySelector('.nav-a11y-btn');
          if (!navBtn || !navBtn.contains(e.target)) {
            closePanel();
          }
        }
      }
    });

    // Tab trap within dialog
    panel.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      var focusables = panel.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    updateUIState();
  }

  // Initialize once DOM body is ready
  function initWidget() {
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
      } else {
        setTimeout(initWidget, 25);
      }
      return;
    }
    renderWidget();
  }

  initWidget();
  document.addEventListener('DOMContentLoaded', initWidget);
  window.addEventListener('load', initWidget);

})();
