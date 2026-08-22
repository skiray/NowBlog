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
    "tags.title": "标签",
    "tags.sub": "点击任意标签查看相关文章。",
    "tags.back": "← 全部标签",
    "search.title": "搜索",
    "search.sub": "搜索全部文章，由 Pagefind 强力驱动。",
    "search.fallback":
      "搜索在 production 构建后可用。先运行 `npm run build`，再运行 `npm run preview` 试试看。",
    "search.placeholder": "搜索文章…",
    "theme.toogle": "切换主题",
    "footer.rights": "保留所有权利。",
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
  },
  en: {
    "nav.blog": "Blog",
    "nav.tags": "Tags",
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
    "tags.title": "Tags",
    "tags.sub": "Click any tag to see related posts.",
    "tags.back": "← All tags",
    "search.title": "Search",
    "search.sub": "Search across all posts, powered by Pagefind.",
    "search.fallback":
      "Search runs after a production build. Run `npm run build` then `npm run preview` to try it.",
    "search.placeholder": "Search posts…",
    "theme.toogle": "Toggle theme",
    "footer.rights": "All rights reserved.",
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
  },
} as const;

export type UIKey = keyof (typeof ui)["zh"];

export function useTranslations(locale: string) {
  const dict = ui[locale as Locale] ?? ui.zh;
  return function t(key: UIKey): string {
    return dict[key];
  };
}
