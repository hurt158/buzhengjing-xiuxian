// ================================================================
// 第 2 部分：核心数据定义
// ================================================================

// ==================== 境界系统 ====================
const REALMS = [
  { name: '凡人', layers: 1, expNeeded: 100, atkBonus: 0, defBonus: 0, hpBonus: 0, mpBonus: 0, breakItem: null, icon: '⚪', lifeMonths: 720 },
  { name: '炼气期', layers: 9, expNeeded: 200, atkBonus: 5, defBonus: 3, hpBonus: 50, mpBonus: 30, breakItem: null, icon: '🟤', lifeMonths: 960 },
  { name: '筑基期', layers: 9, expNeeded: 500, atkBonus: 15, defBonus: 10, hpBonus: 150, mpBonus: 80, breakItem: '筑基丹', icon: '🟢', lifeMonths: 1440 },
  { name: '金丹期', layers: 9, expNeeded: 1200, atkBonus: 40, defBonus: 25, hpBonus: 400, mpBonus: 200, breakItem: '结金丹', icon: '🟡', lifeMonths: 2400 },
  { name: '元婴期', layers: 9, expNeeded: 3000, atkBonus: 100, defBonus: 60, hpBonus: 1000, mpBonus: 500, breakItem: '化婴丹', icon: '🟣', lifeMonths: 4800 },
  { name: '化神期', layers: 9, expNeeded: 8000, atkBonus: 250, defBonus: 150, hpBonus: 3000, mpBonus: 1500, breakItem: '化神丹', icon: '🔵', lifeMonths: 9600 },
  { name: '合体期', layers: 9, expNeeded: 20000, atkBonus: 600, defBonus: 400, hpBonus: 8000, mpBonus: 4000, breakItem: '合体丹', icon: '🟠', lifeMonths: 18000 },
  { name: '大乘期', layers: 9, expNeeded: 50000, atkBonus: 1500, defBonus: 1000, hpBonus: 20000, mpBonus: 10000, breakItem: '大乘丹', icon: '🔴', lifeMonths: 36000 },
  { name: '渡劫期', layers: 1, expNeeded: 100000, atkBonus: 5000, defBonus: 3000, hpBonus: 50000, mpBonus: 30000, breakItem: '渡劫丹', icon: '⚡', lifeMonths: 60000 },
  { name: '仙帝', layers: 1, expNeeded: 999999, atkBonus: 99999, defBonus: 99999, hpBonus: 999999, mpBonus: 999999, breakItem: null, icon: '👑', lifeMonths: Infinity }
];

// ==================== 天赋系统 ====================
const TALENT_LEVELS = ['普通', '异于常人', '百里挑一', '千载难逢', '万里挑一', '古今唯一'];
const TALENT_WEIGHTS = [40, 30, 18, 8, 3, 1];

const TALENT_POOL = {
  '普通': [
    { name: '勤能补拙', desc: '修炼+5%', effect: { type: 'cultivateBoost', val: 1.05 }, evolveTo: { name: '大器晚成', desc: '修炼+25%', effect: { type: 'cultivateBoost', val: 1.25 } } },
    { name: '皮糙肉厚', desc: '生命+8%', effect: { type: 'hpBoost', val: 1.08 }, evolveTo: { name: '百炼成钢', desc: '生命+16%,防御+10', effect: { type: 'hpBoost', val: 1.16, defBonus: 10 } } },
    { name: '小有积蓄', desc: '初始灵石+30', effect: { type: 'startStones', val: 30 }, evolveTo: { name: '富可敌国', desc: '灵石获取+30%', effect: { type: 'stoneBoost', val: 1.3 } } }
  ],
  '异于常人': [
    { name: '灵根初显', desc: '修炼+15%', effect: { type: 'cultivateBoost', val: 1.15 } },
    { name: '寻宝嗅觉', desc: '探索稀有+30%', effect: { type: 'exploreRare', val: 1.3 } },
    { name: '坚韧', desc: '防御+15%', effect: { type: 'defBoost', val: 1.15 } }
  ],
  '百里挑一': [
    { name: '洞天福地', desc: '修炼+30%,突破+5%', effect: { type: 'cultivateBoost', val: 1.3, breakBonus: 0.05 } },
    { name: '战斗直觉', desc: '攻击+25%', effect: { type: 'atkBoost', val: 1.25 } },
    { name: '灵石眷顾', desc: '灵石+40%', effect: { type: 'stoneBoost', val: 1.4 } }
  ],
  '千载难逢': [
    { name: '天灵根', desc: '修炼+60%,灵力恢复+30%', effect: { type: 'cultivateBoost', val: 1.6, mpRegen: 1.3 } },
    { name: '不死血脉', desc: '生命+50%,死亡惩罚减半', effect: { type: 'hpBoost', val: 1.5, deathPenalty: 0.5 } },
    { name: '奇遇体质', desc: '奇遇概率x2', effect: { type: 'adventureRate', val: 2.0 } }
  ],
  '万里挑一': [
    { name: '轮回道果', desc: '修炼x2,突破必成', effect: { type: 'cultivateBoost', val: 2.0, guaranteedBreak: true } },
    { name: '混沌剑体', desc: '攻击x2.5,战斗吸血15%', effect: { type: 'atkBoost', val: 2.5, lifesteal: 0.15 } }
  ],
  '古今唯一': [
    { name: '天道之子', desc: '全属性x2,无视突破丹药', effect: { type: 'allBoost', val: 2.0, ignoreBreakItem: true } },
    { name: '万古不朽', desc: '生命x5,死亡原地复活一次', effect: { type: 'hpBoost', val: 5.0, revive: true } }
  ]
};

// ==================== 体魄系统 ====================
const PHYSIQUE_TYPES = {
  '凡体': { desc: '普通体质', effect: {} },
  '荒古圣体': { desc: '生命+40%,防御+30%', effect: { hpMult: 1.4, defMult: 1.3 } },
  '太阴之体': { desc: '灵力+60%,修炼+30%', effect: { mpMult: 1.6, cultMult: 1.3 } },
  '太阳之体': { desc: '攻击+35%,战斗灵石+30%', effect: { atkMult: 1.35, stoneMult: 1.3 } },
  '混沌体': { desc: '全属性+25%,突破+15%', effect: { allMult: 1.25, breakBonus: 0.15 } },
  '九窍玲珑体': { desc: '奇遇概率x3,道友上限+2', effect: { adventureMult: 3.0, companionMax: 2 } },
  '万毒不侵体': { desc: '恢复+100%,免疫死亡惩罚', effect: { regenMult: 2.0, deathImmune: true } },
  '不灭剑体': { desc: '攻击+20%,战斗后回血5%', effect: { atkMult: 1.2, fightHeal: true } },
  '玄冥之体': { desc: '黑夜修炼效率翻倍,心魔抵抗+20%', effect: { nightCultMult: 2.0, demonResist: 0.2 } },
  '混元灵体': { desc: '所有材料掉落+30%', effect: { matDropBoost: 1.3 } },
  '凤凰涅槃体': { desc: '死亡时免费复活,伤害反弹', effect: { reviveOnce: true, reflectDamage: true } },
  '天罚之体': { desc: '战斗概率召唤天雷追加伤害', effect: { thunderStrike: true } },
  '万象道体': { desc: '修炼+15%,炼丹炼器成功率+15%', effect: { cultMult: 1.15, forgeBoost: 0.15 } },
  '七窍玲珑心': { desc: '无视心魔与天劫,每次心魔永久+1攻击,每次天劫永久+10防御', effect: { immuneDemon: true, immuneTrib: true } }
};

// ==================== 命运四维阈值 ====================
const FATE_THRESHOLDS = {
  intelligence: [
    { val: 30, cultBoost: 1.05, breakBoost: 0.03 },
    { val: 50, cultBoost: 1.1, breakBoost: 0.05 },
    { val: 75, cultBoost: 1.15, breakBoost: 0.08 }
  ],
  physique: [
    { val: 30, expInjury: -5, restBoost: 1.15 },
    { val: 50, expInjury: -10, restBoost: 1.3 },
    { val: 80, expInjury: -15, restBoost: 1.5, immuneLightInjury: true }
  ],
  luck: [
    { val: 30, rareBoost: 1.1, doubleStoneChance: 0.05 },
    { val: 50, rareBoost: 1.25, doubleStoneChance: 0.1 },
    { val: 75, rareBoost: 1.5, doubleStoneChance: 0.15 }
  ],
  focus: [
    { val: 30, demonResist: 0.1, negEventImmune: 0.08 },
    { val: 50, demonResist: 0.2, negEventImmune: 0.15 },
    { val: 80, demonResist: 0.35, negEventImmune: 0.25 }
  ]
};

// ==================== 装备库 ====================
const EQUIPMENT_POOL = {
  weapon: [
    { id: 'w1', name: '铁剑', rarity: 'common', stats: { atk: 5 } },
    { id: 'w2', name: '灵风剑', rarity: 'uncommon', stats: { atk: 12 } },
    { id: 'w3', name: '玄火刃', rarity: 'rare', stats: { atk: 22 } },
    { id: 'w4', name: '破魔枪', rarity: 'epic', stats: { atk: 40, mp: 30 } },
    { id: 'w5', name: '诛仙剑', rarity: 'legendary', stats: { atk: 85, def: 20 } }
  ],
  armor: [
    { id: 'a1', name: '布衣', rarity: 'common', stats: { def: 3 } },
    { id: 'a2', name: '玄铁甲', rarity: 'uncommon', stats: { def: 10, hp: 20 } },
    { id: 'a3', name: '灵纹袍', rarity: 'rare', stats: { def: 18, mp: 25 } },
    { id: 'a4', name: '天蚕宝甲', rarity: 'epic', stats: { def: 35, hp: 80 } },
    { id: 'a5', name: '不灭金身', rarity: 'legendary', stats: { def: 70, hp: 200 } }
  ],
  accessory: [
    { id: 'c1', name: '铜戒指', rarity: 'common', stats: { hp: 15 } },
    { id: 'c2', name: '灵玉坠', rarity: 'uncommon', stats: { mp: 30, atk: 3 } },
    { id: 'c3', name: '储物戒', rarity: 'rare', stats: { hp: 40, def: 5 } },
    { id: 'c4', name: '凤凰翎', rarity: 'epic', stats: { atk: 25, mp: 50 } },
    { id: 'c5', name: '造化玉碟', rarity: 'legendary', stats: { all: 30 } }
  ]
};

// ==================== 套装效果 ====================
const SET_EFFECTS = {
  '诛仙套装': { pieces: ['诛仙剑', '不灭金身'], bonus: { atk: 30, def: 15 } },
  '凤凰套装': { pieces: ['凤凰翎', '灵纹袍'], bonus: { mp: 50, atk: 10 } },
  '储物套装': { pieces: ['储物戒', '玄铁甲'], bonus: { hp: 80, def: 10 } }
};

// ==================== 不正经炼器材料 ====================
const UNORTHODOX_MATERIALS = {
  '大能遗蜕': { id: 'hair', desc: '上古大能飞升遗留的圣物，流光溢彩', truth: '一撮杀马特七彩头发，还带卷', rarity: 'rare' },
  '菩提残片': { id: 'cloth', desc: '佛祖悟道时坐过的蒲团碎片，佛光隐现', truth: '一块破抹布，上面绣着一只歪歪扭扭的鸭子', rarity: 'uncommon' },
  '龙骨化石': { id: 'bone', desc: '远古真龙陨落后的脊骨化石，龙威犹在', truth: '一根狗啃过的猪大腿骨，上面还有牙印', rarity: 'uncommon' },
  '混沌原石': { id: 'stone', desc: '天地初开时遗留的混沌石，内含鸿蒙之气', truth: '一块鹅卵石，上面画着笑脸', rarity: 'common' },
  '天书残卷': { id: 'scroll', desc: '上古天帝留下的功法残篇，字迹有大道之气', truth: '一张写着"今晚吃什么"的便签，笔迹歪扭', rarity: 'rare' },
  '仙酿遗存': { id: 'wine', desc: '太上老君丹炉旁遗留的仙酿坛，闻一口飘飘欲仙', truth: '半坛子醋，打开酸味冲天', rarity: 'uncommon' },
  '凤凰尾羽': { id: 'feather', desc: '五彩流光的凤凰本命尾羽，蕴含涅槃真火', truth: '一只褪了色的鸡毛掸子上的毛', rarity: 'uncommon' },
  '捆仙索断节': { id: 'rope', desc: '上古捆仙索的残段，符文若隐若现', truth: '一根脏兮兮的鞋带，两头都毛了', rarity: 'common' },
  '先天灵钥': { id: 'key', desc: '蕴含先天之气的钥匙，可开万物之门', truth: '一枚生锈的铜钥匙，上面贴着纸条"储物间"', rarity: 'rare' },
  '九天琼浆残留': { id: 'tofu', desc: '九天之上遗留的琼浆玉液，仙气氤氲', truth: '过期的豆腐脑，已经馊了', rarity: 'common' },
  '补天石碎屑': { id: 'lime', desc: '女娲补天剩下的神石碎屑，蕴含造化之力', truth: '建房剩下的石灰渣，一捏就碎', rarity: 'common' },
  '炸炉残渣': { id: 'slag', desc: '炼丹失败的结晶，蕴含暴躁的灵力', truth: '一块烧糊的锅底，扣都扣不下来', rarity: 'common' }
};

// ==================== 不正经法器池（18件） ====================
const UNORTHODOX_ARTIFACTS = [
  { id: 'a01', name: '人皇旗', rarity: 'epic', stats: { atk: 12, def: 5 }, effectName: 'renhuangqi', effectRate: 0.3, effectDesc: '祭出人皇旗！万千魂魄齐声逼问"可有道侣""何时双修"，敌人被问得道心崩溃！', forgeHint: '破幡布+骸骨+黑夜' },
  { id: 'a02', name: '九龙华盖', rarity: 'epic', stats: { def: 12, mp: 10 }, effectName: 'jiulonghuagai', effectRate: 0.15, effectDesc: '你撑开华盖，三条龙说困了要午睡——华盖塌了一半，防御效果减半。', forgeHint: '凤凰尾羽+天书残卷+灵石' },
  { id: 'a03', name: '九品莲台', rarity: 'rare', stats: { def: 8, hp: 60 }, effectName: 'jiupinliantai', effectRate: 0.15, effectDesc: '你坐莲台入定太深，起身时卡住了！修炼效果临时减退。', forgeHint: '菩提残片+灵泉水×2' },
  { id: 'a04', name: '玉清拂尘', rarity: 'uncommon', stats: { atk: 5, mp: 15 }, effectName: 'yuqingfuchen', effectRate: 0.3, effectDesc: '你甩出拂尘驱邪——但咒语念到一半忘了，拂尘缠自己脸上，啥也没发生。', forgeHint: '天书残卷+灵泉水' },
  { id: 'a05', name: '七宝妙树', rarity: 'rare', stats: { mp: 20 }, effectName: 'qibaomiaoshu', effectRate: 0.4, effectDesc: '你摇了摇七宝妙树——掉下来一枚烂桃砸自己头上！但好像也掉了点东西。', forgeHint: '菩提残片+灵泉水+草药' },
  { id: 'a06', name: '血魔披风', rarity: 'rare', stats: { def: 10 }, effectName: 'xuemopifeng', effectRate: 1, effectDesc: '暗红披风鲜血流淌——太显眼了，战斗中敌人全盯着你打。', forgeHint: '大能遗蜕+灵兽血+黑夜' },
  { id: 'a07', name: '九幽玄阴灯', rarity: 'epic', stats: { mp: 25, atk: 8 }, effectName: 'jiuyoudeng', effectRate: 1, effectDesc: '灯幽幽亮了一瞬……你的寿命悄悄溜走……', forgeHint: '龙骨化石+捆仙索断节+心魔值' },
  { id: 'a08', name: '缚仙索', rarity: 'uncommon', stats: { def: 5, mp: 10 }, effectName: 'fuxiansuo', effectRate: 0.3, effectDesc: '你祭出缚仙索——它确实捆住了敌人！但它顺手打了个蝴蝶结。', forgeHint: '捆仙索断节+仙酿遗存' },
  { id: 'a09', name: '醉仙葫芦', rarity: 'rare', stats: { mp: 20 }, effectName: 'zuixianhulu', effectRate: 0.35, effectDesc: '你灌了一口！敌人闻到酒香口水直流，战后顺走灵石若干。', forgeHint: '仙酿遗存+灵泉水' },
  { id: 'a10', name: '乾坤袖', rarity: 'uncommon', stats: { def: 5, hp: 30 }, effectName: 'qiankunxiu', effectRate: 0.2, effectDesc: '你往袖子里一摸——掏出了上次塞进去的半个馒头。', forgeHint: '菩提残片+捆仙索断节' },
  { id: 'a11', name: '五德神禽羽扇', rarity: 'uncommon', stats: { atk: 10 }, effectName: 'wudeshan', effectRate: 0.4, effectDesc: '你挥扇——漫天鸡毛！敌人喷嚏连连。', forgeHint: '凤凰尾羽+草药' },
  { id: 'a12', name: '照妖镜', rarity: 'uncommon', stats: { mp: 10 }, effectName: 'zhaoyaojing', effectRate: 0.3, effectDesc: '镜子一闪——敌人看到了自己的丑样愣住了，羞愧赔了灵石。', forgeHint: '混沌原石+大能遗蜕' },
  { id: 'a13', name: '五鬼运财符', rarity: 'common', stats: {}, effectName: 'wuguiyuncaifu', effectRate: 1, effectDesc: '五鬼嘿咻嘿咻扛来一箱财宝！打开一看——全是冥币。', forgeHint: '天书残卷+龙骨化石+捆仙索断节' },
  { id: 'a14', name: '辟谷丹炉', rarity: 'uncommon', stats: { hp: 20 }, effectName: 'bigudanlu', effectRate: 1, effectDesc: '炉子里滚出一颗热乎的丹药……嗯？怎么是包子味？探索后回血。', forgeHint: '混沌原石+灵泉水+草药' },
  { id: 'a15', name: '传讯灵鹤', rarity: 'common', stats: {}, effectName: 'chuanxunlinghe', effectRate: 0.2, effectDesc: '纸鹤飞出去又飞回来——带回一条过期的消息。', forgeHint: '天书残卷+灵泉水' },
  { id: 'a16', name: '千面面具', rarity: 'rare', stats: { def: 3, mp: 5 }, effectName: 'qianmianmianju', effectRate: 0.3, effectDesc: '你变成了某人的脸——恰好是上一个得罪过的人，被追着砍！', forgeHint: '大能遗蜕+补天石碎屑' },
  { id: 'a17', name: '吸星盘', rarity: 'rare', stats: { mp: 15 }, effectName: 'xixingpan', effectRate: 0.2, effectDesc: '罗盘一转，敌人的灵石全往你兜里飞！但你的武器好像也被吸走了……', forgeHint: '混沌原石+先天灵钥+灵石' },
  { id: 'a18', name: '镇魂铃', rarity: 'rare', stats: { atk: 3, def: 3 }, effectName: 'zhenhunling', effectRate: 1, effectDesc: '铃声一响万物寂静——修炼效率大增，但战斗时总耳鸣。', forgeHint: '龙骨化石+九天琼浆残留+灵泉水' }
];

