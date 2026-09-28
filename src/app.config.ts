export default defineAppConfig({
  pages: ['pages/index/index', 'pages/favorites/index', 'pages/mine/index'],
  subPackages: [
    {
      root: 'packages/reading',
      pages: [
        'pages/section/index',
        'pages/entry/index',
        'pages/search/index',
        'pages/doc/index',
      ],
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#18794e',
    navigationBarTitleText: '高性价比人生指南',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#18794e',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png',
      },
      {
        pagePath: 'pages/favorites/index',
        text: '收藏',
        iconPath: 'assets/tabbar/fav.png',
        selectedIconPath: 'assets/tabbar/fav-selected.png',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-selected.png',
      },
    ],
  },
});
