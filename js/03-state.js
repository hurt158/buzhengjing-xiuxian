// ================================================================
// 第 3 部分：玩家状态、存档/读档、初始化、工具函数
// ================================================================

// ==================== 玩家状态对象 ====================
const DEFAULT_PLAYER = () => ({
  // ---- 境界与修为 ----
  realmIndex: 0,          // 当前境界索引
  layer: 1,               // 当前境界层数
  exp: 0,                 // 当前修为经验

  // ---- 基础属性（不受加成影响） ----
  baseHP: 100,
  baseMP: 50,
  baseAtk: 15,
  baseDef: 5,

  // ---- 当前状态 ----
  currentHP: 100,
  currentMP: 50,
  ageMonths: 216,         // 年龄（月）
  spiritStones: 20,

  // ---- 背包与装备 ----
  bag: [],                // 物品数组 { id, name, type, count, stats, rarity, equipped, enhanceLevel, ... }
  equipment: {
    weapon: null,
    armor: null,
    accessory: null,
    artifact: null
  },

  // ---- 道友与灵兽 ----
  companions: [],         // { name, type, effect, desc, affection, ... }
  pets: [],               // { name, type, effect, desc, level, exp, maxExp, ... }

  // ---- 天赋与体魄 ----
  talent: null,           // { name, desc, level, effect }
  physique: null,         // { name, desc, effect }

  // ---- 命格（四维） ----
  fate: {
    intelligence: 5,
    physique: 5,
    luck: 5,
    focus: 5
  },
  origin: null,           // 出身对象

  // ---- 战斗/冷却 ----
  combatCooldown: 0,
  reviveUsed: false,      // 万古不朽复活标记
  _undyingUsed: false,    // 不死血脉复活标记
  ageStopRemaining: 0,    // 定龄丹剩余月份

  // ---- 材料 ----
  materials: {
    '草药': 0,
    '矿石': 0,
    '灵泉水': 0
  },
  unorthodoxMaterials: {}, // 不正经材料 { 材料名: 数量 }
  enhanceMaterials: {
    '强化石': 0,
    '洗练符': 0
  },

  // ---- 特殊状态 ----
  lotusDebuff: 0,         // 九品莲台卡住回合数
  tribulationFails: 0,    // 连续天劫失败次数
  tribulationWins: 0,     // 累计天劫成功次数
  pillStacks: 0,          // 雷劫丹层数（最多3）
  innerDemon: 0,          // 心魔值

  // ---- 里程碑与成就 ----
  achievements: [],       // 已解锁成就ID列表
  deathCount: 0,          // 死亡次数
  weeklyCount: 0,         // 轮回次数（多周目）

  // ---- 时间与环境 ----
  currentSeason: 'spring', // 'spring' | 'summer' | 'autumn' | 'winter'
  currentDaytime: 'day',   // 'day' | 'night'

  // ---- 临时状态（不持久化） ----
  pendingEvent: null,     // 待处理事件 { comp, options, isDemon }
  currentDungeon: null,   // 当前秘境探索状态
  _cultivateCount: 0,     // 修炼计数（用于成就）
  _ageWarned: false,      // 寿元警告标记
  _fightWins: 0,           // 战斗胜利累计（体魄任务）
  _pillUsed: 0,            // 嗑药累计（体魄任务）
  _exploreCount: 0,        // 探索累计（体魄任务）
  _fateBreakBoost: 0,     // 临时突破加成
  _fateDemonResist: 0,    // 临时心魔抵抗
  _fightCompanionChosen: false, // 战斗道友选择状态
  _gamblerDeathUsed: false,  // 赌场看场免死标记
  _fortuneUsedToday: false,  // 算命先生每日占卜标记
  _fortuneBuff: null,        // 算命先生占卜增益
  _slackCount: 0,           // 摸鱼累计（摸鱼达人称号）
  _reviveCount: 0,          // 触发复活次数（体质/天赋）
  _ghostCultivator: false,  // 是否转为鬼修
  _reviveUsed: false,        // 凤凰涅槃体已使用标记
  _undyingUsed: false,       // 不死血脉已使用标记

  // ---- 功法系统 ----
  skills: [],               // 已学习的功法 [{ id, level }]

  // ---- 心魔塔 ----
  towerFloor: 0,            // 当前已通关的最高层数（0=未通关）

  // ---- 宗门系统 ----
  sect: null,               // 当前宗门ID
  sectRank: 0,              // 宗门职位索引
  sectContrib: 0,           // 宗门贡献点
  _lastStipendTime: 0,      // 上次领取俸禄时间
  battleMode: 'auto',       // 战斗模式: 'auto' 自动 | 'manual' 手动

  // ---- 熟练度系统 ----
  alchemySkill: 0,          // 炼丹熟练度
  forgeSkill: 0,            // 炼器熟练度
  completedBounties: [],    // 已完成悬赏任务ID列表

  // ---- 图鉴系统 ----
  collection: {
    equipment: [],   // 已获得装备名
    pets: [],        // 已获得灵兽名
    materials: [],   // 已获得材料名
    artifacts: [],   // 已获得法器名
    consumables: []  // 已获得丹药名
  },

  // ---- 灵根系统 ----
  spiritualRoots: null,  // 初始化时生成 { metal, wood, water, fire, earth } 总和100

  // ---- 洞府系统 ----
  cave: {
    level: 1,
    lastVisit: Date.now()
  },

  // ---- BOSS战 ----
  beatenBosses: [],    // 已击败BOSS ID列表

  // ---- 人生大事录 ----
  lifeEvents: [],      // 里程碑事件记录

  // ---- 灵田系统 ----
  farm: {
    plots: [
      { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 },
      { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 },
      { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 }
    ],
    maxPlots: 3
  },

  // ---- 神识系统 ----
  spiritualSense: 10,       // 神识 0-100，影响探索和奇遇

  // ---- 存档管理 ----
  _saveSlot: 0,              // 当前使用的存档位

  _lastSaveTime: null,     // 上次保存时间

  logFilter: 'all',          // 日志筛选状态

  // ---- 称号系统 ----
  titles: [],               // 已获得的称号ID列表
  equippedTitle: null       // 当前佩戴的称号ID
});

