// English and Chinese texts for the work categories and translated gallery captions.
// Captions that are names of people or places stay as they are.
import type { WorkCategory } from "./works"

type Meta = Omit<WorkCategory, "images" | "cover">[]

export const metaEn: Meta = [
  {
    slug: "originale",
    title: "Originals",
    text: [
      "When you buy an original, you acquire – as the name says – a genuine Fischer-Art, signed and of course in colour! An original is therefore usually unique: it exists only once in the world. This is especially true of elaborate paintings and is what makes original art so special.",
      "Rich colours, large surfaces, simple structures and comic-like “muppets” – this is the visual language Michael Fischer-Art uses in many of his originals. But the collection also includes landscapes, portraits and abstract pictures. The result is a strong recognition value and pictures that are always a little provocative.",
    ],
  },
  {
    slug: "skulpturen",
    title: "Sculptures",
    text: [
      "Michael Fischer-Art's signature can also be found in his sculptures. Colourful and striking, they are a magnet on many squares in Germany and beyond – an eye-catcher that is not quickly forgotten.",
      "As with art in architecture, sculptures should be durable and sustainable in their origins. Using recycled materials, he creates new, individual figures that are accessible as art in public space.",
    ],
  },
  {
    slug: "kunst-am-bau",
    title: "Art in Architecture",
    text: [
      "What colour is to the artist, the façade is to the builder. Architecture, a basic idea and art in public space come together to create a place that is accessible to people in their everyday lives.",
      "Kindergartens, residential buildings or bridges – anything can be individualised through art in architecture. It is not only about beautifying objects: a theme should always be worked in, such as the history of the building or the occasion for which the artwork was created.",
    ],
  },
  {
    slug: "portraets",
    title: "Portraits",
    text: [
      "Every artist discovers their own passion – Michael Fischer-Art's can be found in this category. Many of his fans are thrilled by the portraits. Naomi Campbell, for example, was so delighted that she bought the painting herself as a belated birthday present.",
      "What inspires Fischer-Art's choice of subjects? Music and striking personalities, among other things – so it is no surprise that “someone has to do the job” and Udo Lindenberg will be portrayed.",
    ],
  },
  {
    slug: "new-art",
    title: "New Art",
    text: [
      "Sometimes it is not the artist who finds the canvas – the object finds the artist. Alongside a large number of vehicles, Michael Fischer-Art has found his personal highlight: the Peace Tank, a project close to the hearts of both artist and client.",
      "Michael Fischer-Art is always looking for new challenges and inspiration. If you would like objects with a history brought to life through art, get in touch.",
    ],
  },
  {
    slug: "events",
    title: "Events",
    text: [
      "Every artist reinvents himself from time to time. Michael Fischer-Art chose the 2019 summer party at the factory near Borna as his starting signal. With almost 300 guests, the grounds turned into a midsummer night's dream with Fischer-Art as DJ and live music, while star chef Lutz Köhler took care of the culinary side.",
      "Looking for a venue for an event in an extraordinary setting? Spend an evening where one of Leipzig's best-known artists creates his works.",
    ],
  },
  {
    slug: "reisen",
    title: "Travel",
    text: [
      "Rome, London, Ischia, Korea, Portugal, Mexico, France, Athens, Jordan, China and America are among the many cities and countries Michael Fischer-Art has visited in recent years to put his thoughts into perspective and, above all, to gather new inspiration. He always records his impressions in sketch diaries.",
      "One of the most impressive places Fischer-Art visited was the rock city of Petra in the Siq gorge in Jordan. Petra was built more than 2,000 years ago. The city was considered lost for many years and has been the setting for films such as Indiana Jones. To this day the rock city holds many secrets – and that is not the only reason it is a source of inspiration.",
    ],
  },
  {
    slug: "friends",
    title: "Fischer-Art & Friends",
    text: [
      "Michael Fischer-Art gets around a lot, and not only in Leipzig. All over the world he finds inspiration and meets famous faces and interesting personalities.",
      "The personalities Michael Fischer-Art has met at various events include not only politicians such as Angela Merkel and Bill Clinton, but also athletes and celebrities from film, television and music.",
    ],
  },
  {
    slug: "charity",
    title: "Charity",
    text: [
      "For many years Michael Fischer-Art has supported a wide range of charity projects around the world. He took part in the Buddy Bear Berlin Show, created many works of art for good causes and paints with children from all social backgrounds on a voluntary basis. Charity is very close to the artist's heart, which is why he not only donates materials but also invests a lot of time.",
      "“I always think it's good to donate to children and young people and to support people in our society who have been hit by strokes of fate. I'm a father of four myself – children always need helping hands,” says Michael Fischer-Art about the charity project “Ein Herz für Kinder” (A Heart for Children).",
    ],
  },
]

