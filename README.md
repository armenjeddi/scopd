# SCOPD Project Page

A static project page for SCOPD, featuring method figures, interactive experimental results, per-benchmark scores, and a preprint PDF. No frontend dependencies or build step are required. The site can be deployed directly to GitHub Pages.

**Live site:** [enmingzz.github.io/scopd](https://enmingzz.github.io/scopd/)

## Local Preview

Run the following command from the project directory:

```sh
python -m http.server 8000
```

Open <http://localhost:8000> in your browser. Press `Ctrl+C` in the terminal to stop the server.

## Public Metadata

Edit `site.config.js` to add publication details:

| Field | Description |
| --- | --- |
| `authors` | List of authors, each with a `name` and optional `url` and `affiliations` |
| `affiliations` | List of institution names; author affiliation indices start at 1 |
| `arxivUrl` | The paper's actual `https://arxiv.org/abs/...` URL |
| `codeUrl` | URL of the public research code repository |
| `paperUrl` | Defaults to `assets/paper/scopd.pdf`; can be replaced with a public paper URL |
| `year` | Confirmed publication year |
| `citationKey` | BibTeX citation key; defaults to `scopd` |

Example author configuration:

```js
authors: [
  { name: 'Author Name', url: 'https://example.com', affiliations: [1] },
],
affiliations: ['University Name'],
```

Empty optional fields are automatically hidden. The citation section appears once actual authors, a publication year, and a valid arXiv URL are provided. Replace the example names and URLs with the correct publication details.

The downloadable file is a project-hosted preprint PDF. This website does not upload the paper to arXiv or imply that an arXiv version is already available. Set `arxivUrl` after publication to enable the arXiv link.

## Deploy to GitHub Pages

1. Generate a release archive containing only public site files:

   ```sh
   python scripts/package_site.py
   ```

2. Extract `site-release.zip` into the root of a GitHub repository, preserving the `assets/` directory structure and `.nojekyll` file. The repository root should contain `index.html`.
3. Commit and push these files to the repository's `main` branch.
4. Open **Settings → Pages**, set **Source** to **Deploy from a branch**, select **main** and **/ (root)**, and click **Save**.
5. Wait for deployment to finish, then visit the URL shown in the Pages settings. Project sites typically use `https://USERNAME.github.io/REPOSITORY/`.

See the [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) for publishing options.

The packaging script uses the Python standard library and an explicit file allowlist. It reports an error if a required file is missing. The archive includes the page, scripts, styles, and specified public figures and PDF; it excludes working files in `.local/` and original inputs. When adding a public asset, also update `PUBLIC_FILES` in `scripts/package_site.py`.

## Edit the Site

- `index.html`: Page content and structure.
- `styles.css`: Colors, layout, and responsive styles.
- `script.js`: Token-budget switching, figure enlargement, and citation copying.
- `results.data.js`: Experimental results.
- `assets/figures/`: Paper figures.
- `assets/paper/scopd.pdf`: Public preprint.

The layout is inspired by [AC3D](https://snap-research.github.io/ac3d/), as credited in the page footer. Rights to the paper text and figures remain with their original authors.
