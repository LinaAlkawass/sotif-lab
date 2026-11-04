'use strict';

// SOTIF Lab: demonstration-only tools. These records and calculations are NOT
// conformity evidence and must not be used to approve a safety-critical system.
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const STORAGE_KEY = 'sotif-lab-scenarios-v1';
  const VALID_STATUSES = ['Open', 'Investigating', 'Mitigation planned', 'Testing', 'Reviewed'];
  const VALID_FUNCTIONS = ['AEB', 'ACC', 'LKA', 'Other ADAS'];
  const FIELDS = ['title', 'function', 'status', 'limitation', 'trigger', 'hazard', 'mitigation', 'evidence', 'owner', 'ref'];

  const exampleScenarios = [
    {
      id: 'example-001', title: 'Pedestrian classification under dusk glare',
      function: 'AEB', status: 'Investigating',
      limitation: 'Hypothetical contrast-sensitive perception pipeline may classify a pedestrian too late.',
      trigger: 'Dusk, reflections on a wet road and intermittent pedestrian occlusion.',
      hazard: 'Late brake activation and possible collision with the pedestrian.',
      mitigation: 'Evaluate sensor-fusion robustness, confidence handling and operating-domain constraints.',
      evidence: '', owner: 'Example / unassigned', ref: 'AEB-PEDESTRIAN-001',
      updated: '2026-11-04T10:00:00.000Z', demo: true
    },
    {
      id: 'example-002', title: 'False target response near overhead structure',
      function: 'AEB', status: 'Open',
      limitation: 'Hypothetical object association may confuse stationary overhead objects with path obstacles.',
      trigger: 'Passing under a low bridge with unusual radar reflections.',
      hazard: 'Unnecessary hard braking could increase risk to following traffic.',
      mitigation: 'Evaluate object height, drivable-path filtering and cross-sensor consistency.',
      evidence: '', owner: 'Example / unassigned', ref: 'AEB-STRUCTURE-002',
      updated: '2026-11-04T10:00:00.000Z', demo: true
    },
    {
      id: 'example-003', title: 'Low-contrast vehicle at road crest',
      function: 'ACC', status: 'Mitigation planned',
      limitation: 'Hypothetical target acquisition latency with partial occlusion at a road crest.',
      trigger: 'Crest geometry, low contrast and short visibility horizon.',
      hazard: 'Delayed speed adaptation to a slower vehicle could reduce separation.',
      mitigation: 'Explore conservative speed control when visibility is limited.',
      evidence: 'Proposed: crest-geometry sweep with varied speed and visibility; no tests executed.',
      owner: 'Example / unassigned', ref: 'ACC-CREST-003',
      updated: '2026-11-04T10:00:00.000Z', demo: true
    }
  ];

  function normalizeScenario(item, fallbackId) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw Error('Invalid scenario object');
    const obj = {};
    for (const field of FIELDS) {
      obj[field] = typeof item[field] === 'string' ? item[field].slice(0, field === 'title' ? 120 : 600) : '';
    }
    obj.function = VALID_FUNCTIONS.includes(obj.function) ? obj.function : 'Other ADAS';
    obj.status = VALID_STATUSES.includes(obj.status) ? obj.status : 'Open';
    if (!obj.title.trim() || !obj.limitation.trim() || !obj.trigger.trim() || !obj.hazard.trim()) {
      throw Error('Every scenario needs a title, insufficiency, trigger and hazard');
    }
    obj.id = typeof item.id === 'string' && /^[\w-]{1,100}$/.test(item.id) ? item.id : fallbackId;
    obj.updated = typeof item.updated === 'string' && !Number.isNaN(Date.parse(item.updated)) ? item.updated : new Date().toISOString();
    obj.demo = item.demo === true;
    return obj;
  }

  function uid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `scenario-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  let scenarios;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    scenarios = saved === null ? exampleScenarios.map((r) => ({ ...r })) : JSON.parse(saved).map((r) => normalizeScenario(r, uid()));
    if (scenarios.length > 500) throw Error('Too many records');
  } catch (error) {
    console.warn('Unable to restore saved scenarios:', error);
    scenarios = exampleScenarios.map((r) => ({ ...r }));
  }

  let toastTimer;
  function notify(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
      return true;
    } catch (error) {
      console.warn('Unable to persist scenarios:', error);
      notify('Browser storage unavailable. Export a JSON copy to avoid losing changes.');
      return false;
    }
  }

  // ---------- Navigation ----------
  const names = {
    overview: 'Overview', learn: 'Learn SOTIF', 'case-study': 'AEB case study',
    'scenario-lab': 'Scenario workspace', simulator: 'Braking sandbox', resources: 'Resources & sources'
  };
  function route() {
    const requested = location.hash.replace('#', '');
    const page = Object.hasOwn(names, requested) ? requested : 'overview';
    $$('[data-page]').forEach((section) => { section.hidden = section.id !== page; });
    $$('.nav-item').forEach((link) => {
      const active = link.dataset.route === page;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    $('#breadcrumb-current').textContent = names[page];
    $('#sidebar').classList.remove('open');
    $('#menu-button').setAttribute('aria-expanded', 'false');
    window.scrollTo(0, 0);
    document.title = `${names[page]} · SOTIF Lab`;
  }
  window.addEventListener('hashchange', route);
  $('#menu-button').addEventListener('click', () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#menu-button').setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (event) => {
    if (innerWidth <= 860 && $('#sidebar').classList.contains('open') &&
        !$('#sidebar').contains(event.target) && !$('#menu-button').contains(event.target)) {
      $('#sidebar').classList.remove('open');
      $('#menu-button').setAttribute('aria-expanded', 'false');
    }
  });

  // ---------- Scenario ledger ----------
  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function fact(label, value) {
    const wrap = el('div');
    wrap.append(el('span', '', label), el('p', '', value || 'Not yet recorded'));
    return wrap;
  }
  function action(label, operation, id, danger = false) {
    const button = el('button', `text-button${danger ? ' danger' : ''}`, label);
    button.type = 'button';
    button.dataset.action = operation;
    button.dataset.id = id;
    return button;
  }
  function renderScenarios() {
    $('#metric-total').textContent = String(scenarios.length);
    $('#metric-open').textContent = String(scenarios.filter((s) => s.status === 'Open' || s.status === 'Investigating').length);
    $('#metric-evidence').textContent = String(scenarios.filter((s) => s.evidence.trim()).length);
    $('#metric-reviewed').textContent = String(scenarios.filter((s) => s.status === 'Reviewed').length);
    const q = $('#scenario-search').value.trim().toLowerCase();
    const filter = $('#scenario-filter').value;
    const visible = scenarios.filter((s) =>
      (filter === 'all' || s.status === filter) &&
      (!q || [s.title, s.function, s.limitation, s.trigger, s.hazard, s.ref, s.owner].some((val) => val.toLowerCase().includes(q)))
    );
    const list = $('#scenario-list');
    list.replaceChildren();
    if (!visible.length) {
      const empty = el('div', 'empty-state');
      empty.append(el('h3', '', scenarios.length ? 'No matching scenarios' : 'Your workspace is empty'),
                   el('p', '', scenarios.length ? 'Try changing the search or status filter.' : 'Create your first SOTIF scenario record to get started.'));
      list.append(empty);
      return;
    }
    for (const s of visible) {
      const card = el('article', 'scenario-card');
      const top = el('div', 'scenario-card-top');
      const titleWrap = el('div');
      titleWrap.append(el('div', 'scenario-meta', `${s.function} · ${s.ref || 'UNREFERENCED'}${s.demo ? ' · SAMPLE' : ''}`), el('h3', '', s.title));
      const status = el('span', `status-tag status-${s.status.replace(/\s+/g, '-')}`, s.status);
      top.append(titleWrap, status);
      const facts = el('div', 'scenario-facts');
      facts.append(fact('FUNCTIONAL INSUFFICIENCY', s.limitation),
                   fact('TRIGGERING CONDITIONS', s.trigger),
                   fact('POTENTIAL HAZARDOUS BEHAVIOR', s.hazard),
                   fact('PROPOSED MITIGATION', s.mitigation),
                   fact('VALIDATION PLAN / EVIDENCE', s.evidence),
                   fact('RECORD OWNER', s.owner));
      const footer = el('div', 'scenario-card-footer');
      footer.append(el('small', '', `Updated ${formatDate(s.updated)}`));
      const actions = el('div', 'scenario-actions');
      actions.append(action('Edit', 'edit', s.id), action('Duplicate', 'duplicate', s.id), action('Delete', 'delete', s.id, true));
      footer.append(actions);
      card.append(top, facts, footer);
      list.append(card);
    }
  }

  let lastFocused = null;
  function openModal(id = null) {
    lastFocused = document.activeElement;
    $('#scenario-form').reset();
    $('#form-id').value = '';
    $('#modal-heading').textContent = id ? 'Edit scenario' : 'New scenario';
    if (id) {
      const s = scenarios.find((item) => item.id === id);
      if (!s) return;
      $('#form-id').value = id;
      for (const field of FIELDS) {
        const input = $(`#form-${field}`);
        if (input) input.value = s[field];
      }
    }
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#form-title').focus();
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
  $('#new-scenario').addEventListener('click', () => openModal());
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-cancel').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if ($('#modal').hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const focusable = [...$('#modal').querySelectorAll('button:not([disabled]), input:not([type="hidden"]), select, textarea')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('#scenario-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const id = $('#form-id').value;
    const prior = scenarios.find((s) => s.id === id);
    const next = {};
    for (const field of FIELDS) next[field] = $(`#form-${field}`).value.trim();
    next.id = prior ? prior.id : uid();
    next.updated = new Date().toISOString();
    next.demo = false;
    try {
      const valid = normalizeScenario(next, next.id);
      if (prior) scenarios[scenarios.indexOf(prior)] = valid;
      else if (scenarios.length < 500) scenarios.unshift(valid);
      else { notify('500-record workspace limit reached. Export and archive some records.'); return; }
      persist();
      renderScenarios();
      closeModal();
      notify(prior ? 'Scenario updated.' : 'Scenario saved.');
    } catch (err) {
      notify(err.message);
    }
  });
  $('#scenario-list').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const s = scenarios.find((entry) => entry.id === button.dataset.id);
    if (!s) return;
    if (button.dataset.action === 'edit') openModal(s.id);
    if (button.dataset.action === 'duplicate') {
      if (scenarios.length >= 500) { notify('500-record limit reached.'); return; }
      scenarios.unshift({ ...s, id: uid(), title: `${s.title.slice(0, 110)} (copy)`, updated: new Date().toISOString(), demo: false });
      persist(); renderScenarios(); notify('Scenario duplicated.');
    }
    if (button.dataset.action === 'delete' && confirm(`Delete “${s.title}”? This cannot be undone without a backup.`)) {
      scenarios = scenarios.filter((entry) => entry.id !== s.id);
      persist(); renderScenarios(); notify('Scenario deleted.');
    }
  });
  $('#scenario-search').addEventListener('input', renderScenarios);
  $('#scenario-filter').addEventListener('change', renderScenarios);
  $('#load-case').addEventListener('click', () => {
    location.hash = '#scenario-lab';
    const entry = scenarios.find((s) => s.ref === 'AEB-PEDESTRIAN-001');
    openModal(entry ? entry.id : null);
    if (!entry) {
      $('#form-title').value = exampleScenarios[0].title;
      for (const field of ['function', 'limitation', 'trigger', 'hazard', 'mitigation', 'ref']) {
        $(`#form-${field}`).value = exampleScenarios[0][field];
      }
    }
  });

  function download(content, mime, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function csvCell(value) {
    let str = String(value ?? '').replace(/\r\n?/g, '\n');
    // Neutralize spreadsheet formula injection on CSV open (not a guarantee for all importers).
    if (/^[\s]*[=+\-@]/.test(str)) str = `'${str}`;
    return `"${str.replace(/"/g, '""')}"`;
  }
  $('#export-json').addEventListener('click', () => {
    const backup = { format: 'sotif-lab-scenarios', version: 1, exportedAt: new Date().toISOString(), disclaimer: 'Educational demo records; not conformity evidence', scenarios };
    download(JSON.stringify(backup, null, 2), 'application/json', 'sotif-lab-scenarios.json');
    notify('JSON backup exported.');
  });
  $('#export-csv').addEventListener('click', () => {
    const headings = ['id', ...FIELDS, 'updated', 'demo'];
    const csv = [headings.map(csvCell).join(','), ...scenarios.map((s) => headings.map((key) => csvCell(s[key])).join(','))].join('\r\n');
    download('\uFEFF' + csv, 'text/csv;charset=utf-8', 'sotif-lab-scenarios.csv');
    notify('CSV table exported.');
  });
  $('#import-trigger').addEventListener('click', () => $('#import-json').click());
  $('#import-json').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2000000) { notify('Import rejected: maximum file size is 2 MB.'); return; }
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.format !== 'sotif-lab-scenarios' || parsed.version !== 1 || !Array.isArray(parsed.scenarios) || parsed.scenarios.length > 500) {
        throw Error('Not a supported SOTIF Lab JSON backup (v1; max 500 records)');
      }
      const loaded = parsed.scenarios.map((s) => normalizeScenario(s, uid()));
      if (new Set(loaded.map((s) => s.id)).size !== loaded.length) throw Error('Duplicate record IDs in backup');
      if (!confirm(`Replace your current ${scenarios.length} scenario(s) with ${loaded.length} from this backup? Export a backup first if needed.`)) return;
      scenarios = loaded;
      persist(); renderScenarios(); notify('Backup imported.');
    } catch (error) {
      notify(`Import failed: ${error.message}`);
    }
  });
  $('#print-report').addEventListener('click', () => window.print());

  // ---------- Simple braking-distance exploration ----------
  // v [m/s], t [s], a [m/s²] -> d [m] = v*t + v²/(2*a)
  const inputs = ['speed', 'gap', 'latency', 'decel'];
  const presetValues = {
    baseline: { speed: 50, gap: 35, latency: 0.55, decel: 6 },
    wet: { speed: 50, gap: 35, latency: 0.55, decel: 3.5 },
    late: { speed: 50, gap: 35, latency: 1.8, decel: 6 }
  };
  function simValues() {
    return Object.fromEntries(inputs.map((name) => [name, Number($(`#${name}`).value)]));
  }
  const fmt = (num, digits = 1) => num.toFixed(digits);
  function calculateBraking() {
    const { speed, gap, latency, decel } = simValues();
    const v = speed / 3.6;
    const before = v * latency;
    const braking = v * v / (2 * decel);
    const total = before + braking;
    const margin = gap - total;
    const time = latency + v / decel;
    const scale = Math.max(total, gap, 1) * 1.08;
    $('#speed-out').textContent = `${speed} km/h`;
    $('#gap-out').textContent = `${gap} m`;
    $('#latency-out').textContent = `${fmt(latency, 2)} s`;
    $('#decel-out').textContent = `${fmt(decel)} m/s²`;
    $('#result-distance').textContent = fmt(total);
    $('#result-before').textContent = `${fmt(before)} m`;
    $('#result-braking').textContent = `${fmt(braking)} m`;
    $('#result-margin').textContent = `${margin >= 0 ? '+' : ''}${fmt(margin)} m`;
    $('#result-time').textContent = `${fmt(time, 2)} s`;
    $('#gap-label').textContent = `${gap} m`;
    $('#bar-scale').textContent = `${fmt(scale, 0)} m plotted scale`;
    $('#distance-before').style.width = `${before / scale * 100}%`;
    $('#distance-brake').style.width = `${braking / scale * 100}%`;
    $('#obstacle-line').style.left = `${gap / scale * 100}%`;
    const label = $('#result-status');
    label.classList.toggle('negative', margin < 0);
    label.textContent = margin >= 0 ? `+${fmt(margin)} m modeled margin · simplified assumptions` : `${fmt(-margin)} m modeled distance overrun · simplified assumptions`;
  }
  function activatePreset(preset) {
    const values = presetValues[preset];
    if (!values) return;
    for (const [name, value] of Object.entries(values)) $(`#${name}`).value = String(value);
    $$('.preset').forEach((button) => button.classList.toggle('active', button.dataset.preset === preset));
    calculateBraking();
  }
  $$('.preset').forEach((button) => button.addEventListener('click', () => activatePreset(button.dataset.preset)));
  inputs.forEach((name) => $(`#${name}`).addEventListener('input', () => {
    $$('.preset').forEach((button) => button.classList.remove('active'));
    calculateBraking();
  }));
  $('#sim-reset').addEventListener('click', () => activatePreset('baseline'));

  // Init
  renderScenarios();
  calculateBraking();
  route();
})();
