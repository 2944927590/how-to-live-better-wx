import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { SECTIONS_INDEX, BOOK_META } from '@/data/book-index';

/** 紧急拨号卡（个人主体可用 makePhoneCall；号码见原书第 13 节） */
const SOS_LIST = [
  { num: '120', name: '急救' },
  { num: '119', name: '火警' },
  { num: '110', name: '报警' },
  { num: '122', name: '交通事故' },
  { num: '96110', name: '反诈专线' },
  { num: '12308', name: '领事保护' },
  { num: '12356', name: '心理援助' },
];

const HomePage: React.FC = () => {
  const goSearch = () => {
    Taro.navigateTo({ url: '/packages/reading/pages/search/index' }).catch((e) => {
      console.error('[home] 跳转搜索页失败', e);
    });
  };

  const goSection = (n: number) => {
    Taro.navigateTo({ url: `/packages/reading/pages/section/index?n=${n}` }).catch((e) => {
      console.error('[home] 跳转节列表失败', e);
    });
  };

  const call = (num: string, name: string) => {
    Taro.showModal({
      title: `拨打 ${num}`,
      content: `确定拨打${name}电话吗？`,
      confirmText: '拨打',
      confirmColor: '#18794e',
    }).then((res) => {
      if (!res.confirm) return;
      Taro.makePhoneCall({ phoneNumber: num }).catch((e) => {
        console.error('[home] 拨号失败', num, e);
        Taro.showToast({ title: '当前环境无法拨号', icon: 'none' });
      });
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>高性价比人生指南</Text>
        <Text className={styles.heroSub}>
          用最少的钱、时间和精力，换回最多的寿命、金钱和人身自由。挑走一两条就算数。
        </Text>
        <View className={styles.heroStats}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{BOOK_META.total}</Text>
            <Text className={styles.statLabel}>条建议</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{BOOK_META.grades.A}</Text>
            <Text className={styles.statLabel}>条证据 A 级</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{BOOK_META.ratios['极高']}</Text>
            <Text className={styles.statLabel}>条性价比极高</Text>
          </View>
        </View>
      </View>

      <View className={styles.body}>
        <View className={styles.searchBar} onClick={goSearch}>
          <Text className={styles.searchIcon}>⌕</Text>
          <Text className={styles.searchPlaceholder}>
            搜索 {BOOK_META.total} 条建议，如：安全带、戒烟、押金
          </Text>
        </View>

        <Text className={styles.sectionTitle}>紧急情况先打这些</Text>
        <ScrollView className={styles.sosScroll} scrollX enhanced showScrollbar={false}>
          {SOS_LIST.map((s) => (
            <View key={s.num} className={styles.sosCard} onClick={() => call(s.num, s.name)}>
              <Text className={styles.sosNum}>{s.num}</Text>
              <Text className={styles.sosName}>{s.name}</Text>
            </View>
          ))}
        </ScrollView>

        <Text className={styles.sectionTitle}>全部 {SECTIONS_INDEX.length} 节</Text>
        <View className={styles.sectionList}>
          {SECTIONS_INDEX.map((s) => (
            <View key={s.n} className={styles.sectionItem} onClick={() => goSection(s.n)}>
              <Text className={styles.sectionNum}>{String(s.n).padStart(2, '0')}</Text>
              <Text className={styles.sectionName}>{s.title}</Text>
              <Text className={styles.sectionCount}>{s.count} 条</Text>
              <Text className={styles.sectionArrow}>›</Text>
            </View>
          ))}
        </View>

        <Text className={styles.footer}>
          内容来自《高性价比人生指南》（Unlicense 公有领域）{'\n'}不构成医疗、法律或投资建议
        </Text>
      </View>
    </View>
  );
};

export default HomePage;
