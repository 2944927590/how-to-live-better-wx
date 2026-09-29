# 高性价比人生指南 · 小程序版

《[高性价比人生指南](https://github.com/eternity4719/HowToLiveBetter)》的离线小程序版。全书 **630 条建议 / 34 节 / 5 篇长文**，内置在包里，无网络也能看、能搜、能收藏。

| 微信版 | 抖音版 |
|---|---|
| ✅ 已开发完成 | ✅ 已开发完成 |

> 本书原版是静态网页（[在线检索](https://eternity4719.github.io/HowToLiveBetter/)）。本仓库把它搬进微信/抖音小程序：数据由构建脚本从原书 Markdown 解析生成，静态打包进小程序，运行期零网络请求、零后端依赖。

## 功能

**主包（3 个 tab）**

- **首页**：全书统计徽章、搜索入口、**紧急拨号卡**（120 / 119 / 110 / 122 / 96110 反诈 / 12308 领事保护 / 12356 心理援助，一键 `makePhoneCall`）、34 节目录
- **收藏**：收藏列表 + 浏览历史，一键清空（本地 Storage，无账号体系）
- **我的**：性价比档说明、证据分级说明、5 篇长文入口、免责声明、数据版本（生成日期 + 原书 commit）

**阅读分包**（`packages/reading`）

- **节列表**：节导读（可折叠）+ 条目卡片（标题 / 说人话 / 性价比档 / 证据等级 / 成本标签四色徽章）
- **条目详情**：说人话强调块、成本 / 收益 / 来源 / 备注四字段、**复制来源链接**（个人主体无 web-view 的替代方案）、收藏、上一条 / 下一条页内切换
- **搜索**：本地全文检索（标题 / 说人话 / 收益 / 备注），按节分组展示
- **长文阅读**：5 篇长文（结婚划不划算 / 做平台要办哪些证 / 家庭应急装备清单 / 遇到陌生人出事该不该停 / 生物钟和夜班），支持表格、加粗、内部跳转链接

**数据互通**

- 节导读 / 长文里的 `../book/`、`../docs/` 相对链接已改写为小程序内跳转，条目互指可以直接点
- 所有外部链接（期刊论文、官方文件）逐条可复制，去浏览器打开

## 技术栈

- **框架**：[Taro](https://taro.zone) 4.1.9 + React 18 + TypeScript，一套代码编译到微信（weapp）和抖音（tt）
- **状态管理**：[zustand](https://github.com/pmndrs/zustand)
- **样式**：SCSS Modules，全局主题变量 + 平台兼容层
- **数据**：构建期静态生成，无运行时网络请求

## 目录结构

```
how-to-live-better-wx/
├── src/
│   ├── app.config.ts          # 全局配置（页面注册、tabBar、分包）
│   ├── app.tsx                # 入口
│   ├── data/
│   │   └── book-index.ts      # 主包数据：节索引 + 长文索引 + 全书 META
│   ├── pages/                 # 主包页面
│   │   ├── index/             # 首页（搜索、紧急拨号卡、节目录）
│   │   ├── favorites/         # 收藏 + 浏览历史
│   │   └── mine/              # 我的（说明、长文入口、免责声明）
│   ├── packages/reading/      # 阅读分包
│   │   ├── data/
│   │   │   ├── s01.ts ~ s33.ts  # 按节数据（各节条目详情）
│   │   │   ├── d1.ts ~ d5.ts    # 长文数据
│   │   │   └── sections.ts      # 聚合入口
│   │   ├── pages/
│   │   │   ├── section/       # 节列表
│   │   │   ├── entry/         # 条目详情
│   │   │   ├── search/        # 搜索
│   │   │   └── doc/           # 长文阅读
│   │   └── utils/
│   │       ├── render.tsx     # 富文本渲染（加粗/链接/表格/引用）
│   │       └── badges.ts      # 徽章样式映射
│   ├── components/EntryCard/  # 条目卡片组件
│   ├── utils/store.ts         # 收藏 / 历史（zustand + Storage）
│   ├── styles/                # 主题变量 + 平台兼容
│   └── types/book.ts          # 数据类型定义
├── config/                    # Taro 构建配置（dev / prod / index）
├── scripts/
│   ├── build-data.mjs         # 数据管线：原书 Markdown → TS 数据文件
│   ├── upload.mjs             # 微信上传（miniprogram-ci）
│   ├── upload-tt.mjs          # 抖音上传（tt-ide-cli）
│   └── sync-from-source.sh    # 从原书仓库同步正文（手动执行）
├── project.config.json        # 微信项目配置
├── project.tt.json            # 抖音项目配置
└── package.json
```

## 数据管线

小程序里的 630 条数据不是手搬的，是 [scripts/build-data.mjs](scripts/build-data.mjs) 从原书仓库（`/Users/xiezhiqiang/HowToLiveBetter/HowToLiveBetter`）的 `book/*.md` 和 `docs/*.md` 解析生成的：

1. 逐行解析 34 个节文件：节标题、节引言、每条的成本标签 / 说人话 / 收益 / 证据等级 / 来源 / 备注
2. 按 [原站公式](https://github.com/eternity4719/HowToLiveBetter/blob/main/index.html)（532-533 行算法 + 881 行权重表）计算性价比档（极高 / 高 / 一般）
3. 校验对账：条目总数、证据分级分布必须与原书 README 徽章一致，**不一致直接构建失败**
4. 内部链接改写：`../book/xx.md`、`../docs/xx.md` 改为小程序内跳转，无法识别的链接丢弃并告警
5. 输出到 `src/data/book-index.ts`（主包）和 `src/packages/reading/data/`（分包），并记录源仓库 commit

```bash
# 重新生成数据（原书更新后执行）
npm run data:build

# 注入源 commit（同步脚本自动带，手跑可不加）
BUILD_SOURCE_COMMIT=b7f7e19 npm run data:build
```

## 开发

```bash
npm install                # 安装依赖
npm run dev:weapp          # 微信开发模式（watch）
npm run dev:tt             # 抖音开发模式（watch）
```

微信开发者工具导入项目目录，AppID 用自己的或测试号；抖音用 [抖音开发者工具](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/developer-instrument/download) 或 `npm run dev:tt` 后用 IDE 打开。

## 构建与上传

```bash
npm run build:weapp        # 构建微信产物 → dist/
npm run build:tt           # 构建抖音产物 → dist/
```

**微信上传**（[miniprogram-ci](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)，需要密钥文件）：

```bash
# 前置：公众平台 → 开发设置 → 下载上传密钥 .key 文件，IP 白名单加本机 IP 或关闭
WX_APPID=wx你的ID \
WX_PRIVATE_KEY_PATH=/path/to/private.wx....key \
npm run upload             # 构建并上传体验版
npm run upload:preview     # 构建并生成预览二维码
```

**抖音上传**（[tt-ide-cli](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/developer-instrument/development-tools-cli)，交互式登录，不需要密钥文件）：

```bash
npm run upload:tt:login    # 首次使用：浏览器扫码登录开发者平台
npm run upload:tt          # 构建并上传
npm run upload:tt:preview  # 构建并生成预览二维码
```

> 脚本凭据全部从环境变量读取，AppID / 密钥不写进代码、不提交 git。`*.key`、`.env`、`preview-qrcode.png` 已在 [.gitignore](.gitignore) 里。

## 提审发布

小程序（微信/抖音一致）：

1. 开发者平台 → 版本管理 → 把上传的版本设为**体验版**自测
2. 确认无误 → 「提交审核」（填类目：微信建议「工具 → 效率」）
3. 审核通过 → 「发布」上线

前置条件：主体注册完成、**小程序备案**通过（微信）、基本信息补全（抖音）。

## 个人主体适配

本项目按个人主体小程序限制设计：

- ❌ 无 `web-view` → 外部链接全部改为「复制链接」
- ❌ 无 UGC（评论、发帖）→ 只有本地收藏 / 历史
- ✅ `makePhoneCall`、本地 Storage、分享可用
- 详情页与「我的」页内置免责声明：不构成医疗 / 法律 / 投资建议

## 数据版本对账

| 指标 | 值 |
|---|---|
| 条目总数 | 630 |
| 证据分级 | A 420 · B 159 · C 51 |
| 性价比档 | 极高 108 · 高 288 · 一般 234 |
| 标注争议 | 58 |
| 待核实 | 35 |
| 源版本 | `ee59a86` |
| 分包数据 | ~1.5 MB |

这些数字构建时自动对账（与原书 README 徽章比对），任何不一致都会让构建失败，保证小程序内容和原书正文严格同步。

## 与原书仓库的关系

- 原书仓库：https://github.com/eternity4719/HowToLiveBetter（内容唯一来源，只读）
- 本仓库：只包含小程序代码和数据生成脚本，**不修改原书任何内容**
- 原书正文更新后：跑 `scripts/sync-from-source.sh`（或手动 `git pull` + `npm run data:build`）即可同步

## 许可

内容遵循原书 [Unlicense](https://github.com/eternity4719/HowToLiveBetter/blob/main/LICENSE)，本仓库代码同样 Unlicense。
