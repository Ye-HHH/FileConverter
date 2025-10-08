# FileConverter

**纯前端文件格式转换工具 - 开箱即用，保护隐私**

## 🚀 [点击访问在线工具](https://Ye-HHH.github.io/FileConverter/)

---

## ✨ 功能特性

- **视频转换**: MP4, MOV, AVI, WEBM, M4V, GIF 互转
- **音频转换**: MP3, WAV, OGG, M4A 互转
- **图片转换**: PNG, JPEG, WEBP, BMP 互转
- **图片转PDF**: 多张图片合并为PDF文档
- **自检功能**: 批量转换并自动验证文件可用性

## 🔐 隐私保护

- ✅ **100%浏览器端处理** - 文件不上传服务器
- ✅ **离线可用** - 集成完整依赖库
- ✅ **无需安装** - 打开网页即可使用

## 📖 使用方法

### 在线使用（推荐）

直接访问 [https://Ye-HHH.github.io/FileConverter/](https://Ye-HHH.github.io/FileConverter/)

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/Ye-HHH/FileConverter.git
cd FileConverter

# 2. 启动本地服务器
npm run serve

# 3. 访问 http://localhost:3210
```

### 自动化测试

```bash
# 安装依赖
npm install

# 运行自检（需指定输入文件和输出目录）
INPUT="/path/to/video.mp4" OUTDIR="/path/to/output" npm test
```

## 🛠 技术栈

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) - 视频/音频转换引擎
- [jsPDF](https://github.com/parallax/jsPDF) - PDF生成库
- Canvas API - 图片格式转换
- Tailwind CSS - UI框架

## 📝 注意事项

- 首次使用需下载 FFmpeg WASM 核心（约24MB），请耐心等待
- GitHub Pages 环境下自动使用单线程模式，转换速度可能较慢
- 大文件转换可能消耗较多内存，建议使用现代浏览器

## 📄 许可证

MIT License

---

**如有问题或建议，欢迎提交 [Issue](https://github.com/Ye-HHH/FileConverter/issues)**
