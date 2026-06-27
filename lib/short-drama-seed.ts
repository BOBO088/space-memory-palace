// Auto-seed data for the AI 短剧导演空间 template.
//
// We pre-create six hotspots on the floor, each with a knowledge card
// that already has demo-quality Chinese starter content. A user opening
// a freshly created short_drama_studio space should see something
// they can immediately show a client — not an empty board.

import type { CardType, Hotspot, KnowledgeCard, Space } from "./types";

export interface ShortDramaSeed {
  hotspots: Hotspot[];
  cards: KnowledgeCard[];
}

interface SeedSpec {
  /** Position on the floor (units are scene meters). */
  position: { x: number; y: number; z: number };
  title: string;
  summary: string;
  type: CardType;
  /** Markdown body. Aim for 200+ characters of meaningful starter text. */
  content: string;
  color: string;
  tags: string[];
}

const SEED: SeedSpec[] = [
  {
    title: "角色墙",
    summary: "主角 / 配角 / 反派 · 一眼看清整部剧的人",
    type: "character",
    position: { x: -3.2, y: 0.15, z: 2.2 },
    color: "#f472b6",
    tags: ["角色", "IP"],
    content: [
      "## 主角 · 林昭",
      "- 26 岁，独立纪录片导演，租住在北京胡同尽头的小院。",
      "- 性格：表面冷淡、内心柔软。习惯用镜头替代语言。",
      "- 视觉锚点：黑色高领毛衣、左手始终握着一只旧胶片机、雨天必穿军绿色风衣。",
      "",
      "## 关键配角",
      "- **苏蔓**：林昭的大学同学，现在是一名直播带货主播。每次出现都用「家人们」开头，是全剧最有烟火气的声音。",
      "- **老周**：胡同口修表的老师傅，60 岁，是林昭父亲生前的好友。台词不超过五句，但每一句都推动剧情。",
      "",
      "## 反派 / 对手",
      "- **陈总**：MCN 机构老板，想签下林昭的纪录片 IP。外表儒雅，谈判时永远笑眯眯。",
      "- 标志性行为：把玩一只银色打火机，从不点燃。",
      "",
      "## 角色关系速记",
      "林昭 ← 老友 → 苏蔓｜林昭 ← 父辈 → 老周｜林昭 ← 对手 → 陈总",
    ].join("\n"),
  },
  {
    title: "世界观",
    summary: "时代 / 地点 / 关键规则 · 短剧 12 集的世界底色",
    type: "scene",
    position: { x: 3.2, y: 0.15, z: 2.2 },
    color: "#22d3ee",
    tags: ["世界观", "设定"],
    content: [
      "## 时代",
      "当下。短视频时代，2024 年的北京。所有剧情在 12 集 × 90 秒内完成，每集结尾必留钩子。",
      "",
      "## 地点",
      "- **主要场景**：北京东城胡同、林昭的小院、老周的修表铺。",
      "- **次要场景**：MCN 办公室、医院走廊、天台。",
      "- **虚实边界**：手机屏幕里的直播画面与现实画面会做硬切剪辑（Jump Cut），是这部剧的视觉签名。",
      "",
      "## 关键规则（限制 / 代价 / 禁忌）",
      "1. 林昭的镜头只能拍「真实的人」，无法对准「虚假的表演」——这是他无法用短视频语言表达自己的根因。",
      "2. 老周修表时，时间是凝固的；这个细节每次出现都暗示角色正在做关键决定。",
      "3. 全剧没有任何 BGM，仅靠环境音和心跳声撑情绪。",
      "",
      "## 视觉基调",
      "- **色板**：胡同一律冷灰偏青，室内一律暖黄，MCN 办公室一律冷白偏蓝。",
      "- **光线**：胡同戏多用手电筒式硬光，室内戏永远只开一盏台灯。",
      "- **质感**：胶片颗粒 + 轻度漏光，永远不追求「干净」的画面。",
    ].join("\n"),
  },
  {
    title: "第 1 集剧情",
    summary: "开场 5 秒钩子 + 90 秒内讲清整部剧的矛盾",
    type: "episode",
    position: { x: -3.2, y: 0.15, z: 0 },
    color: "#fbbf24",
    tags: ["第 1 集", "开场"],
    content: [
      "## 开场（0-5 秒 钩子）",
      "画面：手持镜头剧烈摇晃，巷子里突然冲出一个人影——是林昭。",
      "声音：他急促的呼吸 + 远处有谁在喊「拍下来！拍下来！」",
      "字幕浮在画面正中：「他删掉了所有短视频，却没删掉这一条。」",
      "",
      "## 第一节 · 日常（5-40 秒）",
      "- 林昭的小院，凌晨 4 点，他在剪一部没人看的纪录片。",
      "- 老周送来一碗热粥，两人无言吃饭，镜头停在两人中间的那只旧胶片机。",
      "- 林昭的手机屏幕弹出 99+ 条消息，全部来自 MCN——他不看。",
      "",
      "## 第二节 · 破局事件（40-75 秒）",
      "- 苏蔓突然出现在院门口，背着巨大的直播灯架，眼眶是红的。",
      "- 她说：「家人们，我爸走了。」——这是她第一次在林昭面前没有用「家人们」三个字。",
      "- 林昭第一次举起镜头，对准了苏蔓的脸。",
      "",
      "## 第三节 · 悬念收尾（75-90 秒）",
      "- 黑屏。",
      "- 一行白字：「他把这一条，发到了他只有 12 个粉丝的账号上。」",
      "- 切到陈总的办公室，陈总把银色打火机「啪」地合上，嘴角上扬。",
      "",
      "## 第 1 集留下的钩子",
      "1. 林昭为什么删光所有短视频？",
      "2. 苏蔓的父亲到底发生了什么？",
      "3. 陈总在第 1 集已经知道林昭的存在，说明他一直在监视。",
    ].join("\n"),
  },
  {
    title: "分镜区",
    summary: "关键场景的镜头列表 · 写完即拍",
    type: "scene",
    position: { x: 3.2, y: 0.15, z: 0 },
    color: "#60a5fa",
    tags: ["分镜", "镜头"],
    content: [
      "## S1 · 胡同追逐（开场）",
      "- **镜 1**：POV 主观镜头，画面剧烈晃动（手持 + Stabilizer 反向），声音只有脚步声和喘息。",
      "- **镜 2**：侧面跟拍，林昭从画左冲入画右，背后灯光把他的影子拉得很长。",
      "- **镜 3**：近景特写，林昭的胶片机被撞飞，落地，镜头随之下沉。",
      "",
      "## S2 · 小院剪片（第一节）",
      "- **镜 4**：固定机位 + 微推，林昭坐在监视器前，时间从 04:00 跳到 06:00（叠化）。",
      "- **镜 5**：插入镜头——他剪掉的素材闪回 3 帧（被删的短视频内容），暗示他删过什么。",
      "- **镜 6**：俯拍，老周把粥放在桌上，两人的手没有接触。",
      "",
      "## S3 · 苏蔓出现（第二节）",
      "- **镜 7**：从门缝拍苏蔓，焦点在前景的木门上，苏蔓是失焦的虚影。",
      "- **镜 8**：反打，林昭抬头，胶片机正好在他脸旁，按下录制键的瞬间画面轻微过曝。",
      "",
      "## 镜头语言规则",
      "1. 出现林昭举镜头的瞬间，画面必须过曝半档。",
      "2. 出现老周修表时，切硬切 0.5 秒黑场。",
      "3. 陈总的所有镜头，焦点永远不在他脸上——在打火机上。",
    ].join("\n"),
  },
  {
    title: "提示词库",
    summary: "角色 / 场景 / 风格 · AI 出图直接复制",
    type: "prompt",
    position: { x: -3.2, y: 0.15, z: -2.2 },
    color: "#fbbf24",
    tags: ["提示词", "AI"],
    content: [
      "## 角色一致性 · 林昭",
      "a young Chinese documentary filmmaker, 26, sharp jaw, dark high-neck sweater, old Leica M6 camera always in left hand, calm but tired eyes, soft cold light from a single window, shallow depth of field, 35mm film grain, cinematic color grading, no smile, mid-shot, photorealistic",
      "",
      "## 角色一致性 · 老周",
      "an elderly Chinese watchmaker, 60+, silver hair, thick glasses, leather apron, focused on a tiny mechanical watch, warm tungsten light, shallow DOF, 35mm film grain, photorealistic, hands-on closeup, no eye contact with camera",
      "",
      "## 场景一致性 · 胡同",
      "old Beijing hutong alley at 4am, single sodium street lamp, rain-soaked cobblestones, faint mist, no people, cinematic, 35mm film grain, cold teal color palette, photorealistic, wide establishing shot",
      "",
      "## 风格提示词（贴在任意 prompt 末尾）",
      "cinematic still, 35mm film grain, anamorphic lens, shallow depth of field, no text, no watermark, soft light wrap, photorealistic, 2.39:1 aspect ratio, muted color palette",
      "",
      "## 镜头语言 · 跑酷 / 追逐",
      "handheld tracking shot, slight motion blur, POV close to ground, 24fps, motion-stabilized in post, gritty urban texture, photorealistic",
      "",
      "## 负面提示词（通用）",
      "no text, no logo, no watermark, no deformed hands, no extra fingers, no oversaturated colors, no plastic skin, no anime, no chibi",
    ].join("\n"),
  },
  {
    title: "场景资产",
    summary: "室内外主场景 + 关键道具 · 拍之前先列清单",
    type: "image",
    position: { x: 3.2, y: 0.15, z: -2.2 },
    color: "#a78bfa",
    tags: ["场景", "资产"],
    content: [
      "## 室内主场景 · 林昭的小院",
      "- 空间：约 18 平米，砖墙 + 木窗 + 院里一棵老槐树。",
      "- 关键道具：三脚架、监视器、墙上贴满的剪报、老式挂钟。",
      "- 光线：永远只开一盏台灯（暖黄 2700K），窗外是冷青的月光。",
      "",
      "## 室内主场景 · 老周修表铺",
      "- 空间：不到 8 平米，玻璃柜台塞满旧钟表，墙上是 1970 年代的挂历。",
      "- 关键道具：一盏带绿色玻璃罩的台灯、老周的老花镜、一只停摆的怀表（重要道具）。",
      "- 光线：单光源顶灯 + 修表台的环形灯，永远是静谧的金色。",
      "",
      "## 室外主场景 · 深夜胡同",
      "- 空间：东四三条到东四五条之间，约 200 米。",
      "- 关键道具：路灯、青砖墙、被雨水冲刷过的石板路。",
      "- 光线：钠灯暖黄 + 偶尔经过的车前灯。",
      "",
      "## 关键道具清单（与剧情绑定的物件）",
      "1. **林昭的胶片机** —— 全剧核心道具，出现 18 次，最后一次出现在第 12 集结尾。",
      "2. **老周的怀表** —— 停在 03:17，分集反复出现，第 9 集开始走动。",
      "3. **陈总的银色打火机** —— 从不点燃，第 11 集被林昭点燃。",
      "4. **苏蔓的直播灯架** —— 第 1 集她带来，第 12 集她关掉。",
    ].join("\n"),
  },
];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now()
    .toString(36)
    .slice(-4)}`;
}

/** Build the seed hotspots and cards for a freshly created short_drama_studio space. */
export function buildShortDramaSeed(space: Space): ShortDramaSeed {
  const now = new Date().toISOString();
  const hotspots: Hotspot[] = [];
  const cards: KnowledgeCard[] = [];
  for (const spec of SEED) {
    const cardId = makeId("card");
    const hotspotId = makeId("hot");
    cards.push({
      id: cardId,
      spaceId: space.id,
      title: spec.title,
      type: spec.type,
      content: spec.content,
      summary: spec.summary,
      tags: spec.tags,
      mediaUrls: [],
      externalLinks: [],
      createdAt: now,
      updatedAt: now,
    });
    hotspots.push({
      id: hotspotId,
      spaceId: space.id,
      cardId,
      title: spec.title,
      summary: spec.summary,
      position: spec.position,
      color: spec.color,
      icon: "dot",
      createdAt: now,
      updatedAt: now,
    });
  }
  return { hotspots, cards };
}
