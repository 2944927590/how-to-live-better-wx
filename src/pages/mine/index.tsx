import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { DOCS_INDEX, BOOK_META } from '@/data/book-index';

const REPO_URL = 'https://github.com/eternity4719/HowToLiveBetter';

const MinePage: React.FC = () => {
  const goDoc = (key: string) => {
    Taro.navigateTo({ url: `/packages/reading/pages/doc/index?key=${key}` }).catch((e) => {
      console.error('[mine] 跳转长文失败', e);
    });
  };

  const copyRepo = () => {
    Taro.setClipboardData({ data: REPO_URL }).catch((e) => {
      console.error('[mine] 复制仓库链接失败', e);
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.aboutTitle}>关于这本书</Text>
        <Text className={styles.aboutText}>
          《高性价比人生指南》讲怎么活得久、怎么少生病，出了意外怎么救；也讲少花冤枉钱、避开官司和骗局。每条建议都写明花掉什么、换回什么、证据有多硬，来源只引期刊论文和官方文件。不用全做——这是按性价比排好的备选单，不是任务清单。
        </Text>
        <View className={styles.repoBtn} onClick={copyRepo}>
          <Text className={styles.repoBtnText}>复制原书仓库链接</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.aboutTitle}>延伸阅读（长文）</Text>
        {DOCS_INDEX.map((d) => (
          <View key={d.key} className={styles.docItem} onClick={() => goDoc(d.key)}>
            <Text className={styles.docTag}>长文</Text>
            <Text className={styles.docTitle}>{d.title}</Text>
            <Text className={styles.docArrow}>›</Text>
          </View>
        ))}
      </View>

      <View className={styles.card}>
        <Text className={styles.aboutTitle}>怎么读</Text>
        <Text className={styles.guideTitle}>证据等级</Text>
        <Text className={styles.guideText}>
          A：有具体数字，出处是荟萃分析、大型队列或随机分组试验。B：有研究支持但说不出确切数字，或只有小样本、单独一项研究。C：作者经验或公认做法，没有直接文献。
        </Text>
        <Text className={styles.guideTitle}>性价比档</Text>
        <Text className={styles.guideText}>
          收益量级（大/中/小）加三项成本（钱、时间、毅力）合出「极高 / 高 / 一般」。这一档是作者自己的判断，不是证据；不同口径（换寿命、换钱、换时间精力、换人身自由）之间不互相比较。
        </Text>
        <Text className={styles.guideTitle}>数据版本</Text>
        <Text className={styles.guideText}>
          {BOOK_META.builtAt} 生成{BOOK_META.sourceCommit ? ` · 原书版本 ${BOOK_META.sourceCommit}` : ''} ·{' '}
          {BOOK_META.total} 条（A {BOOK_META.grades.A} / B {BOOK_META.grades.B} / C {BOOK_META.grades.C}）· 标注争议{' '}
          {BOOK_META.disputes} 条、待核实 {BOOK_META.todos} 处
        </Text>
      </View>

      <Text className={styles.disclaimer}>
        本小程序内容不构成医疗、法律或投资建议{'\n'}身体不适请就医，法律问题请咨询执业律师{'\n'}原文以
        Unlicense 许可发布，内容为公有领域
      </Text>
    </View>
  );
};

export default MinePage;
