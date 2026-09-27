(() => {
  'use strict';
  const config = window.SCOPD_SITE || {};
  const data = window.SCOPD_RESULTS;
  const select = (selector) => document.querySelector(selector);
  const selectAll = (selector) => [...document.querySelectorAll(selector)];
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function publicUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      if (['https:', 'http:'].includes(url.protocol)) return url.href;
    } catch { /* Invalid URLs are treated as missing. */ }
    return null;
  }
  const external = (link, href) => { link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; };

  // Resource buttons: live when a URL is configured, otherwise a "Soon" placeholder.
  const links = config.links || {};
  selectAll('[data-link]').forEach((button) => {
    const url = publicUrl(links[button.dataset.link]);
    if (url) {
      external(button, url);
      button.querySelector('.soon')?.remove();
    } else {
      button.classList.add('is-placeholder');
      button.setAttribute('aria-disabled', 'true');
      button.title = 'Coming soon';
    }
  });

  // Authors and affiliations.
  const authors = (config.authors || []).filter((author) => author?.name);
  const affiliations = config.affiliations || [];
  authors.forEach((author) => {
    const item = el('li', 'author');
    const url = publicUrl(author.url);
    const name = el(url ? 'a' : 'span', null, author.name);
    if (url) external(name, url);
    item.append(name);
    const marks = [...(author.affiliations || [])].sort((a, b) => a - b).join(',') + (author.equal ? '*' : '');
    if (marks) item.append(el('sup', null, marks));
    select('#authors').append(item);
  });
  affiliations.forEach((affiliation, index) => {
    const item = el('li', 'affiliation');
    item.append(el('sup', null, String(index + 1)), document.createTextNode(affiliation));
    select('#affiliations').append(item);
  });
  if (!authors.some((author) => author.equal)) select('.equal-note').hidden = true;

  // BibTeX. Uses the arXiv id once `links.arxiv` is set; a placeholder until then.
  const arxivId = publicUrl(links.arxiv)?.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/)?.[1];
  const citation = [
    `@article{${config.citationKey || 'scopd'},`,
    '  title   = {SCOPD: Sparse-Context On-Policy Self-Distillation for Efficient Vision-Language Models},',
    `  author  = {${authors.map((author) => author.bib || author.name).join(' and ')}},`,
    `  journal = {arXiv preprint arXiv:${arxivId || 'XXXX.XXXXX'}},`,
    `  year    = {${config.year || ''}}`,
    '}',
  ].join('\n');
  select('#bibtex').textContent = citation;
  select('#copy-citation').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(citation);
      select('#copy-status').textContent = 'Copied to clipboard.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(select('#bibtex'));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      select('#copy-status').textContent = 'Selected. Press Ctrl+C (⌘C) to copy.';
    }
  });

  // Schematic token grids in the teaser.
  const retainedTokens = new Set([4, 17, 23, 38, 42, 55, 61, 76, 88, 93]);
  selectAll('.token-grid').forEach((grid) => {
    for (let index = 0; index < 100; index++) grid.append(el('i', retainedTokens.has(index) ? 'retained' : null));
  });

  // Dot plot: position encodes the score on a shared axis, so a zoomed axis is honest.
  function dotPlot(container, rowSpecs, { min, max, ticks, reference }) {
    const x = (value) => `${((value - min) / (max - min)) * 100}%`;
    const layer = el('div', 'dp-layer');
    ticks.forEach((tick) => {
      const line = el('span', tick === reference ? 'dp-grid dp-reference' : 'dp-grid');
      line.style.left = x(tick);
      layer.append(line);
    });
    const axis = el('div', 'dp-axis');
    ticks.forEach((tick) => {
      const label = el('span', null, tick === reference ? `${tick} = unpruned` : String(tick));
      label.style.left = x(tick);
      axis.append(label);
    });
    const rows = new Map();
    rowSpecs.forEach(({ key, label, className }) => {
      const row = el('div', `dp-row ${className || ''}`);
      const track = el('div', 'dp-track');
      const dot = el('span', 'dp-dot');
      track.append(dot);
      const value = el('span', 'dp-value');
      row.append(el('span', 'dp-name', label), track, value);
      container.append(row);
      rows.set(key, { dot, value, row });
    });
    container.append(layer, axis);
    return (values, deltas = {}) => {
      rows.forEach(({ dot, value, row }, key) => {
        dot.style.left = x(values[key]);
        value.replaceChildren(document.createTextNode(values[key].toFixed(2)));
        if (deltas[key] !== undefined) value.append(el('small', null, `${deltas[key] >= 0 ? '+' : '−'}${Math.abs(deltas[key]).toFixed(2)}`));
        row.title = `${row.querySelector('.dp-name').textContent}: ${values[key].toFixed(2)}`;
      });
    };
  }

  // Main results.
  const methods = [
    { key: 'Vanilla', label: 'Base model' },
    { key: 'SFT', label: 'SFT' },
    { key: 'EPIC', label: 'EPIC' },
    { key: 'GRPO', label: 'GRPO' },
    { key: 'SCOPD', label: 'SCOPD', className: 'dp-scopd' },
    { key: 'SCOPD+', label: 'SCOPD+', className: 'dp-ours' },
  ];
  const updateResults = dotPlot(select('#results-chart'), methods, { min: 83, max: 102, ticks: [85, 90, 95, 100], reference: 100 });

  function renderResults(budget) {
    const result = data?.budgets[budget];
    if (!result) return;
    selectAll('[data-budget]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.budget === budget)));
    const base = result.aggregate.Vanilla;
    const deltas = Object.fromEntries(methods.slice(1).map(({ key }) => [key, result.aggregate[key] - base]));
    updateResults(result.aggregate, deltas);
    select('#results-chart').setAttribute('aria-label', `Normalized scores at ${budget}% visual tokens. ${methods.map(({ key, label }) => `${label} ${result.aggregate[key].toFixed(2)}`).join(', ')}.`);

    const gain = (result.aggregate['SCOPD+'] - base).toFixed(2);
    select('#result-summary').textContent = budget === '100'
      ? 'With all tokens, every method stays near 100: SCOPD adapts the model to sparse context rather than acting as generic post-training.'
      : `At ${budget}% of visual tokens, SCOPD+ adds +${gain} points over the base model and beats every post-training baseline. Numbers beside each score are the change vs. the base model.`;

    const body = select('#benchmark-table tbody');
    body.replaceChildren();
    data.benchmarks.forEach((name, index) => {
      const row = el('tr');
      const heading = el('th', null, name);
      heading.scope = 'row';
      row.append(heading);
      const values = [data.reference[index], result.Vanilla[index], result.SCOPD[index], result['SCOPD+'][index]];
      const best = Math.max(...values.slice(1));
      values.forEach((value, column) => {
        const cell = el('td', column > 0 && value === best ? 'best' : null, value.toFixed(2));
        row.append(cell);
      });
      body.append(row);
    });
    select('#table-description').textContent = `Raw scores at ${budget}% visual tokens; bold marks the best of the three models at this budget. Table 1.`;
  }
  selectAll('[data-budget]').forEach((button) => button.addEventListener('click', () => renderResults(button.dataset.budget)));
  renderResults('10');

  // Token-selection ablation.
  const selection = window.SCOPD_SELECTION || [];
  const updateSelection = dotPlot(
    select('#selection-chart'),
    selection.map((row) => ({ key: row.name, label: row.name, className: row.ours ? 'dp-ours' : '' })),
    { min: 88, max: 96, ticks: [88, 90, 92, 94, 96] },
  );
  updateSelection(Object.fromEntries(selection.map((row) => [row.name, row.score])));

  // Figure lightbox.
  const dialog = select('#figure-dialog');
  if (typeof dialog.showModal === 'function') {
    selectAll('[data-zoom]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      const image = dialog.querySelector('img');
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }));
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  }

  // Highlight the nav entry for the section in view.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        selectAll('nav a').forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px' });
    selectAll('main section[id]').forEach((section) => observer.observe(section));
  }
})();
