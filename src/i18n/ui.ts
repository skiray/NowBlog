export const languages = {
  zh: "中文",
  en: "English",
} as const;

export type Locale = keyof typeof languages;

export const defaultLocale: Locale = "zh";

const ui = {
  zh: {
    "nav.blog": "博客",
    "nav.tags": "标签",
    "nav.categories": "分类",
    "nav.search": "搜索",
    "nav.about": "关于",
    "hero.greeting": "你好，我是",
    "hero.lead": "记录此刻，留存当下",
    "hero.read": "读我的文章",
    "hero.about": "关于我",
    "latest.eyebrow": "文章",
    "latest.title": "最新文章",
    "latest.sub": "最近写的一些东西。",
    "latest.all": "查看全部文章 →",
    "topics.eyebrow": "Topics",
    "topics.title": "分类 / 标签",
    "about.eyebrow": "About",
    "about.title": "关于 今时录",
    "about.bio": `<p>今时录，记录此刻，留存当下。</p>
<p>这是一个由个人独立维护的博客站点。取名「今时录」，意在提醒自己——每一个今天都值得被认真对待，每一刻的思考与感悟，都值得被记录下来。</p>
<h3>为什么叫 NowBlog？</h3>
<p>Now，是此时此刻，是正在发生，是唯一真实拥有的时间维度。不追忆过去，不过度展望未来，专注记录当下的所见、所思、所感。</p>
<h3>这里会写什么？</h3>
<ul>
<li>技术学习中的踩坑与总结</li>
<li>阅读与观影后的零碎感想</li>
<li>生活中的观察与随想</li>
<li>偶尔冒出来的奇奇怪怪的想法</li>
</ul>
<p>内容没有严格边界，但有一条原则：真诚记录，不为谁而写。</p>
<h3>关于博主</h3>
<p>一个普通的互联网从业者，热爱技术但也迷恋文字。相信输出是最好的输入，所以有了这个博客。</p>
<p>如果你偶然路过这里，读到某篇文章觉得有所共鸣，欢迎留言交流。如果没有，那也没关系——</p>
<p>至少我们曾在同一个「此刻」相遇过。</p>
<p class="sign">今时录 · NowBlog<br />记录此刻，仅此而已。</p>`,
    "about.email": "邮箱",
    "blog.title": "博客",
    "blog.sub": "聊聊开发、设计与独立开发。",
    "blog.back": "← 返回博客",
    "blog.empty": "还没有文章。",
    "blog.archive": "归档",
    "post.prev": "上一篇",
    "post.next": "下一篇",
    "post.related": "相关文章",
    "post.read": "分钟阅读",
    "post.toc": "目录",
    "post.series": "系列",
    "tags.title": "标签",
    "tags.sub": "点击任意标签查看相关文章。",
    "tags.back": "← 全部标签",
    "cats.title": "分类",
    "cats.sub": "按分类浏览文章，一个分类对应一类主题的持续记录。",
    "cats.back": "← 全部分类",
    "cats.count": "篇文章",
    "post.category": "分类",
    "search.title": "搜索",
    "search.sub": "搜索全部文章，由 Pagefind 强力驱动。",
    "search.fallback":
      "搜索在 production 构建后可用。先运行 `npm run build`，再运行 `npm run preview` 试试看。",
    "search.placeholder": "搜索文章…",
    "search.count": "共找到 {n} 条结果",
    "search.empty": "没有匹配的文章，换个关键词试试。",
    "theme.toogle": "切换主题",
    "footer.rights": "保留所有权利。",
    "footer.privacy": "隐私政策",
    "footer.terms": "服务条款",
    "footer.contact": "联系",
    "legal.updated": "最后更新",
    "legal.back": "← 返回首页",
    "privacy.title": "隐私政策",
    "privacy.sub": "本站收集哪些数据，以及不收集哪些数据。",
    "privacy.body": `<p>本站是一个纯静态个人博客，<strong>不使用任何统计、分析或广告脚本</strong>，也没有第三方追踪 Cookie。下面是访问本站时可能产生的数据。</p>
<h3>我们不收集的内容</h3>
<ul>
<li>没有用户账号，没有注册或登录流程</li>
<li>没有 Google Analytics、Umami 之类的访问统计</li>
<li>没有广告或营销追踪像素</li>
<li>页面字体为自托管，不会向任何 CDN 发起请求</li>
</ul>
<h3>本地存储</h3>
<p>深色 / 浅色主题偏好保存在浏览器的 <code>localStorage</code> 中，仅存在于你自己的设备上，随时可以清除。</p>
<h3>评论（Giscus）</h3>
<p>文章评论由 Giscus 提供，评论数据存储为本站在 GitHub 仓库中的 Discussions。只有当你主动登录 GitHub 并发表评论时，GitHub 才会按其隐私声明处理你的账号信息；不评论就不会被记录。</p>
<h3>服务器日志</h3>
<p>托管服务商可能会记录访问日志（如 IP 地址、User-Agent），用于安全与故障排查。这部分数据由服务商保留，本站无法访问或控制。</p>
<h3>联系</h3>
<p>如果对以上内容有疑问，可以通过页脚的邮箱联系我。</p>`,
    "terms.title": "服务条款",
    "terms.sub": "使用本站前请阅读以下约定。",
    "terms.body": `<p>使用本站即表示你同意以下条款。条款可能随站点调整而更新，恕不逐一通知。</p>
<h3>内容版权</h3>
<p>除非文章另有声明，本站原创文字、图片与代码的著作权归作者所有。欢迎在非商业前提下转载，但请注明作者并保留原文链接。</p>
<h3>免责声明</h3>
<ul>
<li>文章内容仅代表作者个人观点，不构成任何专业建议</li>
<li>示例代码按「原样」提供，不保证在所有环境下可用；因使用造成的任何损失，作者不承担责任</li>
<li>外部链接所指向的第三方站点，其内容与隐私实践不在本站控制范围内</li>
</ul>
<h3>评论规范</h3>
<p>评论通过 Giscus 托管于 GitHub Discussions，同时受 GitHub 服务条款约束。请勿发布垃圾信息、人身攻击、违法或侵犯他人权益的内容，我保留删除评论与限制参与的权利。</p>
<h3>条款变更</h3>
<p>本站保留随时修改本条款的权利，修改后的条款自发布时起生效。</p>`,
    "brand": "今时录",
    "rss.title": "今时录",
    "rss.desc": "记录此刻，留存当下 —— 今时录 的个人博客。",
    "author.bio": "记录此刻，留存当下。一个普通互联网从业者的个人博客。",
    "post.info": "文章信息",
    "post.published": "发布",
    "post.author": "作者",
    "post.reading": "阅读时长",
    "sidebar.topics": "标签云",
    "sidebar.explore": "浏览",
    "sidebar.latest": "最新文章",
    "sidebar.tags": "本文标签",
    "authors.title": "作者",
    "authors.back": "← 全部作者",
    "authors.count": "篇文章",
    "authors.sub": "站点作者列表。",
    "authors.desc": "作者 {name} 的文章。",
    "tag.desc": "标签 {tag} 下的文章。",
  },
  en: {
    "nav.blog": "Blog",
    "nav.tags": "Tags",
    "nav.categories": "Categories",
    "nav.search": "Search",
    "nav.about": "About",
    "hero.greeting": "Hi, I'm",
    "hero.lead": "Recording this moment, keeping the present",
    "hero.read": "Read my posts",
    "hero.about": "About me",
    "latest.eyebrow": "Writing",
    "latest.title": "Latest posts",
    "latest.sub": "Some things I've written recently.",
    "latest.all": "View all posts →",
    "topics.eyebrow": "Topics",
    "topics.title": "Categories / Tags",
    "about.eyebrow": "About",
    "about.title": "About NowBlog",
    "about.bio": `<p>NowBlog — recording this moment, keeping the present.</p>
<p>This is a personal, independently maintained blog. The name 今时录 (NowBlog) is a reminder to myself: every today deserves to be taken seriously, and every moment of thought and feeling deserves to be written down.</p>
<h3>Why NowBlog?</h3>
<p>Now is this very moment, what is happening, the only real dimension of time we have. Not dwelling on the past, not overthinking the future — just focusing on recording what we see, think, and feel right now.</p>
<h3>What will I write here?</h3>
<ul>
<li>Notes and lessons from learning tech</li>
<li>Scattered thoughts after reading and watching films</li>
<li>Observations and musings from daily life</li>
<li>The occasional weird and wonderful idea</li>
</ul>
<p>There are no strict boundaries, only one principle: write sincerely, for no one in particular.</p>
<h3>About the author</h3>
<p>An ordinary internet worker who loves technology but is also obsessed with words. I believe output is the best input, which is why this blog exists.</p>
<p>If you happen to pass by and resonate with something you read, feel free to leave a comment. If not, that's okay too —</p>
<p>at least we met in the same "now".</p>
<p class="sign">今时录 · NowBlog<br />Recording this moment, and that is all.</p>`,
    "about.email": "Email",
    "blog.title": "Blog",
    "blog.sub": "Notes on dev, design and indie hacking.",
    "blog.back": "← Back to blog",
    "blog.empty": "No posts yet.",
    "blog.archive": "Archive",
    "post.prev": "Previous",
    "post.next": "Next",
    "post.related": "Related",
    "post.read": "min read",
    "post.toc": "Contents",
    "post.series": "Series",
    "cats.title": "Categories",
    "cats.sub": "Browse posts by category — one category per ongoing topic.",
    "cats.back": "← All categories",
    "cats.count": "posts",
    "post.category": "Category",
    "tags.title": "Tags",
    "tags.sub": "Click any tag to see related posts.",
    "tags.back": "← All tags",
    "search.title": "Search",
    "search.sub": "Search across all posts, powered by Pagefind.",
    "search.fallback":
      "Search runs after a production build. Run `npm run build` then `npm run preview` to try it.",
    "search.placeholder": "Search posts…",
    "search.count": "{n} results found",
    "search.empty": "No matching posts. Try another keyword.",
    "theme.toogle": "Toggle theme",
    "footer.rights": "All rights reserved.",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.contact": "Contact",
    "legal.updated": "Last updated",
    "legal.back": "← Back home",
    "privacy.title": "Privacy Policy",
    "privacy.sub": "What this site does and does not collect.",
    "privacy.body": `<p>This is a purely static personal blog. It <strong>runs no analytics, tracking or advertising scripts</strong>, and sets no third-party tracking cookies. Here is everything that could involve your data.</p>
<h3>What we do not collect</h3>
<ul>
<li>No user accounts — there is nothing to sign up or log in to</li>
<li>No analytics tooling such as Google Analytics or Umami</li>
<li>No advertising or marketing pixels</li>
<li>Fonts are self-hosted, so no requests are made to any CDN</li>
</ul>
<h3>Local storage</h3>
<p>Your dark / light theme preference is kept in the browser's <code>localStorage</code>. It stays on your own device and you can clear it at any time.</p>
<h3>Comments (Giscus)</h3>
<p>Comments are powered by Giscus and stored as GitHub Discussions in this site's repository. GitHub only processes your account information if you deliberately sign in and post a comment; simply reading a page records nothing with GitHub.</p>
<h3>Server logs</h3>
<p>The hosting provider may keep access logs (such as IP address and User-Agent) for security and troubleshooting. That data is retained by the provider and this site cannot access or control it.</p>
<h3>Contact</h3>
<p>If you have questions about any of the above, reach me via the email address in the footer.</p>`,
    "terms.title": "Terms of Service",
    "terms.sub": "Please read these terms before using this site.",
    "terms.body": `<p>By using this site you agree to the terms below. They may be updated as the site evolves, without individual notice.</p>
<h3>Content copyright</h3>
<p>Unless a post states otherwise, the copyright of original text, images and code on this site belongs to the author. Non-commercial sharing is welcome, provided you credit the author and keep a link to the original.</p>
<h3>Disclaimer</h3>
<ul>
<li>Posts reflect only the author's personal views and are not professional advice</li>
<li>Sample code is provided "as is" with no guarantee it works in every environment; the author accepts no liability for any loss arising from its use</li>
<li>Third-party sites reached through outbound links are outside this site's control, both in content and in privacy practices</li>
</ul>
<h3>Comment guidelines</h3>
<p>Comments are hosted on GitHub Discussions via Giscus and are additionally subject to GitHub's terms. Do not post spam, personal attacks, unlawful material, or content that infringes others' rights. I reserve the right to delete comments and restrict participation.</p>
<h3>Changes to these terms</h3>
<p>This site may revise these terms at any time; revisions take effect as soon as they are published.</p>`,
    "brand": "NowBlog",
    "rss.title": "NowBlog",
    "rss.desc": "Recording this moment, keeping the present — the personal blog of NowBlog.",
    "author.bio": "Recording this moment, keeping the present. A personal blog by an ordinary internet worker.",
    "post.info": "Post info",
    "post.published": "Published",
    "post.author": "Author",
    "post.reading": "Reading time",
    "sidebar.topics": "Tag cloud",
    "sidebar.explore": "Explore",
    "sidebar.latest": "Latest posts",
    "sidebar.tags": "Tags in this post",
    "authors.title": "Authors",
    "authors.back": "← All authors",
    "authors.count": "posts",
    "authors.sub": "All authors on this site.",
    "authors.desc": "Posts by {name}.",
    "tag.desc": "Posts tagged {tag}.",
  },
} as const;

export type UIKey = keyof (typeof ui)["zh"];

export function useTranslations(locale: string) {
  const dict = ui[locale as Locale] ?? ui.zh;
  return function t(key: UIKey): string {
    return dict[key];
  };
}
