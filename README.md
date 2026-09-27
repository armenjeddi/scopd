# SCOPD 项目主页

基于论文内容制作的英文静态项目页，包含方法图、交互式实验结果、原始分数表和预印本 PDF。无需安装前端依赖或运行构建命令，可直接部署到 GitHub Pages。

## 本地预览

在项目目录运行：

```sh
python -m http.server 8000
```

浏览器打开 <http://localhost:8000>。结束预览时在终端按 `Ctrl+C`。

## 补充公开信息

编辑 `site.config.js`：

| 字段 | 内容 |
| --- | --- |
| `authors` | 作者列表，每项包含 `name`，可选 `url` 和 `affiliations` |
| `affiliations` | 单位名称列表，作者的单位编号从 1 开始 |
| `arxivUrl` | 论文实际的 `https://arxiv.org/abs/...` 地址 |
| `codeUrl` | 公开代码仓库地址 |
| `paperUrl` | 默认使用 `assets/paper/scopd.pdf`，可改为公开论文地址 |
| `year` | 确认后的发表年份 |
| `citationKey` | BibTeX 引用键，默认 `scopd` |

作者格式示例：

```js
authors: [
  { name: 'Author Name', url: 'https://example.com', affiliations: [1] },
],
affiliations: ['University Name'],
```

空的可选信息会自动隐藏。补充真实作者、年份及有效 arXiv 地址后，页面会显示引用信息。不要把示例姓名或地址用作正式信息。

当前下载文件是项目提供的预印本 PDF；网站本身不会上传论文到 arXiv，也不代表论文已经在 arXiv 发布。实际发布后填写 `arxivUrl` 即可启用对应入口。

## 发布到 GitHub Pages

1. 生成只包含公开页面文件的发布包：

   ```sh
   python scripts/package_site.py
   ```

2. 将生成的 `site-release.zip` 解压到一个 GitHub 仓库的根目录，保留 `assets/` 目录结构及 `.nojekyll` 文件；根目录应直接包含 `index.html`。
3. 提交并推送这些文件到仓库的 `main` 分支。
4. 打开仓库 **Settings → Pages**，将 **Source** 设为 **Deploy from a branch**，选择 **main** 和 **/ (root)**，点击 **Save**。
5. 等待部署完成，使用 Pages 设置中显示的网址访问。项目仓库通常对应 `https://用户名.github.io/仓库名/`。

部署选项可参阅 [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

打包脚本使用 Python 标准库和明确的文件白名单；缺少必需文件时会报错。发布包包含页面、脚本、样式及指定的公开图表和 PDF，不包含 `.local/` 中的工作文件或原始输入。新增公开资源时，同步更新 `scripts/package_site.py` 中的 `PUBLIC_FILES`。

## 修改页面

- `index.html`：页面文字和结构。
- `styles.css`：颜色、布局与移动端样式。
- `script.js`：预算切换、图片放大和引用复制。
- `results.data.js`：实验结果数据。
- `assets/figures/`：论文图表。
- `assets/paper/scopd.pdf`：公开预印本。

页面布局参考 [AC3D](https://snap-research.github.io/ac3d/)，已在页脚注明。论文正文与图表的权利归原作者所有。
