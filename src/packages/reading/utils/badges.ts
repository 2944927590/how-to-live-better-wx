import type { CardBadge } from '@/components/EntryCard';
import type { BookEntry } from '@/types/book';

/** 成本标签文案（照抄原仓库 index.html:884 的 LABEL） */
const MONEY_LABEL: Record<string, string> = { 0: '不花钱', 少: '花少量钱', 多: '花不少钱' };

/** 条目徽章：收益量级 / 性价比档 / 证据等级 / 花钱程度 */
export function entryBadges(e: BookEntry): CardBadge[] {
  return [
    { text: `收益${e.level}`, tone: e.level === '大' ? 'brand' : 'plain' },
    { text: `性价比${e.ratio}`, tone: e.ratio === '极高' ? 'gold' : 'plain' },
    { text: `证据${e.grade}`, tone: `grade${e.grade}` as CardBadge['tone'] },
    { text: MONEY_LABEL[e.money] ?? e.money, tone: 'plain' },
  ];
}

/** 收益口径文案（照抄原仓库 index.html:882 的 LENS_LABEL） */
export function lensLabel(lens: string): string {
  switch (lens) {
    case '死亡率':
      return '换寿命';
    case '金钱':
      return '换钱';
    case '时间':
      return '换时间精力';
    case '自由':
      return '换人身自由';
    default:
      return lens;
  }
}
