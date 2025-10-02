# FileConverter

#### [点击这里访问在线工具](https://Ye-HHH.github.io/FileConverter/)

## 自检（全自动）

本仓库已内置“自检”面板（前端页面 Tab），支持在浏览器内：选择输入视频 → 批量转换为多种格式 → 自动验证可播放性 → 写入输出目录（或回退为下载）→ 生成报告 JSON。

此外还提供 Node 自动化脚本（可选）：

1. 安装依赖（需要网络以安装 Playwright 浏览器）

```
npm i -D playwright
```

2. 运行自检（默认输入/输出路径可用环境变量覆盖）

```
INPUT="/mnt/e/All In One/Downloads/格式转化.mp4" \
OUTDIR="/mnt/e/All In One/Downloads/输出" \
node tools/selftest.js
```

脚本会：
- 启动本地静态服务（无需后端）
- 打开浏览器，进入“自检”页签
- 选择输入视频，默认转换 mp4/m4v/webm
- 拦截下载并保存到 `OUTDIR`
- 最终在输出目录生成转换产物与 `SelfTest_*.json` 报告

注意：若在 GitHub Pages 上使用，页面会自动选择单线程核心（无需 COOP/COEP），可直接在浏览器完成转换。
