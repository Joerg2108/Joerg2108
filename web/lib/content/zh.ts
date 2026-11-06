// 网站内容（简体中文）。结构与 ./de.ts 相同。
import type * as DE from "./de"
import * as de from "./de"

export const site: typeof DE.site = {
  ...de.site,
  claim: "画家、雕塑家、插画家、素描艺术家",
  tagline: "远见者",
}

export const contact: typeof DE.contact = {
  ...de.contact,
  atelier: "Fischer-Art 工作室",
  place: "Kunstfabrik（艺术工厂）",
  city: "04552 Borna，德国",
  phone: "+49 172 3426684",
  intro: "如需咨询、预约或了解更多信息，欢迎与我们联系。期待您的来信。",
}

export const nav: typeof DE.nav = [
  { href: "/#werk", label: "作品" },
  { href: "/#leistungen", label: "服务" },
  { href: "/person", label: "艺术家" },
  { href: "/vita", label: "履历" },
  { href: "/ausstellungen", label: "展览" },
  { href: "/kunst-am-bau", label: "建筑艺术" },
  { href: "/publikationen", label: "出版物" },
  { href: "/aktuelles", label: "最新动态" },
  { href: "/#kontakt", label: "联系" },
]

export const about: typeof DE.about = {
  title: "Michael Fischer-Art",
  text: "出生于莱比锡的艺术家 Michael Fischer-Art 从童年起就立志让世界变得更加多彩。他的艺术以社会批判的视角审视周遭世界。借鉴社会主义现实主义的传统，他将自己的创作归入“市场经济现实主义”。",
  fields: [
    {
      title: "原作",
      text: "Fischer-Art 的画作始终是对乏味的知识主义和虚伪深沉的色彩鲜明、声势夺人的抨击。仿照社会主义现实主义的说法，Fischer-Art 称自己的作品属于“市场经济现实主义”。他的视觉语言以浓烈的色彩、大面积的色块、简洁的结构和漫画式的“木偶人物”为特征，极具辨识度。",
    },
    {
      title: "雕塑",
      text: "色彩缤纷、引人注目，Michael Fischer-Art 的雕塑装点着德国的许多广场，吸引着游客和艺术爱好者。他最早的雕塑项目之一，是位于奥得河畔法兰克福市中心一座长达 100 米的喷泉，八座高达六米的雕塑在其中喷水。",
    },
    {
      title: "立面",
      text: "“几乎没有哪位艺术家在全世界绘制过像他这样多的面积”（《时代周报》，2011 年）。然而，Michael Fischer-Art 的建筑艺术项目并不局限于墙面，桥梁、游乐场等也被他涂上了缤纷的色彩。",
    },
    {
      title: "肖像",
      text: "风格略有不同，但同样色彩斑斓：Michael Fischer-Art 已以波普艺术的手法描绘了众多名人。此外，这位艺术家与政界、商界和演艺界人士保持着良好的联系。",
    },
    {
      title: "新艺术",
      text: "正如人们对 Michael Fischer-Art 这样一位艺术家的期待，他所涉足的一切并非都能归类。灵感一旦降临，艺术也会以非同寻常的方式发生。",
    },
    {
      title: "作家",
      text: "作为作家，Fischer-Art 总能带来惊喜，他最新再版的七篇短篇小说便是明证。他在故事中讲述国家认可的罪犯与偶然的肇事者、无人倾听的人物与顺从的影子般的存在。时而发人深省，时而辛辣尖刻，始终以不寻常的方式引人入胜。",
    },
  ],
}

export const quotes: typeof DE.quotes = {
  bach: { text: "以艺术为生命者，其生命便是一件伟大的艺术。", author: "约翰·塞巴斯蒂安·巴赫" },
  twain: { text: "只要想到我们都是疯子，人生就得到了解释。", author: "马克·吐温" },
}

