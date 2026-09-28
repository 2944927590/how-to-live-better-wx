import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import EntryCard from '@/components/EntryCard';
import { useFavs, removeFav, getHistory, clearHistory, type FavItem } from '@/utils/store';

const goEntry = (it: FavItem) => {
  Taro.navigateTo({ url: `/packages/reading/pages/entry/index?sec=${it.sec}&n=${it.n}` }).catch((e) => {
    console.error('[favorites] 跳转详情失败', e);
  });
};

const FavoritesPage: React.FC = () => {
  const { favs, refresh } = useFavs();
  const [history, setHistory] = useState<FavItem[]>(() => getHistory());

  // tabBar 页每次展示时刷新（详情页里可能刚收藏/浏览过）
  useDidShow(() => {
    refresh();
    setHistory(getHistory());
  });

  const handleRemove = (it: FavItem) => {
    removeFav(it.sec, it.n);
    refresh();
    Taro.showToast({ title: '已移除', icon: 'none', duration: 1000 });
  };

  const handleClearHistory = () => {
    Taro.showModal({
      title: '清空浏览历史',
      content: '历史记录将被清空，收藏不受影响。',
      confirmText: '清空',
      confirmColor: '#18794e',
    }).then((res) => {
      if (!res.confirm) return;
      clearHistory();
      setHistory([]);
    });
  };

  const hasFav = favs.length > 0;
  const hasHis = history.length > 0;

  if (!hasFav && !hasHis) {
    return (
      <View className={styles.page}>
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>☆</Text>
          <Text className={styles.emptyText}>还没有收藏</Text>
          <Text className={styles.emptyHint}>在条目详情页点「收藏」，就存在这里</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      {hasFav && (
        <View>
          <View className={styles.blockTitle}>
            <Text className={styles.titleText}>我的收藏</Text>
          </View>
          {favs.map((it) => (
            <EntryCard
              key={`${it.sec}-${it.n}`}
              index={`${it.sec}.${it.n}`}
              title={it.t}
              desc={it.h}
              onClick={() => goEntry(it)}
              onRemove={() => handleRemove(it)}
            />
          ))}
        </View>
      )}

      {hasHis && (
        <View>
          <View className={styles.blockTitle}>
            <Text className={styles.titleText}>最近浏览</Text>
            <Text className={styles.clearBtn} onClick={handleClearHistory}>
              清空
            </Text>
          </View>
          {history.map((it) => (
            <View key={`${it.sec}-${it.n}-${it.ts}`} className={styles.historyItem} onClick={() => goEntry(it)}>
              <Text className={styles.historyIndex}>
                {it.sec}.{it.n}
              </Text>
              <Text className={styles.historyTitle}>{it.t}</Text>
              <Text className={styles.historyArrow}>›</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default FavoritesPage;
