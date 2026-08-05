# 第一次部署：只做这 6 步

## 推荐方法：GitHub Desktop

1. 解压下载包，得到 `starcove-nd-atlas-v0.5` 文件夹。
2. 打开 GitHub Desktop，选择 **File → Add local repository**。
3. 如果提示这里还不是仓库，选择 **create a repository**；名称建议 `starcove-nd-atlas`。
4. 点击 **Publish repository**。建议先设为 Public。
5. 在 GitHub 网页打开仓库：`Settings → Pages → Source → GitHub Actions`。
6. 打开 `Actions`，等待 `Deploy GitHub Pages` 出现绿色勾。

第一次不要连接 Netlify。先确认 GitHub Pages 能正常显示，再决定是否需要 Netlify 的自定义域名和预览功能。

## 发布后检查

- 首页是否显示完整颜色和字体，而不是裸 HTML。
- 搜索“眼前发黑”“听不清”“湿疹”，结果是否出现黄色高亮。
- 打开研究页，年份与标签筛选是否工作。
- 打开 `Aa 阅读设置`，测试字体、行距、纸张模式和阅读尺。
- 刷新 `#/topic/pots`，页面是否仍存在。

## 日常修改

修改 `content/*.json` 后：

```bash
npm run validate
npm test
```

确认通过，再提交到 GitHub。推送到 `main` 会自动重新发布 GitHub Pages，不消耗 Netlify 积分。