// 当前玩家对象
let player = null;

// ==================== 工具函数 ====================

/** 获取当前境界对象 */
function getCurrentRealm() {
  return REALMS[player.realmIndex];
}

/** 获取完整境界名称（含层数） */
function getRealmFullName() {
  const r = getCurrentRealm();
  return r.layers === 1 ? r.name : r.name + ' ' + player.layer + '层';
}

/** 获取当前境界所需经验 */
function getExpNeeded() {
  return getCurrentRealm().expNeeded;
}

/** 获取当前境界最大寿元（月） */
function getMaxLifeMonths() {
  return getCurrentRealm().lifeMonths;
}

/** 格式化年龄（月 -> 年/月） */
function formatAge(months) {
  const total = Math.floor(months);
  const years = Math.floor(total / 12);
  const m = total % 12;
  return years + '年' + m + '月';
}

/** 随机获取地点名称 */
function rollLoc() {
  const locs = ['青牛镇', '渔阳村', '落霞山', '白河城', '苍梧岭', '枯松坳', '野狐沟', '仙鹤渡', '云梦泽', '黑风寨'];
  return locs[Math.floor(Math.random() * locs.length)];
}

/** 随机生成出身 */
function rollOrigin() {
  const roll = Math.random() * 100;
  let idx;
  if (roll < 10) idx = Math.floor(Math.random() * 3);      // 少年 0-2
  else if (roll < 70) idx = 3 + Math.floor(Math.random() * 3); // 青年 3-5
  else if (roll < 90) idx = 6 + Math.floor(Math.random() * 3); // 中年 6-8
  else idx = 9 + Math.floor(Math.random() * 3);            // 暮年 9-11
  return ORIGINS[idx];
}

/** 生成命格属性（20点分配） */
function rollFateStats(origin) {
  // 初始随机分配
  let vals = [
    3 + Math.floor(Math.random() * 8),
    3 + Math.floor(Math.random() * 8),
    3 + Math.floor(Math.random() * 8),
    3 + Math.floor(Math.random() * 8)
  ];
  // 调整总和为20
  let total = vals.reduce((a, b) => a + b, 0);
  let ratio = 20 / total;
  vals = vals.map(v => Math.max(3, Math.min(10, Math.round(v * ratio))));
  // 修正差值
  let diff = 20 - vals.reduce((a, b) => a + b, 0);
  for (let i = 0; diff > 0; i = (i + 1) % 4) {
    if (vals[i] < 10) { vals[i]++; diff--; }
  }
  for (let i = 0; diff < 0; i = (i + 1) % 4) {
    if (vals[i] > 3) { vals[i]--; diff++; }
  }
  const fate = {
    intelligence: vals[0],
    physique: vals[1],
    luck: vals[2],
    focus: vals[3]
  };
  // 出身修正
  if (origin.fateMod) {
    if (origin.fateMod.intelligence) fate.intelligence = Math.max(1, Math.min(100, fate.intelligence + origin.fateMod.intelligence));
    if (origin.fateMod.physique) fate.physique = Math.max(1, Math.min(100, fate.physique + origin.fateMod.physique));
    if (origin.fateMod.luck) fate.luck = Math.max(1, Math.min(100, fate.luck + origin.fateMod.luck));
    if (origin.fateMod.focus) fate.focus = Math.max(1, Math.min(100, fate.focus + origin.fateMod.focus));
  }
  return fate;
}

/** 随机天赋 */
function randomTalent() {
  const total = TALENT_WEIGHTS.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  let cum = 0;
  let levelIdx = 0;
  for (let i = 0; i < TALENT_WEIGHTS.length; i++) {
    cum += TALENT_WEIGHTS[i];
    if (rand <= cum) { levelIdx = i; break; }
  }
  const level = TALENT_LEVELS[levelIdx];
  const pool = TALENT_POOL[level];
  const talent = { ...pool[Math.floor(Math.random() * pool.length)], level };
  return talent;
}

/** 随机体魄（可先天觉醒） */
function randomPhysique(inborn) {
  if (inborn && Math.random() < 0.05) {
    const rare = Object.entries(PHYSIQUE_TYPES).filter(([k]) => k !== '凡体');
    const [name, data] = rare[Math.floor(Math.random() * rare.length)];
    return { name, ...data };
  }
  return { name: '凡体', ...PHYSIQUE_TYPES['凡体'] };
}

