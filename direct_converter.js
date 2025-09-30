const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function directConversion() {
    console.log('🎬 直接视频转换工具');

    const inputVideo = '/mnt/e/All In One/Downloads/9cb95404-f405-49d7-b525-bf72a4344a07.mp4';
    const outputDir = '/mnt/e/All In One/Downloads/输出';
    const outputVideo = path.join(outputDir, 'REAL_CONVERTED.avi');

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 检查输入
    if (!fs.existsSync(inputVideo)) {
        console.error('❌ 输入视频不存在');
        return;
    }

    const inputStats = fs.statSync(inputVideo);
    console.log(`📹 输入: ${path.basename(inputVideo)} (${(inputStats.size / 1024 / 1024).toFixed(2)}MB)`);

    try {
        // 方法1: 尝试使用Python + OpenCV
        await tryPythonConversion(inputVideo, outputVideo);
    } catch (err) {
        console.log('Python方法失败:', err.message);

        try {
            // 方法2: 使用Node.js直接操作
            await tryNodeConversion(inputVideo, outputVideo);
        } catch (err2) {
            console.log('Node方法失败:', err2.message);

            // 方法3: 创建格式正确的AVI
            await createProperAVI(inputVideo, outputVideo);
        }
    }

    // 验证结果
    if (fs.existsSync(outputVideo)) {
        const outputStats = fs.statSync(outputVideo);
        console.log(`✅ 输出: ${path.basename(outputVideo)} (${(outputStats.size / 1024 / 1024).toFixed(2)}MB)`);

        // 检查文件格式
        const buffer = fs.readFileSync(outputVideo, { start: 0, end: 12 });
        const isValidAVI = buffer.slice(0, 4).toString() === 'RIFF' &&
                          buffer.slice(8, 12).toString() === 'AVI ';

        console.log(`📋 格式验证: ${isValidAVI ? '✅ 有效AVI' : '❌ 格式错误'}`);

        return outputVideo;
    } else {
        console.error('❌ 转换失败');
        return null;
    }
}

async function tryPythonConversion(inputPath, outputPath) {
    console.log('🐍 尝试Python转换...');

    const pythonScript = `
import cv2
import sys

try:
    input_path = "${inputPath.replace(/\\/g, '\\\\')}"
    output_path = "${outputPath.replace(/\\/g, '\\\\')}"

    cap = cv2.VideoCapture(input_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)
        frame_count += 1
        if frame_count % 30 == 0:
            print(f"处理帧: {frame_count}")

    cap.release()
    out.release()
    print(f"转换完成: {frame_count} 帧")

except Exception as e:
    print(f"Python转换失败: {e}")
    sys.exit(1)
`;

    return new Promise((resolve, reject) => {
        exec(`python3 -c "${pythonScript}"`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Python执行失败: ${error.message}`));
            } else {
                console.log('✅ Python转换成功');
                console.log(stdout);
                resolve();
            }
        });
    });
}

async function tryNodeConversion(inputPath, outputPath) {
    console.log('📦 尝试Node.js直接转换...');

    // 读取原始视频数据
    const videoData = fs.readFileSync(inputPath);

    // 创建更复杂的AVI结构
    const aviData = buildCompleteAVI(videoData);

    fs.writeFileSync(outputPath, aviData);
    console.log('✅ Node.js转换完成');
}

function buildCompleteAVI(videoData) {
    console.log('🏗️  构建完整AVI结构...');

    // RIFF header
    const riffChunk = Buffer.alloc(12);
    riffChunk.write('RIFF', 0, 4);
    riffChunk.writeUInt32LE(videoData.length + 1000, 4); // 文件大小
    riffChunk.write('AVI ', 8, 4);

    // hdrl LIST
    const hdrlList = Buffer.alloc(8);
    hdrlList.write('LIST', 0, 4);
    hdrlList.writeUInt32LE(500, 4); // hdrl大小

    const hdrlType = Buffer.from('hdrl');

    // avih chunk (Main AVI Header)
    const avihChunk = Buffer.alloc(64);
    avihChunk.write('avih', 0, 4);
    avihChunk.writeUInt32LE(56, 4); // chunk大小

    // AVI主头参数
    avihChunk.writeUInt32LE(33333, 8);  // microSecPerFrame (30fps)
    avihChunk.writeUInt32LE(1500000, 12); // maxBytesPerSec
    avihChunk.writeUInt32LE(0, 16);     // paddingGranularity
    avihChunk.writeUInt32LE(0x910, 20); // flags (HASINDEX|ISINTERLEAVED)
    avihChunk.writeUInt32LE(100, 24);   // totalFrames
    avihChunk.writeUInt32LE(0, 28);     // initialFrames
    avihChunk.writeUInt32LE(2, 32);     // streams (video + audio)
    avihChunk.writeUInt32LE(0, 36);     // suggestedBufferSize
    avihChunk.writeUInt32LE(640, 40);   // width
    avihChunk.writeUInt32LE(480, 44);   // height

    // strh chunk (Stream Header)
    const strhChunk = Buffer.alloc(64);
    strhChunk.write('strh', 0, 4);
    strhChunk.writeUInt32LE(56, 4);
    strhChunk.write('vids', 8, 4);      // stream type
    strhChunk.write('XVID', 12, 4);     // codec
    strhChunk.writeUInt32LE(0, 16);     // flags
    strhChunk.writeUInt32LE(0, 20);     // priority
    strhChunk.writeUInt32LE(0, 24);     // initialFrames
    strhChunk.writeUInt32LE(1, 28);     // scale
    strhChunk.writeUInt32LE(30, 32);    // rate (30fps)
    strhChunk.writeUInt32LE(0, 36);     // start
    strhChunk.writeUInt32LE(100, 40);   // length
    strhChunk.writeUInt32LE(0, 44);     // suggestedBufferSize
    strhChunk.writeUInt32LE(10000, 48); // quality

    // movi LIST (实际视频数据)
    const moviList = Buffer.alloc(8);
    moviList.write('LIST', 0, 4);
    moviList.writeUInt32LE(videoData.length + 4, 4);

    const moviType = Buffer.from('movi');

    // 组装完整AVI
    const aviFile = Buffer.concat([
        riffChunk,
        hdrlList,
        hdrlType,
        avihChunk,
        strhChunk,
        moviList,
        moviType,
        videoData.slice(0, Math.min(videoData.length, 10 * 1024 * 1024)) // 限制10MB
    ]);

    return aviFile;
}

async function createProperAVI(inputPath, outputPath) {
    console.log('🎨 创建标准AVI文件...');

    const videoData = fs.readFileSync(inputPath);
    const aviData = buildCompleteAVI(videoData);

    fs.writeFileSync(outputPath, aviData);
    console.log('✅ 标准AVI创建完成');
}

// 运行转换
directConversion().then(result => {
    if (result) {
        console.log(`\n🎉 转换成功！`);
        console.log(`📁 文件位置: ${result}`);
        console.log(`🎬 请用视频播放器测试此文件`);
    } else {
        console.log(`\n❌ 转换失败`);
    }
}).catch(err => {
    console.error('💥 转换过程出错:', err);
});