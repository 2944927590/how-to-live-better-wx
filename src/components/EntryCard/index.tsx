import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

export interface CardBadge {
  text: string;
  /** brand=品牌绿 gold=金(性价比极高) gradeA/B/C=证据分级 plain=灰 */
  tone?: 'brand' | 'gold' | 'gradeA' | 'gradeB' | 'gradeC' | 'plain';
}

interface EntryCardProps {
  /** 左上角序号，如 "3" 或 "13-2" */
  index: string;
  title: string;
  desc?: string;
  badges?: CardBadge[];
  onClick?: () => void;
  /** 传入则显示移除按钮 */
  onRemove?: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ index, title, desc, badges, onClick, onRemove }) => {
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.head}>
        <Text className={styles.index}>{index}</Text>
        <Text className={styles.title}>{title}</Text>
        {onRemove && (
          <Text
            className={styles.remove}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            移除
          </Text>
        )}
      </View>
      {desc ? <Text className={styles.desc}>{desc}</Text> : null}
      {badges && badges.length > 0 ? (
        <View className={styles.badges}>
          {badges.map((b, i) => (
            <Text key={i} className={classnames(styles.badge, b.tone && styles[b.tone])}>
              {b.text}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export default EntryCard;
