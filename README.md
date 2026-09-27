# SCOPD project page

Project page for **SCOPD: Sparse-Context On-Policy Self-Distillation for Efficient Vision-Language Models**.

**Live:** <https://armenjeddi.github.io/scopd/>

A static site with no build step. GitHub Pages serves the `main` branch root directly, so every push to `main` redeploys the page.

## Editing

| What | Where |
| --- | --- |
| arXiv, code and Hugging Face links | `links` in `site.config.js`. An empty string shows a greyed-out "Soon" button. Setting `arxiv` also fills the arXiv ID into the BibTeX. |
| Authors, homepages, affiliations | `authors` / `affiliations` in `site.config.js` |
| Page text | `index.html` |
| Result numbers (Tables 1 and 2) | `results.data.js` |
| Styles (light and dark) | `styles.css` |
| Paper figures | `assets/figures/` |

## Local preview

```sh
python -m http.server 8000   # then open http://localhost:8000
```

Initial implementation by Enming Zhang ([Enmingzz/scopd](https://github.com/Enmingzz/scopd)). Layout inspired by [AC3D](https://snap-research.github.io/ac3d/).
