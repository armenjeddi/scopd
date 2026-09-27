(() => {
  'use strict';
  const config = window.SCOPD_SITE || {};
  const data = window.SCOPD_RESULTS;
  const select = (selector) => document.querySelector(selector);
  const selectAll = (selector) => [...document.querySelectorAll(selector)];

  // No fetch or build step: opening index.html directly also works.
  function publicUrl(value, local = false) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      if (['https:', 'http:'].includes(url.protocol)) return url.href;
      if (local && url.protocol === 'file:') return url.href;
    } catch { /* Incomplete metadata is simply omitted. */ }
    return null;
  }

  const paperUrl = publicUrl(config.paperUrl, true);
  if (paperUrl) selectAll('[data-paper-link]').forEach((link) => { link.href = paperUrl; });
  for (const [key, selector] of [['arxivUrl', '#arxiv-link'], ['codeUrl', '#code-link']]) {
    const url = publicUrl(config[key]);
    if (!url) continue;
    const link = select(selector);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.hidden = false;
  }
  const arxivMatch = publicUrl(config.arxivUrl)?.match(/^https?:\/\/arxiv\.org\/abs\/(\d{4}\.\d{4,5}(?:v\d+)?)(?:[?#].*)?$/);
  if (arxivMatch) select('#publication-label').textContent = 'ARXIV PREPRINT';

  const authors = Array.isArray(config.authors) ? config.authors.filter((author) => author && typeof author.name === 'string' && author.name.trim()) : [];
  if (authors.length) {
    const affiliations = Array.isArray(config.affiliations) ? config.affiliations : [];
    select('#author-block').hidden = false;
    for (const author of authors) {
      const wrapper = document.createElement('span');
      wrapper.className = 'author';
      const url = publicUrl(author.url);
      const name = document.createElement(url ? 'a' : 'span');
      name.textContent = author.name;
      if (url) { name.href = url; name.target = '_blank'; name.rel = 'noopener noreferrer'; }
      wrapper.append(name);
      const indices = Array.isArray(author.affiliations) ? author.affiliations.filter((index) => Number.isInteger(index) && index > 0 && index <= affiliations.length) : [];
      if (indices.length) {
        const superscript = document.createElement('sup');
        superscript.textContent = indices.join(',');
        wrapper.append(superscript);
      }
      select('#authors').append(wrapper);
    }
    affiliations.forEach((affiliation, index) => {
      const span = document.createElement('span');
      span.className = 'affiliation';
      const superscript = document.createElement('sup');
      superscript.textContent = String(index + 1);
      span.append(superscript, document.createTextNode(` ${affiliation}`));
      select('#affiliations').append(span);
    });
  }

  // A citation is only exposed once actual publication metadata is available.
  if (authors.length && arxivMatch && /^\d{4}$/.test(String(config.year))) {
    const bibEscape = (value) => String(value).replace(/([{}&%_$#])/g, '\\$1');
    const key = String(config.citationKey || 'scopd').replace(/[^a-zA-Z0-9:_-]/g, '');
    const citation = `@misc{${key || 'scopd'},\n  title = {SCOPD: Sparse-Context On-Policy Self-Distillation for Efficient Vision-Language Models},\n  author = {${authors.map((author) => bibEscape(author.name)).join(' and ')}},\n  year = {${config.year}},\n  eprint = {${arxivMatch[1]}},\n  archivePrefix = {arXiv},\n  url = {https://arxiv.org/abs/${arxivMatch[1]}}\n}`;
    select('#bibtex').textContent = citation;
    select('#citation').hidden = false;
    select('#copy-citation').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(citation);
        select('#copy-status').textContent = 'BibTeX copied to clipboard.';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(select('#bibtex'));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        select('#copy-status').textContent = 'Citation selected. Press Ctrl+C (or ⌘C) to copy.';
      }
    });
  }

  const retainedTokens = new Set([4, 17, 23, 38, 42, 55, 61, 76, 88, 93]);
  selectAll('.token-grid').forEach((grid) => {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 100; index++) {
      const token = document.createElement('i');
      if (retainedTokens.has(index)) token.className = 'retained';
      fragment.append(token);
    }
    grid.append(fragment);
  });

  function renderResults(budget) {
    const result = data?.budgets[budget];
    if (!result) return;
    selectAll('[data-budget]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.budget === budget)));
    selectAll('.result-row').forEach((row) => {
      const score = result.aggregate[row.dataset.method];
      row.querySelector('.result-track > span').style.setProperty('--score', `${score / 105 * 100}%`);
      row.querySelector('strong').textContent = score.toFixed(2);
    });
    select('#results-chart').setAttribute('aria-label', `Aggregate results at ${budget}% visual-token retention`);
    const delta = (result.aggregate['SCOPD+'] - result.aggregate.Vanilla).toFixed(2);
    const highlight = document.createElement('strong');
    highlight.textContent = `+${delta} points`;
    select('#result-summary').replaceChildren(highlight, document.createTextNode(` over Vanilla at ${budget}% visual-token retention.${budget === '100' ? ' The main benefit emerges under sparse visual context.' : ''}`));
    const body = select('#benchmark-table tbody');
    body.replaceChildren();
    data.benchmarks.forEach((name, index) => {
      const row = document.createElement('tr');
      const heading = document.createElement('th');
      heading.scope = 'row';
      heading.textContent = name;
      row.append(heading);
      const values = [data.reference[index], result.Vanilla[index], result.SCOPD[index], result['SCOPD+'][index]];
      values.forEach((value, column) => {
        const cell = document.createElement('td');
        cell.textContent = value.toFixed(2);
        if (column > 0 && value === Math.max(...values.slice(1))) cell.style.fontWeight = '700';
        row.append(cell);
      });
      body.append(row);
    });
    select('#table-description').textContent = `Raw benchmark scores at ${budget}% visual-token retention. The full-context Vanilla reference is shown for comparison. Bold indicates the best score among the three methods at this budget.`;
  }
  selectAll('[data-budget]').forEach((button) => button.addEventListener('click', () => renderResults(button.dataset.budget)));
  renderResults('10');

  const dialog = select('#figure-dialog');
  if (typeof dialog.showModal === 'function') {
    selectAll('[data-zoom]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      const image = link.querySelector('img');
      dialog.querySelector('img').src = link.href;
      dialog.querySelector('img').alt = image.alt;
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }));
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  }

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