export const metaZh: Meta = [
  {
    slug: "originale",
    title: "原作",
    text: [
      "购买原作，顾名思义，就是获得一件真正的 Fischer-Art 作品——有签名，当然也是彩色的！因此原作通常是独一无二的，世界上只存在一件。这一点在精心绘制的画作中尤为突出，也正是原作艺术的独特魅力所在。",
      "浓烈的色彩、大面积的色块、简洁的结构和漫画式的“木偶人物”——这是 Michael Fischer-Art 在许多原作中使用的视觉语言。但收藏中也有风景、肖像和抽象作品。由此诞生的作品辨识度极高，并总带着几分挑衅。",
    ],
  },
  {
    slug: "skulpturen",
    title: "雕塑",
    text: [
      "Michael Fischer-Art 的个人风格同样体现在他的雕塑中。它们色彩缤纷、引人注目，是德国乃至世界各地许多广场上的焦点，令人过目难忘。",
      "与建筑艺术一样，雕塑在取材上也应持久且可持续。他利用回收材料创作出全新的、独具个性的人物形象，作为公共空间艺术供大众欣赏。",
    ],
  },
  {
    slug: "kunst-am-bau",
    title: "建筑艺术",
    text: [
      "颜料之于艺术家，正如立面之于建筑商。建筑、构思与公共空间艺术在此相融，创造出一个融入人们日常生活的场所。",
      "幼儿园、住宅或桥梁——一切都可以通过建筑艺术变得个性化。但这不仅仅是美化物体，还应融入一个主题，例如建筑的历史或艺术作品诞生的缘由。",
    ],
  },
  {
    slug: "portraets",
    title: "肖像",
    text: [
      "每位艺术家都有属于自己的热爱，Michael Fischer-Art 的热爱就体现在这一类别中。许多粉丝一看到这些肖像就赞不绝口。例如，娜奥米·坎贝尔对画作十分喜爱，亲自将其买下作为迟到的生日礼物。",
      "是什么启发了 Fischer-Art 的选择？音乐和个性鲜明的人物都是灵感来源——因此“总得有人来做这件事”，乌多·林登贝格也将成为他笔下的人物。",
    ],
  },
  {
    slug: "new-art",
    title: "新艺术",
    text: [
      "有时不是艺术家找到画布，而是物体找到了艺术家。除了众多车辆之外，Michael Fischer-Art 还找到了他个人的得意之作：和平坦克——艺术家与委托人共同的心血项目。",
      "Michael Fischer-Art 始终在寻找新的挑战和灵感。如果您也希望通过艺术让承载历史的物品焕发生机，欢迎与我们联系。",
    ],
  },
  {
    slug: "events",
    title: "活动",
    text: [
      "每位艺术家都会不时重塑自我。Michael Fischer-Art 选择以 2019 年在博尔纳附近工厂举办的夏日派对作为起点。近 300 位来宾到场，场地化身为一场仲夏夜之梦：Fischer-Art 亲任 DJ，现场音乐助兴，明星厨师 Lutz Köhler 负责美食。",
      "您在寻找一个环境独特的活动场地吗？在莱比锡最著名的艺术家之一创作作品的地方，度过一个美好的夜晚吧。",
    ],
  },
  {
    slug: "reisen",
    title: "旅行",
    text: [
      "罗马、伦敦、伊斯基亚、韩国、葡萄牙、墨西哥、法国、雅典、约旦、中国和美国，都是 Michael Fischer-Art 近年来到访过的城市和国家。他借旅行沉淀思绪，更重要的是收集新的灵感，并始终将所见所感记录在速写日记中。",
      "Fischer-Art 到访过的最令人震撼的地方之一，是约旦西克峡谷中的岩石之城佩特拉。佩特拉建于两千多年前，曾长期被认为已经失落，也是《夺宝奇兵》等电影的取景地。直到今天，这座岩石之城仍隐藏着许多秘密，这也只是它成为灵感源泉的原因之一。",
    ],
  },
  {
    slug: "friends",
    title: "Fischer-Art 与朋友们",
    text: [
      "Michael Fischer-Art 不仅活跃于莱比锡，也在世界各地汲取灵感，结识知名人士和有趣的人物。",
      "在各种活动中与 Michael Fischer-Art 相识的人物，不仅有安格拉·默克尔、比尔·克林顿等政治家，还有体育明星以及影视和音乐界的名人。",
    ],
  },
  {
    slug: "charity",
    title: "慈善",
    text: [
      "多年来，Michael Fischer-Art 一直在世界各地支持各类慈善项目。他参加了柏林“伙伴熊”（Buddy Bär）展，为公益事业创作了许多艺术作品，并义务与来自各个社会阶层的孩子们一起绘画。慈善是这位艺术家的心之所系，因此他不仅捐赠材料，还投入了大量时间。",
      "“我一直认为，为儿童和青少年捐款、帮助社会中遭受命运打击的人是件好事。我自己就是四个孩子的父亲——孩子们永远需要援手。”Michael Fischer-Art 谈及慈善项目“为孩子献出爱心”（Ein Herz für Kinder）时如是说。",
    ],
  },
]

