import React, { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { DOCS_DATA } from '../../data/docs-data';
import { DocBlocksView } from '../../utils/render';

const DocPage: React.FC = () => {
  const router = useRouter();
  const doc = DOCS_DATA[router.params.key ?? ''];

  useEffect(() => {
    if (doc) {
      Taro.setNavigationBarTitle({ title: doc.title }).catch(() => {});
    }
  }, [doc]);

  if (!doc) {
    return (
      <View className={styles.page}>
        <Text>没有找到这篇长文</Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.title}>{doc.title}</Text>
        <DocBlocksView blocks={doc.blocks} />
        <Text className={styles.source}>
          摘自《高性价比人生指南》延伸阅读{'\n'}不构成医疗、法律或投资建议
        </Text>
      </View>
    </View>
  );
};

export default DocPage;
