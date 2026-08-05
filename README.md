# StarCove ND 百科 V0.5

> 一个从功能体验、身体医学、支持需求与最新研究出发，帮助神经多样性人群理解自己并找到可行帮助的无障碍百科。

这是一个纯静态、数据驱动、可部署到 GitHub Pages 或 Netlify 的知识网站。内容与界面分离，适合持续增加百科主题、医学导航、研究摘要和外部资源。

## 这份代码已经包含

- **V0.3**：固定颜色语法、模块层级、阅读设置、字体与版面参数、阅读尺/聚光/覆膜、搜索关键词高亮。
- **V0.4**：第0章、八维功能支持画像、个人“神经系统使用说明”、九大身体医学系统地图。
- **V0.5**：按时间排列的研究库、人工标签与自动标签、可视化研究卡片、PubMed候选收件箱、GitHub定时收集与人工审核工作流。

当前构建数据：103 个百科主题、7 个第0章页面、9 个医学系统、5 篇人工审阅研究、67 个资源入口。

## 最简单的发布方式：GitHub Pages

完整步骤见 [START-HERE.md](START-HERE.md) 和 [docs/GITHUB-DEPLOY.md](docs/GITHUB-DEPLOY.md)。

1. 在 GitHub 创建一个**公开仓库**，建议命名 `starcove-nd-atlas`。
2. 把本项目根目录中的全部文件上传到仓库，必须保留 `.github/workflows/`。
3. 打开仓库 `Settings → Pages`。
4. 在 `Build and deployment → Source` 选择 **GitHub Actions**。
5. 打开 `Actions`，等待 **Deploy GitHub Pages** 完成。
6. 站点通常位于：`https://你的用户名.github.io/starcove-nd-atlas/`。

GitHub Pages 版本使用哈希路由，文章网址类似：

```text
https://你的用户名.github.io/starcove-nd-atlas/#/topic/pots
```

这样可以避免在仓库子路径下刷新深层页面时出现 404。

## 本地预览

需要 Node.js 20 或更高版本。

```bash
npm ci
npm run dev
```

然后访问：

```text
http://127.0.0.1:8080
```

## 常用命令

```bash
npm run validate          # 检查内容结构、ID、来源URL、日期和引用
npm test                  # 内容校验 + 静态构建烟雾测试
npm run build             # 本地/通用哈希路由构建
npm run build:github      # GitHub Pages 构建
npm run build:netlify     # Netlify 构建
npm run research:tag      # 根据规则重算研究自动标签
npm run research:collect  # 从 PubMed 收集候选，仅写入收件箱
```

构建产物在 `dist/`。不要直接修改 `dist/`，它会在下一次构建时重新生成。

## 内容放在哪里

```text
content/
├─ site.json               网站名称、定位和编辑原则
├─ intro.json              第0章
├─ topics.json             百科与医学主题
├─ medical-systems.json    医学系统地图
├─ research.json           已人工审阅研究
├─ research-inbox.json     自动收集的待审研究
├─ resources.json          外部资源
├─ aliases.json            搜索别名
├─ tag-rules.json          自动标签规则
└─ research-sources.json   期刊与PubMed检索源
```

新增内容前请阅读 [docs/CONTENT-SCHEMA.md](docs/CONTENT-SCHEMA.md)。

## 医学与研究边界

- 网站用于教育、理解和导航，不替代诊断、急救或个体化医疗建议。
- 自动收集的研究不会直接公开；只有移动到 `research.json` 且标为 `reviewed` 才会显示。
- 自动标签只帮助检索，不代表作者原始分类，也不替代人工阅读。
- 旧版迁移主题已通过结构审核；“结构通过”不等于所有医学结论都完成同行评审。
- 医学条目需要保留：知识类型、关系边界、红旗、来源、审阅日期和“不能据此推出什么”。

完整审核说明见 [docs/CONTENT-AUDIT.md](docs/CONTENT-AUDIT.md)。

## 许可证

- 代码：MIT，见 [LICENSE-CODE](LICENSE-CODE)
- 原创百科文字与图示：见 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)
- 外部论文、书籍、网站与图片仍归原权利人所有，本站只保存必要元数据、短摘要和链接。