export const services: typeof DE.services = {
  intro: "我们让您的世界更加多彩——无论是委托创作、建筑艺术还是活动。",
  items: [
    {
      title: "委托创作",
      text: "没有比这更个性化的了。委托作品可以远远超出画布上的绘画。绘画几乎没有边界：从房屋外墙设计、建筑艺术、入口大厅壁画，到属于您的个人肖像——一切皆有可能。欢迎与我们联系，分享您的想法。",
    },
    {
      title: "活动",
      text: "Michael Fischer-Art 的工作室不仅是艺术诞生的地方。我们的活动在非同寻常的环境中举行。如果您希望与客户或商业伙伴在工业风格的空间里，在莱比锡最著名的艺术家之一创作的地方共度美好夜晚，欢迎与我们联系。",
    },
    {
      title: "工作室参观",
      text: "如果您一直想看看 Michael Fischer-Art 的工作室是什么样子，并希望参加一次穿插着过去、现在与未来精彩故事的私人导览，请向我们发送咨询。",
    },
    {
      title: "与 Fischer-Art 一起绘画",
      text: "这是一次（重新）发现自身创造力的体验。在艺术家的指导下，您可以在画布上作画、尝试色彩、尽情挥洒。艺术家还会提供材料、画布和丙烯颜料。参与者可以自由诠释推荐的作品，创造力没有界限。无需任何经验，只需带上尝试新事物的勇气。",
    },
  ],
}

export const person: typeof DE.person = {
  ...de.person,
  kicker: "远见者",
  role: "艺术家、设计师、作家",
  claim: "享誉世界的艺术家、设计师和作家",
  text: "Michael Fischer，艺名 Michael Fischer-Art，曾接受泥瓦匠和油漆工培训，做过管理员和精神病院护理员，两德统一后取得高中毕业文凭，并于 1992 年至 1997 年在莱比锡视觉艺术学院（Hochschule für Grafik und Buchkunst）学习。他在大面积画面上使用非常强烈的色彩，采用简洁的结构，既绘制漫画式人物，也创作写实肖像等作品。他以社会批判题材（西藏、非洲）和大型建筑彩绘而闻名。他用铁塑造雕塑，也用废料（坦克、汽车）进行创作。他经常旅行，与政界保持良好关系，人脉遍布全球。他已在国际上为 100 多座建筑进行艺术设计，并不断寻求新的挑战。",
}

export const vita: typeof DE.vita = [
  { year: "2017", text: "Sunshine Art 画廊开幕" },
  { year: "2017", text: "雅典与阿姆斯特丹马拉松" },
  { year: "2016", text: "女儿 Clara 出生" },
  { year: "2015", text: "俄罗斯乌拉尔地区的民族大会战纪念碑" },
  { year: "2015", text: "纽约马拉松" },
  { year: "2008", text: "女儿 Elisabeth 出生" },
  { year: "2008", text: "纽约马拉松" },
  { year: "2005", text: "于佛罗伦萨罗马别墅（Villa Romana）研修" },
  { year: "2004", text: "第 12 届德国联邦大会成员；“温暖联结网”特别大使" },
  { year: "2001", text: "女儿 Charlotte 出生" },
  { year: "2000", text: "儿子 Artur 出生" },
  { year: "1997 年起", text: "自由职业艺术家" },
  { year: "1992 – 1997", text: "就读于莱比锡视觉艺术学院" },
  { year: "1992", text: "取得高中毕业文凭" },
  { year: "1989 – 1992", text: "精神病院护理员" },
  { year: "1989", text: "在莱比锡普莱瑟河游行中被捕，此事与圣尼古拉教堂的和平祈祷有关" },
  { year: "1987 – 1989", text: "从事泥瓦匠、油漆工和管理员工作" },
  { year: "1985 – 1987", text: "泥瓦匠与油漆工学徒" },
  { year: "1975 – 1987", text: "上学" },
  { year: "1969", text: "生于莱比锡" },
]

