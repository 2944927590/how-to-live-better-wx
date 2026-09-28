import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import EntryCard from '@/components/EntryCard';
import { SECTIONS_DATA } from '../../data/sections';

interface IndexRow {
  sec: number;
  n: number;
  title: string;
  human: string;
  hay: string;
}

const HOT_WORDS = ['安全带', '戒烟', '体检', '押金', '劳动合同', '心肺复苏', '疫苗', '急救'];

/** 搜索索引与原仓库同口径：标题+说人话+成本+收益+备注+来源+等级（index.html:534） */
function buildIndex(): IndexRow[] {
  const rows: IndexRow[] = [];
  for (const sec of Object.values(SECTIONS_DATA)) {
    for (const e of sec.entries) {
      rows.push({
        sec: e.sec,
        n: e.n,
        title: e.title,
        human: e.human,
        hay: [e.title, e.human, e.cost, e.gain, e.note, e.src, e.grade]
          .join('\n')
          .replace(/\*\*/g, '')
          .toLowerCase(),
      });
    }
  }
  console.info('[search] 索引构建完成', rows.length, '条');
  return rows;
}

const SearchPage: React.FC = () => {
  const [q, setQ] = useState('');
  const indexRef = useRef<IndexRow[] | null>(null);

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [];
    if (!indexRef.current) indexRef.current = buildIndex();
    return indexRef.current.filter((r) => r.hay.includes(kw)).slice(0, 100);
  }, [q]);

  const goEntry = (r: IndexRow) => {
    Taro.navigateTo({ url: `/packages/reading/pages/entry/index?sec=${r.sec}&n=${r.n}` }).catch((e) => {
      console.error('[search] 跳转详情失败', e);
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.searchBox}>
        <Input
          className={styles.input}
          value={q}
          placeholder={`在 ${Object.values(SECTIONS_DATA).reduce((s, x) => s + x.entries.length, 0)} 条建议里搜…`}
          placeholderClass="inputPlaceholder"
          focus
          confirmType="search"
          onInput={(e) => setQ(e.detail.value)}
        />
        {q ? (
          <Text className={styles.clearBtn} onClick={() => setQ('')}>
            清空
          </Text>
        ) : null}
      </View>

      {!q.trim() ? (
        <View>
          <Text className={styles.hint}>搜标题、说法、收益、来源都可以{'\n'}比如：</Text>
          <View className={styles.tagRow}>
            {HOT_WORDS.map((w) => (
              <Text key={w} className={styles.tag} onClick={() => setQ(w)}>
                {w}
              </Text>
            ))}
          </View>
        </View>
      ) : (
        <View>
          <Text className={styles.resultCount}>
            找到 {results.length} 条{results.length >= 100 ? '（只显示前 100 条）' : ''}
          </Text>
          {results.map((r) => (
            <EntryCard
              key={`${r.sec}-${r.n}`}
              index={`${r.sec}.${r.n}`}
              title={r.title}
              desc={r.human}
              onClick={() => goEntry(r)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default SearchPage;