// ==================== 炼器异象描述 ====================
const FORGE_VISIONS = {
  pure: ['炉火纯青，法器初现雏形……', '炉中霞光万丈，仙气缭绕……', '天降祥瑞入炉，宝光乍现！'],
  mixed: ['炉中霞光忽明忽暗，隐约飘出一股怪味……', '炉盖轻轻颤动，传出了奇怪的笑声……', '霞光万丈又瞬间变绿——你有点不好的预感。'],
  chaos: ['天地异象！炉盖飞起，黑烟冲天三千里！', '炉中紫气暴涨！紫气又变绿了——绿气又红了……', '炉子抖了三抖，打了个喷嚏。你炼出了——']
};

// ==================== 商城物品 ====================
const SHOP_ITEMS = [
  { id: 'heal', name: '回春丹', desc: '恢复30%生命', price: 80, action: 'heal' },
  { id: 'mp', name: '聚灵散', desc: '恢复40%灵力', price: 60, action: 'mp' },
  { id: 'exp', name: '悟道茶', desc: '获得200修为', price: 100, action: 'exp' },
  { id: 'pill', name: '随机突破丹', desc: '随机获得当前或下一境界突破丹', price: 250, action: 'pill' },
  { id: 'egg', name: '灵兽蛋', desc: '随机孵化灵兽', price: 300, action: 'egg' },
  { id: 'scroll', name: '招募令', desc: '随机招募道友', price: 350, action: 'scroll' },
  { id: 'lifePill', name: '延寿丹', desc: '增加5年寿元', price: 500, action: 'lifePill' },
  { id: 'ageStop', name: '定龄丹', desc: '停止年龄增长6个月', price: 400, action: 'ageStop' },
  { id: 'stone', name: '强化石', desc: '强化装备材料', price: 60, action: 'stone' },
  { id: 'reroll', name: '洗练符', desc: '重铸装备属性', price: 80, action: 'reroll' },
  { id: 'tribPill', name: '雷劫丹', desc: '天劫伤害-10%（可叠加3层）', price: 300, action: 'tribPill' }
];

// ==================== 秘境副本 ====================
const DUNGEONS = [
  { name: '幽冥洞', floors: 3, entryCost: 80, rewards: ['强化石', '洗练符', '随机突破丹'], bossItem: '筑基丹' },
  { name: '熔火地心', floors: 5, entryCost: 150, rewards: ['强化石', '洗练符', '灵兽蛋'], bossItem: '结金丹' },
  { name: '古仙战场', floors: 7, entryCost: 300, rewards: ['强化石', '洗练符', '延寿丹'], bossItem: '化婴丹' }
];

// ==================== 炼丹配方 ====================
const ALCHEMY_RECIPES = [
  { name: '回春丹', materials: { '草药': 3 }, result: '回春丹', successRate: 0.8 },
  { name: '筑基丹', materials: { '草药': 5, '灵泉水': 2 }, result: '筑基丹', successRate: 0.5 },
  { name: '强化石', materials: { '矿石': 4 }, result: '强化石', successRate: 0.7 }
];

// ==================== 出身系统 ====================
const ORIGINS = [
  // 少年 8-15岁
  { age: [8 * 12, 15 * 12], name: '散修弟子', descFn: (loc) => `你自幼在${loc}长大，七岁便能观气，被散修收为弟子。`, fateMod: { intelligence: 2, physique: -1, focus: 1 }, bonus: null, passive: { name: '勤修苦练', desc: '每修炼10次获得1个随机材料' } },
  { age: [8 * 12, 15 * 12], name: '富家少爷', descFn: (loc) => `你生在${loc}富户，不好琴棋书画偏好奇门遁甲。`, fateMod: { intelligence: 1, physique: -1 }, bonus: { spiritStones: 30 }, passive: { name: '财大气粗', desc: '商城购买价格打九折' } },
  { age: [8 * 12, 15 * 12], name: '流浪乞儿', descFn: (loc) => `你在${loc}街头乞食长大，偷学功法于破庙之中。`, fateMod: { physique: 2, luck: 1, intelligence: -2 }, bonus: null, passive: { name: '街头韧性', desc: '休息时额外恢复20%生命' } },
  // 青年 15-30岁
  { age: [15 * 12, 30 * 12], name: '镖师', descFn: (loc) => `你在${loc}当镖师，遇妖兽大难不死得功法。`, fateMod: { physique: 2, intelligence: -1, focus: 1 }, bonus: null, passive: { name: '血汗钱', desc: '战斗胜利后额外获得5灵石' } },
  { age: [15 * 12, 30 * 12], name: '落榜书生', descFn: (loc) => `你赴京赶考名落孙山，归途中得奇遇踏入修行。`, fateMod: { intelligence: 3, physique: -2 }, bonus: null, passive: { name: '学而思', desc: '聪慧属性成长速度提升20%' } },
  { age: [15 * 12, 30 * 12], name: '赌场看场', descFn: (loc) => `你在${loc}赌场看场子，一晚遇赌鬼闹事，打斗中得了本功法。`, fateMod: { physique: 1, luck: 2, focus: -2 }, bonus: null, passive: { name: '赌命', desc: '战斗被击败时30%概率保留1血免死，每场限一次' } },
  // 中年 30-45岁
  { age: [30 * 12, 45 * 12], name: '茶馆老板', descFn: (loc) => `你在${loc}开茶馆，穷道士用《归元诀》抵茶钱。`, fateMod: { focus: 2, luck: -1, intelligence: 1 }, bonus: null, passive: { name: '人情世故', desc: '每次休息随机一位道友好感+2' } },
  { age: [30 * 12, 45 * 12], name: '屠夫', descFn: (loc) => `你在${loc}杀猪为生，某日劈开猪骨掉出一本泛黄功法。`, fateMod: { physique: 2, intelligence: -1, focus: 1 }, bonus: null, passive: { name: '庖丁解牛', desc: '对妖兽类敌人额外造成20%伤害' } },
  { age: [30 * 12, 45 * 12], name: '算命先生', descFn: (loc) => `你在${loc}摆摊算命，一老道说你该自己算一卦——于是你给自己算出了修仙之路。`, fateMod: { intelligence: 1, luck: 2, physique: -2 }, bonus: null, passive: { name: '天机术', desc: '每天首次行动前自动占卜，获得随机短时增益' } },
  // 暮年 45-55岁
  { age: [45 * 12, 55 * 12], name: '救狐得果', descFn: (loc) => `暮年在${loc}救下一只白狐，获赠灵果踏入修行。`, fateMod: { luck: 2, physique: -1, focus: 1 }, bonus: null, passive: { name: '灵狐祝福', desc: '灵兽获得经验翻倍' } },
  { age: [45 * 12, 55 * 12], name: '老乞丐', descFn: (loc) => `你在${loc}讨了一辈子饭，被路过的修士赏了一粒延寿丹，就此踏入仙门。`, fateMod: { physique: 1, luck: 3, intelligence: -2 }, bonus: null, passive: { name: '讨饭经', desc: '获得灵石时额外+10%，单次上限5块' } },
  { age: [45 * 12, 55 * 12], name: '守墓人', descFn: (loc) => `你在${loc}守了半辈子墓，常年与亡魂为伴，竟悟出一套心法。`, fateMod: { focus: 2, luck: 1, intelligence: -1 }, bonus: null, passive: { name: '镇魂术', desc: '心魔事件中出现"镇魂"选项' } }
];

// ==================== 出身被动系统 ====================

/** 出身被动触发逻辑映射 */
const ORIGIN_PASSIVE = {
  '散修弟子': {
    id: 'disciple',
    onCultivate: function() {
      if ((player._cultivateCount || 0) > 0 && player._cultivateCount % 10 === 0) {
        const mats = ['草药', '矿石', '灵泉水'];
        const mat = mats[Math.floor(Math.random() * mats.length)];
        player.materials[mat] = (player.materials[mat] || 0) + 1;
        addLog('📦 出身被动【勤修苦练】：获得 ' + mat + '×1', 'special');
      }
    }
  },
  '富家少爷': {
    id: 'rich',
    shopDiscount: function(price) {
      const discount = Math.floor(price * 0.9);
      const saved = price - discount;
      addLog('💰 出身被动【财大气粗】：省了' + saved + '灵石（原价' + price + '→' + discount + '）', 'reward');
      return discount;
    }
  },
  '流浪乞儿': {
    id: 'beggar',
    restBonus: function(hpHeal) {
      const extra = Math.floor(hpHeal * 0.2);
      addLog('🍜 出身被动【街头韧性】：额外恢复' + extra + '生命', 'success');
      return extra;
    }
  },
  '镖师': {
    id: 'escort',
    fightBonus: function() {
      player.spiritStones += 5;
      addLog('💰 出身被动【血汗钱】：战斗额外+5灵石', 'reward');
    }
  },
  '落榜书生': {
    id: 'scholar',
    fateGrowBonus: function(stat, amount) {
      if (stat === 'intelligence') {
        return Math.ceil(amount * 1.2);
      }
      return amount;
    }
  },
  '赌场看场': {
    id: 'gambler',
    tryCheatDeath: function() {
      if (player._gamblerDeathUsed) return false;
      if (Math.random() < 0.3) {
        player._gamblerDeathUsed = true;
        player.currentHP = 1;
        addLog('🎲 出身被动【赌命】：30%概率触发！仅剩1血存活！', 'special');
        return true;
      }
      player._gamblerDeathUsed = true;
      return false;
    }
  },
  '茶馆老板': {
    id: 'innkeeper',
    restCompanion: function() {
      if (player.companions.length === 0) return;
      const comp = player.companions[Math.floor(Math.random() * player.companions.length)];
      comp.affection = Math.min(100, (comp.affection || 50) + 2);
      addLog('🍵 出身被动【人情世故】：道友【' + comp.name + '】好感+2（当前' + comp.affection + '）', 'success');
    }
  },
  '屠夫': {
    id: 'butcher',
    getDamageBonus: function() {
      return 0.2;
    }
  },
  '算命先生': {
    id: 'fortune',
    dailyFortune: function() {
      if (player._fortuneUsedToday) {
        if (player._fortuneBuff) {
          addLog('🔮 占卜增益持续中：' + player._fortuneBuff.desc + '（剩余' + player._fortuneBuff.remains + '次行动）', 'special');
        }
        return;
      }
      player._fortuneUsedToday = true;
      const buffs = [
        { name: '修炼+10%', apply: { type: 'cultivateBoost', val: 1.1 }, desc: '修炼效率+10%' },
        { name: '攻击+15%', apply: { type: 'atkBoost', val: 1.15 }, desc: '攻击力+15%' },
        { name: '防御+15%', apply: { type: 'defBoost', val: 1.15 }, desc: '防御力+15%' },
        { name: '灵石获取+20%', apply: { type: 'stoneBoost', val: 1.2 }, desc: '灵石获取+20%' },
        { name: '生命恢复+30%', apply: { type: 'hpRegenBoost', val: 1.3 }, desc: '生命恢复+30%' }
      ];
      const buff = buffs[Math.floor(Math.random() * buffs.length)];
      player._fortuneBuff = { name: buff.name, apply: buff.apply, desc: buff.desc, remains: 3 };
      addLog('🔮 出身被动【天机术】：今日占卜——' + buff.desc + '（持续3次行动）', 'special');
    }
  },
  '救狐得果': {
    id: 'fox',
    petExpBonus: function(amount) {
      addLog('🦊 出身被动【灵狐祝福】：灵兽经验翻倍！', 'success');
      return amount * 2;
    }
  },
  '老乞丐': {
    id: 'oldBeggar',
    stoneBonus: function(baseAmount) {
      const extra = Math.min(Math.floor(baseAmount * 0.1), 5);
      if (extra > 0) {
        player.spiritStones += extra;
        addLog('🪙 出身被动【讨饭经】：额外+' + extra + '灵石', 'reward');
      }
    }
  },
  '守墓人': {
    id: 'graveKeeper',
    getZhenHunOption: function() {
      return {
        text: '🪦 镇魂',
        action: () => {
          player.innerDemon = Math.max(0, player.innerDemon - 30);
          addMonths(1);
          addLog('🪦 出身被动【镇魂术】：以1个月寿元为代价，心魔大幅消退！', 'success');
        }
      };
    }
  }
};

/** 检查玩家是否拥有指定出身被动 */
function hasOriginPassive(passiveId) {
  if (!player || !player.origin) return false;
  const originName = player.origin.name;
  const passiveDef = ORIGIN_PASSIVE[originName];
  return passiveDef && passiveDef.id === passiveId;
}

/** 获取当前出身被动信息 */
function getCurrentOriginPassive() {
  if (!player || !player.origin || !player.origin.passive) return null;
  return player.origin.passive;
}