export const exhibitions: typeof DE.exhibitions = {
  ...de.exhibitions,
  kicker: "展览",
  lead: "筹备一场展览，意味着要深入探讨一个主题，而在这个并非对所有人都幸福的时代，这几乎是一种挑衅。关于不幸的对话总是受欢迎的，在政治和社会层面无疑都是正确的，也无需任何理由。",
  text: "从博尔纳艺术工厂的幕后走向公众——对艺术家而言还有什么比这更美好的呢？Fischer-Art 亲自开幕了众多关于政治、旅行、人物和项目的展览。最近，他的速写本成为焦点：他借一次特展之机将这些速写本捐赠给了莱比锡大学。展览让人们首次一窥这批尚未整理的作品，从而得以追溯 Fischer-Art 三十多年来的艺术创作。",
  dates: de.exhibitions.dates.map((d) =>
    d
      .replace("Dezember", "12 月")
      .replace("Vernissage", "开幕展")
      .replace(/^(\d{4}) Galerie$/, "$1 画廊")
      .replace("Ausstellung", "展览")
      .replace("Aktion Mauerfälle", "“柏林墙倒塌”行动")
      .replace("„20 Jahre Mauerfall“", "“柏林墙倒塌 20 周年”")
      .replace("Kunst im Loft", "Loft 艺术展")
      .replace("Expo in Shanghai", "上海世博会")
      .replace("Louvre", "卢浮宫")
      .replace(/„([^“]+)“/g, "“$1”"),
  ),
  institutions: de.exhibitions.institutions.map((d) =>
    d
      .replace("Ausstellung Schloss Brandis", "布兰迪斯城堡展览")
      .replace("Ausstellung „Die Welt im Tagebuch“", "展览“日记中的世界”")
      .replace("Rathaus in Eschborn", "埃施博恩市政厅")
      .replace("Cologne", "科隆")
      .replace("Arts Centre, England", "艺术中心，英国")
      .replace("Galerie Casteel aus Mönchengladbach", "门兴格拉德巴赫 Casteel 画廊")
      .replace("Drei Leipziger Künstler – Drei Systeme", "三位莱比锡艺术家——三种体制")
      .replace("Künstler & Gäste, im The Q", "艺术家与嘉宾，The Q")
      .replace("Société Nationale des Beaux Arts", "法国国家美术协会（Société Nationale des Beaux Arts）")
      .replace("Frankreich – Paris", "法国——巴黎")
      .replace("Zu Gast in Hoyerswerda, Erfurt", "霍耶斯韦达、爱尔福特客座展览")
      .replace("Galerie Stuttgart", "斯图加特画廊")
      .replace("Wanderausstellung", "巡回展览")
      .replace("Blüthner-Flügel im chinesischen Pavillon", "中国馆中的博兰斯勒（Blüthner）三角钢琴")
      .replace("Museum Schloss Burgk", "布尔格克城堡博物馆")
      .replace("Jade, Niedersachsen", "亚德，下萨克森州")
      .replace("München", "慕尼黑")
      .replace("Dresden", "德累斯顿")
      .replace("Miami", "迈阿密")
      .replace(/„([^“]+)“/g, "“$1”"),
  ),
  images: de.exhibitions.images.map((i) => ({ ...i, caption: i.caption === "Serie" ? "系列" : i.caption === "Stahlfigur" ? "钢铁人像" : i.caption })),
}

