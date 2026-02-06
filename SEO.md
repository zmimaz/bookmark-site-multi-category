# 🔍 SEO 优化指南

本指南帮助你提高网站被搜索引擎收录的概率。

## 📋 部署后必做步骤

### 1. 替换域名

部署成功后，将所有 `your-domain.pages.dev` 替换为你的实际域名。

需要修改的文件：
- `index.html` - 所有 URL
- `public/robots.txt` - Sitemap URL
- `public/sitemap.xml` - 网站 URL

### 2. 提交网站到搜索引擎

#### Google Search Console
1. 访问 [Google Search Console](https://search.google.com/search-console/)
2. 点击「添加资源」→ 选择「网址前缀」
3. 输入你的网站地址
4. 通过 HTML 标签验证（在 index.html 中添加验证代码）
5. 提交站点地图：`https://你的域名/sitemap.xml`

#### Bing Webmaster Tools
1. 访问 [Bing Webmaster Tools](https://www.bing.com/webmasters/)
2. 登录微软账号
3. 添加网站 URL
4. 验证所有权（支持从 Google 导入）
5. 提交站点地图

#### 百度搜索资源平台
1. 访问 [百度搜索资源平台](https://ziyuan.baidu.com/)
2. 注册/登录百度账号
3. 添加网站（需要备案信息，国外域名可能无法添加）
4. 验证网站所有权
5. 提交站点地图
6. 使用「链接提交」→「主动推送」加速收录

#### 360 站长平台
1. 访问 [360 站长平台](https://zhanzhang.so.com/)
2. 添加并验证网站
3. 提交 sitemap

#### 搜狗站长平台
1. 访问 [搜狗站长平台](https://zhanzhang.sogou.com/)
2. 添加网站并验证
3. 提交站点地图

### 3. 添加验证代码

各搜索引擎会提供验证代码，添加到 `index.html` 的 `<head>` 中：

```html
<!-- Google Search Console 验证 -->
<meta name="google-site-verification" content="你的验证码" />

<!-- Bing Webmaster 验证 -->
<meta name="msvalidate.01" content="你的验证码" />

<!-- 百度站长验证 -->
<meta name="baidu-site-verification" content="你的验证码" />

<!-- 360 站长验证 -->
<meta name="360-site-verification" content="你的验证码" />

<!-- 搜狗站长验证 -->
<meta name="sogou_site_verification" content="你的验证码" />
```

## 🖼️ 添加社交分享图片

为了让网站在社交媒体分享时显示漂亮的预览图：

1. 创建一张 1200x630 像素的图片
2. 保存为 `public/og-image.png`
3. 另外创建一张截图 `public/screenshot.png`

推荐使用在线工具制作：
- [Canva](https://www.canva.com/) - 免费设计工具
- [OG Image Generator](https://og-playground.vercel.app/)

## 📈 提高收录概率的技巧

### 内容优化
1. **定期更新内容** - 经常添加新的收藏，搜索引擎喜欢活跃的网站
2. **丰富的分类** - 使用有意义的分类名称
3. **详细的描述** - 为收藏项添加详细描述

### 技术优化
1. **网站速度** - Cloudflare CDN 已经很快了
2. **移动端适配** - 已完成响应式设计
3. **HTTPS** - Cloudflare 自动提供

### 外部优化
1. **获取外链** - 在其他网站、论坛分享你的收藏夹链接
2. **社交媒体** - 在微博、知乎、推特等分享网站
3. **友情链接** - 与其他站点交换链接

## 🔧 已实现的 SEO 优化

### HTML 元标签
- ✅ 标题优化（包含关键词）
- ✅ 描述元标签
- ✅ 关键词元标签
- ✅ robots 指令
- ✅ 规范链接 (canonical)
- ✅ Open Graph 标签（Facebook、微信）
- ✅ Twitter Card 标签
- ✅ 语言声明 (lang="zh-CN")

### 结构化数据
- ✅ WebApplication Schema（应用信息）
- ✅ BreadcrumbList Schema（面包屑）

### 技术文件
- ✅ robots.txt（爬虫指引）
- ✅ sitemap.xml（站点地图）
- ✅ favicon.svg（网站图标）

### 无障碍
- ✅ noscript 降级内容
- ✅ 语义化 HTML

## 📊 监控收录情况

### 查看是否被收录

在各搜索引擎中搜索：
```
site:你的域名.pages.dev
```

### 查看收录数量
- Google: `site:域名`
- 百度: `site:域名`
- Bing: `site:域名`

### 预计收录时间
- Google: 1-7 天
- Bing: 3-14 天
- 百度: 7-30 天（国外域名可能更慢或不收录）

## 💡 额外建议

1. **使用自定义域名** - 比 `pages.dev` 更专业
2. **添加 SSL 证书** - Cloudflare 已自动提供
3. **保持网站稳定** - 避免频繁改版
4. **创建有价值的内容** - 公开分享有用的收藏

## 🔗 相关资源

- [Google SEO 新手指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org 结构化数据](https://schema.org/)
- [Open Graph 协议](https://ogp.me/)
- [Twitter Cards 文档](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
