/**
 * 抖音小程序上传脚本（tt-ide-cli）
 *
 * 抖音使用交互式登录（浏览器扫码），不需要密钥文件。
 * 首次使用先执行登录：npm run upload:tt:login
 *
 * 用法：
 *   npm run upload:tt            # 构建 tt 并上传到开发者平台
 *   npm run upload:tt:preview    # 构建并生成预览二维码
 *   npm run upload:tt:login      # 登录开发者平台（首次使用）
 *
 * 前置：
 *   1. 在 https://developer.open-douyin.com 注册小程序，获取 AppID（tt 开头）
 *   2. 把 AppID 填入 project.tt.json 的 appid 字段
 *   3. 执行 npm run upload:tt:login 完成登录
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] === 'preview' ? 'preview' : 'upload';
const distDir = path.join(ROOT, 'dist');

function fail(msg) {
  console.error(`[upload-tt] ${msg}`);
  process.exit(1);
}

// 检查 project.tt.json 的 appid
const ttConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'project.tt.json'), 'utf8'));
if (!ttConfig.appid || ttConfig.appid === 'touristappid') {
  fail('project.tt.json 的 appid 还是占位值 touristappid。请先在抖音开发者平台注册小程序，把真实 AppID 填进去。');
}

// 1. 构建抖音小程序产物
if (!process.env.SKIP_BUILD) {
  console.log('[upload-tt] 开始构建 tt …');
  try {
    execSync('npm run build:tt', { cwd: ROOT, stdio: 'inherit' });
  } catch (e) {
    fail('构建失败，请先修复编译错误。');
  }
}

if (!fs.existsSync(path.join(distDir, 'app.json'))) {
  fail('dist/app.json 不存在，构建产物异常。');
}

const version = process.env.TT_VERSION || `1.0.${Math.floor(Date.now() / 1000) - 1760000000}`;
const changelog = process.env.TT_DESC || `高性价比人生指南离线版 ${new Date().toISOString().slice(0, 10)}`;
const qrcodePath = path.join(ROOT, 'preview-qrcode.png');

// 2. 检查登录状态
console.log('[upload-tt] 检查登录状态 …');
try {
  execSync('npx tt-ide-cli check-session', { cwd: ROOT, stdio: 'pipe', env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' } });
  console.log('[upload-tt] 已登录 ✓');
} catch {
  fail('未登录抖音开发者平台。请先执行：npm run upload:tt:login（浏览器扫码登录）');
}

// 3. 上传或预览
const cmd =
  mode === 'preview'
    ? `npx tt-ide-cli preview "${distDir}" --qrcode-output "${qrcodePath}"`
    : `npx tt-ide-cli upload "${distDir}" -v "${version}" -c "${changelog}"`;

console.log(`[upload-tt] ${mode === 'preview' ? '生成预览二维码' : `上传 v${version}`} …`);
try {
  const output = execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' },
  });
  // tt-ide-cli 上传失败时也可能退出码 0，需检查输出内容
  if (/Upload Error|Error:/i.test(output)) {
    fail(`${mode === 'preview' ? '预览' : '上传'}失败：${output.trim().split('\n').pop()}`);
  }
  if (mode === 'preview') {
    console.log(`[upload-tt] 预览二维码已生成：${qrcodePath}`);
  } else {
    console.log('[upload-tt] 上传成功 ✅');
    console.log('[upload-tt] 下一步：抖音开发者平台 → 版本管理 → 把该版本设为体验版自测，确认无误后「提交审核」。');
  }
} catch (e) {
  const out = e.stdout ? e.stdout.toString() : '';
  const err = e.stderr ? e.stderr.toString() : '';
  const msg = (out + err).trim().split('\n').pop() || e.message;
  fail(`${mode === 'preview' ? '预览' : '上传'}失败：${msg}`);
}
