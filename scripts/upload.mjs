/**
 * 微信小程序上传脚本（miniprogram-ci，模板已内置该依赖）
 *
 * 凭据从环境变量读取（不要把 AppID/私钥写进代码或提交到 git）：
 *   WX_APPID     小程序 AppID，wx 开头
 *   WX_PRIVATE_KEY_PATH  代码上传密钥 private.wx....key 的本地路径
 *
 * 用法：
 *   node scripts/upload.mjs           # 构建 weapp 并上传为「体验版」
 *   node scripts/upload.mjs preview   # 构建并生成预览二维码图片（真机扫码）
 *
 * 前置：
 *   1. 公众平台 → 开发管理 → 开发设置 → AppID
 *   2. 同页「小程序代码上传密钥」下载 .key 文件；并把本机出口 IP 加入 IP 白名单
 *      （或临时关闭白名单）。
 *   3. npm run build:weapp 产物在 dist/（本脚本默认自动构建，如已构建可设 SKIP_BUILD=1）
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ci from 'miniprogram-ci';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] === 'preview' ? 'preview' : 'upload';

const appid = process.env.WX_APPID;
const keyPath = process.env.WX_PRIVATE_KEY_PATH;

function fail(msg) {
  console.error(`[upload] ${msg}`);
  process.exit(1);
}

if (!appid || !/^wx[0-9a-f]{16}$/i.test(appid)) {
  fail('缺少有效的 WX_APPID（wx 开头 18 位）。先在公众平台注册小程序并设置环境变量。');
}
if (!keyPath || !fs.existsSync(keyPath)) {
  fail('找不到上传密钥：请设置 WX_PRIVATE_KEY_PATH 指向下载的 private.wx....key 文件。');
}
const privateKey = fs.readFileSync(keyPath, 'utf8');

// 1. 构建微信小程序产物
if (!process.env.SKIP_BUILD) {
  console.log('[upload] 开始构建 weapp …');
  try {
    execSync('npm run build:weapp', { cwd: ROOT, stdio: 'inherit', env: { ...process.env, TARO_APP_ID: appid } });
  } catch (e) {
    fail('构建失败，请先修复编译错误。');
  }
}

const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(path.join(distDir, 'app.json'))) {
  fail('dist/app.json 不存在，构建产物异常。');
}

// 2. 创建项目与 CI 实例
const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath: distDir,
  privateKey,
  ignores: ['node_modules/**/*'],
});

const version = process.env.WX_VERSION || `1.0.${Math.floor(Date.now() / 1000) - 1760000000}`;
const desc = process.env.WX_DESC || `高性价比人生指南离线版 ${new Date().toISOString().slice(0, 10)}`;
const setting = { es6: true, minify: true, autoPrefixWXSS: true };

const onProgress = (log) => {
  if (log && log._status) process.stdout.write(`\r[upload] ${log._status} ${(log._progress || 0).toFixed(1)}%`);
};

(async () => {
  if (mode === 'preview') {
    console.log('[upload] 生成预览二维码 …');
    const res = await ci.preview({
      project,
      desc,
      setting,
      qrcodeFormat: 'image',
      qrcodeOutputDest: path.join(ROOT, 'preview-qrcode.png'),
      onProgressUpdate: onProgress,
    });
    console.log('\n[upload] 预览二维码已生成：preview-qrcode.png');
    if (res.subPackageInfo) {
      console.log('[upload] 分包体积：', res.subPackageInfo.map((p) => `${p.name || '主包'} ${(p.size / 1024).toFixed(0)}KB`).join(' / '));
    }
    return;
  }
  console.log(`[upload] 上传体验版 v${version} …`);
  const res = await ci.upload({
    project,
    version,
    desc,
    setting,
    onProgressUpdate: onProgress,
  });
  console.log('\n[upload] 上传成功 ✅');
  if (res.subPackageInfo) {
    console.log('[upload] 分包体积：', res.subPackageInfo.map((p) => `${p.name || '主包'} ${(p.size / 1024).toFixed(0)}KB`).join(' / '));
  }
  console.log('[upload] 下一步：公众平台 → 版本管理 → 把该版本设为体验版自测，确认无误后「提交审核」。');
})().catch((e) => {
  console.error('\n[upload] 上传失败：', e.message || e);
  if (/ip/i.test(e.message || '')) {
    console.error('[upload] 多半是 IP 白名单问题：公众平台 → 开发设置 → 小程序代码上传 → IP 白名单，加入本机出口 IP（或临时关闭）。');
  }
  process.exit(1);
});