// ==================== 事件故事库 ====================
const CULTIVATE_TALES = [
  // --- 保留原有优质事件 ---
  { msg: '🧘 你入定后神识飘到一间凡间网吧，看到一群人在玩"修仙模拟器"。你在屏幕里看见了自己。修为+20。', eff: (p) => { p.exp += 20; } },
  { msg: '🫁 你深吸一口灵气，发现今天的灵气味道不对——像隔壁丹房烧糊了的味。灵力+5，但你想吐。', eff: (p) => { const s = getEffectiveStats(); p.currentMP = Math.min(s.maxMP, p.currentMP + 5); } },
  { msg: '🐜 你发现一只蚂蚁在偷你的灵气。你跟踪它回了蚁穴，发现蚂蚁们在用灵气养蘑菇。你偷了一半蘑菇，获得【灵菇】×5。', eff: (p) => { p.materials['灵菇'] = (p.materials['灵菇'] || 0) + 5; } },
  { msg: '🔄 你运气时感觉经脉里有东西在爬——是你三天前喝进去的一口茶，至今没消化完，在你体内修炼出灵智了。修为+10，但你体内多了一个房客。', eff: (p) => { p.exp += 10; } },
  { msg: '🗣️ 你一边修炼一边背单词——背的是《上古龙语九百句》。念错一个音，窗外打了一声雷。你再念，又打雷。你闭嘴了。', eff: () => {} },
  { msg: '🎵 你的心跳声和灵气的流动频率对上了，你发现自己的心跳是一首曲子。你跟着哼了出来——方圆十里所有修士跟着你的节奏突破了。你成了网红。', eff: (p) => { p.exp += 15; } },
  { msg: '🕳️ 你修炼时屁股底下漏风。你低头一看——地上有个洞，洞里有一只老鼠在吸你的灵气。你俩对视一眼，它递给你一块灵石，示意你继续。', eff: (p) => { p.spiritStones += 5; } },
  { msg: '🧠 你修炼到一半突然想通了——你之所以进展慢，是因为你是左撇子但一直用右手运功。换成左手后修为+25。', eff: (p) => { p.exp += 25; } },
  { msg: '🪞 你看着自己的倒影修炼，倒影也在修炼。但你的倒影比你快一步——你抬手它已经放下了，你吸气它已经吐气了。你被自己的倒影卷到了，修炼效率翻倍。', eff: (p) => { p.exp += 30; } },
  { msg: '🫧 你吐纳时吐出一个泡泡，泡泡飘到空中炸开，里面是你三年前说的一句废话。整个山谷都听到了。社死。', eff: () => {} },

  // --- 新增：身体异变 ---
  { msg: '💨 你运功时放了一个连环屁，每个屁的音高都不一样，连起来是一首《两只老虎》。隔壁洞府给你扔了三块灵石求你闭嘴。', eff: (p) => { p.spiritStones += 3; } },
  { msg: '🩸 修炼时你的鼻血流了出来，滴在地上形成一幅阵法图。你照着图修炼，修为+20，但贫血有点头晕。', eff: (p) => { p.exp += 20; p.currentHP = Math.max(1, p.currentHP - 3); } },
  { msg: '🦷 你咬紧牙关运功，把一颗蛀牙崩了出来。牙里藏着一颗微小的灵石，是你小时候吃进去的。获得【蛀牙灵石】×1。', eff: (p) => { p.materials['蛀牙灵石'] = (p.materials['蛀牙灵石'] || 0) + 1; } },
  { msg: '👃 你修炼时打了个喷嚏，喷出一条细细的鼻涕丝。那鼻涕丝在空中凝成了一根银针，竟是件法器。获得【鼻涕针】，攻击+3。', eff: (p) => { addToBag({ name: '鼻涕针', rarity: 'common', stats: { atk: 3 } }, 'weapon'); } },
  { msg: '🫀 你内视时发现自己的心脏上长了一圈青苔。你刮下来闻了闻——是灵药。获得【心苔】×3。', eff: (p) => { p.materials['心苔'] = (p.materials['心苔'] || 0) + 3; } },
  { msg: '🦵 你盘坐太久腿麻了，站起来时摔了个狗啃泥。但这一摔打通了你腿上一条堵塞的经脉，修为+8。', eff: (p) => { p.exp += 8; } },
  { msg: '👀 你修炼时太用力，眼珠子瞪了出来。你手忙脚乱塞回去，但发现视力变好了，修炼效率+5%。', eff: (p) => { p.exp += 10; } },
  { msg: '🦶 你的脚趾在运功时自己动了起来，像是在弹琴。你顺着脚趾的节奏呼吸，发现那是一部失传的功法。修为+15。', eff: (p) => { p.exp += 15; } },
  { msg: '🧠 你内视时发现自己的脑子里有一块区域在发光——是你三年前背过的菜谱。你照着菜谱炼了一锅丹药，居然成功了。获得【乱炖丹】×2。', eff: (p) => { addToBag('乱炖丹', 'consumable', 2); } },
  { msg: '🩻 你的骨头在运功时发出嘎吱嘎吱的声音。你发现每根骨头上都刻着细小的文字，是你前世留下的笔记。修为+25。', eff: (p) => { p.exp += 25; } },

  // --- 新增：重口味但有用 ---
  { msg: '💩 你修炼时腹中翻涌，急需出恭。你憋了三个时辰，排出的废物竟是一颗金灿灿的【辟谷丹】——你把它回收了。', eff: (p) => { addToBag('辟谷丹', 'consumable', 1); } },
  { msg: '🤮 你练功练到反胃，吐了一地。呕吐物里爬出一只发光的虫子——【灵蛆】，可以用来炼丹。你忍着恶心收起来了。', eff: (p) => { p.materials['灵蛆'] = (p.materials['灵蛆'] || 0) + 1; } },
  { msg: '🫘 你吐了一口老痰，痰落在地上变成了一只【痰精】。它瞪了你一眼，跑了。三天后它带着一群痰精回来找你认主。获得灵兽【痰将军】。', eff: (p) => { if (p.pets.length < 2) { p.pets.push({ name: '痰将军', type: '灵兽', effect: { atkBoost: 1, defBoost: 1 }, desc: '攻击和防御各+1', level: 1, exp: 0, maxExp: 30 }); } } },
  { msg: '🧦 你修炼时脚汗流成了一条小溪。你脱了袜子拧了一把，汗液凝成一颗【汗灵珠】，可以用来炼避水丹。', eff: (p) => { p.materials['汗灵珠'] = (p.materials['汗灵珠'] || 0) + 1; } },
  { msg: '🩹 你抠了一下肚脐眼，抠出一团泥。那团泥在你手心里扭动了一下——竟是活的！你把它养了起来，获得【肚脐精】宠物。', eff: (p) => { if (p.pets.length < 2) { p.pets.push({ name: '肚脐精', type: '灵兽', effect: { defBoost: 2 }, desc: '防御+2', level: 1, exp: 0, maxExp: 30 }); } } },
  { msg: '🍲 你吃了一颗丹药后拉肚子，拉了三天三夜。但拉完之后灵气运转通畅了，修为+30，你觉得自己被排空了。', eff: (p) => { p.exp += 30; p.currentHP = Math.max(1, p.currentHP - 10); } },
  { msg: '🫧 你洗澡时发现洗澡水在发光——你的死皮脱落物富含灵气。你收集起来炼了一颗【死皮丹】，吃了修为+12。', eff: (p) => { p.exp += 12; } },
  { msg: '💨 你修炼时放了一个闷屁，把你屁股底下的蒲团熏成了一株【屁香草】。这草能入药，你种了起来。', eff: (p) => { p.materials['屁香草'] = (p.materials['屁香草'] || 0) + 1; } },
  { msg: '🧴 你练功出了一身油汗，在皮肤表面凝成一层蜡膜。你把蜡刮下来做成蜡烛，点了三天三夜，修炼速度+10%。', eff: (p) => { p.exp += 15; } },
  { msg: '🦴 你咳出一颗米粒大小的东西——是你十年前吞进去的一块骨头，如今被灵气打磨成了一颗骨珠。戴在身上灵力上限+10。', eff: (p) => { const s = getEffectiveStats(); p.currentMP = Math.min(s.maxMP, p.currentMP + 10); } },

  // --- 新增：超现实修炼 ---
  { msg: '⏳ 你入定后时间流速变了。你感觉修炼了三年，醒来只过了三秒。但你的修为真的涨了三年的量。修为+80。', eff: (p) => { p.exp += 80; } },
  { msg: '🌌 你修炼时神识冲出了天际，看见这片大陆其实是一只乌龟的背。乌龟回头看了你一眼，说："别看，专心修炼。"', eff: () => {} },
  { msg: '📡 你接收到一段来自远方的传音："这里是仙盟广播电台，下面播放一首《难忘今宵》送给正在突破的道友们。"你听完后修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '🌀 你的灵气在体内转了一个圈，形成了一个莫比乌斯环。你领悟了"没有正反面的功法"，修为+20，但从此分不清前后了。', eff: (p) => { p.exp += 20; } },
  { msg: '🌱 你打坐的山头突然长出一棵参天大树，把你托到了云层之上。你在树顶修炼，灵气浓度翻倍，但下不来了。三天后树自己缩回去了。', eff: (p) => { p.exp += 40; } },
  { msg: '🪐 你内视时发现丹田里多了一颗微缩星球。星球上有山有水有蚂蚁。你感觉那颗星球上的蚂蚁在修炼你。', eff: () => {} },
  { msg: '🧲 你修炼时身体突然变磁了，所有铁器都往你身上飞。你被飞剑、丹炉、锅铲埋了三小时，扒出来时修为+15。', eff: (p) => { p.exp += 15; } },
  { msg: '🌊 你的灵气像潮汐一样涨落。你发现每涨落一次，你的修为就涨一点，但你的洞府像海边一样潮湿，长满了青苔。', eff: (p) => { p.exp += 10; } },
  { msg: '🔮 你修炼时面前凭空出现了一个光幕，上面写着"广告倒计时5秒，充值可跳过"。你等了5秒，啥也没发生。修为+1。', eff: (p) => { p.exp += 1; } },
  { msg: '🎭 你入定到一半，看见另一个你走了过来，拍了拍你的肩膀说："你自己练吧，我去帮你渡劫。"你的修为涨了，但总觉得他在偷懒。', eff: (p) => { p.exp += 20; } },

  // --- 新增：动物搞事 ---
  { msg: '🐈 一只野猫跑进你的洞府，在你的功法上睡了一觉。醒来后功法上多了几行猫爪印——居然是一套猫爪功法。修为+12。', eff: (p) => { p.exp += 12; } },
  { msg: '🦉 一只猫头鹰落在你头顶，跟你一起修炼。它飞升了，临走前在你头上拉了一泡屎。你获得【猫头鹰飞升粪】，入药可炼渡劫丹。', eff: (p) => { p.materials['猫头鹰飞升粪'] = (p.materials['猫头鹰飞升粪'] || 0) + 1; } },
  { msg: '🐍 一条蛇钻进你的裤腿，在你的腿上盘了一圈，跟你一起运功。你获得了"蛇形走位"的感悟，修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '🦎 一只壁虎在你面前的墙上修炼。它每吐一次舌头，你的灵力就涨一点。你们对练了一下午，修为+15。', eff: (p) => { p.exp += 15; } },
  { msg: '🐖 一只野猪拱开你的门，在你旁边打了个滚，然后开始打鼾。它的鼾声频率刚好帮你打通了任督二脉。修为+25。', eff: (p) => { p.exp += 25; } },
  { msg: '🦟 一只蚊子叮了你一口，吸走了你的灵气。蚊子当场突破成了妖兽，追着你叫爸爸。你多了个蚊子干儿子。', eff: () => {} },
  { msg: '🐸 一只癞蛤蟆跳上你的丹炉，鼓着肚子跟你一起运气。你的灵气和它的鼓声共振了，修为+8。', eff: (p) => { p.exp += 8; } },
  { msg: '🦀 你在海边修炼，一只螃蟹夹住了你的脚趾。你疼得跳起来，但这一跳让你领悟了"蟹钳擒拿手"。修为+10。', eff: (p) => { p.exp += 10; p.currentHP = Math.max(1, p.currentHP - 2); } },

  // --- 新增：社死现场 ---
  { msg: '📢 你修炼时以为四下无人，大声念出了你给自己取的中二道号"九天十地无敌至尊法王"。结果隔壁山头的修士录下来了，传遍了修仙界。', eff: () => {} },
  { msg: '👗 你修炼时衣服被灵气撑爆了。你光着身子跑了三里地回洞府，路上被七个修士看见了。获得成就"坦诚相见"。', eff: () => {} },
  { msg: '📸 你摆了一个自以为很帅的修炼姿势，结果有人用留影石拍下来了。第二天你在坊市的公告栏上看见了自己的照片，下面写着"今日最佳姿势"。灵石+10（版权费）。', eff: (p) => { p.spiritStones += 10; } },
  { msg: '🎤 你修炼时情不自禁唱了出来，而且唱得很难听。隔壁洞府的道友搬走了。你的洞府租金降了，但孤独+10。', eff: () => {} },
  { msg: '🍑 你光屁股打坐被采蘑菇的小姑娘看见了。她尖叫着跑开，你的道心受到了冲击。修为-5，但你把蘑菇捡了。', eff: (p) => { p.exp = Math.max(0, p.exp - 5); p.materials['蘑菇'] = (p.materials['蘑菇'] || 0) + 3; } },

  // --- 新增：法器/装备搞事 ---
  { msg: '🗡️ 你的飞剑趁你修炼时自己飞出去打架了。它打赢了，叼着一块灵石飞回来邀功。获得灵石×20。', eff: (p) => { p.spiritStones += 20; } },
  { msg: '👟 你的鞋子在你修炼时自己走了。你追了十里地，发现它在和另一只鞋子约会。你不想打扰它们，光脚回去了。', eff: () => {} },
  { msg: '👑 你的发簪在你运功时变成了一条小龙，绕着你飞了三圈，又变回发簪。你感觉被什么上古力量祝福了，修为+15。', eff: (p) => { p.exp += 15; } },
  { msg: '🧣 你的围巾被灵气吹起来，裹住了你的脸。你什么也看不见，但灵力运转反而更专注了。修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '💍 你的储物戒指在你修炼时突然打开了，把方圆十米内所有东西都吸了进去——包括你的晚饭。你的灵石没丢，但饿了一天。', eff: () => {} },

  // --- 新增：环境异常 ---
  { msg: '🌧️ 你修炼时天上下起了灵石雨。你撑起衣服接了半天，获得灵石×15，但被砸了一头包。', eff: (p) => { p.spiritStones += 15; p.currentHP = Math.max(1, p.currentHP - 3); } },
  { msg: '❄️ 你修炼时洞府突然降温，你呼出的气结成了冰晶。冰晶在地上拼成了一张地图，标注了一个藏宝点。你记下了。', eff: () => {} },
  { msg: '🌪️ 一股龙卷风卷走了你的洞府屋顶。你抬头看见了满天星辰，星辰排列成一行字："加油，你行的。"你受到了鼓励，修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '🌋 你修炼的地方突然喷出一股温泉，把你冲到了天上。你掉下来时砸在了一个魔修身上，他以为你在偷袭他，跑了。你捡到了他掉落的灵石×25。', eff: (p) => { p.spiritStones += 25; p.currentHP = Math.max(1, p.currentHP - 5); } },
  { msg: '🌲 你身后的树在你修炼时长高了一截。你扭头看它，它不长了。你一闭眼，它又长。你跟它较了一天的劲，修为+10。', eff: (p) => { p.exp += 10; } },

  // --- 新增：心魔与精神 ---
  { msg: '😈 心魔化作一个推销员，向你推销"心魔保险"——说你以后被心魔搞崩溃了可以赔灵石。你买了，但你觉得被心魔骗了。灵石-20。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 20); } },
  { msg: '👻 你修炼时感觉背后有人。回头一看，是你自己的童年阴影——你怕黑。你和它对视了三个时辰，它先顶不住跑了。心魔-15。', eff: (p) => { p.innerDemon = Math.max(0, p.innerDemon - 15); } },
  { msg: '💭 你的杂念在你脑子里开了一场辩论赛。辩题是"今天要不要修炼"。正方赢了，你决定继续修炼，修为+5。', eff: (p) => { p.exp += 5; } },
  { msg: '🧩 你的心魔化作一个拼图，你说拼好了它就消失。你拼了三天，拼出来是"你本来就很强"。你无语了，心魔自动消散。', eff: (p) => { p.innerDemon = Math.max(0, p.innerDemon - 25); } },
  { msg: '😴 你练着练着睡着了，梦见自己飞升了。醒来发现修为没涨，但口水流了一地。获得【仙人口水】×1，据说能炼丹。', eff: (p) => { p.materials['仙人口水'] = (p.materials['仙人口水'] || 0) + 1; } },

  // --- 新增：第四面墙 ---
  { msg: '🎮 你的视野左上角出现了一行小字："今日登录奖励已领取。"你什么也没做，修为+5。', eff: (p) => { p.exp += 5; } },
  { msg: '🔄 你修炼时感觉自己被存档了。你有一种强烈的冲动想读档重来，但你忍住了。修为+10，意志力+1。', eff: (p) => { p.exp += 10; } },
  { msg: '📋 一张半透明的面板浮现在你面前："您有一个新的修炼任务：打坐30分钟。奖励：修为+20。"你完成了，真的涨了。', eff: (p) => { p.exp += 20; } },
  { msg: '💬 你听到天空传来一行字："玩家ID 9527，你的修炼时长已超过79%的玩家。"你看了看四周，没别人。你卷到了自己。', eff: (p) => { p.exp += 15; } },
  { msg: '🛒 你的神识逛了一趟仙界淘宝，买了一本《七天突破金丹》——收到货发现是《七天学会烤蛋糕》。你烤了一个蛋糕，吃了修为+5。', eff: (p) => { p.exp += 5; } },

  // --- 新增：随缘凑数但有看点 ---
  { msg: '🪠 你修炼时被自己的口水呛到了。咳了半个时辰，咳出一口淤血，之后呼吸畅通了，修炼效率+10%。', eff: (p) => { p.exp += 10; p.currentHP = Math.max(1, p.currentHP - 3); } },
  { msg: '🎈 你的丹田里鼓起一个灵气泡。你憋着不敢放，它越来越大，最后从你嘴里飘了出去，在天上炸开，方圆十里都下了一场灵雨。所有修士修为+5，你的修为+20。', eff: (p) => { p.exp += 20; } },
  { msg: '🧻 你修炼时流了一滩汗在地上，汗渍形成了一个图案——看起来像一只王八。你觉得这是天意，从此自称"灵龟真人"。', eff: () => {} },
  { msg: '🪄 你念咒语时舌头打结，念出了一串完全不同的音节。结果召唤出了一只穿着西装的鸭子，它递给你一张名片："仙界法律援助，渡劫纠纷咨询。"', eff: () => {} },
  { msg: '🧂 你修炼时太专注，把自己腌入味儿了。三天后你闻起来像一块腊肉，但修为确实涨了。防御+3（皮厚了）。', eff: (p) => { p.baseDef += 3; } },
  { msg: '🐟 你修炼时摸鱼发呆，被师父逮了个正着。师父却说你"悟了摸鱼之道"，修为意外+10！', eff: (p) => { p.exp += 10; } }
];

const BREAK_TALES = [
  // --- 保留原有优质事件 ---
  { msg: '💼 突破时心魔化作你凡间的老板，递上一份"修士岗位说明书"让你签字。你签字后修为+10，但每月要多交5灵石社保。', eff: (p) => { p.exp += 10; } },
  { msg: '🪞 雷劫劈下，你本能地举起一面镜子——雷劫反射到隔壁山头，把别人的洞府炸了。对方索赔50灵石。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 50); } },
  { msg: '🧠 突破时你突然想通了一个道理：修仙的本质是内卷。悟了，修为+30，但道心有了裂痕。', eff: (p) => { p.exp += 30; p.innerDemon = (p.innerDemon || 0) + 10; } },
  { msg: '🎭 天劫云聚集成一张脸，对着你打了个哈欠，然后飘走了。你愣在原地，修为+5，感觉被鄙视了。', eff: (p) => { p.exp += 5; } },
  { msg: '📉 你突破失败，修为没涨，但获得了一个新技能：假装突破成功。可以在社交场合唬人。', eff: () => {} },
  { msg: '🦷 天劫劈掉了你一颗牙，但掉下来的牙变成了灵石。你拿着它，不知道该不该镶回去。获得【牙灵石】×1。', eff: (p) => { p.materials['牙灵石'] = (p.materials['牙灵石'] || 0) + 1; } },
  { msg: '📞 突破时你的传讯玉简响了——是你妈打来的，问你什么时候结丹、什么时候找道侣。心魔+15。', eff: (p) => { p.innerDemon = (p.innerDemon || 0) + 15; } },
  { msg: '🔁 你成功突破，但发现自己是重生回这个时间点的第一万三千七百五十二次。你麻木了。', eff: () => {} },
  { msg: '🪤 雷劫劈中你的储物袋，里面的东西随机重组了。你的内裤和法器融合了——获得【内裤飞剑】，攻击+8，但每次出剑都有一股樟脑味。', eff: (p) => { addToBag({ name: '内裤飞剑', rarity: 'rare', stats: { atk: 8 } }, 'weapon'); } },
  { msg: '🪪 突破成功后天道给你发了一张身份牌，上面写着"已筑基，可贷款"。你揣兜里，感觉不太对。', eff: () => {} },

  // --- 新增：天劫奇葩 ---
  { msg: '⚡ 第一道雷劫劈下来——劈歪了，劈中了你三年前埋的一坛女儿红。酒香四溢，你喝了一口，突破了。修为+15。', eff: (p) => { p.exp += 15; } },
  { msg: '⛈️ 雷劫云在你头顶憋了半天，最后只放了一个响屁——一声闷雷，啥也没劈。你觉得它在耍你。', eff: () => {} },
  { msg: '🎆 雷劫化作漫天烟花，在你头顶炸出一行字："恭喜XXX道友成功筑基——来自仙帝楚某的贺礼。"你社死了，但修为确实涨了。', eff: (p) => { p.exp += 15; } },
  { msg: '🔋 雷劫劈在你身上，你不但没事，还感觉手机（传讯玉简）被充饱了电。你看了看电量——100%。', eff: () => {} },
  { msg: '🎯 雷劫锁定你劈了下来。你闪了一下——雷劫劈中了你身后的靶子，十环。天道在玩打靶。', eff: () => {} },
  { msg: '🧲 你突破时浑身带电，把方圆十米内的金属物品全吸到了身上。你像个刺猬一样渡完了劫。修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '🌩️ 九道天雷，一道比一道细。最后一道像根牙签一样戳在你脑门上。你觉得自己被侮辱了。', eff: () => {} },
  { msg: '🎶 雷劫劈下时带着旋律——是贝多芬的《命运交响曲》。你踩着拍子渡劫，感觉自己很优雅。修为+12。', eff: (p) => { p.exp += 12; } },
  { msg: '☁️ 雷劫云在你头上飘了三天三夜，一直没劈下来。你跟它大眼瞪小眼瞪了三天，它终于憋不住散了。你突破了，但很累。', eff: (p) => { p.exp += 10; } },
  { msg: '🪫 你的灵气在突破时突然断流了——就像手机没电一样。你找了半天原因，发现是你丹田的"省电模式"没关。关上后渡劫成功。', eff: () => {} },

  // --- 新增：心魔花式 ---
  { msg: '💔 心魔化作你暗恋的人，对你说："你突破的样子很帅。"你心一乱差点走火入魔，但咬牙稳住了。修为+15，心魔+5。', eff: (p) => { p.exp += 15; p.innerDemon = (p.innerDemon || 0) + 5; } },
  { msg: '🍜 心魔化作一碗热腾腾的牛肉面。你三天没吃饭了，差点被诱惑。你一拳打散了牛肉面，但道心更强了。修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '📺 心魔化作一台电视机，给你放了一集你最喜欢的剧。你看了半集就把电视砸了——你居然没看完就去修炼了，你长大了。修为+20。', eff: (p) => { p.exp += 20; } },
  { msg: '🤡 心魔变成一个小丑，在你面前翻跟头。你不笑，它翻得更卖力。你憋了三个时辰没笑，它累倒了。心魔-30。', eff: (p) => { p.innerDemon = Math.max(0, p.innerDemon - 30); } },
  { msg: '🎰 心魔拉你赌博："输了放弃突破，赢了直接成功。"你梭哈了。你赢了。修为+50，但你怀疑心魔放水了。', eff: (p) => { p.exp += 50; } },
  { msg: '📝 心魔给你发了一张考卷："突破资格测试，满分100，60分及格。"你考了59分。心魔说可以补考，交10灵石。你交了，过了。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 10); p.exp += 20; } },
  { msg: '🧸 心魔化作你小时候最爱的玩具熊，坐在角落里说："你变了。"你沉默了，但你还是突破了。', eff: () => {} },

  // --- 新增：渡劫重口味 ---
  { msg: '💩 雷劫劈下来时你吓得拉裤子了。但你发现雷劫被你的……过滤了一遍，威力减弱了30%。你不知道该高兴还是该哭。', eff: () => {} },
  { msg: '🤮 你渡劫时太紧张吐了。呕吐物被雷劫劈中，发生了某种化学反应，炸出一朵蘑菇云。你被气浪推飞了，但突破了。', eff: (p) => { p.exp += 15; p.currentHP = Math.max(1, p.currentHP - 10); } },
  { msg: '💨 你放了一个响屁，冲力把你往上推了三尺。刚好躲过了一道贴地雷劫。你感谢你的屁股。', eff: () => {} },
  { msg: '🩸 你渡劫时鼻血狂流。你用鼻血在地上画了一道引雷阵，把雷劫引到了别处。突破了，但贫血三天。', eff: (p) => { p.exp += 15; p.currentHP = Math.max(1, p.currentHP - 5); } },
  { msg: '🧴 你紧张得手心出汗，汗水滴在地上被雷劫劈中，蒸发成了灵雾。你吸了灵雾，修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '💎 雷劫劈中了你口袋里的一颗鼻屎——它被炼成了一颗【雷劫鼻屎丹】，吃下去修为+20。你犹豫了一秒，吞了。', eff: (p) => { p.exp += 20; } },

  // --- 新增：突破意外收获 ---
  { msg: '🎁 突破时天降异象——掉下来一个包裹。里面是一件写着"渡劫纪念"的T恤，穿上后防御+5。', eff: (p) => { p.baseDef += 5; } },
  { msg: '🌟 你突破成功时，天空出现你的名字和一行小字："此人已击败99%的同境界修士。"你截图发朋友圈了。', eff: () => {} },
  { msg: '🧧 突破后你的储物袋里多了一个红包，上面写着"天道红包"。打开一看——1灵石。你骂了一句。', eff: (p) => { p.spiritStones += 1; } },
  { msg: '📜 突破时你的功法自动翻到了最后一页，上面写着："恭喜通关。请重开新档以获得更多体验。"你愣住了。', eff: () => {} },
  { msg: '🏆 突破成功后，天道给你发了一枚虚拟勋章，上面写着"筑基期·杰出校友"。你把它挂在了墙上。', eff: () => {} },
  { msg: '🎫 你突破时的灵气波动激活了一张传单，上面写着："恭喜突破！凭此传单到丹霞宗领取免费丹药一份。"你去了，真的领到了。获得【免费丹药】×1。', eff: (p) => { addToBag('免费丹药', 'consumable', 1); } },

  // --- 新增：围观群众 ---
  { msg: '👀 你突破时有一群散修在围观。他们一边嗑瓜子一边点评："姿势不对""换气节奏有问题"。你被干扰了，但强行突破成功。修为+5。', eff: (p) => { p.exp += 5; } },
  { msg: '📱 有人在直播你渡劫。你对着镜头比了个耶，直播间刷了一波礼物。获得灵石×15。', eff: (p) => { p.spiritStones += 15; } },
  { msg: '🐕 隔壁山头的狗被你的雷劫吓到了，跑过来对着雷劫云狂吠。雷劫云被狗骂走了。你突破了，给狗买了根骨头。', eff: () => {} },
  { msg: '👮 你突破时的动静太大，"灵气管理协会"的人来了，说你违反"灵气排放标准"，罚了你20灵石。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 20); } },
  { msg: '🧙 一个路过的老修士看了你渡劫，摇了摇头说"年轻人就是沉不住气"，然后帮你挡了一道雷。你请他喝了杯茶。', eff: (p) => { p.exp += 10; p.spiritStones = Math.max(0, p.spiritStones - 5); } },

  // --- 新增：离谱突破方式 ---
  { msg: '🛌 你躺着突破的。雷劫劈下来时你翻了个身，躲过去了。天道觉得你太懒了，懒得劈了。', eff: () => {} },
  { msg: '🎤 你对着天劫唱了一首《死了都要爱》。天劫被你的音准吓跑了。你成功突破，但嗓子哑了三天。', eff: (p) => { p.exp += 10; } },
  { msg: '🕺 你一边跳舞一边渡劫。雷劫跟着你的节奏劈，你跳得越快它劈得越快。你跳了一曲《极乐净土》，渡劫成功。', eff: (p) => { p.exp += 15; } },
  { msg: '🧘 你倒立渡劫。雷劫劈在你脚底板上，打通了你脚心的穴位。你以后走路都在漏灵气。', eff: (p) => { p.exp += 10; } },
  { msg: '🍔 你突破前吃了三个大包子。雷劫劈在你肚子上，包子帮你挡了一部分伤害。你发誓以后渡劫前都要吃包子。', eff: (p) => { p.exp += 8; } },

  // --- 新增：邪门突破 ---
  { msg: '🪞 你突破时看见另一个时空的自己也在突破。你们隔着时空对了一掌，互相传了50年功力。修为+40。', eff: (p) => { p.exp += 40; } },
  { msg: '🧵 你的寿命线在你面前具象化了，变成一根发光的线。你伸手一拉——线变长了。寿命+5年。', eff: (p) => { /* 寿命+5年效果由游戏系统处理 */ } },
  { msg: '🗝️ 突破时你丹田里掉出一把钥匙。你也不知道这钥匙是开哪儿的，但你觉得很重要。获得【未知钥匙】×1。', eff: (p) => { p.materials['未知钥匙'] = (p.materials['未知钥匙'] || 0) + 1; } },
  { msg: '🪶 天劫劈完后，灰烬里有一根金色的羽毛。你捡起来，羽毛化作一道光钻进你眉心。你学会了一招"金翅拍蚊手"。', eff: (p) => { p.exp += 20; } },
  { msg: '🧊 你突破时把自己冻住了，成了一块冰雕。三天后冰化了，你发现自己突破了，而且皮肤变好了。', eff: (p) => { p.exp += 15; } },
  { msg: '🔄 你突破到一半走火入魔，境界倒退回炼气期。但你发现退回炼气期后可以重新选天赋。你重选了，更强了。', eff: (p) => { p.exp = Math.max(0, p.exp - 10); } },
  { msg: '🪠 你的元婴在突破时从头顶冒了出来，吸了一口空气，说了句"空气质量不错"，又缩回去了。', eff: () => {} },
  { msg: '🎪 你突破时天地异象——空中出现了一个巨大的旋转木马。天道说这是给你的奖励。你坐了一圈，修为+20。', eff: (p) => { p.exp += 20; } },
  { msg: '🧂 你突破后发现自己身上多了一层细细的盐粒——灵气的结晶。你把自己舔干净了，修为+5。', eff: (p) => { p.exp += 5; } },
  { msg: '🦴 你突破时骨头噼里啪啦响，像放鞭炮一样。响完之后你长高了三厘米。修为+8。', eff: (p) => { p.exp += 8; } },
  { msg: '🪄 你突破后发现自己多了一根手指。六根手指运功更快了，但每次跟人握手都很尴尬。修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '🐟 你突破失败，但摔了个四脚朝天——反而把经脉摔顺了。咸鱼翻身，状态全满！', eff: (p) => { const s = getEffectiveStats(); p.currentHP = s.maxHP; p.currentMP = s.maxMP; } }
];

const EXPLORE_TALES = [
  // --- 保留原有优质事件 ---
  { msg: '🪑 你在荒郊野外看到一把空椅子，上面贴着一张纸条："坐一下试试。"你没坐。走出三里地，回头发现椅子还在你身后五步。', eff: () => {} },
  { msg: '🎻 遇到一个盲人琴师，弹的曲子让你想起了前一世的事。你上一世是一只蚊子，被拍死的记忆太清晰了，修为-5。', eff: (p) => { p.exp = Math.max(0, p.exp - 5); } },
  { msg: '🧳 捡到一个储物袋，里面全是另一个修士的购物清单："筑基丹×1，内裤×3，香菜×2把。"你默默地还回去了。', eff: () => {} },
  { msg: '🌊 路过一条河，河水倒流。河里游着一条鱼，鱼说你今年不宜修炼。你不信，走了三步摔了一跤，修为-3。', eff: (p) => { p.exp = Math.max(0, p.exp - 3); } },
  { msg: '🗣️ 你遇到一个会说话的石头。石头说自己已经活了十万年，最大的成就是"没有被搬走"。你搬走了它。获得【话痨石】。', eff: (p) => { p.materials['话痨石'] = (p.materials['话痨石'] || 0) + 1; } },
  { msg: '🏪 你走进一家路边小店，店主是你自己。你问他你是谁，他说他是"明天的你"，来提醒你后天有雷阵雨。你买了一把伞，15灵石。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 15); addToBag('雨伞', 'consumable', 1); } },
  { msg: '🕸️ 你发现一座全是蛛丝的废弃洞府，中央有一具盘坐的骸骨，蛛丝在他身上织成了一行字："卡关勿慌，重开一局。"', eff: () => {} },
  { msg: '🥚 路边有一颗蛋。你把它孵了三天，孵出来一只小鸡。小鸡叫你妈妈。你多了个累赘，但不想扔了它。', eff: () => {} },
  { msg: '🪞 捡到一面铜镜，镜子里的人比你好看。你照了三天，镜子里的你开始收你房租。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 10); } },
  { msg: '🧵 你发现一条通往地下的楼梯。走下去，是一个和你洞府一模一样的房间，连吃剩的包子都一样。你退出来，楼梯消失了。', eff: () => {} },
  { msg: '🧊 你在冰湖上打坐，冰面下的倒影突然睁开眼睛看着你。你对视了三天三夜，修为+25，但再也不敢在冰上打坐了。', eff: (p) => { p.exp += 25; } },
  { msg: '🦴 你在路边捡到一根骨头，上面刻着"此乃仙帝遗骨"。你拿去鉴定，结果是狗骨头。你被狗追了三条街。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); } },

  // --- 新增：经典回归 + 奇人异事 ---
  { msg: '🏄 看见修士骑着道友过海，你默默记下。灵石+5。', eff: (p) => { p.spiritStones += 5; } },
  { msg: '🎪 你遇到一个马戏团，团长是一只穿着西装的猴子。它表演了"御剑术"——用尾巴御剑。你打赏了5灵石。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 5); } },
  { msg: '🧙 一个白胡子老头拦住你，说你骨骼惊奇，是万中无一的修道奇才。然后向你推销了一本《如来神掌》，只要10灵石。你买了，翻开一看是《如来的家常菜谱》。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 10); } },
  { msg: '👻 你在鬼市看到一个摊位卖"仙人跳"——字面意思，一块跳板，踩上去能蹦三丈高。你买了，还挺好用。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 8); addToBag('仙人跳板', 'consumable', 1); } },
  { msg: '🦀 捡到一只螃蟹，螃蟹说它以前是合体期大能，因为嘴臭被人下了诅咒。你信了，把它卖了换灵石。获得灵石×3。', eff: (p) => { p.spiritStones += 3; } },
  { msg: '🧝 你遇见一个精灵，她说可以实现你一个愿望。你说"我要很多灵石"。她给了你一块灵石，说"这是一块，你数一下，里面有很多个原子"。你无语了。', eff: (p) => { p.spiritStones += 1; } },

  // --- 新增：探索重口味 ---
  { msg: '💩 你在路边踩到一坨东西，低头一看是一坨金色的粪便——【仙兽粪】，是炼丹极品材料。你忍着恶心捡起来了。', eff: (p) => { p.materials['仙兽粪'] = (p.materials['仙兽粪'] || 0) + 1; } },
  { msg: '🧠 你发现一具骸骨，骸骨的脑子里长出了一朵花。花是金色的，散发着灵气。你摘了它，获得【脑花金芝】×1，入药可炼增寿丹。', eff: (p) => { p.materials['脑花金芝'] = (p.materials['脑花金芝'] || 0) + 1; } },
  { msg: '🫁 你捡到一个透明罐子，里面泡着一对肺。标签上写着"金丹期修士的肺，包邮"。你把它买了，虽然不知道有什么用。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 10); addToBag('泡肺罐', 'consumable', 1); } },
  { msg: '🌋 你发现一处沸腾的泥潭，泥浆在冒泡泡。你伸手一捞——捞出一颗【温泉蛋】，吃了生命全满。', eff: (p) => { const s = getEffectiveStats(); p.currentHP = s.maxHP; } },
  { msg: '🦷 你在路边捡到一颗巨大的牙齿，比你还高。你敲了敲，牙齿里掉出一堆法器残骸。获得【废铁】×5。', eff: (p) => { p.materials['废铁'] = (p.materials['废铁'] || 0) + 5; } },
  { msg: '💀 你发现一个地洞，里面堆满了骨头。你翻了一下，找到一本日记，最后一页写着:"第二年了，我还没死。洞里好黑。第三年……"字迹到这里断了。你决定不往下走了。', eff: () => {} },

  // --- 新增：秘境怪事 ---
  { msg: '🏛️ 你发现一座地下宫殿，大门上刻着"欢迎光临，出口在厕所后面"。你进去了，里面全是镜子迷宫。你花了三天才找到厕所。', eff: (p) => { p.exp += 10; } },
  { msg: '🗺️ 你打开一张藏宝图，图上画着一个大大的箭头，写着"你在这里"。你环顾四周，啥也没有。你被地图耍了。', eff: () => {} },
  { msg: '⛰️ 你爬到一座山顶，发现山顶上立着一块牌子:"此山是我开，此树是我栽。要想从此过，留下买路财。"你等了一天，也没人出来收钱。', eff: () => {} },
  { msg: '🌲 你走进一片会呼吸的森林。每棵树都在呼吸，节奏跟你一样。你停下来，它们也停下来。你跑起来，它们也跟着摇。你被一棵树绊倒了。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 2); } },
  { msg: '🪨 你发现一块巨大的水晶，里面冻着一只上古生物——看起来像一只仓鼠。你敲开水晶，仓鼠活了，瞪了你一眼，跑了。', eff: () => {} },
  { msg: '🌊 你来到一片黑色的湖泊，湖水是墨水。你蘸了一点写字，字浮在水面上不散。你写了一首诗，湖水涨潮了，把你的诗冲走了。', eff: () => {} },
  { msg: '🗿 你发现一尊石像，石像的手指指着某个方向。你跟着走了三天，到了一座悬崖边。石像的手指还指着前方——悬崖外面。你骂了一句。', eff: () => {} },

  // --- 新增：交易奇遇 ---
  { msg: '🏪 你在路边小摊买了一颗丹药，老板说是"十全大补丹"。你吃了，发现是十颗糖豆裹在一起。修为+2，心情+10。', eff: (p) => { p.exp += 2; } },
  { msg: '💎 一个神秘人拦住你，说他的灵石掉缝里了。你帮他捡了起来，他给了你5灵石作为报酬。你帮他捡灵石，赚了5灵石。', eff: (p) => { p.spiritStones += 5; } },
  { msg: '🎭 你遇到一个面具贩子，卖的面具戴上后可以改变声音。你买了一个"仙帝音"面具，戴上后说话自带回音。但走路时面具会掉。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 12); addToBag({ name: '仙帝音面具', rarity: 'common', stats: { def: 1 } }, 'armor'); } },
  { msg: '📦 你在路边捡到一个快递盒，收件人是你自己，寄件人写的是"未来的你"。打开一看——是一张纸条："别打开这个盒子。"你沉默了。', eff: () => {} },

  // --- 新增：动植物异变 ---
  { msg: '🌳 你遇到一棵会骂人的树。你骂回去，你们对骂了一整天。树先撑不住了，掉了一颗果子给你。吃了修为+8。', eff: (p) => { p.exp += 8; } },
  { msg: '🐦 一只鸟在你头顶拉了一泡屎。屎掉在你头上，你感觉头顶一阵清凉——你长出了第三只眼。虽然只是暂时的，但它确实长了一会儿。', eff: () => {} },
  { msg: '🌸 你走进一片花海，花都是人脸。它们对你微笑，说"欢迎来到花园"。你退了一步，花说"别走嘛"。你跑了。', eff: () => {} },
  { msg: '🦎 你看到一只壁虎在晒太阳。它的尾巴断了，断尾在地上跳来跳去，自己画了一个阵法。你照着阵法修炼，修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '🐜 你发现一群蚂蚁在搬运一块灵石。你跟着它们到了蚁穴，发现蚁穴里堆满了灵石——蚂蚁们在挖矿。你偷了20块灵石，留了5块给它们当辛苦费。', eff: (p) => { p.spiritStones += 20; } },
  { msg: '🦂 你被一只蝎子蜇了。你没死，反而获得了抗毒性。你追着蝎子想让它在蜇你一次。它跑了。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); p.baseDef += 2; } },

  // --- 新增：凡人世界 ---
  { msg: '🏘️ 你路过一个凡人村庄，村民们正在祭拜"仙人"。你亮了一下飞剑，村民们跪了一地，给你上了三炷香和一只烤全羊。你吃了羊，留下了5灵石。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 5); p.currentHP = getEffectiveStats().maxHP; } },
  { msg: '🍜 你在凡人集市吃了一碗面，老板收了你一块灵石，找了你九十九两银子。你拿着银子，不知道该怎么花。', eff: () => {} },
  { msg: '⚽ 一群小孩在踢球，球踢到你面前。你一脚踢回去——球飞到了云层里。小孩们哭着找妈妈。你赔了他们一文钱。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 1); } },
  { msg: '🎪 你在凡人集市看到一个江湖骗子在卖"仙丹"。你闻了一下，是面粉团子。你没揭穿他，毕竟你也是修仙的，给同行留点面子。', eff: () => {} },
  { msg: '🏯 你路过一座书院，里面在考试。你偷偷用神识看了隔壁的卷子，传给了旁边一个考生。他考中了，分了你一半谢礼。灵石+10。', eff: (p) => { p.spiritStones += 10; } },

  // --- 新增：秘境探险 ---
  { msg: '🕋 你进入一个山洞，洞壁上全是上古壁画。画的是一个人从凡人修炼到仙帝的过程。最后一张壁画上——那人跟你长得一模一样。', eff: () => {} },
  { msg: '🗝️ 你发现一扇巨大的门，门上有一个锁孔。你插进去一根树枝——门开了。门后是一个空房间，只有一张纸条:"恭喜你发现了空气。"', eff: () => {} },
  { msg: '💎 你走进一个矿洞，洞壁上全是灵石。你挖了半天，发现那些灵石是假的——是一种会发光的矿石。你白高兴了一场。', eff: () => {} },
  { msg: '🌌 你误入一个空间裂缝，掉进了一个全是镜子的世界。每个镜子里都是一个不同的你——有的在修炼，有的在吃饭，有的在挨打。你找到了那个在吃饭的你，跟他换了碗。', eff: (p) => { p.exp += 15; } },
  { msg: '🏚️ 你发现一座废弃的洞府，里面有一个丹炉，炉底还有一点余温。你打开炉盖——里面是一锅炖烂的功法秘籍。你将就着喝了一口汤，修为+10。', eff: (p) => { p.exp += 10; } },

  // --- 新增：随机邪门 ---
  { msg: '🪆 你遇到一个套娃精。它说每打开一层，就能获得一层修为。你打开了第一层——修为+5。第二层——修为+8。一直开到最后一层——里面是一张纸条:"谢谢参与。"', eff: (p) => { p.exp += 13; } },
  { msg: '🎲 你捡到一个骰子，投了一下——6点。你的运气变好了。又投了一下——1点。你的运气变差了。你扔了骰子，它自己滚回来了。', eff: () => {} },
  { msg: '🧭 你捡到一个指南针，但它永远指向你自己。你觉得它在说你才是方向。你把它收起来了。', eff: () => {} },
  { msg: '🪄 你在路边看到一根树枝，捡起来挥了一下——你的头发变成了绿色。你又挥了一下——变回来了。你获得了【变色树枝】×1。', eff: (p) => { addToBag({ name: '变色树枝', rarity: 'common', stats: { atk: 1 } }, 'weapon'); } },
  { msg: '📿 你在路边捡到一串佛珠，刚戴上就听见一声佛号:"施主，你与我佛有缘。"你回头一看——一头猪在说话。你觉得自己可能真的与佛有缘。', eff: () => {} },
  { msg: '🎭 你看到一个戴着面具的人站在路边。你问他为什么戴面具，他说:"因为我没脸见人。"他摘下面具——他没有脸。你跑了。', eff: () => {} },
  { msg: '🪶 天上掉下来一根羽毛，轻轻地落在你手里。你抬头看——什么都没有。羽毛开始写字，在你手心里写了一个"等"字。你等了三天，啥也没发生。', eff: () => {} },
  { msg: '🧂 你遇到一个盐矿，里面的盐是甜的。你舔了一口——确实是甜的。你装了一袋，以后做饭不用放糖了。', eff: () => {} },
  { msg: '🪵 你发现一段会自己移动的木头。你踩住它，它不动了。你松开脚，它又动了。你跟它玩了一下午。', eff: () => {} },
  { msg: '🎯 你看到一个靶子，上面插满了飞剑。你拔了一把下来——是你的飞剑。你十年前丢的飞剑，终于找到了。攻击+3。', eff: (p) => { p.baseAtk += 3; } },
  { msg: '📜 你在路边捡到一张符咒，上面写着"急急如律令"。你试着一念——地上多了50灵石！', eff: (p) => { p.spiritStones += 50; } }
];

const FIGHT_TALES = [
  // --- 保留原有优质事件 ---
  { msg: '🤝 敌人摆出起手式，你也摆出起手式。你们对视了半个时辰，谁也没动手。最后互相鞠躬，各自回家。', eff: () => {} },
  { msg: '⏸️ 你打到一半，敌人突然喊"暂停"，掏出笔记本记了点什么。然后说"你的连招我学会了"，继续打。你觉得自己被当教材了。', eff: () => {} },
  { msg: '🎰 敌人扔出一件法器——是个骰子。点数大于3你赢，小于3你输。你投了个4。敌人认栽，赔了30灵石。', eff: (p) => { p.spiritStones += 30; } },
  { msg: '🧑‍🤝‍🧑 敌人和你打了半天，发现你们是同一个村的。你们攀了会儿亲，敌人决定不打你，但让你请客吃饭，花了20灵石。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 20); } },
  { msg: '🪃 你的飞剑出手后没回来。你追了十里地，发现它插在一棵树上，剑柄上坐着一只鸟，鸟在筑巢。你拔走飞剑，鸟追着你啄了三条街。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 3); } },
  { msg: '📣 你大喊一声招式名——敌人也喊了一声同名招式。你们撞在了一起，谁也没打着谁。场面一度十分尴尬。', eff: () => {} },
  { msg: '🥊 你一拳打在敌人脸上，敌人没躲。他说"不疼"，然后哭了。你不知所措，站在原地被他哭了三个时辰。你输了——输在了道德上。', eff: () => {} },
  { msg: '🫂 敌人把你按在地上，突然打了个喷嚏，把你喷飞了出去。你撞在树上，掉下来一颗果子，吃了修为+8。', eff: (p) => { p.exp += 8; } },
  { msg: '🧹 你的法器被敌人打飞了。你随手抄起一把扫帚——那扫帚其实是上一个隐居大能的遗物，攻击+20。你决定留着这把扫帚。', eff: (p) => { addToBag({ name: '大能遗扫', rarity: 'uncommon', stats: { atk: 20 } }, 'weapon'); } },
  { msg: '🔄 你被敌人击退三步，每一步都踩中一个机关——你触发了自己三天前布置的陷阱。自食其果，生命-15，敌人笑到岔气。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 15); } },
  { msg: '🎭 敌人用法术变成了你的模样。你们两个站在原地互骂对方是假的，谁也证明不了自己是真的。最后各回各家，第二天见面还打招呼。', eff: () => {} },
  { msg: '💳 你打败了敌人，他掏出一张卡："仙生不易，可否分期付灵石？"你心软答应了，但他再也没出现过。', eff: () => {} },

  // --- 新增：堂堂正正但歪 ---
  { msg: '🗡️ 敌人说："拔剑吧。"你拔了。他说："很好。"然后他跑过来在你剑上撞了一下，倒了。他说你赢了，然后走了。你全程没动。', eff: () => {} },
  { msg: '👊 你一套连招打在敌人身上，敌人纹丝不动。他说"该我了"，然后弹了你一个脑瓜崩。你飞出去撞碎了三堵墙。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 15); } },
  { msg: '🥋 你用了一套上古拳法——但你记错了招式顺序。结果威力反而更大，因为敌人看不懂你的路数。修为+15。', eff: (p) => { p.exp += 15; } },
  { msg: '⚔️ 敌人一剑刺来，你侧身一躲——剑刺进了你身后的墙壁，拔不出来了。敌人说"等我拔个剑"，你等了。他拔出来后又跟你打，但气势弱了一半。', eff: () => {} },
  { msg: '🛡️ 敌人召出一面盾牌，你一拳打上去——盾牌裂了。敌人又召出一面，你又打裂了。你们打了十二面盾牌，他破产了。你赢了，但手很疼。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); } },
  { msg: '🎯 敌人射出一支飞镖，你接住了。你又扔了回去——飞镖扎在了他自己腿上。他单腿跳着跑了。', eff: () => {} },
  { msg: '🧶 敌人的武器是一根线。他用线把你缠成了茧。你在茧里憋了半天，终于挣破了。出来后你发现敌人被自己的线缠住了。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 10); } },
  { msg: '🔔 敌人的法器是一口钟。他敲了一下钟，声波把你们俩都震飞了。你飞出去五丈，他飞出去三丈。你赢了——你飞得更远。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 8); } },

  // --- 新增：嘴炮/心理战 ---
  { msg: '💬 你问敌人："你妈知道你在这儿打架吗？"敌人愣住了，说"我妈不让我打架"。然后他收起武器回家了。', eff: () => {} },
  { msg: '🧠 你对敌人进行了心理分析，说他童年缺爱。敌人哭着跑了。你赢了，但觉得自己有点过分。', eff: () => {} },
  { msg: '📖 你给敌人背了一段《道德经》。敌人听入了迷，坐下来跟你探讨道法。你们聊了三个时辰，结为道友。修为+20。', eff: (p) => { p.exp += 20; } },
  { msg: '😱 你朝敌人做了一张鬼脸。敌人吓了一跳，后退三步。你觉得这个方法有效，以后打架先做鬼脸。', eff: () => {} },
  { msg: '🤔 你问敌人："你确定你要打我？我身上有传染病。"敌人犹豫了，问你什么病。你说"懒病"。敌人无语了，还是打了你。', eff: () => {} },

  // --- 新增：重口味战斗 ---
  { msg: '💨 你放了一个屁，敌人被熏到了。但他没有后退，而是深吸了一口，说"炼丹的素材"。你后悔了。', eff: () => {} },
  { msg: '🤮 你一拳打在敌人胃上，他吐了。呕吐物里有他刚吃的丹药——你捡起来洗了洗，还能吃。获得【半消化丹药】×1。', eff: (p) => { p.materials['半消化丹药'] = (p.materials['半消化丹药'] || 0) + 1; } },
  { msg: '🩸 你被敌人打出了鼻血。鼻血流到地上，形成了一个血阵——召唤出了一只野生灵兽。灵兽看了你们一眼，加入了更强的一方（你）。', eff: (p) => { if (p.pets.length < 2) { p.pets.push({ name: '血召兽', type: '灵兽', effect: { atkBoost: 3 }, desc: '攻击+3', level: 1, exp: 0, maxExp: 30 }); } } },
  { msg: '🧴 你紧张得手心出汗，汗水滴在武器上滑得握不住。武器飞出去砸在敌人脸上，把他砸晕了。你赢了，但武器丢了。', eff: (p) => { p.equipment.weapon = null; } },
  { msg: '🦷 敌人一拳打在你脸上，打掉了你一颗牙。你把牙吐出来——牙变成了暗器，扎在了敌人手上。你俩都愣了。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); } },
  { msg: '💩 你被打飞出去，一屁股坐进了一堆灵兽粪便里。你臭烘烘地站起来，敌人被你熏跑了。你赢了，但身上很臭。', eff: () => {} },

  // --- 新增：武器搞事 ---
  { msg: '🗡️ 你的武器突然开口说话了："我不想打他，他是我远房亲戚。"你换了一把武器。', eff: () => {} },
  { msg: '🔪 你的刀砍在敌人身上——断了。敌人看着你手中的刀柄，笑了。你用刀柄敲了他一下，他晕了。原来刀柄才是本体。', eff: () => {} },
  { msg: '🏹 你射出一支箭，箭在空中拐了个弯，飞回来射中了你。你自食其果，生命-10。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 10); } },
  { msg: '🪓 你的斧头卡在敌人盾牌上了。你拔不出来，敌人也甩不掉。你们俩扛着一把斧头打了半天。', eff: () => {} },
  { msg: '🔫 你的法器是一把扇子。你扇了敌人一下——敌人飞出去了。你又扇了一下——自己飞出去了。这扇子不分敌我。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); } },

  // --- 新增：灵兽参战 ---
  { msg: '🐕 你的灵兽冲上去咬了敌人一口，然后把敌人的鞋子叼回来给你邀功。敌人光着一只脚跑了。', eff: () => {} },
  { msg: '🐱 你的灵兽不理你，在一旁舔毛。敌人被萌到了，蹲下来摸你的灵兽。你趁机偷袭成功。', eff: () => {} },
  { msg: '🐉 你召唤出灵兽——它打了个哈欠，把敌人吹飞了。然后它趴下睡觉了。你赢了，但灵兽不听使唤。', eff: () => {} },
  { msg: '🦜 你的灵兽是一只鹦鹉。它在战斗时疯狂重复敌人说的话。敌人被烦得受不了，投降了。', eff: () => {} },
  { msg: '🐍 你的灵兽是一条蛇。它缠住了敌人，但缠得太紧了——敌人翻白眼了。你赶紧让蛇松开，敌人感谢你的不杀之恩，给了你灵石×20。', eff: (p) => { p.spiritStones += 20; } },

  // --- 新增：地形杀 ---
  { msg: '🌊 你们在河边打架。你一脚踩空掉进河里。敌人笑得太大声，也掉进来了。你们在水里继续打，但都打不准。体力消耗巨大。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); } },
  { msg: '🌲 你躲到一棵树后面，敌人一剑刺穿了树——树倒了，砸在敌人身上。你赢了。', eff: () => {} },
  { msg: '🏔️ 你们在山顶打架。你一个闪避，敌人冲太猛掉下悬崖了。他在下落过程中突破了——因为生死关头。他飞回来继续打，更强了。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 10); } },
  { msg: '🏚️ 你们在破庙里打架。你撞断了一根柱子——庙塌了。你们都被埋了。你们从废墟里爬出来，互相看了一眼，决定不打了。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 10); } },
  { msg: '🧊 你们在冰面上打架。你用力过猛，冰裂了。你们都掉进了冰水里。冻得打不动了，各自上岸回家了。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 8); } },

  // --- 新增：战斗意外 ---
  { msg: '📱 打到一半，敌人的传讯玉简响了。他接了个电话，说了句"我在打架，等会儿回你"。然后挂了继续打。你被打乱了节奏。', eff: () => {} },
  { msg: '🎂 今天是你生日。敌人知道了，唱了一首生日歌。你有点感动，下手轻了。', eff: () => {} },
  { msg: '🐝 你俩打架时惊动了一个蜂窝。一群灵蜂追着你们俩蜇。你们停手跑路，各自肿了一圈。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); } },
  { msg: '🌧️ 打到一半突然下雨了。雨太大，你们看不清对方。决定雨停了再打。雨停了你发现敌人走了。你赢了——你比他更有耐心。', eff: () => {} },
  { msg: '🕳️ 你一脚踩进一个坑里，坑里是上古传送阵。你被传送到了一百里外。你花了三天走回来，敌人还在原地等你。他说"你跑什么"。', eff: () => {} },

  // --- 新增：战斗后遗症 ---
  { msg: '🤧 打完架你感冒了。你一个修仙者居然感冒了——因为打架时出汗吹了风。你觉得自己很丢人。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 3); } },
  { msg: '🧵 你的衣服被撕破了。你光着膀子走回洞府，路上被三个女修看见了。她们评价你身材一般。', eff: () => {} },
  { msg: '💔 你跟敌人打出了感情。你们互留了传讯方式，约定下次再打。你多了一个宿敌——也是朋友。', eff: () => {} },
  { msg: '📸 有人拍下了你打架的英姿。你把留影石买了下来，挂在家里。每次看都觉得当时的自己很帅。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 5); } },
  { msg: '🩹 打完架你发现自己受了内伤。你花了三天疗伤，花了50灵石买药。下次打架你决定先买保险。', eff: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 50); p.currentHP = Math.max(1, p.currentHP - 10); } },

  // --- 新增：邪门战斗 ---
  { msg: '🌀 你俩打着打着，空间扭曲了。你们被传送到了一片虚空。虚空中有一个声音说："打完才能出去。"你们打了七天七夜，出来时外面只过了一炷香。', eff: (p) => { p.exp += 30; p.currentHP = Math.max(1, p.currentHP - 20); } },
  { msg: '🎭 敌人摘下面具——是你失踪多年的师父。他说这是对你的最终考验。你通过了，他给了你一本功法。修为+40。', eff: (p) => { p.exp += 40; } },
  { msg: '🧬 你打散了敌人的肉身。他的灵魂飘出来说："谢谢，我早就想换具身体了。"然后钻进了你的影子里。你多了一个住客。', eff: () => {} },
  { msg: '🕰️ 敌人拥有时间法器。他把时间倒回了开战前。你们又重新打了一遍。他每次打不过就倒回。第七次你直接认输了，他满意地走了。', eff: () => {} },
  { msg: '🎪 你们打着打着，地面塌了。你们掉进了一个地下擂台。擂台上空有一个倒计时，主持人说："欢迎来到仙界真人秀！"你们被迫打给全场观众看。你赢了，获得奖金灵石×50。', eff: (p) => { p.spiritStones += 50; p.currentHP = Math.max(1, p.currentHP - 15); } },

  // --- 新增：凑数但有看点 ---
  { msg: '🥋 你用了家传绝学"王八拳"。虽然不好看，但有效。敌人被你乱拳打懵了。', eff: () => {} },
  { msg: '🍜 你边吃面边打架。敌人觉得你不尊重他，生气了。但你吃完面后力气大增，把他打败了。', eff: (p) => { p.exp += 10; } },
  { msg: '🧊 你把自己冻在冰里，等敌人靠近时破冰而出。但你没算好时间——破冰早了，敌人还没走过来。你很尴尬。', eff: () => {} },
  { msg: '💤 你假装睡着了，等敌人放松警惕。但你真的睡着了。醒来时敌人已经走了，留了一张纸条："看你睡得香，没忍心叫你。"', eff: () => {} },
  { msg: '🎉 你输了。但敌人跟你击了个掌，说"打得不错"。你感觉好多了。', eff: () => {} },
  { msg: '🧪 你对敌人撒了一把粉末——是辣椒面。敌人捂着眼睛叫唤。你跑了，但觉得自己胜之不武。', eff: () => {} },
  { msg: '🛌 你躺在地上装死。敌人踢了你两脚，你不动。敌人说"我还没用力你就死了"然后走了。你等他走远才爬起来。', eff: () => {} },
  { msg: '🎶 你一边打架一边哼歌。敌人不自觉跟着你的节奏打。你突然变节奏，敌人没跟上，摔倒了。', eff: () => {} },
  { msg: '🧗 敌人抓住你的衣领把你举了起来。你踢了他一脚，他松手了。你摔在地上，他踩到你脚趾，你们俩都疼得跳了起来。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); } },
  { msg: '🏁 敌人说"我们一招定胜负吧"。你同意了。你们对了一掌——你退了五步，他退了四步。你输了，但只输了一步。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 10); } },
  { msg: '💰 敌人突然掏出一块钱说："充个钱。"你接过钱，他跑了。灵石+1。', eff: (p) => { p.spiritStones += 1; } }
];

const HORROR_EVENTS = [
  // --- 保留原有优质恐怖事件 ---
  { msg: '🪞 你照镜子时发现镜中的你慢了半拍。你停下来，镜中的你还在笑。你凑近看，他在无声地说："别眨眼。"', eff: (p) => { addMonths(1); } },
  { msg: '🕳️ 你在洞府打坐，听到地下有敲击声。你挖开地面，发现下面是一间一模一样的洞府，天花板上有你刚挖的痕迹。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 5); } },
  { msg: '📖 你翻开一本捡到的功法，每一页都是你的生平，连你昨天拉肚子都写了。你翻到最后一页，空白处写着："正在更新中……"', eff: () => {} },
  { msg: '👤 你在路上遇见一个和你一模一样的人。你问他你是谁，他反问你是谁。你们争论了三天，最后你开始怀疑自己才是赝品。', eff: (p) => { p.exp = Math.max(0, p.exp - 10); } },
  { msg: '🩸 你斩杀一只妖兽后，它的血在地上凝成一行字："你的飞剑是我三百年前炼化的，谢谢你还给我。"你看着手里的飞剑，沉默了。', eff: () => {} },
  { msg: '🗝️ 你闭关出来，发现门外的世界变了——树往地下长，水往天上流。你遇到的每一个人都认识你，但你说不出他们是谁。', eff: (p) => { addMonths(3); } },
  { msg: '📿 你捡到一串佛珠，数一遍是108颗，再数一遍是109颗。你数了一夜，每次数字都不一样。你把它扔了，第二天它挂在你脖子上。', eff: () => {} },
  { msg: '👁️ 你的影子在你打坐时自己站了起来，绕着洞府走了一圈，然后躺回原位。你假装没看见。', eff: () => {} },
  { msg: '🪦 你在路边看到自己的墓碑，碑上刻着"寿终正寝，享年三百七十二岁"。你算了算——那是七天后。', eff: (p) => { addMonths(1); p.currentHP = Math.max(1, p.currentHP - 30); } },
  { msg: '📦 有人在你门口放了一个盒子。里面是一颗眼球。眼球上写着你的名字。你把它埋了，第二天门口又出现一个盒子。', eff: () => {} },
  { msg: '🧵 你打坐入睡后，梦见自己还在打坐。你醒来后，发现刚才的"醒来"也是梦。你反复醒了六次，第七次你分不清了。', eff: () => {} },
  { msg: '🪶 你捡到一根羽毛，上面写着一行极小的字："第七千四百三十一次轮回，你终于捡到了。"你手一抖，羽毛烧成了灰。', eff: () => {} },
  { msg: '🕯️ 你路过一座荒废的洞府，里面点着一盏灯。灯芯烧了不知多少年，但你发现灯油是你的影子。你的影子比原来淡了一半。', eff: () => {} },
  { msg: '📜 你发现一卷上古卷轴，上面记载了一种失传的功法——修炼条件是"献祭一个认识你的人的记忆"。你犹豫了一下，想起了你妈。你合上了卷轴。', eff: (p) => { p.innerDemon = (p.innerDemon || 0) + 15; } },
  { msg: '🫀 你在河边捡到一颗还在跳动的心脏。你把它埋在树下，第二天那棵树结了一颗果子，剥开里面是一颗更小的心脏，还在跳。你吃了它，修为+50，但你能听到树的心跳声了。', eff: (p) => { p.exp += 50; } },

  // --- 新增：心理恐怖 ---
  { msg: '🗣️ 你一个人在洞府里，听到背后有人叫你的名字。你回头——没人。你又听到了，这次是从你嘴里发出的。', eff: () => {} },
  { msg: '🪟 你半夜醒来，看见窗外有一张脸贴着玻璃。你打开门——外面什么都没有。但你的窗是关着的，那张脸是在屋里。', eff: (p) => { addMonths(1); } },
  { msg: '🚪 你的洞府多了一扇门。你从未见过这扇门。你打开它——里面是你的洞府，一模一样，但空无一人。你关上门，再打开——恢复正常了。', eff: () => {} },
  { msg: '🧠 你发现自己的记忆有缺口。你记得昨天吃了一碗面——但你的储物袋里没有碗。你去找面馆——面馆老板说昨天你没来过。', eff: (p) => { p.exp = Math.max(0, p.exp - 5); } },
  { msg: '👄 你在修炼时，嘴不受控制地说出了一串你从未学过的咒语。你的身体自己动了起来，打了一套你从未见过的拳法。你感觉自己的身体被人借走了。', eff: () => {} },
  { msg: '📷 你的留影石里多了一段你从未录过的影像。视频里的你坐在黑暗中说："别相信镜子里的那个人。"你看着影像里的自己，他的嘴型和你的不一样。', eff: () => {} },
  { msg: '🫂 你每天醒来床头都有一个人形的凹陷，像是有人睡在你旁边。但你是一个人住的。你不冷，但你开始冷了。', eff: () => {} },
  { msg: '🩻 你内视时发现自己的骨头上刻满了密密麻麻的文字。你仔细看——是你自己写的日记，但你从没写过。最新一条写着："他在看。"', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 10); } },

  // --- 新增：存在主义恐怖 ---
  { msg: '🌌 你发现天上的星星排列成一行字："你又来了。"你眨了眨眼，星星恢复了正常。但你记得刚才看到的。', eff: () => {} },
  { msg: '🔄 你今天做的事有一种强烈的既视感。你意识到——你不仅经历过这一切，而且你已经意识到自己经历过。你的意识在层层嵌套。', eff: () => {} },
  { msg: '🧩 你拼凑起一件法器的碎片，拼好后发现——那是一面镜子。镜子里映出的不是你，而是一个你从未见过的人。他对你说："你终于把我放出来了。"', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 20); } },
  { msg: '🕳️ 你发现了一个地洞。洞口立着一块牌子："下去之后，你就不再是你了。"你下去了。下面什么都没有。你上来后，感觉自己的名字有点陌生。', eff: () => {} },
  { msg: '📜 你在自己的笔迹中发现了一封不是你写的信。信上写着："如果你看到这封信，说明我已经走了。不要找我。我不是你。"落款是你的名字。', eff: () => {} },
  { msg: '🪞 你路过一面水潭，倒影里的你在对你摆手——不是再见的意思，而是"别过来"的意思。', eff: () => {} },
  { msg: '🧬 你感觉自己被观察着。不是被人在暗处观察——而是你感觉自己是一个角色，被某个更高的存在决定着一举一动。你抬头看天，天上一片空白。', eff: (p) => { p.innerDemon = (p.innerDemon || 0) + 10; } }
];

// ==================== 道友与灵兽名称池 ====================
// ==================== 道友与灵兽名称池 ====================
const SURNAMES = [
  '赵', '钱', '孙', '李', '周', '吴', '郑', '王',
  '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨',
  '朱', '秦', '许', '何', '吕', '张', '孔', '曹', '严'
];
const GIVEN_NAMES = [
  '云', '天', '风', '玄', '青', '子', '明', '龙', '飞', '白',
  '月', '清', '玉', '仙', '鹤', '羽', '烟', '尘', '霜', '雪',
  '灵', '寒', '道', '川', '江', '雨', '星', '岚', '霄', '鸿'
];
const EASTER_EGG_NAMES = [
  '梅始得', '吴所谓', '郝有钱', '秦兽', '杜子腾', '范统',
  '魏生津', '史珍香', '夏流', '毕云涛', '刘芒', '姬慧',
  '毛遂', '苟剩', '朱队友', '唐赛', '胡丽晶', '肖强'
];

// ==================== 鬼修专属故事池 ====================
const GHOST_TALES = [
  { msg: '👻 你吸收周围的阴气修炼，耳边传来无数亡魂的低语。修为+10。', eff: (p) => { p.exp += 10; } },
  { msg: '👻 一名道士路过，看见你后大喊"有鬼！"一道符咒飞来，你狼狈逃窜。生命-15。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 15); } },
  { msg: '👻 你在乱葬岗修炼，周围的亡魂们把你当成同类，纷纷过来打招呼。修为+5，心魔-5。', eff: (p) => { p.exp += 5; p.innerDemon = Math.max(0, p.innerDemon - 5); } },
  { msg: '👻 一位鬼修前辈的残魂找到你，传授了你一套鬼修功法。修为+25。', eff: (p) => { p.exp += 25; } },
  { msg: '👻 你尝试吞噬其他游魂来增强修为，但被一个千年老鬼盯上了。你赶紧逃跑，修为+3。', eff: (p) => { p.exp += 3; } },
  { msg: '👻 你发现一处阴气极盛的坟地，在这里修炼事半功倍。修为+18。', eff: (p) => { p.exp += 18; } },
  { msg: '👻 你的鬼气不小心泄露，惊动了附近的正道门派。你被迫转移阵地。生命-8。', eff: (p) => { p.currentHP = Math.max(1, p.currentHP - 8); } },
  { msg: '👻 一只野猫能看见你，追着你叫了一整夜。你无法专心修炼，啥也没发生。', eff: () => {} },
  { msg: '👻 你在月圆之夜修炼，阴气暴涨！修为大增+30，但引来了天雷警告，生命-10。', eff: (p) => { p.exp += 30; p.currentHP = Math.max(1, p.currentHP - 10); } },
  { msg: '👻 你遇到一个迷路的小孩，你本想吓唬他，结果他问"你能带我找妈妈吗？"你沉默了，带他找到了家人。心魔-10。', eff: (p) => { p.innerDemon = Math.max(0, p.innerDemon - 10); } },
  { msg: '👻 地府的鬼差误以为你是逃魂，拿着锁链来抓你。你费了好大劲才解释清楚。灵力-10。', eff: (p) => { p.currentMP = Math.max(0, p.currentMP - 10); } }
];

const PET_NAMES = [
  '墨鳞蛇', '寻宝鼠', '赤焰鸟', '冰晶龟', '雷纹猫',
  '啸月狼', '灵鹤', '玄龟', '火凤幼崽', '玉兔',
  '噬金虫', '幻光蝶', '霜牙虎', '幽冥狐', '岩甲熊',
  '风隼', '紫电貂', '青鸾', '石灵', '月华兔'
];

// ==================== 轮回周目奖励 ====================
const WEEKLY_BONUSES = {
  1: { stones: 50, talentPool: ['皮糙肉厚', '小有积蓄'] },
  2: { stones: 100, talentPool: ['灵根初显', '坚韧'] },
  3: { stones: 200, talentPool: ['洞天福地', '战斗直觉'] }
};

// ==================== 成就列表 ====================
const ACHIEVEMENTS = [
  { id: 'firstCultivate', name: '初窥门径', desc: '完成第一次修炼', reward: '灵石+10', check: (p) => p._cultivateCount > 0, apply: (p) => { p.spiritStones += 10; } },
  { id: 'firstBreak', name: '突破炼气', desc: '突破至炼气期', reward: '灵石+30', check: (p) => p.realmIndex >= 1, apply: (p) => { p.spiritStones += 30; } },
  { id: 'goldCore', name: '金丹真人', desc: '突破至金丹期', reward: '灵石+100', check: (p) => p.realmIndex >= 3, apply: (p) => { p.spiritStones += 100; } },
  { id: 'immortal', name: '仙帝', desc: '突破至仙帝', reward: '多周目解锁', check: (p) => p.realmIndex >= REALMS.length - 1, apply: () => {} },
  { id: 'rich', name: '灵石富翁', desc: '灵石超过500', reward: '无', check: (p) => p.spiritStones >= 500, apply: () => {} },
  { id: 'fullSet', name: '套装收集者', desc: '同时装备任意套装2件', reward: '灵石+80', check: (p) => { const names = [p.equipment.weapon?.name, p.equipment.armor?.name, p.equipment.accessory?.name].filter(Boolean); return Object.values(SET_EFFECTS).some(set => set.pieces.every(piece => names.includes(piece))); }, apply: (p) => { p.spiritStones += 80; } },
  { id: 'firstArtifact', name: '不正经的炼器师', desc: '成功炼制第一件法器', reward: '灵石+50', check: (p) => !!p.equipment.artifact, apply: (p) => { p.spiritStones += 50; } },
  { id: 'tribMaster', name: '渡劫达人', desc: '成功渡过3次天劫', reward: '防御+10', check: (p) => (p.tribulationWins || 0) >= 3, apply: (p) => { p.baseDef += 10; } },
  { id: 'petMaster', name: '灵兽宗师', desc: '拥有3只灵兽', reward: '灵石+50', check: (p) => p.pets.length >= 3, apply: (p) => { p.spiritStones += 50; } },
  { id: 'deathMaster', name: '死不瞑目', desc: '累计死亡5次', reward: '成就', check: (p) => (p.deathCount || 0) >= 5, apply: () => {} }
];

// ==================== 称号系统（事件触发，不与成就重叠） ====================
const TITLES = [
  { id: 'toeCultivator', name: '脚趾修仙者', desc: '累计修炼30次', check: (p) => (p._cultivateCount || 0) >= 30 },
  { id: 'collector', name: '收藏家', desc: '背包物品达到15件', check: (p) => (p.bag || []).length >= 15 },
  { id: 'thanks', name: '感谢大家的支持', desc: '通关游戏一次', check: (p) => p.realmIndex >= REALMS.length - 1 || p.weeklyCount > 0 },
  { id: 'chicken', name: '鸡你太美', desc: '渡劫失败3次', check: (p) => (p.tribulationFails || 0) >= 3 },
  { id: 'charmer', name: '万人迷', desc: '拥有5名道友', check: (p) => (p.companions || []).length >= 5 },
  { id: 'deathWalker', name: '生死看淡', desc: '死亡5次', check: (p) => (p.deathCount || 0) >= 5 },
  { id: 'richMan', name: '大富翁', desc: '灵石超过1000', check: (p) => (p.spiritStones || 0) >= 1000 },
  { id: 'slacker', name: '摸鱼达人', desc: '累计摸鱼10次', check: (p) => (p._slackCount || 0) >= 10 },
  { id: 'reincarnator', name: '轮回者', desc: '轮回3次', check: (p) => (p.weeklyCount || 0) >= 3 },
  { id: 'towerMaster', name: '心魔征服者', desc: '通关心魔塔第10层', check: (p) => (p.towerFloor || 0) >= 10 }
];

// ==================== 悬赏任务系统 ====================
const BOUNTY_TASKS = [
  // 杀怪
  { id: 'b1', name: '初出茅庐', desc: '击败3只妖兽', target: 3, type: 'kill', progress: (p) => p._fightWins || 0, check: (p) => (p._fightWins || 0) >= 3, reward: { stones: 50, exp: 30 } },
  { id: 'b2', name: '小有名气', desc: '击败10只妖兽', target: 10, type: 'kill', progress: (p) => p._fightWins || 0, check: (p) => (p._fightWins || 0) >= 10, reward: { stones: 200, exp: 100 }, item: '回春丹' },
  { id: 'b3', name: '斩妖除魔', desc: '击败25只妖兽', target: 25, type: 'kill', progress: (p) => p._fightWins || 0, check: (p) => (p._fightWins || 0) >= 25, reward: { stones: 500, exp: 300 }, item: '筑基丹' },
  { id: 'b4', name: '妖兽克星', desc: '击败50只妖兽', target: 50, type: 'kill', progress: (p) => p._fightWins || 0, check: (p) => (p._fightWins || 0) >= 50, reward: { stones: 1200, exp: 800 }, item: '化婴丹' },
  // 探索
  { id: 'b5', name: '初探江湖', desc: '探索5次', target: 5, type: 'explore', progress: (p) => p._exploreCount || 0, check: (p) => (p._exploreCount || 0) >= 5, reward: { stones: 30, exp: 20 } },
  { id: 'b6', name: '游历四方', desc: '探索15次', target: 15, type: 'explore', progress: (p) => p._exploreCount || 0, check: (p) => (p._exploreCount || 0) >= 15, reward: { stones: 100, exp: 60 } },
  { id: 'b7', name: '行万里路', desc: '探索30次', target: 30, type: 'explore', progress: (p) => p._exploreCount || 0, check: (p) => (p._exploreCount || 0) >= 30, reward: { stones: 300, exp: 200 } },
  // 炼丹
  { id: 'b8', name: '炼丹学徒', desc: '炼制3颗丹药', target: 3, type: 'alchemy', progress: (p) => p.alchemySkill || 0, check: (p) => (p.alchemySkill || 0) >= 3, reward: { stones: 40, exp: 30 } },
  { id: 'b9', name: '炼丹师', desc: '炼制10颗丹药', target: 10, type: 'alchemy', progress: (p) => p.alchemySkill || 0, check: (p) => (p.alchemySkill || 0) >= 10, reward: { stones: 150, exp: 100 } },
  { id: 'b10', name: '丹道大师', desc: '炼制25颗丹药', target: 25, type: 'alchemy', progress: (p) => p.alchemySkill || 0, check: (p) => (p.alchemySkill || 0) >= 25, reward: { stones: 400, exp: 300 }, item: '聚灵散' },
  // 炼器
  { id: 'b11', name: '炼器学徒', desc: '炼制1件法器', target: 1, type: 'forge', progress: (p) => p.forgeSkill || 0, check: (p) => (p.forgeSkill || 0) >= 1, reward: { stones: 50, exp: 40 } },
  { id: 'b12', name: '炼器师', desc: '炼制5件法器', target: 5, type: 'forge', progress: (p) => p.forgeSkill || 0, check: (p) => (p.forgeSkill || 0) >= 5, reward: { stones: 200, exp: 150 } },
  // 采集
  { id: 'b13', name: '采药人', desc: '采集10份草药', target: 10, type: 'collect', progress: (p) => p.materials['草药'] || 0, check: (p) => (p.materials['草药'] || 0) >= 10, reward: { stones: 30, exp: 20 } },
  { id: 'b14', name: '矿工', desc: '采集10份矿石', target: 10, type: 'collect', progress: (p) => p.materials['矿石'] || 0, check: (p) => (p.materials['矿石'] || 0) >= 10, reward: { stones: 30, exp: 20 } },
  { id: 'b15', name: '取水人', desc: '采集5份灵泉水', target: 5, type: 'collect', progress: (p) => p.materials['灵泉水'] || 0, check: (p) => (p.materials['灵泉水'] || 0) >= 5, reward: { stones: 40, exp: 25 } },
  // 终极悬赏（所有悬赏完成后解锁）
  { id: 'b16', name: '👑 天道试炼', desc: '完成所有悬赏后解锁的终极挑战', target: 1, type: 'ultimate', progress: (p) => { var d = (p.completedBounties || []).filter(function(id) { return id.startsWith('b') && id !== 'b16'; }).length; return d >= 15 ? 1 : 0; }, check: (p) => { var d = (p.completedBounties || []).filter(function(id) { return id.startsWith('b') && id !== 'b16'; }).length >= 15; return d; }, reward: { stones: 5000, exp: 5000 }, item: '天道令' }
];

// ==================== BOSS战系统 ====================
const BOSS_LIST = [
  { id: 'boss0', name: '山贼王', realmReq: 0, desc: '占山为王的悍匪，欺压百姓多年', atk: 18, def: 8, hp: 120, icon: '🏴', rewards: { stones: 80, exp: 50, item: '铁剑' }, itemType: 'weapon' },
  { id: 'boss1', name: '妖狼王', realmReq: 1, desc: '修炼千年的妖狼，统领群兽', atk: 35, def: 15, hp: 300, icon: '🐺', rewards: { stones: 150, exp: 100, item: '玄铁甲' }, itemType: 'armor' },
  { id: 'boss2', name: '邪修散人', realmReq: 2, desc: '堕入魔道的散修，专吸人灵力', atk: 55, def: 25, hp: 600, icon: '☠️', rewards: { stones: 300, exp: 200, item: '筑基丹' }, itemType: 'consumable' },
  { id: 'boss3', name: '金丹魔修', realmReq: 3, desc: '结了一颗黑色金丹的魔头', atk: 90, def: 40, hp: 1200, icon: '🔮', rewards: { stones: 600, exp: 400, item: '玄火刃' }, itemType: 'weapon' },
  { id: 'boss4', name: '血影老魔', realmReq: 4, desc: '以血炼功的老怪物，元婴期巅峰', atk: 160, def: 70, hp: 2500, icon: '🩸', rewards: { stones: 1200, exp: 800, item: '天蚕宝甲' }, itemType: 'armor' },
  { id: 'boss5', name: '天外心魔', realmReq: 5, desc: '来自域外的心魔化身', atk: 280, def: 130, hp: 5000, icon: '👁️', rewards: { stones: 2500, exp: 1500, item: '化神丹' }, itemType: 'consumable' },
  { id: 'boss6', name: '万妖之王', realmReq: 6, desc: '统御万妖的妖帝', atk: 500, def: 250, hp: 10000, icon: '🐉', rewards: { stones: 5000, exp: 3000, item: '诛仙剑' }, itemType: 'weapon' },
  { id: 'boss7', name: '上古凶兽', realmReq: 7, desc: '上古遗存的凶兽，毁天灭地', atk: 900, def: 450, hp: 20000, icon: '🦖', rewards: { stones: 10000, exp: 6000, item: '不灭金身' }, itemType: 'armor' },
  { id: 'boss8', name: '天劫主宰', realmReq: 8, desc: '掌控天劫的远古意志', atk: 2000, def: 1000, hp: 50000, icon: '⚡', rewards: { stones: 20000, exp: 15000, item: '渡劫丹' }, itemType: 'consumable' },
  { id: 'boss9', name: '天道化身', realmReq: 9, desc: '天道本身的意志化身', atk: 9999, def: 5000, hp: 100000, icon: '👑', rewards: { stones: 50000, exp: 30000, item: '轮回令' }, itemType: 'consumable' }
];

// ==================== 功法系统 ====================
const SKILLS = [
  { id: 'sk1', name: '基础吐纳术', type: 'cultivate', desc: '修炼效率+5%/级', effect: { cultivateBoost: 0.05 }, maxLevel: 5, costPerLevel: 80, costType: 'stone', realmReq: 0 },
  { id: 'sk2', name: '混元功', type: 'cultivate', desc: '修炼效率+8%/级', effect: { cultivateBoost: 0.08 }, maxLevel: 5, costPerLevel: 200, costType: 'stone', realmReq: 2 },
  { id: 'sk3', name: '紫霞功', type: 'cultivate', desc: '修炼效率+12%/级', effect: { cultivateBoost: 0.12 }, maxLevel: 5, costPerLevel: 500, costType: 'stone', realmReq: 3 },
  { id: 'sk4', name: '基础剑法', type: 'combat', desc: '攻击+3/级', effect: { atkBoost: 3 }, maxLevel: 5, costPerLevel: 60, costType: 'stone', realmReq: 0 },
  { id: 'sk5', name: '破甲诀', type: 'combat', desc: '攻击+6/级', effect: { atkBoost: 6 }, maxLevel: 5, costPerLevel: 150, costType: 'stone', realmReq: 2 },
  { id: 'sk6', name: '金钟罩', type: 'defense', desc: '防御+2/级', effect: { defBoost: 2 }, maxLevel: 5, costPerLevel: 60, costType: 'stone', realmReq: 0 },
  { id: 'sk7', name: '铁布衫', type: 'defense', desc: '防御+4/级', effect: { defBoost: 4 }, maxLevel: 5, costPerLevel: 150, costType: 'stone', realmReq: 2 },
  { id: 'sk8', name: '御风术', type: 'explore', desc: '探索效率+5%/级', effect: { exploreBoost: 0.05 }, maxLevel: 3, costPerLevel: 100, costType: 'stone', realmReq: 1 },
  { id: 'sk9', name: '炼器心得', type: 'forge', desc: '炼器成功率+3%/级', effect: { forgeBoost: 0.03 }, maxLevel: 3, costPerLevel: 100, costType: 'stone', realmReq: 1 },
  { id: 'sk10', name: '丹道初解', type: 'alchemy', desc: '炼丹成功率+3%/级', effect: { alchemyBoost: 0.03 }, maxLevel: 3, costPerLevel: 100, costType: 'stone', realmReq: 1 }
];

// ==================== 心魔塔 ====================
const TOWER_FLOORS = [
  { floor: 1, name: '初识心魔', demonHp: 80, demonAtk: 15, reward: { stones: 30, exp: 20 }, desc: '一个模糊的影子在脑海中低语……' },
  { floor: 2, name: '贪念', demonHp: 150, demonAtk: 25, reward: { stones: 60, exp: 40 }, desc: '你看见自己坐拥无数灵石，心生贪念。' },
  { floor: 3, name: '嗔怒', demonHp: 250, demonAtk: 40, reward: { stones: 100, exp: 70 }, desc: '过往的屈辱涌上心头，怒火中烧。' },
  { floor: 4, name: '痴妄', demonHp: 400, demonAtk: 60, reward: { stones: 150, exp: 110 }, desc: '幻象中你已证道仙帝，沉溺其中。' },
  { floor: 5, name: '心魔·筑基', demonHp: 600, demonAtk: 85, reward: { stones: 250, exp: 180, item: '筑基丹' }, desc: '一道心魔化身拦住去路，实力堪比筑基修士。' },
  { floor: 6, name: '疑心', demonHp: 900, demonAtk: 120, reward: { stones: 400, exp: 280 }, desc: '你开始怀疑自己走的路是否是对的。' },
  { floor: 7, name: '执念', demonHp: 1300, demonAtk: 170, reward: { stones: 600, exp: 400 }, desc: '你最深的执念化作实体，与你对峙。' },
  { floor: 8, name: '心魔·金丹', demonHp: 2000, demonAtk: 250, reward: { stones: 1000, exp: 650, item: '结金丹' }, desc: '金丹级的心魔，已经能撼动你的元神。' },
  { floor: 9, name: '道心崩塌', demonHp: 3500, demonAtk: 400, reward: { stones: 2000, exp: 1200 }, desc: '天地颠倒，道心摇摇欲坠。' },
  { floor: 10, name: '心魔·真我', demonHp: 6000, demonAtk: 700, reward: { stones: 5000, exp: 3000, item: '洗髓丹' }, desc: '你在镜中看到了真正的自己——那是最大的心魔。' }
];

// ==================== 大地图探索 ====================
const MAP_REGIONS = [
  { id: 'r1', name: '青牛镇', icon: '🏘️', realmReq: 0, desc: '新手村周围，妖兽出没', rewards: { stones: [3,12], exp: [5,20] }, events: ['遇见一只迷路的灵兽', '发现一小块灵石矿', '被一只野鸡追赶'] },
  { id: 'r2', name: '落霞山', icon: '⛰️', realmReq: 1, desc: '灵气充沛的山脉，有珍稀草药', rewards: { stones: [10,30], exp: [15,40] }, events: ['采到一株百年灵芝', '遇到山涧灵泉', '被山魈偷袭'] },
  { id: 'r3', name: '云梦泽', icon: '🌊', realmReq: 2, desc: '迷雾笼罩的沼泽，危险与机遇并存', rewards: { stones: [20,60], exp: [30,80] }, events: ['发现一处古迹', '陷入沼泽损失体力', '捡到一件法器残片'] },
  { id: 'r4', name: '苍梧秘境', icon: '🏛️', realmReq: 3, desc: '上古宗门遗迹，藏有功法残卷', rewards: { stones: [40,120], exp: [60,150] }, events: ['参悟残碑上的功法', '触发上古禁制受伤', '发现灵石矿脉'] },
  { id: 'r5', name: '黑风岭', icon: '🌋', realmReq: 4, desc: '魔气弥漫的险地，有高阶材料', rewards: { stones: [80,250], exp: [120,300] }, events: ['击杀一头妖兽获得材料', '被魔气侵蚀', '找到一株魔草'] },
  { id: 'r6', name: '天池仙境', icon: '🏔️', realmReq: 6, desc: '接近天际的仙池，可淬炼肉身', rewards: { stones: [200,600], exp: [300,800] }, events: ['在仙池中淬体', '遇到隐世高人指点', '摘到千年雪莲'] },
  { id: 'r7', name: '归墟之地', icon: '🌀', realmReq: 8, desc: '天地尽头，传说中有成仙的秘密', rewards: { stones: [500,1500], exp: [800,2500] }, events: ['触摸到一丝天道法则', '被空间乱流所伤', '捡到一块上古灵石'] }
];

// ==================== 宗门系统 ====================
const SECTS = [
  // —— 正派 ——
  { id: 'sect1', name: '青云宗', alignment: '正', desc: '正道第一大派，讲究道法自然', icon: '⛰️', bonuses: { cultivate: 1.1 }, ranks: ['外门弟子', '内门弟子', '核心弟子', '长老', '掌门'], contribNeeded: [0, 100, 300, 800, 2000], stipend: [10, 30, 80, 200, 500] },
  { id: 'sect2', name: '天剑门', alignment: '正', desc: '以剑入道，战力为尊', icon: '🗡️', bonuses: { combat: 1.15 }, ranks: ['外门弟子', '内门弟子', '核心弟子', '长老', '掌门'], contribNeeded: [0, 100, 300, 800, 2000], stipend: [10, 30, 80, 200, 500] },
  // —— 邪派 ——
  { id: 'sect4', name: '合欢宗', alignment: '邪', desc: '以情入道，阴阳双修', icon: '💕', bonuses: { cultivate: 1.15, doubleCultivate: true }, ranks: ['侍者', '弟子', '护法', '长老', '宗主'], contribNeeded: [0, 100, 300, 800, 2000], stipend: [10, 30, 80, 200, 500] },
  { id: 'sect5', name: '五毒宗', alignment: '邪', desc: '以毒入道，万蛊噬身', icon: '🦂', bonuses: { combat: 1.1, poisonAtk: 5 }, ranks: ['毒奴', '弟子', '毒师', '长老', '教主'], contribNeeded: [0, 100, 300, 800, 2000], stipend: [10, 30, 80, 200, 500] },
  { id: 'sect6', name: '恶人谷', alignment: '邪', desc: '三教九流，无恶不作', icon: '☠️', bonuses: { stoneBoost: 1.2, combat: 1.05 }, ranks: ['喽啰', '打手', '头目', '当家', '谷主'], contribNeeded: [0, 100, 300, 800, 2000], stipend: [10, 30, 80, 200, 500] },
  // —— 中立 ——
  { id: 'sect3', name: '丹霞谷', alignment: '中立', desc: '专攻丹道，以药入道', icon: '🧪', bonuses: { alchemy: 0.15 }, ranks: ['外门弟子', '内门弟子', '核心弟子', '长老', '掌门'], contribNeeded: [0, 100, 300, 800, 2000], stipend: [10, 30, 80, 200, 500] }
];
const SECT_TASKS = [
  { name: '采集草药', desc: '上缴10份草药', contrib: 20, check: (p) => (p.materials['草药'] || 0) >= 10, doTask: (p) => { p.materials['草药'] -= 10; } },
  { name: '挖掘矿石', desc: '上缴10份矿石', contrib: 20, check: (p) => (p.materials['矿石'] || 0) >= 10, doTask: (p) => { p.materials['矿石'] -= 10; } },
  { name: '宗门巡逻', desc: '击败5只妖兽', contrib: 30, check: (p) => (p._fightWins || 0) >= 5, doTask: (p) => {} },
  { name: '炼丹贡献', desc: '炼制3颗丹药', contrib: 35, check: (p) => (p.alchemySkill || 0) >= 3, doTask: (p) => { p.alchemySkill = Math.max(0, (p.alchemySkill || 0) - 3); } },
  { name: '炼器贡献', desc: '炼制2件法器', contrib: 40, check: (p) => (p.forgeSkill || 0) >= 2, doTask: (p) => { p.forgeSkill = Math.max(0, (p.forgeSkill || 0) - 2); } }
];

// ==================== 宗门事件 ====================
const SECT_EVENTS = [
  // ---- 随机事件 ----
  { id: 'sec1', type: 'random', minRank: 0,
    desc: (s) => '📜 掌门传你到议事厅，说：「' + s.name + '近日有外敌觊觎，你可愿去巡查周边？」',
    options: [
      { text: '✅ 接令巡查', action: (p) => { p.spiritStones += 50; p.sectContrib += 20; addLog('🚶 巡查一圈，发现可疑痕迹，上报后获赏', 'reward'); } },
      { text: '❌ 闭关修炼', action: (p) => { addLog('你以闭关为由推辞了', 'system'); } }
    ]},
  { id: 'sec2', type: 'random', minRank: 0,
    desc: (s) => '💬 同门师兄拉你喝酒：「师弟/师妹，最新八卦！听说隔壁' + (s.id === 'sect1' ? '天剑门' : s.id === 'sect2' ? '丹霞谷' : '青云宗') + '的掌门在秘境里被打劫了！」',
    options: [
      { text: '🍶 一起喝', action: (p) => { p.exp += 20; p.innerDemon = Math.max(0, (p.innerDemon || 0) - 10); addLog('喝酒聊天，修为微涨，心魔稍减', 'success'); } },
      { text: '🙄 不感兴趣', action: (p) => { addLog('你拒绝了，继续修炼', 'system'); } }
    ]},
  { id: 'sec3', type: 'random', minRank: 1,
    desc: (s) => '🏟️ 宗门大比开始！' + s.name + '内门弟子切磋武艺，你被点名参赛。',
    options: [
      { text: '⚔️ 全力一战', action: (p) => { const win = Math.random() < 0.6; if (win) { p.spiritStones += 100; p.sectContrib += 30; addLog('🏆 连胜三场！获得内门比试第三名！', 'reward'); } else { addLog('惜败，但赢得了尊重', 'system'); } } },
      { text: '🤝 谦虚认输', action: (p) => { p.sectContrib += 10; addLog('你主动认输，大家赞你谦逊有礼', 'system'); } }
    ]},
  { id: 'sec4', type: 'random', minRank: 2,
    desc: (s) => '🔮 藏经阁长老找到你：「你在宗内表现优异，送你一本失传已久的功法残卷。」',
    options: [
      { text: '📖 潜心研读', action: (p) => { p.exp += 200; addLog('参悟残卷，收获颇丰！', 'success'); } },
      { text: '💎 上缴宗门', action: (p) => { p.sectContrib += 80; p.spiritStones += 150; addLog('你上交残卷获宗门重赏', 'reward'); } }
    ]},
  // ---- 危机事件 ----
  { id: 'sec5', type: 'crisis', minRank: 1,
    desc: (s) => '⚡ 警报！一群妖兽围攻山门！' + s.name + '的护山大阵被冲击，急需弟子抵御！',
    options: [
      { text: '⚔️ 下山御敌', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 30); p.sectContrib += 50; p.spiritStones += 80; addLog('奋勇杀退妖兽群，宗门上下称赞！', 'reward'); } },
      { text: '🏃 躲在后方', action: (p) => { p.sectContrib -= 20; addLog('你躲了起来，事后被同门鄙视', 'danger'); } }
    ]},
  { id: 'sec6', type: 'crisis', minRank: 2,
    desc: (s) => '🔥 宗门丹房失火！珍贵丹药面临损失，长老急呼弟子救火。',
    options: [
      { text: '💪 冲进去救', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 20); p.sectContrib += 40; addToBag('随机突破丹', 'consumable', 1); addLog('你从火中抢出一批丹药，长老感激涕零', 'reward'); } },
      { text: '💧 运水灭火', action: (p) => { p.currentMP = Math.max(0, p.currentMP - 30); p.sectContrib += 25; addLog('你参与灭火，虽没抢出丹药但也出了力', 'system'); } }
    ]},
  // ---- 争端事件 ----
  { id: 'sec7', type: 'conflict', minRank: 1,
    desc: (s) => '⚔️ 在外历练时遇到敌对宗门的弟子挑衅！对方出言不逊侮辱' + s.name + '。',
    options: [
      { text: '🗡️ 教训他们', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 25); p.sectContrib += 35; addLog('你以一敌三，打跑了对方！为宗门争光！', 'success'); } },
      { text: '🙏 以和为贵', action: (p) => { p.exp += 15; addLog('你忍让退避，回去后掌门赞你顾全大局', 'system'); } }
    ]},
  { id: 'sec8', type: 'conflict', minRank: 2,
    desc: (s) => '🏴‍☠️ 一群魔修流窜到' + s.name + '的地盘烧杀抢掠，宗门发布紧急征召令！',
    options: [
      { text: '⚡ 带队清剿', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 50); p.sectContrib += 80; p.spiritStones += 200; addLog('你率队清剿魔修，大获全胜！名声大振！', 'reward'); } },
      { text: '📦 提供物资', action: (p) => { p.spiritStones = Math.max(0, p.spiritStones - 80); p.sectContrib += 30; addLog('你捐出物资支援前线', 'system'); } }
    ]},
  // ---- 奖励事件 ----
  { id: 'sec9', type: 'random', minRank: 3,
    desc: (s) => '🎉 ' + s.name + '举办百年庆典！各地修士云集，盛况空前！',
    options: [
      { text: '🎪 参加庆典', action: (p) => { p.exp += 100; p.spiritStones += 50; addLog('庆典上你结识了几位散修，交流心得获益良多', 'success'); } },
      { text: '🏆 参加比武', action: (p) => { const win = Math.random() < 0.4; if (win) { p.spiritStones += 300; p.sectContrib += 60; addLog('你在庆典比武中力压群雄！夺得头彩！', 'reward'); } else { p.currentHP = Math.max(1, p.currentHP - 20); addLog('比武惜败，但虽败犹荣', 'system'); } } }
    ]},
  { id: 'sec10', type: 'crisis', minRank: 3,
    desc: (s) => '🐉 一条妖龙盘踞在' + s.name + '附近，吞食灵气、袭击弟子！掌门亲自点将让你带队屠龙。',
    options: [
      { text: '🐉 接下屠龙令', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 80); p.sectContrib += 150; p.spiritStones += 500; addToBag('龙鳞甲', 'armor', 1); addLog('🗡️ 历经苦战，你斩下龙头！全宗震动！', 'reward'); } },
      { text: '🙇 婉言谢绝', action: (p) => { p.sectContrib -= 30; addLog('你推辞了，掌门面露失望', 'danger'); } }
    ]},
  // ---- 合欢宗专属 ----
  { id: 'sec_h1', type: 'random', minRank: 0, sectId: 'sect4',
    desc: (s) => '💕 一位合欢宗师姐路过，对你抛了个媚眼："弟弟可要一起参悟合欢秘法？"',
    options: [
      { text: '💕 恭敬不如从命', action: (p) => { p.exp += 60; p.spiritStones += 30; addLog('双修一夜，修为大涨！', 'success'); } },
      { text: '🙈 落荒而逃', action: (p) => { addLog('你红着脸跑了，身后传来阵阵笑声', 'system'); } }
    ]},
  { id: 'sec_h2', type: 'random', minRank: 1, sectId: 'sect4',
    desc: (s) => '🌺 宗门举办"百花大会"，弟子们各展魅力吸引道侣。你被推选为代表参赛。',
    options: [
      { text: '✨ 盛装出席', action: (p) => { var win = Math.random() < 0.5; if (win) { p.spiritStones += 150; p.sectContrib += 40; addLog('你惊艳全场！夺得花魁！', 'reward'); } else { addLog('表现平平，但重在参与', 'system'); } } },
      { text: '🙅 婉拒', action: (p) => { addLog('你推辞了，师姐们直呼可惜', 'system'); } }
    ]},
  // ---- 五毒宗专属 ----
  { id: 'sec_d1', type: 'random', minRank: 0, sectId: 'sect5',
    desc: (s) => '🦂 五毒宗饲养的毒蝎王跑出来了！在宗门里乱窜，弟子们鸡飞狗跳。',
    options: [
      { text: '🧤 帮忙抓蝎子', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 15); p.sectContrib += 30; addLog('你被蜇了一下但成功抓住了毒蝎王！', 'reward'); } },
      { text: '🏃 躲远点', action: (p) => { addLog('你关紧门窗，外面传来惨叫声……', 'system'); } }
    ]},
  { id: 'sec_d2', type: 'random', minRank: 2, sectId: 'sect5',
    desc: (s) => '🧪 长老炼出一种新型蛊毒，需要一个活人试毒。你的目光和长老对上了……',
    options: [
      { text: '💉 以身试毒', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 40); p.sectContrib += 60; p.exp += 100; addLog('你痛得死去活来，但体质意外增强了！', 'reward'); } },
      { text: '👀 假装没看见', action: (p) => { addLog('你低头装死，长老找了别人', 'system'); } }
    ]},
  // ---- 恶人谷专属 ----
  { id: 'sec_e1', type: 'random', minRank: 0, sectId: 'sect6',
    desc: (s) => '☠️ 恶人谷的兄弟们正在分赃——刚劫了一批商队。有人喊你一起喝酒分钱！',
    options: [
      { text: '🍺 加入他们', action: (p) => { p.spiritStones += 100; p.innerDemon = (p.innerDemon || 0) + 10; addLog('喝酒分赃，灵石到手！但心魔涨了', 'reward'); } },
      { text: '🚶 假装路过', action: (p) => { addLog('你默默走开了，兄弟们骂你怂包', 'system'); } }
    ]},
  { id: 'sec_e2', type: 'random', minRank: 1, sectId: 'sect6',
    desc: (s) => '👊 恶人谷要和隔壁山寨抢地盘！大当家点你去打头阵。',
    options: [
      { text: '⚔️ 冲在最前面', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 30); p.spiritStones += 150; p.sectContrib += 50; addLog('你一马当先杀退对方，恶人谷名声大振！', 'reward'); } },
      { text: '🕵️ 背后阴人', action: (p) => { p.sectContrib += 20; addLog('你绕后偷袭了对方粮草，兵不血刃', 'system'); } }
    ]},
  // ---- 青云宗专属 ----
  { id: 'sec_q1', type: 'random', minRank: 0, sectId: 'sect1',
    desc: (s) => '📖 青云宗藏经阁开放日，长老允许弟子借阅一本上古典籍。',
    options: [
      { text: '📚 借阅功法', action: (p) => { p.exp += 80; addLog('参悟典籍，修为精进！', 'success'); } },
      { text: '🤝 帮长老整理书阁', action: (p) => { p.sectContrib += 25; addLog('长老夸你懂事', 'system'); } }
    ]},
  // ---- 天剑门专属 ----
  { id: 'sec_j1', type: 'random', minRank: 0, sectId: 'sect2',
    desc: (s) => '⚔️ 天剑门的剑冢中有一柄古剑嗡鸣作响，似乎在等待有缘人。',
    options: [
      { text: '🗡️ 拔剑一试', action: (p) => { var win = Math.random() < 0.4; if (win) { addToBag('古剑·青霜', 'weapon', 1); addLog('古剑认主！你获得了【古剑·青霜】！', 'reward'); } else { p.currentHP = Math.max(1, p.currentHP - 25); addLog('被剑气震退，受了点伤', 'danger'); } } },
      { text: '🙏 敬剑三炷香', action: (p) => { p.sectContrib += 20; addLog('剑鸣平息，仿佛认可了你的敬意', 'system'); } }
    ]},
  // ---- 丹霞谷专属 ----
  { id: 'sec_dan1', type: 'random', minRank: 0, sectId: 'sect3',
    desc: (s) => '🧪 丹炉炸了！满院子都是药气，吸一口就头晕目眩。',
    options: [
      { text: '😤 顶着药气救丹', action: (p) => { p.currentHP = Math.max(1, p.currentHP - 20); p.sectContrib += 30; addToBag('聚灵散', 'consumable', 2); addLog('你从炸炉中抢出两瓶丹药！', 'reward'); } },
      { text: '😵 赶紧跑远', action: (p) => { addLog('你跑出院子，药气追着你飘了三条街', 'system'); } }
    ]},
];

console.log('✅ 核心数据定义已加载');
