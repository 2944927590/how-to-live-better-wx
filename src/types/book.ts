/* 《高性价比人生指南》数据类型（配合 scripts/build-data.mjs 生成物） */

export type Grade = 'A' | 'B' | 'C';
export type Ratio = '极高' | '高' | '一般';
export type Lens = '死亡率' | '金钱' | '时间' | '自由';

/** 一条建议 */
export interface BookEntry {
  sec: number;
  n: number;
  title: string;
  money: '0' | '少' | '多';
  time: '少' | '中' | '多';
  will: '否' | '些' | '是';
  level: '大' | '中' | '小';
  lens: Lens;
  cost: string;
  human: string;
  gain: string;
  grade: Grade;
  src: string;
  note: string;
  /** 三项成本权重和（构建期算好） */
  cs: number;
  /** 性价比档（构建期算好） */
  ratio: Ratio;
}

/** 一节 */
export interface BookSection {
  n: number;
  title: string;
  intro: string[];
  entries: BookEntry[];
}

export interface SectionIndexItem {
  n: number;
  title: string;
  count: number;
}

export interface DocIndexItem {
  key: string;
  title: string;
}

export interface BookMeta {
  total: number;
  grades: { A: number; B: number; C: number };
  ratios: { 极高: number; 高: number; 一般: number };
  disputes: number;
  todos: number;
  builtAt: string;
  /** 内容源仓库的 commit short SHA（同步脚本注入，手跑时为 null） */
  sourceCommit: string | null;
}

/** 长文渲染块（构建期预解析） */
export type DocBlock =
  | { t: 'h'; level: 2 | 3 | 4; text: string }
  | { t: 'p'; text: string }
  | { t: 'li'; ord?: number; text: string }
  | { t: 'quote'; text: string }
  | { t: 'table'; head: string[]; rows: string[][] };

export interface DocData {
  key: string;
  title: string;
  blocks: DocBlock[];
}
