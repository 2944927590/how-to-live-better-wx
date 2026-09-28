import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { SECTIONS_DATA } from '../../data/sections';
import { InlineText } from '../../utils/render';
import { isFav, toggleFav, pushHistory } from '@/utils/store';
import { entryBadges, lensLabel } from '../../utils/badges';
import type { BookEntry } from '@/types/book';

const EntryPage: React.FC = () => {
  const router = useRouter();
  // 当前定位用 state：路由参数只做首次初始化，上一条/下一条在页内即时切换
  const [loc, setLoc] = useState({
    sec: Number(router.params.sec ?? 0),
    n: Number(router.params.n ?? 0),
  });
  const [fav, setFav] = useState(false);

  const sec = SECTIONS_DATA[loc.sec];
  const idx = useMemo(
    () => (sec ? sec.entries.findIndex((e) => e.n === loc.n) : -1),
    [sec, loc.n],
  );
  const entry: BookEntry | null = sec && idx >= 0 ? sec.entries[idx] : null;

  useEffect(() => {
    if (!entry) return;
    Taro.setNavigationBarTitle({ title: `${entry.sec}.${entry.n} ${entry.title}`.slice(0, 30) }).catch(() => {});
    setFav(isFav(entry.sec, entry.n));
    pushHistory({ sec: entry.sec, n: entry.n, t: entry.title, h: entry.human.slice(0, 60) });
  }, [entry]);

  const prev = entry && idx > 0 ? sec.entries[idx - 1] : null;
  const next = entry && idx < sec.entries.length - 1 ? sec.entries[idx + 1] : null;

  const go = (target: BookEntry) => {
    setLoc({ sec: target.sec, n: target.n });
    Taro.pageScrollTo({ scrollTop: 0, duration: 0 }).catch(() => {});
  };

  const onToggleFav = () => {
    if (!entry) return;
    const nowFav = toggleFav({ sec: entry.sec, n: entry.n, t: entry.title, h: entry.human.slice(0, 60) });
    setFav(nowFav);
    Taro.showToast({ title: nowFav ? '已收藏' : '已取消收藏', icon: 'none', duration: 1000 });
  };

  const copyAllSources = () => {
    if (!entry) return;
    const urls = [...entry.src.matchAll(/<((?:https?:\/\/)[^>]+)>/g)].map((m) => m[1]);
    if (urls.length === 0) {
      Taro.showToast({ title: '本条没有外部链接', icon: 'none' });
      return;
    }
    Taro.setClipboardData({
      data: urls.join('\n'),
      success: () => Taro.showToast({ title: `已复制 ${urls.length} 个链接`, icon: 'none' }),
    }).catch((e) => console.error('[entry] 复制来源失败', e));
  };

  if (!entry) {
    return (
      <View className={styles.page}>
        <Text>没有找到这一条</Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.title}>{entry.title}</Text>
        <View className={styles.badges}>
          {entryBadges(entry).map((b, i) => {
            const toneMap: Record<string, string> = {
              brand: styles.brand,
              gold: styles.gold,
              gradeA: styles.gradeA,
              gradeB: styles.gradeB,
              gradeC: styles.gradeC,
            };
            const cls = b.tone && toneMap[b.tone] ? `${styles.badge} ${toneMap[b.tone]}` : styles.badge;
            return (
              <Text key={i} className={cls}>
                {b.text}
              </Text>
            );
          })}
        </View>
      </View>

      <View className={styles.humanCard}>
        <Text className={styles.humanLabel}>说人话</Text>
        <Text className={styles.humanText}>{entry.human}</Text>
      </View>

      <View className={styles.field}>
        <View className={styles.fieldHead}>
          <Text className={styles.fieldLabel}>成本</Text>
        </View>
        <View className={styles.fieldText}>
          <InlineText text={entry.cost} />
        </View>
      </View>

      <View className={styles.field}>
        <View className={styles.fieldHead}>
          <Text className={styles.fieldLabel}>收益（{lensLabel(entry.lens)}）</Text>
        </View>
        <View className={styles.fieldText}>
          <InlineText text={entry.gain} />
        </View>
      </View>

      <View className={styles.field}>
        <View className={styles.fieldHead}>
          <Text className={styles.fieldLabel}>证据等级：{entry.grade}</Text>
          <Text className={styles.copyAll} onClick={copyAllSources}>
            复制来源链接
          </Text>
        </View>
        <View className={styles.fieldText}>
          <InlineText text={entry.src} />
        </View>
      </View>

      <View className={styles.field}>
        <View className={styles.fieldHead}>
          <Text className={styles.fieldLabel}>备注</Text>
        </View>
        <View className={styles.fieldText}>
          <InlineText text={entry.note} />
        </View>
      </View>

      <Text className={styles.disclaimer}>
        以上内容摘自《高性价比人生指南》第 {entry.sec} 节第 {entry.n} 条{'\n'}不构成医疗、法律或投资建议
      </Text>

      <View className={styles.bottomBar}>
        <View
          className={`${styles.navBtn} ${!prev ? styles.navBtnDisabled : ''}`}
          onClick={() => prev && go(prev)}
        >
          <Text className={styles.navText}>上一条</Text>
        </View>
        <View className={`${styles.favBtn} ${fav ? styles.favBtnActive : ''}`} onClick={onToggleFav}>
          <Text className={`${styles.favText} ${fav ? styles.favTextActive : ''}`}>
            {fav ? '★ 已收藏' : '☆ 收藏'}
          </Text>
        </View>
        <View
          className={`${styles.navBtn} ${!next ? styles.navBtnDisabled : ''}`}
          onClick={() => next && go(next)}
        >
          <Text className={styles.navText}>下一条</Text>
        </View>
      </View>
    </View>
  );
};

export default EntryPage;
