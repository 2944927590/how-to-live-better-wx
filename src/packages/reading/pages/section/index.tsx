import React, { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import EntryCard from '@/components/EntryCard';
import { SECTIONS_DATA } from '../../data/sections';
import { entryBadges } from '../../utils/badges';

const SectionPage: React.FC = () => {
  const router = useRouter();
  const secNum = Number(router.params.n ?? 0);
  const sec = SECTIONS_DATA[secNum];
  const [introOpen, setIntroOpen] = useState(false);

  React.useEffect(() => {
    if (sec) {
      Taro.setNavigationBarTitle({ title: sec.title }).catch(() => {});
    }
  }, [sec]);

  const intro = useMemo(() => (sec ? sec.intro.join('\n') : ''), [sec]);

  if (!sec) {
    return (
      <View className={styles.page}>
        <Text>没有找到这一节</Text>
      </View>
    );
  }

  const goEntry = (n: number) => {
    Taro.navigateTo({ url: `/packages/reading/pages/entry/index?sec=${sec.n}&n=${n}` }).catch((e) => {
      console.error('[section] 跳转详情失败', e);
    });
  };

  return (
    <View className={styles.page}>
      {intro ? (
        <View className={styles.introCard}>
          <Text className={introOpen ? styles.introText : `${styles.introText} ${styles.introClamp}`}>
            {intro}
          </Text>
          <Text className={styles.introToggle} onClick={() => setIntroOpen(!introOpen)}>
            {introOpen ? '收起' : '展开导读'}
          </Text>
        </View>
      ) : null}

      <Text className={styles.count}>本节共 {sec.entries.length} 条，按性价比从高到低排</Text>

      {sec.entries.map((e) => (
        <EntryCard
          key={e.n}
          index={String(e.n)}
          title={e.title}
          desc={e.human}
          badges={entryBadges(e)}
          onClick={() => goEntry(e.n)}
        />
      ))}
    </View>
  );
};

export default SectionPage;