const objects: Record<string, string> = {
  "Einweihung State Department": "美国国务院揭幕",
  Hochhaus: "高层建筑",
  "Fassade Goldschmidtstraße": "戈德施密特街立面",
  "Pflegeheim des EHK": "EHK 养老院",
  "Industriegebäude Plagwitz": "普拉格维茨工业建筑",
  "GEORADO Erlebniswelt": "GEORADO 体验世界",
  "Tower Flughafen": "机场塔台",
  Nordhausen: "诺德豪森",
  Brückenbemalung: "桥梁彩绘",
  Fassadenbemalung: "立面彩绘",
  "Sonne des Lebens (Edelstahl 4,5 m)": "生命之日（不锈钢，4.5 米）",
  "Baum des Lebens (Edelstahl 2,98 m)": "生命之树（不锈钢，2.98 米）",
  "Kulturhaus Leipzig im Ural, Russland": "俄罗斯乌拉尔地区莱比锡文化宫",
  Wandbemalung: "壁画",
  "6 farbig beschichtete Edelstahlfiguren": "6 座彩色涂层不锈钢雕像",
  "Das Letzte Abendmahl, Kuppelbemalung": "《最后的晚餐》穹顶彩绘",
  "Aufstellung Berliner Mauersegment": "柏林墙片段安置",
  "Deckengemälde im Westbad": "西浴场天花板壁画",
  "Moabit/Wedding": "莫阿比特 / 威丁",
  "11-Geschosser DDR-Plattenbau": "11 层民主德国预制板楼",
  "Gestaltung Synlabgebäude": "Synlab 大楼设计",
  "Eingangsportal der Grundschule": "小学入口",
  Völkerschlachtpanoramabild: "民族大会战全景画",
  "KiTa Olgastraße": "奥尔加街幼儿园",
  "Gestaltung Wohngebiet": "住宅区设计",
  "Leipziger Platz, Addis Abeba": "亚的斯亚贝巴莱比锡广场",
  "Außenfassade der Brühlarkaden": "布吕尔拱廊外立面",
  "Görlitzer Straße": "格尔利茨街",
  Kindergarten: "幼儿园",
  "Turm in Wurzbach": "武尔茨巴赫塔楼",
  Sonderpflegeheim: "特殊护理院",
  "Fischer-Art-Haus": "Fischer-Art 之家",
  "Verhüllung Schlosswache Osterburg": "奥斯特堡城堡卫所包裹艺术",
  "Giebelbemalung Gymnasium": "文理中学山墙彩绘",
  "Wandbild Musikschule Johann Sebastian Bach": "约翰·塞巴斯蒂安·巴赫音乐学校壁画",
  "Wandbemalung Klinikum St. Georg": "圣格奥尔格医院壁画",
  "Verhüllung Hofwiesenpark BUGA": "霍夫维森公园包裹艺术（联邦园艺展）",
  "Entrollung des Wandbildes": "壁画揭幕",
  "Verhüllung Außenfassaden „Drei Türme“": "“三塔”外立面包裹艺术",
  "Gestaltung Schulgebäude Lehmbaugruppe": "Lehmbaugruppe 学校建筑设计",
  "Gebäudegestaltung Sankratstraße": "桑克拉特街建筑设计",
  "Fertigstellung Elsterlofts": "埃尔斯特 Loft 竣工",
  "Giebelwand Grafisches Viertel": "印刷区山墙",
  "Ausgestaltung der HTWK": "莱比锡应用技术大学（HTWK）装饰设计",
}
const places: Record<string, string> = {
  Washington: "华盛顿",
  Hoyerswerda: "霍耶斯韦达",
  Leipzig: "莱比锡",
  Zwönitz: "茨文尼茨",
  "Tharandter Wald": "塔兰特森林",
  Altenburg: "阿尔滕堡",
  Nordhausen: "诺德豪森",
  Äthiopien: "埃塞俄比亚",
  Templin: "滕普林",
  Berlin: "柏林",
  "Varel Friesland": "弗里斯兰瓦雷尔",
  Markkleeberg: "马克克莱贝格",
  Stuttgart: "斯图加特",
  Chemnitz: "开姆尼茨",
  Zwenkau: "茨文考",
  Wurzbach: "武尔茨巴赫",
  Hannover: "汉诺威",
  Weida: "魏达",
  Freiberg: "弗赖贝格",
  Gera: "格拉",
  "Leipzig – Borna": "莱比锡 – 博尔纳",
  Mönchengladbach: "门兴格拉德巴赫",
}

export const kunstAmBau: typeof DE.kunstAmBau = {
  kicker: "参考项目",
  lead: "过去几十年间，Fischer-Art 在公共空间创作了大量作品。迄今已彩绘逾 30,000 平方米的建筑立面，为此用掉了近 600 升鲜艳的颜料。",
  projects: de.kunstAmBau.projects.map((p) => ({ year: p.year, place: places[p.place] ?? p.place, object: objects[p.object] ?? p.object })),
}

