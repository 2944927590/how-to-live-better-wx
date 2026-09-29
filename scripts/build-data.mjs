/**
 * 数据管线：读取《高性价比人生指南》原仓库正文，生成小程序内置数据。
 *
 * 输入（只读）：
 *   /Users/xiezhiqiang/HowToLiveBetter/HowToLiveBetter/book/*.md    34 节 630 条
 *   /Users/xiezhiqiang/HowToLiveBetter/HowToLiveBetter/docs/        5 篇长文（排除 引用对照.md 与 核实记录/）
 * 输出：
 *   src/data/book-index.ts                          节索引 + 长文索引 + META（主包）
 *   src/packages/reading/data/sNN.ts                按节数据（分包）
 *   src/packages/reading/data/sections.ts           聚合入口
 *   src/packages/reading/data/dN.ts / docs-data.ts  长文
 *
 * 性价比档公式照抄原仓库 index.html:532-533 与 COST_W(index.html:881)。
 * 校验基准（README 徽章）：630 条；A 420 / B 159 / C 51；性价比 极高 108 / 高 288 / 一般 234。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_REPO = '/Users/xiezhiqiang/HowToLiveBetter/HowToLiveBetter';
const BOOK_DIR = path.join(SRC_REPO, 'book');
const DOCS_DIR = path.join(SRC_REPO, 'docs');
const OUT_MAIN = path.join(ROOT, 'src', 'data');
const OUT_SUB = path.join(ROOT, 'src', 'packages', 'reading', 'data');

const COST_W = { money: { 0: 0, 少: 1, 多: 2 }, time: { 少: 0, 中: 1, 多: 2 }, will: { 否: 0, 些: 1, 是: 2 } };
const DOCS = [
  { key: 'marriage', file: '结婚划不划算.md' },
  { key: 'platform-licenses', file: '做平台要办哪些证.md' },
  { key: 'emergency-kit', file: '家庭应急装备清单.md' },
  { key: 'stranger-help', file: '遇到陌生人出事该不该停.md' },
  { key: 'circadian', file: '生物钟和夜班.md' },
];

function fail(msg) {
  console.error(`[build-data] 校验失败：${msg}`);
  process.exit(1);
}
const read = (p) => fs.readFileSync(p, 'utf8');

/** 相对链接改写：../docs/X.md → doc:key；../book/NN-*.md → sec:NN；其余相对链接去掉只留文字 */
function rewriteLinks(text, warnCtx) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, target) => {
    if (/^https?:\/\//.test(target)) return `[${label}](${target})`;
    let m = /^(?:\.\.\/)?docs\/(.+?)\.md$/.exec(target);
    if (m) {
      const hit = DOCS.find((d) => d.file === m[1] + '.md');
      if (hit) return `[${label}](doc:${hit.key})`;
    }
    m = /^(?:\.\.\/)?book\/(\d+)-[^/]*\.md$/.exec(target);
    if (m) return `[${label}](sec:${m[1]})`;
    console.warn(`[build-data] 丢弃未识别的相对链接：${warnCtx} → ${target}`);
    return label;
  });
}

