import Taro from '@tarojs/taro';
import { useState } from 'react';

/** 收藏/历史条目的最小快照（不依赖分包数据即可渲染列表） */
export interface FavItem {
  sec: number;
  n: number;
  t: string;
  h: string;
  ts: number;
}

const FAV_KEY = 'hlb_favs';
const HIS_KEY = 'hlb_history';
const HIS_MAX = 100;

function readList(key: string): FavItem[] {
  try {
    const v = Taro.getStorageSync(key);
    return Array.isArray(v) ? v : [];
  } catch (e) {
    console.error('[store] 读取存储失败', key, e);
    return [];
  }
}

function writeList(key: string, list: FavItem[]) {
  try {
    Taro.setStorageSync(key, list);
  } catch (e) {
    console.error('[store] 写入存储失败', key, e);
  }
}

const sameItem = (a: FavItem, b: FavItem) => a.sec === b.sec && a.n === b.n;

export function getFavs(): FavItem[] {
  return readList(FAV_KEY);
}

export function isFav(sec: number, n: number): boolean {
  return getFavs().some((i) => i.sec === sec && i.n === n);
}

/** 切换收藏，返回切换后是否已收藏 */
export function toggleFav(item: Omit<FavItem, 'ts'>): boolean {
  const list = getFavs();
  const idx = list.findIndex((i) => sameItem(i, item));
  let fav: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    fav = false;
  } else {
    list.unshift({ ...item, ts: Date.now() });
    fav = true;
  }
  writeList(FAV_KEY, list);
  return fav;
}

export function removeFav(sec: number, n: number) {
  writeList(FAV_KEY, getFavs().filter((i) => !(i.sec === sec && i.n === n)));
}

export function getHistory(): FavItem[] {
  return readList(HIS_KEY);
}

export function pushHistory(item: Omit<FavItem, 'ts'>) {
  const list = getHistory().filter((i) => !sameItem(i, item));
  list.unshift({ ...item, ts: Date.now() });
  writeList(HIS_KEY, list.slice(0, HIS_MAX));
}

export function clearHistory() {
  try {
    Taro.removeStorageSync(HIS_KEY);
  } catch (e) {
    console.error('[store] 清除历史失败', e);
  }
}

/** 收藏页 / 收藏按钮共用的响应式收藏列表 */
export function useFavs() {
  const [favs, setFavs] = useState<FavItem[]>(() => getFavs());
  const refresh = () => setFavs(getFavs());
  return { favs, refresh };
}