// ==================== 获取有效属性（含所有加成） ====================
function getEffectiveStats() {
  const s = {
    maxHP: player.baseHP,
    maxMP: player.baseMP,
    atk: player.baseAtk,
    def: player.baseDef
  };

  // 1. 境界加成（已修炼的层数总和）
  for (let i = 1; i <= player.realmIndex; i++) {
    const r = REALMS[i];
    const layers = (i === player.realmIndex) ? player.layer : r.layers;
    s.maxHP += r.hpBonus * Math.max(0, layers);
    s.maxMP += r.mpBonus * Math.max(0, layers);
    s.atk += r.atkBonus * Math.max(0, layers);
    s.def += r.defBonus * Math.max(0, layers);
  }

  // 2. 装备加成（武器/防具/饰品）
  ['weapon', 'armor', 'accessory'].forEach(slot => {
    const eq = player.equipment[slot];
    if (eq && eq.stats) {
      for (const [key, val] of Object.entries(eq.stats)) {
        if (key === 'all') {
          s.atk += val;
          s.def += val;
          s.maxHP += val;
          s.maxMP += val;
        } else if (key === 'atk') s.atk += val;
        else if (key === 'def') s.def += val;
        else if (key === 'hp') s.maxHP += val;
        else if (key === 'mp') s.maxMP += val;
      }
    }
  });

  // 3. 法器加成
  if (player.equipment.artifact) {
    const art = player.equipment.artifact;
    if (art.stats) {
      if (art.stats.atk) s.atk += art.stats.atk;
      if (art.stats.def) s.def += art.stats.def;
      if (art.stats.hp) s.maxHP += art.stats.hp;
      if (art.stats.mp) s.maxMP += art.stats.mp;
    }
  }

  // 4. 体魄效果
  const phys = player.physique?.effect || {};
  if (phys.hpMult) s.maxHP = Math.floor(s.maxHP * phys.hpMult);
  if (phys.mpMult) s.maxMP = Math.floor(s.maxMP * phys.mpMult);
  if (phys.atkMult) s.atk = Math.floor(s.atk * phys.atkMult);
  if (phys.defMult) s.def = Math.floor(s.def * phys.defMult);
  if (phys.allMult) {
    s.maxHP = Math.floor(s.maxHP * phys.allMult);
    s.maxMP = Math.floor(s.maxMP * phys.allMult);
    s.atk = Math.floor(s.atk * phys.allMult);
    s.def = Math.floor(s.def * phys.allMult);
  }

  // 5. 天赋加成
  const talent = player.talent;
  if (talent) {
    const e = talent.effect;
    if (e.type === 'hpBoost') s.maxHP = Math.floor(s.maxHP * e.val);
    if (e.type === 'atkBoost') s.atk = Math.floor(s.atk * e.val);
    if (e.type === 'defBoost') s.def = Math.floor(s.def * e.val);
    if (e.type === 'allBoost') {
      s.maxHP = Math.floor(s.maxHP * e.val);
      s.maxMP = Math.floor(s.maxMP * e.val);
      s.atk = Math.floor(s.atk * e.val);
      s.def = Math.floor(s.def * e.val);
    }
  }

  // 6. 套装加成
  const setBonus = getSetBonus();
  if (setBonus.atk) s.atk += setBonus.atk;
  if (setBonus.def) s.def += setBonus.def;
  if (setBonus.hp) s.maxHP += setBonus.hp;
  if (setBonus.mp) s.maxMP += setBonus.mp;

  // 7. 道友/灵兽加成
  const compPetBonus = getCompanionPetBonus();
  s.atk += compPetBonus.atk;
  s.def += compPetBonus.def;
  s.maxHP += compPetBonus.hp;
  s.maxMP += compPetBonus.mp;

  // 保证最低值
  s.maxHP = Math.max(1, s.maxHP);
  s.maxMP = Math.max(1, s.maxMP);
  s.atk = Math.max(0, s.atk);
  s.def = Math.max(0, s.def);

  return s;
}

/** 获取套装加成（纯计算，不修改状态） */
function getSetBonus() {
  const bonus = { atk: 0, def: 0, hp: 0, mp: 0 };
  const equippedNames = [
    player.equipment.weapon?.name,
    player.equipment.armor?.name,
    player.equipment.accessory?.name
  ].filter(Boolean);
  for (const set of Object.values(SET_EFFECTS)) {
    if (set.pieces.every(p => equippedNames.includes(p))) {
      for (const [key, val] of Object.entries(set.bonus)) {
        bonus[key] = (bonus[key] || 0) + val;
      }
    }
  }
  return bonus;
}

/** 获取道友与灵兽加成（用于战斗、修炼等） */
function getCompanionPetBonus() {
  const b = { atk: 0, def: 0, hp: 0, mp: 0, cultivate: 1, stones: 1 };
  player.companions.forEach(c => {
    if (c.effect) {
      if (c.effect.cultivateBonus) b.cultivate *= c.effect.cultivateBonus;
      if (c.effect.combatAtk) b.atk += c.effect.combatAtk;
      // 其他可能效果
    }
  });
  player.pets.forEach(p => {
    const eff = getPetEffect(p);
    if (eff.hpBonus) b.hp += eff.hpBonus;
    if (eff.stoneBonus) b.stones *= eff.stoneBonus;
    if (eff.defBoost) b.def += eff.defBoost;
    if (eff.atkBoost) b.atk += eff.atkBoost;
  });
  return b;
}

/** 获取灵兽实际效果（含等级加成） */
function getPetEffect(pet) {
  if (!pet.level) pet.level = 1;
  const base = { ...pet.effect };
  if (pet.level > 1) {
    for (const key in base) {
      if (typeof base[key] === 'number') {
        base[key] = Math.floor(base[key] * (1 + 0.2 * (pet.level - 1)));
      }
    }
  }
  return base;
}

// ==================== 添加/移除物品 ====================
/** 添加到背包（支持堆叠） */
function addToBag(item, type, count = 1) {
  if (type === 'consumable' || type === 'material') {
    // 尝试堆叠
    const exist = player.bag.find(i => i.id === item || i.name === item);
    if (exist) {
      exist.count = (exist.count || 1) + count;
      // 图鉴：第一次获得时已记录，无需重复
      return;
    }
    // 否则新建
    const itemName = typeof item === 'string' ? item : item.name;
    player.bag.push({
      id: typeof item === 'string' ? item : (item.id || item.name),
      name: itemName,
      type,
      count: count,
      rarity: item.rarity || 'common',
      price: item.price || 20
    });
    // 图鉴记录
    if (!player.collection) player.collection = { equipment: [], pets: [], materials: [], artifacts: [], consumables: [] };
    if (type === 'consumable' && !player.collection.consumables.includes(itemName)) {
      player.collection.consumables.push(itemName);
    }
    if (type === 'material' && !player.collection.materials.includes(itemName)) {
      player.collection.materials.push(itemName);
    }
  } else {
    // 装备类（武器/防具/饰品）
    const entry = { ...item, type, count: 1, equipped: false };
    if (!entry.id) entry.id = entry.name + '_' + Date.now();
    // 图鉴记录
    if (!player.collection) player.collection = { equipment: [], pets: [], materials: [], artifacts: [], consumables: [] };
    if (!player.collection.equipment.includes(entry.name)) {
      player.collection.equipment.push(entry.name);
    }
    player.bag.push(entry);
  }
}

