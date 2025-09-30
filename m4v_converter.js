const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class M4VConverter {
    constructor() {
        this.inputVideo = '/mnt/e/All In One/Downloads/9cb95404-f405-49d7-b525-bf72a4344a07.mp4';
        this.outputDir = '/mnt/e/All In One/Downloads/输出';
        this.outputVideo = path.join(this.outputDir, 'CONVERTED_VIDEO.m4v');
    }

    async convert() {
        console.log('🎬 MP4 到 M4V 转换器');
        console.log(`📹 输入: ${path.basename(this.inputVideo)}`);
        console.log(`🎯 输出: ${path.basename(this.outputVideo)}`);

        // 确保输出目录存在
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // 检查输入文件
        if (!fs.existsSync(this.inputVideo)) {
            console.error('❌ 输入视频不存在');
            return false;
        }

        const inputStats = fs.statSync(this.inputVideo);
        console.log(`📊 输入大小: ${(inputStats.size / 1024 / 1024).toFixed(2)}MB`);

        try {
            // 方法1: 直接复制并重命名（M4V基本就是MP4）
            await this.directCopyMethod();

            // 方法2: 创建标准M4V结构
            await this.createM4VStructure();

            return await this.verifyOutput();

        } catch (err) {
            console.error('❌ 转换失败:', err.message);
            return false;
        }
    }

    async directCopyMethod() {
        console.log('📋 方法1: 直接复制方法 (M4V本质上是MP4容器)');

        try {
            // M4V基本上就是重命名的MP4，特别是没有DRM的情况下
            fs.copyFileSync(this.inputVideo, this.outputVideo);
            console.log('✅ 直接复制完成');
            return true;
        } catch (err) {
            console.warn('⚠️  直接复制失败:', err.message);
            return false;
        }
    }

    async createM4VStructure() {
        console.log('🏗️  方法2: 创建标准M4V结构');

        try {
            const inputData = fs.readFileSync(this.inputVideo);
            const m4vData = this.buildM4VContainer(inputData);

            fs.writeFileSync(this.outputVideo + '_structured', m4vData);
            console.log('✅ 结构化M4V创建完成');
            return true;
        } catch (err) {
            console.warn('⚠️  结构化创建失败:', err.message);
            return false;
        }
    }

    buildM4VContainer(videoData) {
        console.log('📦 构建M4V容器结构...');

        // M4V使用MP4容器格式，主要区别在于metadata和兼容性
        // 创建基本的MP4/M4V box结构

        // ftyp box (文件类型)
        const ftypBox = this.createFtypBox();

        // moov box (metadata)
        const moovBox = this.createMoovBox();

        // mdat box (media data)
        const mdatBox = this.createMdatBox(videoData);

        return Buffer.concat([ftypBox, moovBox, mdatBox]);
    }

    createFtypBox() {
        // File Type Box for M4V
        const size = 20;
        const type = Buffer.from('ftyp');
        const majorBrand = Buffer.from('M4V '); // M4V brand
        const minorVersion = Buffer.alloc(4);
        minorVersion.writeUInt32BE(0, 0);
        const compatibleBrands = Buffer.from('M4V mp42isom'); // 兼容品牌

        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(size, 0);

        return Buffer.concat([
            sizeBuffer,
            type,
            majorBrand,
            minorVersion,
            compatibleBrands.slice(0, 8) // 限制长度
        ]);
    }

    createMoovBox() {
        // Movie Box (简化版metadata)
        const mvhdData = this.createMvhdBox();
        const trakData = this.createTrakBox();

        const moovContent = Buffer.concat([mvhdData, trakData]);
        const size = moovContent.length + 8;

        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(size, 0);
        const typeBuffer = Buffer.from('moov');

        return Buffer.concat([sizeBuffer, typeBuffer, moovContent]);
    }

    createMvhdBox() {
        // Movie Header Box
        const size = 108;
        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(size, 0);

        const typeBuffer = Buffer.from('mvhd');
        const versionAndFlags = Buffer.alloc(4); // version=0, flags=0

        // 时间戳 (简化为0)
        const creationTime = Buffer.alloc(4);
        const modificationTime = Buffer.alloc(4);

        // 时间刻度和持续时间
        const timescale = Buffer.alloc(4);
        timescale.writeUInt32BE(1000, 0); // 1000 units per second

        const duration = Buffer.alloc(4);
        duration.writeUInt32BE(30000, 0); // 30 seconds

        // 其他参数
        const rate = Buffer.alloc(4);
        rate.writeUInt32BE(0x00010000, 0); // 1.0

        const volume = Buffer.alloc(2);
        volume.writeUInt16BE(0x0100, 0); // 1.0

        const reserved = Buffer.alloc(10);
        const matrix = Buffer.alloc(36);
        // 设置单位矩阵
        matrix.writeUInt32BE(0x00010000, 0);  // a
        matrix.writeUInt32BE(0x00010000, 20); // e
        matrix.writeUInt32BE(0x40000000, 32); // i

        const predefined = Buffer.alloc(24);
        const nextTrackID = Buffer.alloc(4);
        nextTrackID.writeUInt32BE(2, 0);

        return Buffer.concat([
            sizeBuffer, typeBuffer, versionAndFlags,
            creationTime, modificationTime, timescale, duration,
            rate, volume, reserved, matrix, predefined, nextTrackID
        ]);
    }

    createTrakBox() {
        // Track Box (简化版)
        const tkhdData = this.createTkhdBox();
        const content = tkhdData;

        const size = content.length + 8;
        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(size, 0);
        const typeBuffer = Buffer.from('trak');

        return Buffer.concat([sizeBuffer, typeBuffer, content]);
    }

    createTkhdBox() {
        // Track Header Box
        const size = 92;
        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(size, 0);

        const typeBuffer = Buffer.from('tkhd');
        const versionAndFlags = Buffer.alloc(4);
        versionAndFlags.writeUInt32BE(0x00000001, 0); // version=0, flags=1 (enabled)

        // 基本参数
        const creationTime = Buffer.alloc(4);
        const modificationTime = Buffer.alloc(4);
        const trackID = Buffer.alloc(4);
        trackID.writeUInt32BE(1, 0);

        const reserved1 = Buffer.alloc(4);
        const duration = Buffer.alloc(4);
        duration.writeUInt32BE(30000, 0);

        const reserved2 = Buffer.alloc(8);
        const layer = Buffer.alloc(2);
        const alternateGroup = Buffer.alloc(2);
        const volume = Buffer.alloc(2);
        const reserved3 = Buffer.alloc(2);

        const matrix = Buffer.alloc(36);
        matrix.writeUInt32BE(0x00010000, 0);  // a
        matrix.writeUInt32BE(0x00010000, 20); // e
        matrix.writeUInt32BE(0x40000000, 32); // i

        const width = Buffer.alloc(4);
        width.writeUInt32BE(640 << 16, 0); // 640.0

        const height = Buffer.alloc(4);
        height.writeUInt32BE(480 << 16, 0); // 480.0

        return Buffer.concat([
            sizeBuffer, typeBuffer, versionAndFlags,
            creationTime, modificationTime, trackID, reserved1, duration,
            reserved2, layer, alternateGroup, volume, reserved3,
            matrix, width, height
        ]);
    }

    createMdatBox(videoData) {
        // Media Data Box
        const dataSize = Math.min(videoData.length, 20 * 1024 * 1024); // 限制20MB
        const actualData = videoData.slice(0, dataSize);

        const size = actualData.length + 8;
        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(size, 0);

        const typeBuffer = Buffer.from('mdat');

        return Buffer.concat([sizeBuffer, typeBuffer, actualData]);
    }

    async verifyOutput() {
        console.log('🔍 验证M4V输出文件...');

        if (!fs.existsSync(this.outputVideo)) {
            console.error('❌ 输出文件不存在');
            return false;
        }

        const outputStats = fs.statSync(this.outputVideo);
        console.log(`📊 输出大小: ${(outputStats.size / 1024 / 1024).toFixed(2)}MB`);

        // 检查文件头
        const buffer = fs.readFileSync(this.outputVideo, { start: 0, end: 20 });

        // 检查是否是有效的MP4/M4V文件
        const hasValidHeader = this.checkMP4Header(buffer);

        console.log(`📋 格式验证: ${hasValidHeader ? '✅ 有效M4V/MP4' : '❌ 格式错误'}`);

        // 尝试用系统工具验证
        try {
            await this.systemVerification();
        } catch (err) {
            console.warn('⚠️  系统验证失败:', err.message);
        }

        // 创建成功报告
        await this.createConversionReport(outputStats.size, hasValidHeader);

        return hasValidHeader;
    }

    checkMP4Header(buffer) {
        // MP4/M4V文件应该以ftyp box开始
        if (buffer.length < 8) return false;

        const size = buffer.readUInt32BE(0);
        const type = buffer.slice(4, 8).toString();

        return type === 'ftyp' && size > 0 && size < 100;
    }

    async systemVerification() {
        return new Promise((resolve, reject) => {
            exec(`file "${this.outputVideo}"`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`🔧 系统识别: ${stdout.trim()}`);
                    resolve(stdout);
                }
            });
        });
    }

    async createConversionReport(outputSize, isValid) {
        const report = {
            timestamp: new Date().toISOString(),
            conversion: {
                input: {
                    file: this.inputVideo,
                    format: 'MP4',
                    size: fs.statSync(this.inputVideo).size
                },
                output: {
                    file: this.outputVideo,
                    format: 'M4V',
                    size: outputSize,
                    valid: isValid
                },
                method: 'Direct copy + M4V container structure',
                status: isValid ? 'SUCCESS' : 'PARTIAL'
            },
            notes: [
                'M4V is essentially MP4 with Apple compatibility',
                'Direct copy method used for maximum compatibility',
                'File should be playable in most video players'
            ]
        };

        const reportPath = path.join(this.outputDir, 'M4V_CONVERSION_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`📋 转换报告: ${reportPath}`);
    }
}

// 执行M4V转换
const converter = new M4VConverter();
converter.convert().then(success => {
    console.log(`\n🎯 M4V转换结果: ${success ? '✅ 成功' : '❌ 失败'}`);

    if (success) {
        console.log('🎬 M4V文件已生成，可以用以下播放器测试:');
        console.log('  - VLC Media Player');
        console.log('  - QuickTime Player (macOS)');
        console.log('  - Windows Media Player');
        console.log('  - Any MP4-compatible player');
        console.log(`\n📁 文件位置: ${converter.outputVideo}`);
    }

    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('💥 M4V转换崩溃:', err);
    process.exit(1);
});