export const captionsEn: Record<string, string> = {
  Bibliothek: "Library",
  Bildermuseum: "Museum of Fine Arts",
  Brunnen: "Fountain",
  "Brunnen- Frankfurt Oder": "Fountain, Frankfurt (Oder)",
  "Brunnen-Frankfurt Oder": "Fountain, Frankfurt (Oder)",
  "Brühl-Arkade": "Brühl Arcade",
  "Charlene von Monaco": "Charlene of Monaco",
  "Diplom Finanzbeamte": "Diploma, tax officials",
  "Eingangsportal der Grundschule Markkleeberg": "Primary school entrance, Markkleeberg",
  "Feier zu 3": "Celebration for three",
  "Fischer-Art Porträt": "Fischer-Art portrait",
  "Fischer-Art-Haus Hannover": "Fischer-Art House, Hanover",
  "Fischer-Art-Haus, Sebnitz": "Fischer-Art House, Sebnitz",
  Frankreich: "France",
  Friedenspanzer: "Peace Tank",
  "Gestaltung Fritz-Heckert-Wohngebiet": "Fritz Heckert housing estate",
  "Gestaltung des Hörsaal-Kubus TU Dresden": "Lecture hall cube, TU Dresden",
  "Giebelbemalung Brühl-Arkaden": "Gable painting, Brühl Arcades",
  Italien: "Italy",
  "KiTa Olgastraße": "Olgastrasse day-care centre",
  "Klitschko Brüder": "Klitschko brothers",
  "Marathon am Völkerschlachtdenkmal": "Marathon at the Battle of the Nations Monument",
  "Michail Gorbatschow": "Mikhail Gorbachev",
  Nordhäuser: "Nordhäuser",
  Oldtimer: "Vintage car",
  "Prinz Hakoon": "Crown Prince Haakon",
  "Projekt Neubrandenburg": "Neubrandenburg project",
  Regenwand: "Rain wall",
  Religionen: "Religions",
  "Sebastian Krumbiegel- Ronald McDonald": "Sebastian Krumbiegel – Ronald McDonald House",
  Seerosen: "Water lilies",
  "Skizze Mensch": "Sketch: human",
  Spielplatz: "Playground",
  "Sportstadt Leipzig mit Tina Dietze-Olympiaball": "Sports City Leipzig with Tina Dietze – Olympic Ball",
  "Sportstadt Leipzig-Olympiaball": "Sports City Leipzig – Olympic Ball",
  Stahlfigur: "Steel figure",
  Stahlfiguren: "Steel figures",
  "Verhüllung Außenfassaden Drei Türme": "Wrapping of the Three Towers façades",
  "Verhüllung der Schlosswache auf der Osterburg": "Wrapping of the castle guardhouse, Osterburg",
  "Vom Tellerwäscher zum Millionär": "From Rags to Riches",
  "Wandbemalung, Kulturhaus Leipzig im Ural": "Mural, Leipzig Cultural Centre in the Urals",
  Wolkenhaufen: "Cloud heap",
  "Zukunft und Vergangenheit": "Future and Past",
}

