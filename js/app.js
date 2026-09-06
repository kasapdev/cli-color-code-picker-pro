/* =====================================================================
   CLI Color Code Picker Pro — app.js
   Visual picker for terminal ANSI/SGR escape codes: 16-color + 256-color
   palettes, text styles, live mock-terminal preview, and copyable
   Bash / Node.js / raw ANSI output. Classic script, depends on window.WUS.
   ===================================================================== */
(function () {
  'use strict';

  var WUS = window.WUS;
  var STORE_KEY = 'clicolor.state';

  /* =================================================================
     REAL ANSI DATA
     ================================================================= */
  // Standard 16 ANSI colors (SGR 30-37 normal, 90-97 bright foreground;
  // 40-47 / 100-107 background). RGB values are the classic ANSI/VGA
  // reference palette used across terminal documentation.
  var ANSI16 = [
    { name: 'Black',          rgb: '#000000', fg: 30, bg: 40 },
    { name: 'Red',            rgb: '#800000', fg: 31, bg: 41 },
    { name: 'Green',          rgb: '#008000', fg: 32, bg: 42 },
    { name: 'Yellow',         rgb: '#808000', fg: 33, bg: 43 },
    { name: 'Blue',           rgb: '#000080', fg: 34, bg: 44 },
    { name: 'Magenta',        rgb: '#800080', fg: 35, bg: 45 },
    { name: 'Cyan',           rgb: '#008080', fg: 36, bg: 46 },
    { name: 'White',          rgb: '#c0c0c0', fg: 37, bg: 47 },
    { name: 'Bright Black',   rgb: '#808080', fg: 90, bg: 100 },
    { name: 'Bright Red',     rgb: '#ff0000', fg: 91, bg: 101 },
    { name: 'Bright Green',   rgb: '#00ff00', fg: 92, bg: 102 },
    { name: 'Bright Yellow',  rgb: '#ffff00', fg: 93, bg: 103 },
    { name: 'Bright Blue',    rgb: '#0000ff', fg: 94, bg: 104 },
    { name: 'Bright Magenta', rgb: '#ff00ff', fg: 95, bg: 105 },
    { name: 'Bright Cyan',    rgb: '#00ffff', fg: 96, bg: 106 },
    { name: 'Bright White',   rgb: '#ffffff', fg: 97, bg: 107 }
  ];

  // Real xterm 256-color algorithm: 0-15 system colors (reuse ANSI16 RGB),
  // 16-231 a 6x6x6 color cube with real per-component levels, 232-255 a
  // 24-step grayscale ramp.
  var CUBE_LEVELS = [0, 95, 135, 175, 215, 255];
  function build256() {
    var out = [];
    for (var i = 0; i < 16; i++) out.push(ANSI16[i].rgb);
    for (var r = 0; r < 6; r++) {
      for (var g = 0; g < 6; g++) {
        for (var b = 0; b < 6; b++) {
          out.push(rgbToHex(CUBE_LEVELS[r], CUBE_LEVELS[g], CUBE_LEVELS[b]));
        }
      }
    }
    for (var n = 0; n < 24; n++) {
      var v = 8 + n * 10;
      out.push(rgbToHex(v, v, v));
    }
    return out; // index 0..255 == the real ANSI 256-color index
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (c) {
      var h = c.toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }
  var PAL256 = build256();

  var STYLES = [
    { id: 'styleBold', code: 1, css: 'font-weight:700;' },
    { id: 'styleDim', code: 2, css: 'opacity:.6;' },
    { id: 'styleItalic', code: 3, css: 'font-style:italic;' },
    { id: 'styleUnderline', code: 4, css: 'text-decoration:underline;' },
    { id: 'styleBlink', code: 5, css: 'animation: ansiBlink 1s step-start infinite;' },
    { id: 'styleReverse', code: 7, css: '' } // handled specially (swap fg/bg)
  ];

  /* =================================================================
     STATE
     ================================================================= */
  var state = {
    fg: null,       // { type: '16'|'256', code, hex }
    bg: null,
    styles: [],     // array of SGR codes
    pal256Target: 'fg',
    previewText: 'Hello, world!'
  };

  /* ----------------------------- DOM refs ---------------------------- */
  var fgSwatches = document.getElementById('fgSwatches');
  var bgSwatches = document.getElementById('bgSwatches');
  var fgLabel = document.getElementById('fgLabel');
  var bgLabel = document.getElementById('bgLabel');
  var grid256 = document.getElementById('grid256');
  var palTargetSeg = document.getElementById('palTargetSeg');
  var termPreview = document.getElementById('termPreview');
  var previewText = document.getElementById('previewText');
  var statusBadge = document.getElementById('statusBadge');
  var statusText = document.getElementById('statusText');
  var outRaw = document.getElementById('outRaw');
  var outBash = document.getElementById('outBash');
  var outNode = document.getElementById('outNode');

  /* =================================================================
     BUILD SGR CODE LIST
     ================================================================= */
  function buildCodes() {
    // Sensible, predictable order regardless of click order: styles
    // ascending (1,2,3,4,5,7), then foreground, then background.
    var codes = state.styles.slice().sort(function (a, b) { return a - b; });
    if (state.fg) {
      if (state.fg.type === '16') codes.push(state.fg.code);
      else codes.push('38;5;' + state.fg.code);
    }
    if (state.bg) {
      if (state.bg.type === '16') codes.push(state.bg.code);
      else codes.push('48;5;' + state.bg.code);
    }
    return codes;
  }

  function currentLabel(sel) {
    if (!sel) return 'Default';
    if (sel.type === '16') return sel.name;
    return '256: ' + sel.code;
  }

  /* =================================================================
     RENDER: swatches
     ================================================================= */
  function renderSwatches(container, kind) {
    container.innerHTML = '';
    var noneBtn = WUS.el('button', {
      class: 'swatch swatch-none', type: 'button', title: 'Default (no color)',
      onclick: function () { setColor(kind, null); }
    }, [
      WUS.el('span', { class: 'swatch-chip', style: 'background:transparent' }),
      WUS.el('span', { text: 'Default' })
    ]);
    container.appendChild(noneBtn);

    ANSI16.forEach(function (c) {
      var code = kind === 'fg' ? c.fg : c.bg;
      var btn = WUS.el('button', {
        class: 'swatch', type: 'button', title: c.name + ' (' + code + ')',
        onclick: function () { setColor(kind, { type: '16', code: code, hex: c.rgb, name: c.name }); }
      }, [
        WUS.el('span', { class: 'swatch-chip', style: 'background:' + c.rgb }),
        WUS.el('span', { text: c.name.replace('Bright ', 'Br. ') })
      ]);
      btn.dataset.code = String(code);
      container.appendChild(btn);
    });
  }

  function renderGrid256() {
    grid256.innerHTML = '';
    PAL256.forEach(function (hex, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sw256';
      btn.style.background = hex;
      btn.title = idx + ' — ' + hex;
      btn.setAttribute('aria-label', '256-color ' + idx);
      btn.addEventListener('click', function () {
        setColor(state.pal256Target, { type: '256', code: idx, hex: hex });
      });
      grid256.appendChild(btn);
    });
  }

  function setColor(kind, sel) {
    state[kind] = sel;
    refreshActiveStates();
    updateAll();
    persist();
  }

  function refreshActiveStates() {
    [['fg', fgSwatches], ['bg', bgSwatches]].forEach(function (pair) {
      var kind = pair[0], container = pair[1];
      var sel = state[kind];
      var btns = container.querySelectorAll('.swatch');
      btns.forEach(function (b) {
        var isNone = b.classList.contains('swatch-none');
        var active = (!sel && isNone) || (sel && sel.type === '16' && !isNone && Number(b.dataset.code) === sel.code);
        b.classList.toggle('is-active', !!active);
      });
    });
    var sw256 = grid256.querySelectorAll('.sw256');
    sw256.forEach(function (b, idx) {
      var sel = state[state.pal256Target];
      b.classList.toggle('is-active', !!(sel && sel.type === '256' && sel.code === idx));
    });
    fgLabel.textContent = currentLabel(state.fg);
    bgLabel.textContent = currentLabel(state.bg);
  }

  /* =================================================================
     PREVIEW (CSS approximation)
     ================================================================= */
  function updatePreview() {
    var css = '';
    var fgHex = state.fg ? state.fg.hex : '#e6e6e6';
    var bgHex = state.bg ? state.bg.hex : 'transparent';
    var reversed = state.styles.indexOf(7) > -1;
    if (reversed) {
      var tmp = fgHex; fgHex = (bgHex === 'transparent' ? '#0b0d12' : bgHex); bgHex = tmp;
    }
    css += 'color:' + fgHex + ';';
    css += 'background:' + bgHex + ';';
    STYLES.forEach(function (s) {
      if (s.code === 7) return;
      if (state.styles.indexOf(s.code) > -1) css += s.css;
    });
    termPreview.setAttribute('style', css);
    termPreview.textContent = previewText.value || '';
  }

  /* =================================================================
     OUTPUT GENERATION
     ================================================================= */
  function updateOutputs() {
    var codes = buildCodes();
    var text = previewText.value || '';
    var codeStr = codes.join(';');
    var hasCodes = codes.length > 0;

    var raw = hasCodes
      ? '\\x1b[' + codeStr + 'm' + text + '\\x1b[0m'
      : text;
    var bash = hasCodes
      ? 'echo -e "\\033[' + codeStr + 'm' + escapeForShell(text) + '\\033[0m"'
      : 'echo -e "' + escapeForShell(text) + '"';
    var node = hasCodes
      ? "console.log('\\x1b[" + codeStr + "m%s\\x1b[0m', '" + escapeForJs(text) + "');"
      : "console.log('" + escapeForJs(text) + "');";

    outRaw.textContent = raw;
    outBash.textContent = bash;
    outNode.textContent = node;

    statusText.textContent = hasCodes ? codes.length + ' code' + (codes.length === 1 ? '' : 's') + ' active' : 'Default';
    statusBadge.classList.toggle('is-valid', hasCodes);
  }

  function escapeForShell(s) { return s.replace(/(["\\$`])/g, '\\$1'); }
  function escapeForJs(s) { return s.replace(/(['\\])/g, '\\$1'); }

  function updateAll() {
    updatePreview();
    updateOutputs();
  }

  /* =================================================================
     STYLE TOGGLES
     ================================================================= */
  function wireStyles() {
    STYLES.forEach(function (s) {
      var el = document.getElementById(s.id);
      el.addEventListener('change', function () {
        var idx = state.styles.indexOf(s.code);
        if (el.checked && idx === -1) state.styles.push(s.code);
        else if (!el.checked && idx > -1) state.styles.splice(idx, 1);
        updateAll();
        persist();
      });
    });
  }

  function applyStylesToCheckboxes() {
    STYLES.forEach(function (s) {
      document.getElementById(s.id).checked = state.styles.indexOf(s.code) > -1;
    });
  }

  /* =================================================================
     COPY
     ================================================================= */
  function wireCopyButtons() {
    document.getElementById('btnCopyRaw').addEventListener('click', function () {
      WUS.copy(outRaw.textContent, 'Raw ANSI sequence copied');
    });
    document.getElementById('btnCopyBash').addEventListener('click', function () {
      WUS.copy(outBash.textContent, 'Bash command copied');
    });
    document.getElementById('btnCopyNode').addEventListener('click', function () {
      WUS.copy(outNode.textContent, 'Node.js snippet copied');
    });
  }

  /* =================================================================
     256-PALETTE TARGET TOGGLE (fg/bg)
     ================================================================= */
  function wirePalTarget() {
    var btns = palTargetSeg.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
        b.setAttribute('aria-selected', 'true');
        state.pal256Target = b.dataset.target;
        refreshActiveStates();
        persist();
      });
    });
  }

  /* =================================================================
     RESET
     ================================================================= */
  function resetAll() {
    state.fg = null; state.bg = null; state.styles = [];
    previewText.value = 'Hello, world!';
    applyStylesToCheckboxes();
    refreshActiveStates();
    updateAll();
    persist();
    WUS.toast('Selection reset');
  }

  /* =================================================================
     PERSISTENCE
     ================================================================= */
  function persist() {
    WUS.store.set(STORE_KEY, {
      fg: state.fg, bg: state.bg, styles: state.styles,
      pal256Target: state.pal256Target, previewText: previewText.value
    });
  }
  var persistDebounced = WUS.debounce(persist, 300);

  function restore() {
    var saved = WUS.store.get(STORE_KEY, null);
    if (!saved) return;
    state.fg = saved.fg || null;
    state.bg = saved.bg || null;
    state.styles = Array.isArray(saved.styles) ? saved.styles : [];
    state.pal256Target = saved.pal256Target === 'bg' ? 'bg' : 'fg';
    if (typeof saved.previewText === 'string') previewText.value = saved.previewText;

    var btns = palTargetSeg.querySelectorAll('button');
    btns.forEach(function (b) {
      b.setAttribute('aria-selected', b.dataset.target === state.pal256Target ? 'true' : 'false');
    });
    applyStylesToCheckboxes();
  }

  /* =================================================================
     SHORTCUTS HELP MODAL
     ================================================================= */
  var helpBackdrop = document.getElementById('helpBackdrop');
  var helpClose = document.getElementById('helpClose');
  var shortcutRows = document.getElementById('shortcutRows');

  var SHORTCUTS = [
    { keys: ['alt', 'shift', 'R'], desc: 'Reset selection' },
    { keys: ['?'], desc: 'Show this help' },
    { keys: ['Esc'], desc: 'Close dialog' }
  ];

  function buildShortcutTable() {
    var html = '';
    SHORTCUTS.forEach(function (s) {
      var kbds = s.keys.map(function (k) { return '<kbd>' + WUS.escapeHtml(k) + '</kbd>'; }).join('');
      html += '<tr><td>' + WUS.escapeHtml(s.desc) + '</td><td>' + kbds + '</td></tr>';
    });
    shortcutRows.innerHTML = html;
  }

  function openHelp() { helpBackdrop.hidden = false; helpClose.focus(); }
  function closeHelp() { helpBackdrop.hidden = true; }

  helpClose.addEventListener('click', closeHelp);
  helpBackdrop.addEventListener('click', function (e) { if (e.target === helpBackdrop) closeHelp(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !helpBackdrop.hidden) closeHelp();
  });
  var helpBtns = document.querySelectorAll('[data-shortcut-help]');
  for (var i = 0; i < helpBtns.length; i++) helpBtns[i].addEventListener('click', openHelp);

  /* =================================================================
     WIRING
     ================================================================= */
  document.getElementById('btnReset').addEventListener('click', resetAll);
  previewText.addEventListener('input', function () { updateAll(); persistDebounced(); });

  // Note: NOT mod+shift+r — that combo is intercepted by Chrome/Firefox/Edge
  // as the browser's own "hard reload" shortcut before it ever reaches page
  // JS, so a page-level keydown handler can never preventDefault() it. Using
  // alt+shift+r keeps the mnemonic while avoiding a reserved browser combo.
  WUS.registerShortcut('alt+shift+r', function () { resetAll(); }, 'Reset selection');
  WUS.registerShortcut('?', function () { openHelp(); }, 'Show shortcuts');

  /* =================================================================
     INIT
     ================================================================= */
  renderSwatches(fgSwatches, 'fg');
  renderSwatches(bgSwatches, 'bg');
  renderGrid256();
  wireStyles();
  wireCopyButtons();
  wirePalTarget();
  buildShortcutTable();
  restore();
  refreshActiveStates();
  updateAll();
})();