/** 从背包移除物品（按名称或ID，支持减少数量） */
function removeFromBag(nameOrId, count = 1) {
  const idx = player.bag.findIndex(i => i.id === nameOrId || i.name === nameOrId);
  if (idx === -1) return false;
  const item = player.bag[idx];
  if (item.count > 1) {
    item.count -= count;
    if (item.count <= 0) player.bag.splice(idx, 1);
  } else {
    player.bag.splice(idx, 1);
  }
  return true;
}

// ==================== 年龄与时间推进 ====================
/** 增加月份（考虑定龄丹） */
function addMonths(months) {
  let remaining = months;
  if (player.ageStopRemaining > 0) {
    const stop = Math.min(remaining, player.ageStopRemaining);
    player.ageStopRemaining -= stop;
    remaining -= stop;
  }
  player.ageMonths = player.ageMonths + remaining;

  // 道友同步老化
  if (player.companions && player.companions.length > 0) {
    for (let i = player.companions.length - 1; i >= 0; i--) {
      const c = player.companions[i];
      if (c.maxAgeMonths && c.ageMonths !== undefined) {
        c.ageMonths += remaining;
        if (c.ageMonths >= c.maxAgeMonths) {
          const daoMsg = c.isDaoCompanion ? ' 💔你的道侣……' : '';
          addLog('🍂 道友【' + c.name + '】寿元耗尽，仙逝归天。' + daoMsg, 'danger');
          addLifeEvent('道友【' + c.name + '】寿元耗尽仙逝');
          player.companions.splice(i, 1);
        }
      }
    }
  }

  // 灵田生长
  if (player.farm && player.farm.plots) {
    player.farm.plots.forEach(plot => {
      if (plot.planted && !plot.ready) {
        plot.elapsed = (plot.elapsed || 0) + remaining;
        if (plot.elapsed >= plot.totalGrowth) {
          plot.ready = true;
        }
      }
    });
  }

  // 寿元耗尽检测（鬼修不受寿元限制）
  const maxLife = getMaxLifeMonths();
  if (player.ageMonths >= maxLife && isFinite(maxLife) && !player._ghostCultivator) {
    addLog('⌛ 寿元耗尽，于' + formatAge(player.ageMonths) + '坐化...', 'danger');
    handleDeath(true);
    return;
  }

  // 寿元警告（鬼修无视）
  if (maxLife - player.ageMonths <= 12 && maxLife - player.ageMonths > 0 && !player._ageWarned && !player._ghostCultivator) {
    player._ageWarned = true;
    showModal('寿元警示', '<p style="color:var(--danger);">⚠️ 你的寿元仅剩不足1年！请尽快突破或服用延寿丹。</p>');
  }

  // 推进时间（昼夜/季节变化）
  advanceTime();
}

/** 推进时间（昼夜/季节随机变化） */
function advanceTime() {
  if (Math.random() < 0.1) {
    player.currentDaytime = player.currentDaytime === 'day' ? 'night' : 'day';
  }
  if (Math.random() < 0.35) {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    const idx = seasons.indexOf(player.currentSeason);
    player.currentSeason = seasons[(idx + 1) % 4];
  }
}