function parseBook() {
  const files = fs.readdirSync(BOOK_DIR).filter((f) => /^\d{2}-.+\.md$/.test(f)).sort();
  if (files.length !== 34) fail(`book 目录应有 34 个节文件，实际 ${files.length}`);
  const sections = [];
  let total = 0;
  const grades = { A: 0, B: 0, C: 0 };
  const ratios = { 极高: 0, 高: 0, 一般: 0 };
  let disputes = 0, todos = 0;

  for (const f of files) {
    const lines = read(path.join(BOOK_DIR, f)).split(/\r?\n/).map((l) => l.trimEnd());
    let sec = null;
    let entry = null;
    let introParas = [];
    let para = [];
    const flushPara = () => {
      if (para.length) { introParas.push(para.join('')); para = []; }
    };
    const flushEntry = () => { if (entry && sec) sec.entries.push(entry); entry = null; };

    for (const raw of lines) {
      const line = raw.trim();
      let m;
      if ((m = /^# (\d+)\. (.+)$/.exec(line))) {
        sec = { n: Number(m[1]), title: m[2].trim(), intro: [], entries: [] };
        sections.push(sec);
        continue;
      }
      if (!sec) continue;
      if (/^## /.test(line)) break; // 文末「## 许可」等页脚，节正文到此结束
      if ((m = /^### (\d+)\. (.+)$/.exec(line))) {
        flushPara(); flushEntry();
        entry = { n: Number(m[1]), title: m[2].trim(), money: '', time: '', will: '', level: '', lens: '', cost: '', human: '', gain: '', grade: '', src: '', note: '' };
        continue;
      }
      if (entry) {
        if ((m = /^<!--\s*成本标签:\s*(.*?)\s*-->$/.exec(line))) {
          for (const kv of m[1].split(/\s+/)) {
            const [k, v] = kv.split('=');
            if (k === '钱') entry.money = v;
            else if (k === '时间') entry.time = v;
            else if (k === '毅力') entry.will = v;
            else if (k === '收益') entry.level = v;
            else if (k === '口径') entry.lens = v;
          }
          continue;
        }
        if ((m = /^- 成本：(.*)$/.exec(line))) { entry.cost = m[1].trim(); continue; }
        if ((m = /^- 说人话：(.*)$/.exec(line))) { entry.human = m[1].trim(); continue; }
        if ((m = /^- 收益：(.*)$/.exec(line))) { entry.gain = m[1].trim(); continue; }
        if ((m = /^- 证据等级：\s*([ABC])/.exec(line))) { entry.grade = m[1]; continue; }
        if ((m = /^- 来源：(.*)$/.exec(line))) { entry.src = m[1].trim(); continue; }
        if ((m = /^- 备注：(.*)$/.exec(line))) { entry.note = m[1].trim(); continue; }
        if (line === '' || line.startsWith('[← 回总目录]')) continue;
        fail(`${f} 条目 ${entry.n} 内出现未识别行：${line.slice(0, 60)}`);
      }
      if (line === '' || line.startsWith('[← 回总目录]')) { flushPara(); continue; }
      para.push(rewriteLinks(line, `${f} 导读`));
    }
    flushPara(); flushEntry();

    if (!sec) fail(`${f} 没有解析出节标题`);
    // 条目排序与字段完整性校验
    let prev = 0;
    for (const e of sec.entries) {
      e.sec = sec.n; // 条目带上所属节号（跨节跳转、收藏快照都依赖它）
      if (e.n !== prev + 1) fail(`${f} 条目序号不连续：${prev} → ${e.n}`);
      prev = e.n;
      for (const k of ['title', 'money', 'time', 'will', 'level', 'lens', 'cost', 'human', 'gain', 'grade', 'src', 'note']) {
        if (e[k] === '' || e[k] == null) fail(`${f} 条目 ${e.n} 字段为空：${k}`);
      }
      if (!COST_W.money.hasOwnProperty(e.money)) fail(`${f} 条目 ${e.n} 钱=${e.money} 非法`);
      if (!COST_W.time.hasOwnProperty(e.time)) fail(`${f} 条目 ${e.n} 时间=${e.time} 非法`);
      if (!COST_W.will.hasOwnProperty(e.will)) fail(`${f} 条目 ${e.n} 毅力=${e.will} 非法`);
      if (!['大', '中', '小'].includes(e.level)) fail(`${f} 条目 ${e.n} 收益=${e.level} 非法`);
      if (!['死亡率', '金钱', '时间', '自由'].includes(e.lens)) fail(`${f} 条目 ${e.n} 口径=${e.lens} 非法`);
      grades[e.grade]++;
      // 性价比档（照抄 index.html:532-533）
      const cs = COST_W.money[e.money] + COST_W.time[e.time] + COST_W.will[e.will];
      e.cs = cs;
      e.ratio = e.level === '大' ? (cs === 0 ? '极高' : cs <= 2 ? '高' : '一般')
        : e.level === '中' ? (cs === 0 ? '高' : '一般') : '一般';
      ratios[e.ratio]++;
      if (/^争议/.test(e.note)) disputes++;
      if (/待核实|TODO/.test(e.src + e.gain + e.note + e.cost)) todos++;
      total++;
    }
    sec.intro = introParas;
  }
  return { sections, total, grades, ratios, disputes, todos };
}

/** CJK 相邻行拼接：前一行结尾与后一行开头都是非 ASCII 时直接相连，否则补空格 */
function joinLines(arr) {
  let out = '';
  for (const l of arr) {
    if (!out) { out = l; continue; }
    out += (/[\x20-\x7e]$/.test(out) && /^[\x20-\x7e(]/.test(l) ? ' ' : '') + l;
  }
  return out;
}

function parseDoc(file) {
  const lines = read(path.join(DOCS_DIR, file)).split(/\r?\n/).map((l) => l.trimEnd());
  const blocks = [];
  let title = '';
  let para = [];
  let table = null;
  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', text: joinLines(para) }); para = []; } };
  const flushTable = () => { if (table && table.head.length) blocks.push(table); table = null; };

  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if ((m = /^(#{1,4})\s+(.+)$/.exec(line))) {
      flushPara(); flushTable();
      const level = m[1].length;
      const text = rewriteLinks(m[2].trim(), file);
      if (level === 1 && !title) { title = text; continue; }
      blocks.push({ t: 'h', level: Math.min(level, 4), text });
      continue;
    }
    if ((m = /^\|(.+)\|$/.exec(line))) {
      flushPara();
      const cells = m[1].split('|').map((c) => rewriteLinks(c.trim(), file));
      if (cells.every((c) => /^:?-{2,}:?$/.test(c) || c === '')) continue; // 分隔行
      if (!table) table = { t: 'table', head: cells, rows: [] };
      else table.rows.push(cells);
      continue;
    }
    if (table) flushTable();
    if (line === '') { flushPara(); continue; }
    if ((m = /^[-*]\s+(.+)$/.exec(line))) { flushPara(); blocks.push({ t: 'li', text: rewriteLinks(m[1], file) }); continue; }
    if ((m = /^(\d+)[.、]\s+(.+)$/.exec(line))) { flushPara(); blocks.push({ t: 'li', ord: Number(m[1]), text: rewriteLinks(m[2], file) }); continue; }
    if ((m = /^>\s?(.*)$/.exec(line))) { flushPara(); blocks.push({ t: 'quote', text: rewriteLinks(m[1], file) }); continue; }
    if (/^<!--.*-->$/.test(line) || /^[-*_]{3,}$/.test(line)) { flushPara(); continue; }
    para.push(rewriteLinks(line, file));
  }
  flushPara(); flushTable();
  if (!title) title = file.replace(/\.md$/, '');
  return { title, blocks };
}

function writeTs(file, content) {
  fs.writeFileSync(file, content);
  return Buffer.byteLength(content);
}

// ---------- 主流程 ----------
const result = parseBook();
const { sections, total, grades, ratios, disputes, todos } = result;

// 对账（README 徽章基准）
if (total !== 630) fail(`条目总数 ${total} ≠ 630`);
if (grades.A !== 420 || grades.B !== 159 || grades.C !== 51) fail(`证据分级 ${JSON.stringify(grades)} ≠ A420/B159/C51`);
if (ratios['极高'] !== 108 || ratios['高'] !== 288 || ratios['一般'] !== 234) {
  console.warn(`[build-data] 注意：性价比档分布 ${JSON.stringify(ratios)} 与 README（108/288/234）不一致，请人工核对`);
}

fs.mkdirSync(OUT_MAIN, { recursive: true });
fs.mkdirSync(OUT_SUB, { recursive: true });
let bytes = 0;

const builtAt = new Date().toISOString().slice(0, 10);
// 源仓库版本：由同步脚本注入（git rev-parse --short HEAD），手跑时为 null
const sourceCommit = process.env.BUILD_SOURCE_COMMIT || null;
const docTitles = [];

const docsParsed = DOCS.map((d) => {
  const parsed = parseDoc(d.file);
  docTitles.push(parsed.title);
  return { ...d, ...parsed };
});

// 分包：按节
for (const s of sections) {
  const nn = String(s.n).padStart(2, '0');
  const body = JSON.stringify({ n: s.n, title: s.title, intro: s.intro, entries: s.entries });
  bytes += writeTs(path.join(OUT_SUB, `s${nn}.ts`), `/* 本文件由 scripts/build-data.mjs 生成，请勿手改。 */
import type { BookSection } from '@/types/book';
export const section: BookSection = ${body};
`);
}
bytes += writeTs(path.join(OUT_SUB, 'sections.ts'), `/* 本文件由 scripts/build-data.mjs 生成，请勿手改。 */
import type { BookSection } from '@/types/book';
${sections.map((s) => `import { section as s${String(s.n).padStart(2, '0')} } from './s${String(s.n).padStart(2, '0')}';`).join('\n')}

export const SECTIONS_DATA: Record<number, BookSection> = {
${sections.map((s) => `  ${s.n}: s${String(s.n).padStart(2, '0')},`).join('\n')}
};
`);

// 分包：长文
docsParsed.forEach((d, i) => {
  const body = JSON.stringify({ key: d.key, title: d.title, blocks: d.blocks });
  bytes += writeTs(path.join(OUT_SUB, `d${i + 1}.ts`), `/* 本文件由 scripts/build-data.mjs 生成，请勿手改。 */
import type { DocData } from '@/types/book';
export const doc: DocData = ${body};
`);
});
bytes += writeTs(path.join(OUT_SUB, 'docs-data.ts'), `/* 本文件由 scripts/build-data.mjs 生成，请勿手改。 */
import type { DocData } from '@/types/book';
${docsParsed.map((_, i) => `import { doc as d${i + 1} } from './d${i + 1}';`).join('\n')}

export const DOCS_DATA: Record<string, DocData> = {
${docsParsed.map((d, i) => `  '${d.key}': d${i + 1},`).join('\n')}
};
`);

// 主包索引（依赖 docTitles，重写一次）
bytes += writeTs(path.join(OUT_MAIN, 'book-index.ts'), `/* 本文件由 scripts/build-data.mjs 生成，请勿手改。生成日期 ${builtAt} */
import type { BookMeta, SectionIndexItem, DocIndexItem } from '@/types/book';

export const SECTIONS_INDEX: SectionIndexItem[] = ${JSON.stringify(sections.map((s) => ({ n: s.n, title: s.title, count: s.entries.length })))};

export const DOCS_INDEX: DocIndexItem[] = ${JSON.stringify(DOCS.map((d, i) => ({ key: d.key, title: docTitles[i] })))};

export const BOOK_META: BookMeta = ${JSON.stringify({ total, grades, ratios, disputes, todos, builtAt, sourceCommit })};
`);

console.log(`[build-data] 完成：${total} 条 / ${sections.length} 节 / ${docsParsed.length} 篇长文`);
console.log(`[build-data] 分级 A${grades.A} B${grades.B} C${grades.C}；性价比 极高${ratios['极高']} 高${ratios['高']} 一般${ratios['一般']}；争议 ${disputes}；待核实 ${todos}`);
console.log(`[build-data] 生成数据约 ${(bytes / 1024).toFixed(0)} KB`);