export const publications: typeof DE.publications = {
  ...de.publications,
  kicker: "出版物",
  text: about.fields[5].text,
  publisher: "Schwarzkopf & Schwarzkopf 出版社出版",
  books: [
    { year: "2014", title: "《短篇小说集：无主之城》（Kurzgeschichten. Herrenlose Stadt）", note: "已绝版" },
    { year: "2008", title: "《被告已被“审判”》（Der Angeklagte ist anGERICHTet.）", note: "Veikko Bartel 著，Michael Fischer-Art 插图" },
    { year: "2002", title: "《莱比锡画派》（Leipziger Schule.）" },
    { year: "2002", title: "《建筑艺术》（Kunst am Bau）" },
    { year: "1997", title: "《文凭与其他有组织的犯罪》（Das Diplom und andere organisierte Verbrechen.）" },
    { year: "1995", title: "《通往色彩冲击之路及归来》（Der Weg zum Farbschock und zurück.）" },
  ],
  covers: de.publications.covers.map((c, i) => ({
    ...c,
    caption: ["《文凭与其他有组织的犯罪》", "《建筑艺术》", "《莱比锡画派》", "《通往色彩冲击之路及归来》"][i] ?? c.caption,
  })),
}

export const news: typeof DE.news = [
  {
    ...de.news[0],
    title: "博尔纳工作室春季沙龙 2026 年 4 月 18 日",
    text: "博尔纳工作室春季沙龙：2026 年 4 月 18 日 10:00 – 20:00。欢迎前来欣赏艺术！",
  },
]

export const shop: typeof DE.shop = {
  intro: "原作、艺术印刷品、出版物和周边商品即将在此发售。",
  order: "如需购买日历，请将您的姓名和地址通过电子邮件发送给我们。",
  items: [
    {
      ...de.shop.items[0],
      title: "2023 年尼泊尔日历（竖版）",
      text: "每年至少做一件好事——为筹备多个慈善项目，艺术家 Michael Fischer-Art 也深入参与了尼泊尔首都加德满都一家儿童医院的重建。这次访问启发了尼泊尔日历的主题。",
      price: "9.90 欧元，另加 8 欧元运费",
    },
    {
      ...de.shop.items[1],
      title: "2023 年希望日历（横版）",
      text: "“希望永不消逝”——Fischer-Art 如此描述他的月历，这本日历再次让他和身边的人面临种种挑战。艺术家不仅处理具有社会意义的主题，还尝试以日常场景加以调和。经济危机与体育运动被结合在一起呈现，让人一窥艺术家的思想世界。",
      price: "9.90 欧元，另加 8 欧元运费",
    },
    {
      ...de.shop.items[2],
      title: "2021 年日历",
      text: "Michael Fischer-Art 独家日历的第二版以 12 幅令人印象深刻的作品陪伴您度过 2021 年。所有高品质艺术作品都与季节和节日相呼应。",
      price: "9.90 欧元，另加 8 欧元运费",
    },
    {
      ...de.shop.items[3],
      title: "2021 年日历",
      text: "2020 年让我们大多待在自己的四壁之内。在此期间，Michael Fischer-Art 和许多人一样，被对远方的渴望所打动。他将对异国文化和遥远国度中热闹生活的向往，化作 12 幅独特的高品质作品。",
      price: "9.90 欧元，另加 8 欧元运费",
    },
  ],
}

export const faq: typeof DE.faq = [
  {
    q: "如何委托创作？",
    a: "请将您的想法发送至 atelier@fischer-art.de。委托作品范围广泛：从个人肖像、布面绘画，到入口大厅壁画，乃至整座建筑立面的设计。",
  },
  {
    q: "可以参观工作室吗？",
    a: "可以。预约后即可参加博尔纳艺术工厂的私人工作室导览，聆听关于过去、现在和未来的故事。",
  },
  {
    q: "可以预订工作室举办活动吗？",
    a: "可以。艺术工厂为您与客户或商业伙伴的夜晚提供独特的工业风格场地。请通过电子邮件发送咨询。",
  },
  {
    q: "参加“与 Fischer-Art 一起绘画”需要基础吗？",
    a: "不需要，只需带上尝试新事物的勇气。材料、画布和丙烯颜料均由艺术家提供。",
  },
  {
    q: "如何订购日历？",
    a: "请将您的姓名和地址通过电子邮件发送给我们。每本日历 9.90 欧元，另加 8 欧元运费。",
  },
  {
    q: "工作室在哪里？",
    a: "位于德国博尔纳 Am Steigerhain 13 号艺术工厂（Kunstfabrik），邮编 04552，莱比锡以南。",
  },
]