/** 季节中文名 */
function seasonName(s) {
  return { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[s] || s;
}

// ==================== 生命/灵力自动恢复 ====================
function regenerate() {
  // 死亡状态下不恢复生命/灵力
  if (player.currentHP <= 0) return;
  const stats = getEffectiveStats();
  const phys = player.physique?.effect || {};
  let hpRegen = Math.floor(stats.maxHP * 0.02);
  let mpRegen = Math.floor(stats.maxMP * 0.03);

  if (phys.regenMult) hpRegen = Math.floor(hpRegen * phys.regenMult);
  if (player.talent?.effect?.mpRegen) mpRegen = Math.floor(mpRegen * player.talent.effect.mpRegen);

  player.currentHP = Math.min(stats.maxHP, player.currentHP + hpRegen);
  player.currentMP = Math.min(stats.maxMP, player.currentMP + mpRegen);
}

// ==================== 存档与读档（3个存档位） ====================

const SAVE_KEYS = ['buzhengjing_save_0', 'buzhengjing_save_1', 'buzhengjing_save_2'];
const META_KEY = 'buzhengjing_save_meta';

function getSaveMeta() {
  try {
    const raw = JSON.parse(localStorage.getItem(META_KEY));
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    // 旧格式对象转数组
    const arr = [];
    for (let i = 0; i < 3; i++) arr[i] = raw[i] || null;
    return arr;
  } catch(e) { return []; }
}
function setSaveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function saveGame(slot, customKey) {
  try {
    const idx = slot !== undefined ? slot : (player._saveSlot || 0);
    const saveKey = customKey || SAVE_KEYS[idx];
    const saveData = {
      realmIndex: player.realmIndex, layer: player.layer, exp: player.exp,
      baseHP: player.baseHP, baseMP: player.baseMP, baseAtk: player.baseAtk, baseDef: player.baseDef,
      currentHP: player.currentHP, currentMP: player.currentMP,
      ageMonths: player.ageMonths, spiritStones: player.spiritStones,
      bag: player.bag, equipment: player.equipment,
      companions: player.companions, pets: player.pets,
      talent: player.talent, physique: player.physique, fate: player.fate, origin: player.origin,
      combatCooldown: player.combatCooldown, reviveUsed: player.reviveUsed, ageStopRemaining: player.ageStopRemaining,
      materials: player.materials, unorthodoxMaterials: player.unorthodoxMaterials, enhanceMaterials: player.enhanceMaterials,
      lotusDebuff: player.lotusDebuff, tribulationFails: player.tribulationFails, tribulationWins: player.tribulationWins,
      pillStacks: player.pillStacks, innerDemon: player.innerDemon,
      achievements: player.achievements, deathCount: player.deathCount, weeklyCount: player.weeklyCount,
      currentSeason: player.currentSeason, currentDaytime: player.currentDaytime,
      _cultivateCount: player._cultivateCount, _ageWarned: player._ageWarned,
      _fightWins: player._fightWins, _pillUsed: player._pillUsed, _exploreCount: player._exploreCount,
      _fateBreakBoost: player._fateBreakBoost, _fateDemonResist: player._fateDemonResist,
      _slackCount: player._slackCount,
      _fortuneUsedToday: player._fortuneUsedToday,
      _fortuneBuff: player._fortuneBuff,
      _lastStipendTime: player._lastStipendTime,
      logFilter: player.logFilter,
      _reviveCount: player._reviveCount,
      _reviveUsed: player._reviveUsed,
      _undyingUsed: player._undyingUsed,
      _gamblerDeathUsed: player._gamblerDeathUsed,
      _ghostCultivator: player._ghostCultivator,
      skills: player.skills,
      towerFloor: player.towerFloor,
      sect: player.sect, sectRank: player.sectRank, sectContrib: player.sectContrib,
      alchemySkill: player.alchemySkill, forgeSkill: player.forgeSkill,
      completedBounties: player.completedBounties, collection: player.collection,
      spiritualRoots: player.spiritualRoots,
      cave: player.cave, beatenBosses: player.beatenBosses, lifeEvents: player.lifeEvents, farm: player.farm,
      spiritualSense: player.spiritualSense, titles: player.titles, equippedTitle: player.equippedTitle,
      battleMode: player.battleMode,
      _lastSaveTime: Date.now()
    };
    localStorage.setItem(saveKey, JSON.stringify(saveData));
    if (!customKey) {
      const meta = getSaveMeta();
      meta[idx] = { time: Date.now(), realm: getRealmFullName(), age: formatAge(player.ageMonths), stones: player.spiritStones, name: player.origin ? player.origin.name : '?' };
      setSaveMeta(meta);
      player._saveSlot = idx;
      addLog('💾 存档已保存（槽位' + (idx + 1) + '）。', 'success');
    }
  } catch (e) { addLog('⚠️ 保存失败：' + e.message, 'danger'); }
}

function loadGame(slot) {
  try {
    const idx = slot !== undefined ? slot : 0;
    const raw = localStorage.getItem(SAVE_KEYS[idx]);
    if (!raw) return false;
    const data = JSON.parse(raw);
    player = DEFAULT_PLAYER();
    for (const key in player) { player[key] = data.hasOwnProperty(key) ? data[key] : player[key]; }
    if (!player.equipment) player.equipment = { weapon: null, armor: null, accessory: null, artifact: null };
    if (!player.fate) player.fate = { intelligence: 5, physique: 5, luck: 5, focus: 5 };
    if (!player.materials) player.materials = { '草药': 0, '矿石': 0, '灵泉水': 0 };
    if (!player.unorthodoxMaterials) player.unorthodoxMaterials = {};
    if (!player.enhanceMaterials) player.enhanceMaterials = { '强化石': 0, '洗练符': 0 };
    if (!player.achievements) player.achievements = [];
    if (!player.companions) player.companions = [];
    if (player.companions.length > 0) {
      let needMigration = false;
      player.companions.forEach(c => { if (c.realmIndex === undefined) needMigration = true; });
      if (needMigration) {
        player.companions.forEach(c => { c.realmIndex = c.realmIndex ?? Math.max(0, (player.realmIndex || 0) - 1); c.ageMonths = c.ageMonths ?? 300; c.maxAgeMonths = c.maxAgeMonths ?? 960; });
      }
    }
    if (!player.pets) player.pets = [];
    if (!player.titles) player.titles = [];
    if (!player.equippedTitle) player.equippedTitle = null;
    if (!player.completedBounties) player.completedBounties = [];
    if (!player.collection) player.collection = { equipment: [], pets: [], materials: [], artifacts: [], consumables: [] };
    if (!player.cave) player.cave = { level: 1, lastVisit: Date.now() };
    if (!player.beatenBosses) player.beatenBosses = [];
    if (!player.lifeEvents) player.lifeEvents = [];
    if (!player.farm) player.farm = { plots: [{ planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 }, { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 }, { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 }], maxPlots: 3 };
    if (!player.spiritualSense) player.spiritualSense = 10;
    if (!player._reviveCount) player._reviveCount = 0;
    if (player._reviveUsed === undefined) player._reviveUsed = false;
    if (player._undyingUsed === undefined) player._undyingUsed = false;
    if (player._gamblerDeathUsed === undefined) player._gamblerDeathUsed = false;
    if (player._fortuneUsedToday === undefined) player._fortuneUsedToday = false;
    if (player._fortuneBuff === undefined) player._fortuneBuff = null;
    if (player._lastStipendTime === undefined) player._lastStipendTime = 0;
    if (player.logFilter === undefined) player.logFilter = 'all';
    if (!player._ghostCultivator) player._ghostCultivator = false;
    if (!player.skills) player.skills = [];
    if (!player.towerFloor) player.towerFloor = 0;
    if (!player.sect) player.sect = null;
    if (!player.sectRank) player.sectRank = 0;
    if (!player.sectContrib) player.sectContrib = 0;
    if (!player.spiritualRoots) {
      const roots = ['metal', 'wood', 'water', 'fire', 'earth'];
      let vals = roots.map(() => 10 + Math.floor(Math.random() * 25));
      const total = vals.reduce((a, b) => a + b, 0);
      if (total > 0) { const ratio = 100 / total; vals = vals.map(v => Math.max(1, Math.round(v * ratio))); }
      let diff = 100 - vals.reduce((a, b) => a + b, 0);
      for (let i = 0; diff > 0; i = (i + 1) % 5) { vals[i]++; diff--; }
      player.spiritualRoots = { metal: vals[0], wood: vals[1], water: vals[2], fire: vals[3], earth: vals[4] };
    }
    player.pendingEvent = null; player.currentDungeon = null; player._fightCompanionChosen = false;
    player.ageMonths = Math.floor(player.ageMonths || 0);
    const s = getEffectiveStats();
    player.currentHP = Math.min(player.currentHP || 0, s.maxHP);
    player.currentMP = Math.min(player.currentMP || 0, s.maxMP);
    player._saveSlot = idx;
    player._loadedFromSave = true;
    addLog('📂 读取存档（槽位' + (idx + 1) + '）成功。', 'system');
    return true;
  } catch (e) { addLog('⚠️ 读取存档失败：' + e.message, 'danger'); return false; }
}

function showSaveManager(mode) {
  let html = '<div style="max-height:350px;overflow-y:auto;">';
  const meta = getSaveMeta();

  // 读档模式：先显示自动存档位
  if (mode === 'load') {
    const autoRaw = localStorage.getItem('buzhengjing_save_auto');
    const autoExists = !!autoRaw;
    html += '<div class="stat-card" style="margin-bottom:6px;cursor:pointer;text-align:left;border:1px solid var(--accent);' + (autoExists ? '' : 'opacity:0.5;') + '"';
    html += autoExists ? ' onclick="doLoadAuto();closeModal();"' : '';
    html += '>';
    html += '<h3>🕐 自动存档</h3>';
    if (autoExists) {
      try {
        var ad = JSON.parse(autoRaw);
        html += '<div style="font-size:0.7rem;">境界：' + (REALMS[ad.realmIndex || 0].name) + ' | 年龄：' + formatAge(ad.ageMonths || 0) + '</div>';
        html += '<div style="font-size:0.65rem;color:#8899aa;">灵石：' + (ad.spiritStones || 0) + ' | ' + (ad.origin ? ad.origin.name : '?') + '</div>';
      } catch(e) {
        html += '<div style="font-size:0.7rem;color:var(--danger);">存档数据损坏</div>';
      }
    } else {
      html += '<div style="font-size:0.7rem;color:#8899aa;">暂无自动存档</div>';
    }
    html += '</div>';
    html += '<div style="text-align:center;color:#8899aa;font-size:0.6rem;margin-bottom:8px;">— 手动存档 —</div>';
  }

  for (let i = 0; i < 3; i++) {
    const m = meta[i];
    const exists = !!m && !!localStorage.getItem(SAVE_KEYS[i]);
    html += '<div class="stat-card" style="margin-bottom:6px;cursor:pointer;text-align:left;" onclick="' + (mode === 'save' ? 'doSave(' + i + ')' : 'doLoad(' + i + ')') + ';closeModal();">';
    html += '<h3>' + (mode === 'save' ? '💾' : '📂') + ' 槽位 ' + (i + 1) + '</h3>';
    if (exists) {
      html += '<div style="font-size:0.7rem;">境界：' + (m.realm || '?') + ' | 年龄：' + (m.age || '?') + '</div>';
      html += '<div style="font-size:0.65rem;color:#8899aa;">灵石：' + (m.stones || 0) + ' | ' + (m.name || '?') + '</div>';
    } else {
      html += '<div style="font-size:0.7rem;color:#8899aa;">空</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  showModal(mode === 'save' ? '💾 选择存档位' : '📂 选择读档位', html);
}

function doSave(idx) { saveGame(idx); requestUIUpdate(); }
function doLoad(idx) { if (loadGame(idx)) { requestUIUpdate(); hideSplash(); } }
function doLoadAuto() {
  try {
    var raw = localStorage.getItem('buzhengjing_save_auto');
    if (!raw) { addLog('⚠️ 无自动存档', 'danger'); return; }
    player = DEFAULT_PLAYER();
    var data = JSON.parse(raw);
    for (var key in player) { player[key] = data.hasOwnProperty(key) ? data[key] : player[key]; }
    // 恢复字段
    if (!player.equipment) player.equipment = { weapon: null, armor: null, accessory: null, artifact: null };
    if (!player.fate) player.fate = { intelligence: 5, physique: 5, luck: 5, focus: 5 };
    player.pendingEvent = null; player.currentDungeon = null; player._fightCompanionChosen = false;
    player.ageMonths = Math.floor(player.ageMonths || 0);
    var s = getEffectiveStats();
    player.currentHP = Math.min(player.currentHP || 0, s.maxHP);
    player.currentMP = Math.min(player.currentMP || 0, s.maxMP);
    player._loadedFromSave = true;
    requestUIUpdate();
    hideSplash();
    addLog('📂 读取自动存档成功。', 'system');
  } catch (e) { addLog('⚠️ 读取自动存档失败：' + e.message, 'danger'); }
}
function hideSplash() {
  const s = document.getElementById('splashScreen');
  if (s && !s.classList.contains('hidden')) { s.classList.add('hidden'); setTimeout(() => { if (s) s.style.display = 'none'; }, 1000); }
  setTimeout(function() { playBgm('bgmGame'); }, 600);
}

function autoLoadOrNew() {
  // 迁移旧版存档到新格式（一次性）
  var old = localStorage.getItem('buzhengjing_save_v2');
  if (old) {
    for (var i = 0; i < 3; i++) {
      if (!localStorage.getItem(SAVE_KEYS[i])) {
        localStorage.setItem(SAVE_KEYS[i], old);
        var meta = getSaveMeta(); meta[i] = { time: Date.now(), realm: '旧存档', age: '', stones: 0, name: '迁移' }; setSaveMeta(meta);
        localStorage.removeItem('buzhengjing_save_v2');
        break;
      }
    }
  }
  // 仅在标记要清理的旧测试数据时清除（_clearSaves 标记由手动或脚本设置，这里仅读取）
  var needClear = localStorage.getItem('_clearSaves');
  if (needClear === '1') {
    for (var i = 0; i < 3; i++) localStorage.removeItem(SAVE_KEYS[i]);
    localStorage.removeItem(META_KEY);
    localStorage.removeItem('buzhengjing_save_v2');
    localStorage.removeItem('_clearSaves');
  }
  // 不自动读档，由用户在启动封面点击"继续游戏"来读档
  // 仅当没有任何存档时自动开新游戏
  const hasAnySave = (function() {
    for (let i = 0; i < 3; i++) {
      if (localStorage.getItem(SAVE_KEYS[i])) return true;
    }
    return false;
  })();

  if (!hasAnySave) {
    initNewGame();
  } else {
    // 有存档时仅创建最小占位 player，不执行完整的初始化（避免触发灵兽赠予等逻辑）
    player = DEFAULT_PLAYER();
    // 设置基础属性以免部分 UI 读取出错
    player.currentHP = 100;
    player.currentMP = 50;
    // 不调用 initNewGame() — 用户点击"继续游戏"或"开始游戏"时会覆盖
  }
}// ==================== 初始化新游戏 ====================
function initNewGame() {
  player = DEFAULT_PLAYER();

  // 1. 生成天赋
  player.talent = randomTalent();

  // 2. 生成体魄（有概率先天觉醒）
  player.physique = randomPhysique(true);

  // 3. 生成出身
  const origin = rollOrigin();
  player.origin = origin;
  player.ageMonths = origin.age[0] + Math.floor(Math.random() * (origin.age[1] - origin.age[0]));

  // 4. 生成命格
  player.fate = rollFateStats(origin);

  // 4.5. 生成灵根
  const rootNames = ['metal', 'wood', 'water', 'fire', 'earth'];
  let rootVals = rootNames.map(() => 5 + Math.floor(Math.random() * 30));
  const rootTotal = rootVals.reduce((a, b) => a + b, 0);
  if (rootTotal > 0) { const r = 100 / rootTotal; rootVals = rootVals.map(v => Math.max(1, Math.round(v * r))); }
  let rootDiff = 100 - rootVals.reduce((a, b) => a + b, 0);
  for (let i = 0; rootDiff > 0; i = (i + 1) % 5) { rootVals[i]++; rootDiff--; }
  player.spiritualRoots = { metal: rootVals[0], wood: rootVals[1], water: rootVals[2], fire: rootVals[3], earth: rootVals[4] };

  // 新手装备：木剑（防止前期打不过怪）
  player.equipment.weapon = { id: 'starter_sword', name: '木剑', type: 'weapon', stats: { atk: 5 }, desc: '新手木剑，勉强能用' };

  // 4.5. 出身初始伙伴
  const startAgeMonths = player.ageMonths;
  if (startAgeMonths >= 96 && startAgeMonths <= 180) {
    // 少年出身：赠送随机灵兽
    if (player.pets.length < 2) {
      const defaultName = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
      const effect = Math.random() < 0.5 ? { hpBonus: 20 } : { stoneBonus: 1.2 };
      // 直接用随机默认名，不弹窗（弹窗可能出现在启动封面之前）
      player.pets.push({
        name: defaultName,
        type: '灵兽',
        effect: effect,
        desc: '自幼相伴的灵兽',
        level: 1,
        exp: 0,
        maxExp: 30
      });
      addLog('🐣 少年时便与你相伴的灵兽【' + defaultName + '】随你踏上仙途！', 'special');
    }
  } else if (startAgeMonths >= 540 && startAgeMonths <= 660) {
    // 暮年出身：赠送随机道友
    const maxComp = player.physique?.effect?.companionMax ? 3 + player.physique.effect.companionMax : 3;
    if (player.companions.length < maxComp) {
      const comp = createCompanion(player.realmIndex);
      comp.desc = '暮年相伴的道友';
      comp.affection = 60;
      player.companions.push(comp);
      addLog('👥 暮年之际结交道友【' + comp.name + '】（' + REALMS[comp.realmIndex].name + '），愿同赴仙途。', 'special');
    }
  }

  // 5. 天赋初始奖励
  if (player.talent.effect.type === 'startStones') {
    player.spiritStones += player.talent.effect.val;
  }
  if (origin.bonus && origin.bonus.spiritStones) {
    player.spiritStones += origin.bonus.spiritStones;
  }

  // 6. 添加初始道具
  addToBag('回春丹', 'consumable', 1);

  // 7. 设置初始生命灵力
  const stats = getEffectiveStats();
  player.currentHP = stats.maxHP;
  player.currentMP = stats.maxMP;

  // 8. 添加初始日志
  addLog('🌟 天赋觉醒：【' + player.talent.level + '·' + player.talent.name + '】- ' + player.talent.desc, 'special');
  addLog('📖 ' + origin.descFn(rollLoc()), 'system');
  addLog('🗿 体魄：【' + player.physique.name + '】' + (player.physique.name !== '凡体' ? '——' + player.physique.desc : ''), 'system');
  addLog('🎭 出身：【' + origin.name + '】，命格：聪慧' + player.fate.intelligence + ' 体魄' + player.fate.physique + ' 气运' + player.fate.luck + ' 定力' + player.fate.focus, 'system');
  if (origin.passive) {
    addLog('🔰 出身被动【' + origin.passive.name + '】：' + origin.passive.desc, 'special');
  }
  addLog('⏳ 你今年' + formatAge(player.ageMonths) + '，凡人寿限60年，务必尽快突破延寿！', 'system');

  // 不在此处自动存档——由玩家点击"开始游戏"或手动存档按钮触发
  // saveGame() 由 doStartNewGame() 或用户手动点击"存"按钮调用
  requestUIUpdate();
}

// ==================== 导出函数（供后续部分使用） ====================
// 这些函数将被后续模块调用，目前先声明在全局作用域
// 注意：addLog, showModal, requestUIUpdate, handleDeath 等将在后续实现
// 但我们先声明占位，避免未定义错误

// 占位函数（后续会覆盖）
function addLog(msg, type) { console.log('[' + type + ']', msg); }
function showModal(title, bodyHTML) { alert(title + '\n' + bodyHTML); }
function requestUIUpdate() { /* 后续实现 */ }
function handleDeath(isOldAge) { /* 后续实现 */ }

/**
 * 体魄任务线觉醒检查
 * 战斗10胜 → 不灭剑体 | 嗑药30次 → 万毒不侵体 | 探索20次 → 九窍玲珑体
 * 仅当当前体魄为凡体时触发
 */
function checkBodyQuest(type) {
  if (!player) return;
  if (!player.physique || player.physique.name !== '凡体') return;

  let target = null;
  let msg = '';

  if (type === 'fight' && (player._fightWins || 0) >= 10) {
    target = '不灭剑体';
    msg = '🗡️ 连续战斗10胜！体魄觉醒【不灭剑体】！攻击+20%，战斗后回血5%';
  } else if (type === 'pill' && (player._pillUsed || 0) >= 30) {
    target = '万毒不侵体';
    msg = '💊 嗑药30次！体魄觉醒【万毒不侵体】！恢复+100%，免疫死亡惩罚';
  } else if (type === 'explore' && (player._exploreCount || 0) >= 20) {
    target = '九窍玲珑体';
    msg = '🔮 探索20次！体魄觉醒【九窍玲珑体】！奇遇概率x3，道友上限+2';
  }

  if (target) {
    const data = PHYSIQUE_TYPES[target];
    if (data) {
      player.physique = { name: target, ...data };
      addLog(msg, 'special');
      requestUIUpdate();
      saveGame();
    }
  }
}

/** 生成道友对象（含境界/年龄/寿限） */
function createCompanion(playerRealm, customName) {
  const realmIndex = Math.max(0, playerRealm - Math.floor(Math.random() * 3));
  const realm = REALMS[realmIndex];
  const maxAgeMonths = isFinite(realm.lifeMonths) ? Math.floor(realm.lifeMonths * (0.7 + Math.random() * 0.3)) : 99999;
  const ageMonths = Math.floor(maxAgeMonths * (0.15 + Math.random() * 0.25));
  // 名字生成：10%彩蛋 + 90%随机组合
  let name;
  if (customName) {
    name = customName;
  } else if (Math.random() < 0.1) {
    name = EASTER_EGG_NAMES[Math.floor(Math.random() * EASTER_EGG_NAMES.length)];
  } else {
    const s = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const n1 = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
    const n2 = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
    name = s + n1 + n2;
  }

  return {
    name: name,
    type: '道友',
    gender: ['男', '女'][Math.floor(Math.random() * 2)],
    effect: Math.random() < 0.5
      ? { cultivateBonus: +(1 + realmIndex * 0.05).toFixed(2) }
      : { combatAtk: 3 + realmIndex * 2 },
    desc: realm.name + '·随行道友',
    affection: 50,
    realmIndex: realmIndex,
    ageMonths: Math.floor(ageMonths),
    maxAgeMonths: Math.floor(maxAgeMonths)
  };
}

/** 图鉴系统记录 */
function trackCollection(category, name) {
  if (!player.collection) player.collection = { equipment: [], pets: [], materials: [], artifacts: [], consumables: [] };
  if (!player.collection[category]) player.collection[category] = [];
  if (!player.collection[category].includes(name)) {
    player.collection[category].push(name);
  }
}

/** 获取功法总加成 */
function getSkillBonus(type) {
  if (!player.skills || !SKILLS) return 0;
  let total = 0;
  player.skills.forEach(s => {
    const skill = SKILLS.find(sk => sk.id === s.id);
    if (skill && skill.type === type && skill.effect) {
      const lvl = s.level || 1;
      for (const key in skill.effect) {
        if (key === 'cultivateBoost' && type === 'cultivate') total += skill.effect[key] * lvl;
        else if (key === 'atkBoost' && type === 'combat') total += skill.effect[key] * lvl;
        else if (key === 'defBoost' && type === 'defense') total += skill.effect[key] * lvl;
        else if (key === 'exploreBoost' && type === 'explore') total += skill.effect[key] * lvl;
        else if (key === 'forgeBoost' && type === 'forge') total += skill.effect[key] * lvl;
        else if (key === 'alchemyBoost' && type === 'alchemy') total += skill.effect[key] * lvl;
      }
    }
  });
  return total;
}

console.log('✅ 玩家状态、存档/读档、初始化、工具函数已加载');

// ==================== 修为突破检测（补充缺失函数） ====================
/**
 * 检测玩家是否已达到突破条件，在获得修为后调用
 */
function checkBreakthrough() {
  const realm = getCurrentRealm();
  const expNeeded = getExpNeeded();
  if (player.exp >= expNeeded) {
    addLog('💡 修为已满，可以尝试突破！', 'system');
  }
}