export const captionsZh: Record<string, string> = {
  "Amy Winehouse": "艾米·怀恩豪斯",
  "Angela Merkel": "安格拉·默克尔",
  "Angelina Jolie": "安吉丽娜·朱莉",
  Bibliothek: "图书馆",
  Bildermuseum: "莱比锡造型艺术博物馆",
  "Bill Clinton": "比尔·克林顿",
  Blüthner: "博兰斯勒钢琴",
  "Brad Pitt": "布拉德·皮特",
  Brunnen: "喷泉",
  "Brunnen- Frankfurt Oder": "奥得河畔法兰克福喷泉",
  "Brunnen-Frankfurt Oder": "奥得河畔法兰克福喷泉",
  "Brühl-Arkade": "布吕尔拱廊",
  "Charlene von Monaco": "摩纳哥王妃夏琳",
  China: "中国",
  "Diplom Finanzbeamte": "税务官员文凭",
  "Eingangsportal der Grundschule Markkleeberg": "马克克莱贝格小学入口",
  "Feier zu 3": "三人庆典",
  "Fischer-Art Porträt": "Fischer-Art 肖像",
  "Fischer-Art-Haus Hannover": "汉诺威 Fischer-Art 之家",
  "Fischer-Art-Haus, Sebnitz": "塞布尼茨 Fischer-Art 之家",
  Frankreich: "法国",
  Friedenspanzer: "和平坦克",
  "Gestaltung Fritz-Heckert-Wohngebiet": "弗里茨·黑克特住宅区设计",
  "Gestaltung des Hörsaal-Kubus TU Dresden": "德累斯顿工业大学报告厅立方体设计",
  "Giebelbemalung Brühl-Arkaden": "布吕尔拱廊山墙彩绘",
  "Helmut Kohl": "赫尔穆特·科尔",
  "Hotel Berlin": "柏林酒店",
  Iran: "伊朗",
  Israel: "以色列",
  Italien: "意大利",
  "Joachim Gauck": "约阿希姆·高克",
  "Karl Lagerfeld": "卡尔·拉格斐",
  "Kate Moss": "凯特·摩丝",
  "KiTa Olgastraße": "奥尔加街幼儿园",
  Kindergarten: "幼儿园",
  "Klitschko Brüder": "克里琴科兄弟",
  "Lady Gaga": "Lady Gaga",
  Madeira: "马德拉",
  "Marathon am Völkerschlachtdenkmal": "民族大会战纪念碑马拉松",
  "Michael Ballack": "米夏埃尔·巴拉克",
  "Michail Gorbatschow": "米哈伊尔·戈尔巴乔夫",
  Oldtimer: "老爷车",
  "Princess Diana": "戴安娜王妃",
  "Prinz Hakoon": "哈康王储",
  "Projekt Neubrandenburg": "新勃兰登堡项目",
  Regenwand: "雨墙",
  Religionen: "宗教",
  Seerosen: "睡莲",
  "Seehotel Templin": "滕普林湖滨酒店",
  "Skizze Mensch": "人物速写",
  Spielplatz: "游乐场",
  "Sportstadt Leipzig mit Tina Dietze-Olympiaball": "体育之城莱比锡与蒂娜·迪策——奥林匹克舞会",
  "Sportstadt Leipzig-Olympiaball": "体育之城莱比锡——奥林匹克舞会",
  Stahlfigur: "钢铁人像",
  Stahlfiguren: "钢铁人像",
  Taxi: "出租车",
  "Tom Jones": "汤姆·琼斯",
  "Verhüllung Außenfassaden Drei Türme": "“三塔”外立面包裹艺术",
  "Verhüllung der Schlosswache auf der Osterburg": "奥斯特堡城堡卫所包裹艺术",
  Vietnam: "越南",
  "Vom Tellerwäscher zum Millionär": "从洗碗工到百万富翁",
  "Wandbemalung, Kulturhaus Leipzig im Ural": "乌拉尔地区莱比锡文化宫壁画",
  Wolkenhaufen: "云堆",
  "Zukunft und Vergangenheit": "未来与过去",
}
