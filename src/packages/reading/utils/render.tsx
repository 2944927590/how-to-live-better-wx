/* 行内 Markdown 与长文块渲染（分包内共用） */
import React from 'react';
import { Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './render.module.scss';
import type { DocBlock } from '@/types/book';

export interface InlineToken {
  text: string;
  bold?: boolean;
  /** http(s)=复制链接 doc:跳长文 sec:跳节 */
  url?: string;
}

/** 解析 **加粗**、[文字](链接)、<https://自动链接>、doc:/sec: 内部链接 */
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const re = /\*\*([^*]+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|<((?:https?:\/\/|doc:|sec:)[^>\s]+)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ text: m[1], bold: true });
    else if (m[3] !== undefined) tokens.push({ text: m[2], url: m[3] });
    else if (m[4] !== undefined) tokens.push({ text: m[4], url: m[4] });
    last = re.lastIndex;
  }
  if (last < text.length) tokens.push({ text: text.slice(last) });
  return tokens;
}

/** 内部/外部链接统一处理：个人小程序无 web-view，外链一律复制 */
export function handleLink(url: string) {
  if (url.startsWith('doc:')) {
    Taro.navigateTo({ url: `/packages/reading/pages/doc/index?key=${url.slice(4)}` }).catch((e) => {
      console.error('[render] 跳转长文失败', url, e);
    });
    return;
  }
  if (url.startsWith('sec:')) {
    Taro.navigateTo({ url: `/packages/reading/pages/section/index?n=${url.slice(4)}` }).catch((e) => {
      console.error('[render] 跳转节失败', url, e);
    });
    return;
  }
  Taro.setClipboardData({
    data: url,
    success: () => Taro.showToast({ title: '链接已复制', icon: 'none', duration: 1200 }),
  }).catch((e) => console.error('[render] 复制链接失败', url, e));
}

/** 行内富文本 */
export const InlineText: React.FC<{ text: string }> = ({ text }) => {
  const tokens = parseInline(text);
  return (
    <Text>
      {tokens.map((tk, i) => {
        if (tk.url) {
          return (
            <Text key={i} className={styles.link} onClick={() => handleLink(tk.url as string)}>
              {tk.text}
            </Text>
          );
        }
        if (tk.bold) {
          return (
            <Text key={i} className={styles.bold}>
              {tk.text}
            </Text>
          );
        }
        return <Text key={i}>{tk.text}</Text>;
      })}
    </Text>
  );
};

/** 长文块视图（构建期已解析成 DocBlock） */
export const DocBlocksView: React.FC<{ blocks: DocBlock[] }> = ({ blocks }) => {
  return (
    <View>
      {blocks.map((b, i) => {
        if (b.t === 'h') {
          const cls = b.level === 2 ? styles.h2 : b.level === 3 ? styles.h3 : styles.h4;
          return (
            <Text key={i} className={cls}>
              {b.text}
            </Text>
          );
        }
        if (b.t === 'p') {
          return (
            <View key={i} className={styles.para}>
              <InlineText text={b.text} />
            </View>
          );
        }
        if (b.t === 'li') {
          return (
            <View key={i} className={styles.li}>
              <Text className={styles.liMark}>{b.ord ? `${b.ord}.` : '•'}</Text>
              <View className={styles.liBody}>
                <InlineText text={b.text} />
              </View>
            </View>
          );
        }
        if (b.t === 'quote') {
          return (
            <View key={i} className={styles.quote}>
              <InlineText text={b.text} />
            </View>
          );
        }
        // table
        return (
          <View key={i} className={styles.table}>
            <View className={styles.trHead}>
              {b.head.map((c, j) => (
                <Text key={j} className={styles.tdHead}>
                  {c}
                </Text>
              ))}
            </View>
            {b.rows.map((row, r) => (
              <View key={r} className={styles.tr}>
                {row.map((c, j) => (
                  <Text key={j} className={styles.td}>
                    <InlineText text={c} />
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
};
