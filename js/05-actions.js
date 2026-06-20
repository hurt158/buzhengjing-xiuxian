// ================================================================
// 第 5 部分：行动系统（秘境 / 炼丹 / 炼器 / 商城 / 装备管理 / 背包）
// ================================================================

// ==================== 装备管理 ====================

/** 随机生成装备（按类型和稀有度） */
function randomEquipment(type) {
  const pool = EQUIPMENT_POOL[type];
  if (!pool) return null;

  // 稀有度权重
  const weights = { common: 50, uncommon: 28, rare: 14, epic: 6, legendary: 2 };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  let rarity = 'common';
  let cum = 0;
  for (const [r, w] of Object.entries(weights)) {
    cum += w;
    if (rand <= cum) { rarity = r; break; }
  }

  const candidates = pool.filter(e => e.rarity === rarity);
  if (candidates.length === 0) {
    // 若没有该稀有度，回退到common
    const fallback = pool.filter(e => e.rarity === 'common');
    return fallback.length ? { ...fallback[Math.floor(Math.random() * fallback.length)] } : null;
  }
  return { ...candidates[Math.floor(Math.random() * candidates.length)] };
}

/** 穿戴装备 */
function equipItem(itemName) {
  const idx = player.bag.findIndex(i =>
    i.name === itemName &&
    (i.type === 'weapon' || i.type === 'armor' || i.type === 'accessory')
  );
  if (idx === -1) {
    addLog('未找到该装备', 'danger');
    return;
  }

  const item = player.bag[idx];
  if (item.equipped) {
    addLog('该装备已穿戴', 'system');
    return;
  }

  const slot = item.type;
  // 卸下同槽位旧装备
  if (player.equipment[slot]) {
    const old = player.equipment[slot];
    const oldInBag = player.bag.find(i => i.id === old.id);
    if (oldInBag) oldInBag.equipped = false;
    addLog('卸下【' + old.name + '】', 'system');
  }

  // 穿戴新装备
  player.equipment[slot] = item;
  item.equipped = true;
  addLog('装备【' + item.name + '】', 'success');
  requestUIUpdate();
}

/** 强化装备 */
function enhanceEquipment(itemName) {
  const idx = player.bag.findIndex(i =>
    i.name === itemName &&
    (i.type === 'weapon' || i.type === 'armor' || i.type === 'accessory')
  );
  if (idx === -1) {
    addLog('未找到该装备', 'danger');
    return;
  }

  const item = player.bag[idx];
  if (!item.enhanceLevel) item.enhanceLevel = 0;
  if (item.enhanceLevel >= 10) {
    addLog('装备已达最高强化等级（+10）', 'system');
    return;
  }

  const cost = 50 * (item.enhanceLevel + 1);
  const matNeeded = Math.ceil((item.enhanceLevel + 1) / 2);
  if (player.spiritStones < cost || (player.enhanceMaterials['强化石'] || 0) < matNeeded) {
    addLog('强化需要 ' + cost + ' 灵石和 ' + matNeeded + ' 个强化石', 'danger');
    return;
  }

  player.spiritStones -= cost;
  player.enhanceMaterials['强化石'] -= matNeeded;

  const successRate = Math.max(0.3, 1 - item.enhanceLevel * 0.07);
  if (Math.random() < successRate) {
    item.enhanceLevel++;
    // 提升属性
    for (const key in item.stats) {
      if (key === 'all') {
        // 'all' 表示全属性+固定值，直接加成
        item.stats.all = Math.floor(item.stats.all * 1.08);
      } else if (typeof item.stats[key] === 'number') {
        item.stats[key] = Math.floor(item.stats[key] * 1.08);
      }
    }
    addLog('🔨 强化成功！【' + item.name + '】提升至 +' + item.enhanceLevel, 'success');
  } else {
    if (item.enhanceLevel > 0) {
      item.enhanceLevel--;
      addLog('💥 强化失败！【' + item.name + '】降级为 +' + item.enhanceLevel, 'danger');
    } else {
      addLog('💥 强化失败！装备未降级', 'danger');
    }
  }
  requestUIUpdate();
}

/** 洗练装备（重铸随机属性） */
function rerollEquipment(itemName) {
  const idx = player.bag.findIndex(i =>
    i.name === itemName &&
    (i.type === 'weapon' || i.type === 'armor' || i.type === 'accessory')
  );
  if (idx === -1) {
    addLog('未找到该装备', 'danger');
    return;
  }

  if ((player.enhanceMaterials['洗练符'] || 0) < 1) {
    addLog('需要 1 个洗练符', 'danger');
    return;
  }

  player.enhanceMaterials['洗练符']--;
  const item = player.bag[idx];

  // 重铸所有非'all'属性
  for (const key in item.stats) {
    if (key === 'all') continue;
    const base = key === 'atk' ? 5 : key === 'def' ? 3 : key === 'hp' ? 20 : key === 'mp' ? 15 : 5;
    item.stats[key] = Math.floor(base * (0.8 + Math.random() * 0.4));
  }
  addLog('✨ 洗练成功！【' + item.name + '】属性已变化', 'success');
  requestUIUpdate();
}

/** 显示装备管理界面 */
function showEquip() {
  let html = '<div style="max-height:350px;overflow-y:auto;">';
  ['weapon', 'armor', 'accessory'].forEach(slot => {
    const items = player.bag.filter(i => i.type === slot);
    if (items.length === 0) {
      html += '<p style="color:#666;">暂无' + (slot === 'weapon' ? '武器' : slot === 'armor' ? '防具' : '饰品') + '</p>';
      return;
    }
    html += '<h4 style="color:var(--gold);margin:8px 0 4px;">' +
      (slot === 'weapon' ? '🗡️ 武器' : slot === 'armor' ? '🛡️ 防具' : '💍 饰品') + '</h4>';
    items.forEach(item => {
      const enhance = item.enhanceLevel ? ' +' + item.enhanceLevel : '';
      const equipped = item.equipped ? ' ✅已装备' : '';
      // 属性显示
      let statsStr = '';
      if (item.stats) {
        const parts = [];
        for (const [k, v] of Object.entries(item.stats)) {
          if (k === 'all') { parts.push('全属性+' + v); }
          else if (k === 'atk') parts.push('攻+' + v);
          else if (k === 'def') parts.push('防+' + v);
          else if (k === 'hp') parts.push('命+' + v);
          else if (k === 'mp') parts.push('灵+' + v);
        }
        statsStr = parts.join(' ');
      }
      const rarityColor = item.rarity === 'legendary' ? '#e2b04a' : item.rarity === 'epic' ? '#9b59b6' : item.rarity === 'rare' ? '#3498db' : '#8899aa';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
      html += '<div><span style="color:' + rarityColor + ';">' + item.name + enhance + equipped + '</span><br><span style="font-size:0.6rem;color:#8899aa;">' + statsStr + '</span></div>';
      html += '<div style="display:flex;gap:4px;">';
      if (!item.equipped) {
        html += '<button class="quick-btn" onclick="equipItem(\'' + item.name + '\');showEquip();">装备</button>';
      }
      html += '<button class="quick-btn" onclick="enhanceEquipment(\'' + item.name + '\');showEquip();">强化</button>';
      html += '<button class="quick-btn" onclick="rerollEquipment(\'' + item.name + '\');showEquip();">洗练</button>';
      html += '</div></div>';
    });
  });
  html += '</div>';
  showModal('⚙️ 装备管理', html);
}

// ==================== 背包系统 ====================

/** 显示背包 */
function showBag() {
  if (player.bag.length === 0) {
    addLog('🎒 背包空空如也', 'system');
    return;
  }

  let html = '<div style="max-height:350px;overflow-y:auto;">';
  player.bag.forEach((item, idx) => {
    const count = item.count || 1;
    const rarityMap = { common: '普通', uncommon: '不凡', rare: '稀有', epic: '史诗', legendary: '传说' };
    const rarity = item.rarity ? ' (' + (rarityMap[item.rarity] || item.rarity) + ')' : '';
    const equipped = item.equipped ? ' [已装备]' : '';
    const enhance = item.enhanceLevel ? ' +' + item.enhanceLevel : '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
    html += '<span>' + item.name + rarity + enhance + equipped + ' ×' + count + '</span>';
    html += '<button class="quick-btn" style="color:var(--danger);" onclick="sellItem(' + idx + ');showBag();">出售</button>';
    html += '</div>';
  });
  html += '<button class="modal-btn" style="margin-top:10px;" onclick="sellAllItems();showBag();">🗑️ 批量出售全部</button>';
  html += '</div>';
  showModal('🎒 背包', html);
}

/** 出售单个物品（支持堆叠） */
function sellItem(idx) {
  const item = player.bag[idx];
  if (!item) return;

  // 计算价格
  let price = 20;
  if (item.rarity === 'legendary') price = 150;
  else if (item.rarity === 'epic') price = 80;
  else if (item.rarity === 'rare') price = 40;
  else if (item.rarity === 'uncommon') price = 25;
  else price = 15;

  if (item.count > 1) {
    // 只卖一个
    item.count--;
    player.spiritStones += price;
    addLog('卖出【' + item.name + '】×1，获得 ' + price + ' 灵石', 'reward');
  } else {
    player.bag.splice(idx, 1);
    player.spiritStones += price;
    addLog('卖出【' + item.name + '】，获得 ' + price + ' 灵石', 'reward');
  }
  requestUIUpdate();
}

/** 批量出售所有物品 */
function sellAllItems() {
  let total = 0;
  const toRemove = [];
  player.bag.forEach((item, idx) => {
    let price = 15;
    if (item.rarity === 'legendary') price = 150;
    else if (item.rarity === 'epic') price = 80;
    else if (item.rarity === 'rare') price = 40;
    else if (item.rarity === 'uncommon') price = 25;

    // 不能出售已装备物品
    if (item.equipped) return;

    const count = item.count || 1;
    total += price * count;
    toRemove.push(idx);
  });

  if (toRemove.length === 0) {
    addLog('没有可出售的物品（已装备物品不能出售）', 'system');
    return;
  }

  // 从后往前删除
  toRemove.sort((a, b) => b - a);
  for (const idx of toRemove) {
    player.bag.splice(idx, 1);
  }

  player.spiritStones += total;
  addLog('批量出售获得 ' + total + ' 灵石', 'reward');
  requestUIUpdate();
}

// ==================== 商城系统 ====================

/** 打开商城 */
function openShop() {
  let html = '<div style="max-height:350px;overflow-y:auto;">';
  SHOP_ITEMS.forEach(item => {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
    html += '<div><b>' + item.name + '</b><br><span style="color:#8899aa;">' + item.desc + ' | ' + item.price + '灵石</span></div>';
    html += '<button class="quick-btn" style="color:var(--gold);" onclick="buyItem(\'' + item.name + '\');openShop();">购买</button>';
    html += '</div>';
  });
  html += '</div>';
  showModal('🛒 仙家商城', html);
}

/** 购买商品 */
function buyItem(itemName) {
  const shopItem = SHOP_ITEMS.find(i => i.name === itemName);
  if (!shopItem) {
    addLog('无此商品', 'danger');
    return;
  }

  let price = shopItem.price;
  // 出身被动：富家少爷 - 商城价格九折
  if (hasOriginPassive('rich')) {
    price = ORIGIN_PASSIVE['富家少爷'].shopDiscount(price);
  }

  if (player.spiritStones < price) {
    addLog('灵石不足，需要 ' + price + ' 灵石', 'danger');
    return;
  }

  player.spiritStones -= price;

  // 执行购买动作
  switch (shopItem.action) {
    case 'heal': {
      const stats = getEffectiveStats();
      const heal = Math.floor(stats.maxHP * 0.3);
      player.currentHP = Math.min(stats.maxHP, player.currentHP + heal);
      addLog('服下回春丹，生命恢复 ' + heal, 'success');
      break;
    }
    case 'mp': {
      const stats = getEffectiveStats();
      const heal = Math.floor(stats.maxMP * 0.4);
      player.currentMP = Math.min(stats.maxMP, player.currentMP + heal);
      addLog('服下聚灵散，灵力恢复 ' + heal, 'success');
      break;
    }
    case 'exp': {
      player.exp += 200;
      addLog('饮下悟道茶，修为+200', 'success');
      checkBreakthrough();
      break;
    }
    case 'pill': {
      const possible = [];
      const realm = getCurrentRealm();
      if (realm.breakItem) possible.push(realm.breakItem);
      if (player.realmIndex < REALMS.length - 1 && REALMS[player.realmIndex + 1].breakItem) {
        possible.push(REALMS[player.realmIndex + 1].breakItem);
      }
      if (possible.length) {
        const pill = possible[Math.floor(Math.random() * possible.length)];
        addToBag(pill, 'consumable', 1);
        addLog('获得【' + pill + '】', 'reward');
      } else {
        addLog('暂无可用突破丹', 'system');
      }
      break;
    }
    case 'egg': {
      if (player.pets.length >= 2) {
        addLog('灵兽已满（上限2只）', 'danger');
        break;
      }
      const defaultName = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
      showPetNameModal(defaultName, function(finalName) {
        const pet = {
          name: finalName,
          type: '灵兽',
          effect: Math.random() < 0.5 ? { hpBonus: 20 } : { stoneBonus: 1.2 },
          desc: '护主灵兽',
          level: 1, exp: 0, maxExp: 30
        };
        player.pets.push(pet);
        addLog('🐣 孵化出灵兽【' + finalName + '】', 'success');
        addLifeEvent('获得灵兽【' + finalName + '】');
        requestUIUpdate();
      });
      break;
    }
    case 'scroll': {
      const maxComp = player.physique?.effect?.companionMax ? 3 + player.physique.effect.companionMax : 3;
      if (player.companions.length >= maxComp) {
        addLog('道友已满（上限' + maxComp + '人）', 'danger');
        break;
      }
      const comp = createCompanion(player.realmIndex);
      player.companions.push(comp);
      addLog('👥 招募到道友【' + comp.name + '】（' + REALMS[comp.realmIndex].name + '）', 'success');
      addLifeEvent('招募道友【' + comp.name + '】');
      break;
    }
    case 'lifePill': {
      player.ageMonths = Math.max(0, player.ageMonths - 60);
      addLog('服下延寿丹，寿元增加5年！', 'success');
      player._ageWarned = false; // 重置警告标记
      break;
    }
    case 'ageStop': {
      player.ageStopRemaining = (player.ageStopRemaining || 0) + 6;
      addLog('服下定龄丹，接下来6个月内年龄不会增长。', 'success');
      break;
    }
    case 'stone': {
      player.enhanceMaterials['强化石'] = (player.enhanceMaterials['强化石'] || 0) + 1;
      addLog('获得强化石×1', 'reward');
      break;
    }
    case 'reroll': {
      player.enhanceMaterials['洗练符'] = (player.enhanceMaterials['洗练符'] || 0) + 1;
      addLog('获得洗练符×1', 'reward');
      break;
    }
    case 'tribPill': {
      if ((player.pillStacks || 0) >= 3) {
        addLog('雷劫丹最多叠加3层！', 'danger');
        break;
      }
      player.pillStacks = (player.pillStacks || 0) + 1;
      addLog('服用雷劫丹！天劫减伤' + (player.pillStacks * 10) + '%（' + player.pillStacks + '/3层）', 'success');
      break;
    }
    default:
      addLog('未知商品', 'danger');
  }

  // 体魄任务：嗑药计数（仅限服用类丹药）
  const pillActions = ['heal', 'mp', 'exp', 'pill', 'lifePill', 'ageStop', 'tribPill'];
  if (pillActions.includes(shopItem.action)) {
    player._pillUsed = (player._pillUsed || 0) + 1;
    checkBodyQuest('pill');
  }

  requestUIUpdate();
}

// ==================== 道友与灵兽管理 ====================

/** 显示道友列表 */
function showCompanions() {
  if (player.companions.length === 0) {
    addLog('👥 暂无道友', 'system');
    return;
  }

  let html = '<div style="max-height:350px;overflow-y:auto;">';
  player.companions.forEach(c => {
    const aff = c.affection || 50;
    const affColor = aff >= 70 ? 'var(--success)' : (aff >= 40 ? 'var(--gold)' : 'var(--danger)');
    const realmName = c.realmIndex !== undefined ? REALMS[c.realmIndex]?.name || '未知' : '未知';
    const ageStr = c.ageMonths ? formatAge(c.ageMonths) : '?';
    const genderIcon = c.gender === '男' ? '♂️' : c.gender === '女' ? '♀️' : '⚧️';
    const isDao = c.isDaoCompanion;
    const daoBadge = isDao ? ' 💕道侣' : '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
    html += '<div><b>' + genderIcon + ' ' + c.name + '</b> (' + realmName + daoBadge + ')<br><span style="color:#8899aa;">好感：</span><span style="color:' + affColor + ';">' + aff + '</span> | <span style="color:#8899aa;">寿元：</span>' + ageStr + '</div>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
    html += '<button class="quick-btn" onclick="giveGiftPrompt(\'' + c.name + '\');">送礼</button>';
    if (!isDao && aff >= 80) {
      html += '<button class="quick-btn" style="color:#e74c8a;" onclick="makeDaoCompanion(\'' + c.name + '\');showCompanions();">💕结缘</button>';
    }
    html += '<button class="quick-btn" style="color:var(--danger);" onclick="breakWithCompanion(\'' + c.name + '\');showCompanions();">割袍</button>';
    html += '</div></div>';
  });
  html += '</div>';
  showModal('👥 道友列表', html);
}

/** 割袍断义 */
function breakWithCompanion(name) {
  const idx = player.companions.findIndex(c => c.name === name);
  if (idx === -1) {
    addLog('没有这位道友', 'danger');
    return;
  }
  const comp = player.companions[idx];
  player.companions.splice(idx, 1);
  addLog('你与道友【' + comp.name + '】割袍断义。', 'danger');
  requestUIUpdate();
}

/** 结为道侣 */
function makeDaoCompanion(name) {
  // 先解除现有道侣
  player.companions.forEach(c => { if (c.isDaoCompanion) c.isDaoCompanion = false; });
  const comp = player.companions.find(c => c.name === name);
  if (!comp) { addLog('找不到这位道友', 'danger'); return; }
  comp.isDaoCompanion = true;
  addLog('💕 你与【' + comp.name + '】结为道侣，共修大道！', 'special');
  addLifeEvent('与【' + comp.name + '】结为道侣');
  // 道侣专属加成
  if (comp.effect.cultivateBonus) comp.effect.cultivateBonus *= 1.2;
  if (comp.effect.combatAtk) comp.effect.combatAtk = Math.floor(comp.effect.combatAtk * 1.2);
  comp.affection = Math.min(100, (comp.affection || 50) + 20);
  saveGame();
  requestUIUpdate();
  // 触发道侣事件
  triggerDaoEvent(comp);
}

/** 道侣专属小事件 */
function triggerDaoEvent(comp) {
  const events = [
    '💕 ' + comp.name + '为你煮了一壶灵茶，修为少许提升。',
    '💕 你与' + comp.name + '并肩观星，顿悟天道，修为大增。',
    '💕 ' + comp.name + '帮你整理洞府，发现一本旧功法，获得了些灵感。',
    '💕 你与' + comp.name + '双修悟道，灵力交融。',
    '💕 ' + comp.name + '送你一枚亲手炼制的玉佩，灵气环绕。'
  ];
  const msg = events[Math.floor(Math.random() * events.length)];
  addLog(msg, 'special');
  player.exp += 50 + Math.floor(Math.random() * 50);
}

/** 送礼选择 */
function giveGiftPrompt(companionName) {
  const available = player.bag.filter(i => !i.equipped && i.type !== 'consumable' && i.type !== 'material');
  if (available.length === 0) {
    addLog('背包中没有可送的物品（装备/法器可送，丹药/材料不可送）', 'system');
    return;
  }

  let html = '<div style="max-height:300px;overflow-y:auto;"><p>选择送给【' + companionName + '】的礼物：</p>';
  available.forEach(item => {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
      const rarityMap = { common: '普通', uncommon: '不凡', rare: '稀有', epic: '史诗', legendary: '传说' };
    html += '<span>' + item.name + (item.rarity ? ' (' + (rarityMap[item.rarity] || item.rarity) + ')' : '') + '</span>';
    html += '<button class="quick-btn" onclick="giveGift(\'' + companionName + '\',\'' + item.name + '\');showCompanions();">赠送</button>';
    html += '</div>';
  });
  html += '</div>';
  showModal('🎁 选择礼物', html);
}

/** 执行送礼 */
function giveGift(companionName, itemName) {
  const comp = player.companions.find(c => c.name === companionName);
  if (!comp) {
    addLog('没有这位道友', 'danger');
    return;
  }

  const idx = player.bag.findIndex(i => i.name === itemName && !i.equipped);
  if (idx === -1) {
    addLog('背包中没有此物品', 'danger');
    return;
  }

  const item = player.bag[idx];
  let affectionGain = 10;
  if (item.rarity === 'uncommon') affectionGain = 15;
  else if (item.rarity === 'rare') affectionGain = 25;
  else if (item.rarity === 'epic') affectionGain = 40;
  else if (item.rarity === 'legendary') affectionGain = 60;

  comp.affection = Math.min(100, (comp.affection || 50) + affectionGain);
  addLog('你送给【' + comp.name + '】' + item.name + '，好感度提升至 ' + comp.affection, 'success');

  // 从背包移除（堆叠处理）
  if (item.count > 1) {
    item.count--;
  } else {
    player.bag.splice(idx, 1);
  }
  requestUIUpdate();
}

/** 显示灵兽列表 */
function showPets() {
  if (player.pets.length === 0) {
    showModal('🐾 灵兽巢穴', '<p style="text-align:center;color:#8899aa;font-size:0.75rem;">你还没有灵兽<br><br>可以在商城购买灵兽蛋孵化</p>');
    return;
  }

  let html = '<div style="max-height:350px;overflow-y:auto;">';
  player.pets.forEach(function(p) {
    var lvl = p.level || 1;
    var exp = p.exp || 0;
    var maxExp = p.maxExp || 30;
    var expPct = Math.floor(exp / maxExp * 100);
    var evoTag = p.evolved ? ' 🔥已进化' : (lvl >= 5 ? ' ⚡可进化' : '');
    html += '<div class="stat-card" style="margin-bottom:8px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<h3 style="margin:0;">' + p.name + evoTag + '</h3>';
    html += '<span style="font-size:0.65rem;color:#8899aa;">Lv.' + lvl + '/10</span>';
    html += '</div>';
    html += '<div style="font-size:0.65rem;color:#8899aa;">' + (p.desc || '') + '</div>';
    html += '<div class="progress-bar-bg" style="height:4px;margin:4px 0;"><div class="progress-bar-fill exp-fill" style="width:' + expPct + '%;height:100%;"></div></div>';
    html += '<div style="font-size:0.6rem;color:#8899aa;">经验 ' + exp + '/' + maxExp + '</div>';
    html += '<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">';
    html += '<button class="quick-btn" onclick="petFeed(\'' + p.name + '\');showPets();">🍖喂食</button>';
    html += '<button class="quick-btn" onclick="petPlay(\'' + p.name + '\');showPets();">🎾玩耍</button>';
    if (!p.evolved && lvl >= 5) {
      html += '<button class="quick-btn" style="color:#9b59b6;" onclick="petEvolve(\'' + p.name + '\');showPets();">⬆️进化</button>';
    }
    html += '<button class="quick-btn" style="color:var(--danger);" onclick="abandonPet(\'' + p.name + '\');showPets();">放生</button>';
    html += '</div></div>';
  });
  html += '</div>';
  showModal('🐾 灵兽巢穴', html);
}

/** 喂食灵兽 */
function petFeed(name) {
  var pet = player.pets.find(function(p) { return p.name === name; });
  if (!pet) return;
  var food = ['草药', '灵泉水', '灵屁花'];
  var has = food.filter(function(f) { return (player.materials[f] || 0) > 0; });
  if (has.length === 0) { addLog('没有可以喂食的材料（需要草药/灵泉水/灵屁花）', 'system'); return; }
  var used = has[Math.floor(Math.random() * has.length)];
  player.materials[used]--;
  var gain = 8 + Math.floor(Math.random() * 7);
  petGainExp(pet, gain);
  addLog('🍖 给【' + pet.name + '】喂了' + used + '，经验+' + gain, 'success');
  if (Math.random() < 0.2) triggerPetEvent(pet);
  saveGame();
}

/** 陪灵兽玩耍 */
function petPlay(name) {
  var pet = player.pets.find(function(p) { return p.name === name; });
  if (!pet) return;
  if (player.currentMP < 10) { addLog('灵力不足，玩不动', 'danger'); return; }
  player.currentMP -= 5;
  var gain = 5 + Math.floor(Math.random() * 6);
  petGainExp(pet, gain);
  addLog('🎾 陪【' + pet.name + '】玩了一会儿，经验+' + gain, 'success');
  if (Math.random() < 0.25) triggerPetEvent(pet);
  saveGame();
}

/** 灵兽进化 */
function petEvolve(name) {
  var pet = player.pets.find(function(p) { return p.name === name; });
  if (!pet) return;
  var lvl = pet.level || 1;
  if (lvl < 5) { addLog('需要5级才能进化', 'system'); return; }
  if (pet.evolved) { addLog('已经进化过了', 'system'); return; }
  pet.evolved = true;
  pet.level = Math.min(10, lvl + 1);
  if (pet.effect) {
    Object.keys(pet.effect).forEach(function(k) { pet.effect[k] = Math.floor(pet.effect[k] * 1.5); });
  }
  pet.desc = (pet.desc || '') + '·进化体';
  addLog('🌟 ' + pet.name + '进化了！实力大幅提升！', 'reward');
  addLifeEvent('灵兽【' + pet.name + '】进化');
  saveGame();
}

const PET_EVENTS = [
  { msg: '🐾 $在土里刨出一颗灵石叼到你面前', good: true, action: function(p) { p.spiritStones += 20; } },
  { msg: '🌿 $找到一株野生草药吃了，经验大涨', good: true, action: function(p) { var pet = p.pets[Math.floor(Math.random() * p.pets.length)]; if (pet) petGainExp(pet, 10); } },
  { msg: '💩 $在你头上拉了一泡……你忍了', good: false, action: function(p) { p.innerDemon = (p.innerDemon || 0) + 3; } },
  { msg: '🔮 $对着月亮嚎叫引来灵气，修为微涨', good: true, action: function(p) { p.exp += 15; } },
  { msg: '🕳️ $在院子里刨坑把你种的灵草刨了', good: false, action: function(p) { addLog('灵田受损', 'danger'); } }
];

function triggerPetEvent(pet) {
  if (!pet) return;
  var ev = PET_EVENTS[Math.floor(Math.random() * PET_EVENTS.length)];
  addLog(ev.msg.replace('$', pet.name), ev.good ? 'reward' : 'danger');
  if (ev.action) ev.action(player);
  requestUIUpdate();
  saveGame();
}

/** 放生灵兽 */
function abandonPet(name) {
  const idx = player.pets.findIndex(p => p.name === name);
  if (idx === -1) {
    addLog('没有这只灵兽', 'danger');
    return;
  }
  const pet = player.pets[idx];
  player.pets.splice(idx, 1);
  addLog('你遗弃了灵兽【' + pet.name + '】', 'system');
  requestUIUpdate();
}

/** 灵兽获得经验（升级） */
function petGainExp(pet, amount) {
  if (!pet.level) pet.level = 1;
  if (!pet.exp) pet.exp = 0;
  if (!pet.maxExp) pet.maxExp = 30;

  // 出身被动：救狐得果 - 灵兽经验翻倍
  let finalAmount = amount;
  if (hasOriginPassive('fox')) {
    finalAmount = ORIGIN_PASSIVE['救狐得果'].petExpBonus(amount);
  }
  pet.exp += finalAmount;
  while (pet.exp >= pet.maxExp && pet.level < 10) {
    pet.exp -= pet.maxExp;
    pet.level++;
    pet.maxExp = 30 + (pet.level - 1) * 20;
    addLog('🌟 灵兽【' + pet.name + '】升级至 ' + pet.level + ' 级！效果提升。', 'success');
  }
  requestUIUpdate();
}

// ==================== 秘境副本 ====================

/** 打开秘境菜单 */
function openDungeonMenu() {
  let html = '<div style="max-height:300px;overflow-y:auto;">';
  DUNGEONS.forEach(d => {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
    html += '<div><b>' + d.name + '</b> (' + d.floors + '层) | 门票：' + d.entryCost + '灵石<br><span style="color:#8899aa;">掉落：' + d.rewards.join('、') + '，BOSS掉落：' + d.bossItem + '</span></div>';
    html += '<button class="quick-btn" onclick="enterDungeon(\'' + d.name + '\');closeModal();">进入</button>';
    html += '</div>';
  });
  html += '</div>';
  showModal('🏰 秘境副本', html);
}

/** 进入秘境 */
function enterDungeon(dungeonName) {
  const dungeon = DUNGEONS.find(d => d.name === dungeonName);
  if (!dungeon) {
    addLog('无此秘境', 'danger');
    return;
  }

  if (player.spiritStones < dungeon.entryCost) {
    addLog('灵石不足，需要 ' + dungeon.entryCost + ' 灵石', 'danger');
    return;
  }
  if (player.currentHP < 30) {
    addLog('生命过低，不宜冒险', 'danger');
    return;
  }

  player.spiritStones -= dungeon.entryCost;
  player.currentDungeon = {
    ...dungeon,
    currentFloor: 1
  };
  addLog('🏰 进入秘境【' + dungeon.name + '】，共 ' + dungeon.floors + ' 层。', 'special');
  exploreDungeonFloor();
}

/** 探索秘境一层 */
function exploreDungeonFloor() {
  const d = player.currentDungeon;
  if (!d) return;

  const floor = d.currentFloor;
  const enemyLvl = player.realmIndex + floor;
  const eAtk = 10 + enemyLvl * 25;
  const eDef = 5 + enemyLvl * 15;
  let eHP = 50 + enemyLvl * 80;
  const eName = ['地底妖物', '熔岩兽', '战场亡魂', '石魔', '暗影灵'][Math.floor(Math.random() * 5)] + '(秘境' + floor + '层)';

  addLog('⚔️ ' + floor + '层遭遇【' + eName + '】！', 'combat');

  const stats = getEffectiveStats();
  const compBonus = getCompanionPetBonus();
  const skillAtkBonus = getSkillBonus('combat');
  const skillDefBonus = getSkillBonus('defense');
  let sectAtkBonus = 0;
  if (player.sect) {
    const sect = SECTS.find(s => s.id === player.sect);
    if (sect && sect.bonuses.combat) {
      sectAtkBonus = Math.floor((stats.atk + compBonus.atk) * (sect.bonuses.combat - 1));
    }
  }
  const combatAtk = stats.atk + compBonus.atk + skillAtkBonus + sectAtkBonus;
  const combatDef = stats.def + compBonus.def + skillDefBonus;
  let pDmgTotal = 0;
  let eDmgTotal = 0;
  let rounds = 0;

  while (eHP > 0 && player.currentHP > 0 && rounds < 5) {
    rounds++;
    const pDmg = Math.max(Math.floor(combatAtk * 0.05), combatAtk - eDef + Math.floor(Math.random() * 10));
    eHP -= pDmg;
    pDmgTotal += pDmg;

    if (eHP > 0) {
      const eDmg = Math.max(1, eAtk - combatDef + Math.floor(Math.random() * 8));
      player.currentHP -= eDmg;
      eDmgTotal += eDmg;
    }
  }

  if (eHP <= 0 && player.currentHP > 0) {
    // 本层胜利
    addLog('🏆 击败守卫！', 'success');

    // 随机奖励
    if (Math.random() < 0.4) {
      const reward = d.rewards[Math.floor(Math.random() * d.rewards.length)];
      if (reward === '强化石' || reward === '洗练符') {
        player.enhanceMaterials[reward] = (player.enhanceMaterials[reward] || 0) + 1;
        addLog('获得【' + reward + '】×1', 'reward');
      } else if (reward === '随机突破丹') {
        const possible = REALMS.filter(r => r.breakItem).map(r => r.breakItem);
        if (possible.length) {
          const pill = possible[Math.floor(Math.random() * possible.length)];
          addToBag(pill, 'consumable', 1);
          addLog('获得【' + pill + '】', 'reward');
        }
      } else {
        // 灵兽蛋或延寿丹
        const shopItem = SHOP_ITEMS.find(i => i.name === reward);
        if (shopItem) {
          // 直接执行购买动作（但不需要灵石）
          // 简便处理：直接调用对应逻辑
          switch (shopItem.action) {
            case 'egg':
              if (player.pets.length < 2) {
                const defaultName = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
                showPetNameModal(defaultName, function(finalName) {
                  const pet = {
                    name: finalName,
                    type: '灵兽',
                    effect: Math.random() < 0.5 ? { hpBonus: 20 } : { stoneBonus: 1.2 },
                    desc: '秘境灵兽',
                    level: 1, exp: 0, maxExp: 30
                  };
                  player.pets.push(pet);
                  addLog('获得灵兽【' + finalName + '】', 'reward');
                  addLifeEvent('获得灵兽【' + finalName + '】');
                  requestUIUpdate();
                });
              } else {
                addLog('灵兽已满，获得' + reward + '但无法孵化', 'system');
              }
              break;
            case 'lifePill':
              player.ageMonths = Math.max(0, player.ageMonths - 60);
              addLog('获得延寿丹，寿元+5年！', 'reward');
              break;
            default:
              addLog('获得【' + reward + '】', 'reward');
          }
        }
      }
    }

    // 检查是否通关
    if (floor === d.floors) {
      // BOSS战
      addLog('🐉 最终BOSS出现！', 'combat');
      let bossHP = eHP * 2;
      const bossAtk = eAtk * 1.5;
      let bossRounds = 0;
      while (bossHP > 0 && player.currentHP > 0 && bossRounds < 5) {
        bossRounds++;
        const pDmg = Math.max(1, stats.atk - eDef + Math.floor(Math.random() * 10));
        bossHP -= pDmg;
        if (bossHP > 0) {
          const eDmg = Math.max(1, bossAtk - stats.def + Math.floor(Math.random() * 8));
          player.currentHP -= eDmg;
        }
      }

      if (bossHP <= 0 && player.currentHP > 0) {
        addLog('🎉 秘境【' + d.name + '】通关！', 'success');
        if (d.bossItem) {
          addToBag(d.bossItem, 'consumable', 1);
          addLog('获得最终奖励【' + d.bossItem + '】！', 'reward');
        }
        // 额外奖励
        const bonusStones = 50 + Math.floor(Math.random() * 100);
        player.spiritStones += bonusStones;
        addLog('额外获得 ' + bonusStones + ' 灵石', 'reward');
      } else {
        addLog('💀 被BOSS击败，秘境探索终止。', 'danger');
        if (player.currentHP <= 0) {
          handleDeath(false);
        }
      }
      player.currentDungeon = null;
    } else {
      // 进入下一层
      d.currentFloor++;
      player.currentDungeon = d;
      addLog('前往第 ' + d.currentFloor + ' 层...', 'system');
      // 递归调用（但用setTimeout避免阻塞）
      setTimeout(() => exploreDungeonFloor(), 300);
    }
  } else if (player.currentHP <= 0) {
    addLog('💀 在秘境中战败。', 'danger');
    handleDeath(false);
    player.currentDungeon = null;
  } else {
    addLog('敌人逃走，当前层未通过。', 'danger');
    player.currentDungeon = null;
  }

  addMonths(1);
  requestUIUpdate();
}

// ==================== 炼丹系统 ====================

/** 打开炼丹界面 */
function openAlchemy() {
  let html = '<div style="font-size:0.65rem;color:#8899aa;margin-bottom:8px;">🔧 熟练度：' + (player.alchemySkill || 0) + '（成功率+' + Math.min(50, (player.alchemySkill || 0) * 0.5) + '%）</div>';
  html += '<div style="max-height:300px;overflow-y:auto;">';
  ALCHEMY_RECIPES.forEach(r => {
    const matsStr = Object.entries(r.materials).map(([k, v]) => k + '×' + v).join('，');
    const canCraft = Object.entries(r.materials).every(([k, v]) => (player.materials[k] || 0) >= v);
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
    html += '<div><b>' + r.name + '</b> (' + (r.successRate * 100) + '%成功率)<br><span style="color:#8899aa;">材料：' + matsStr + '</span></div>';
    html += '<button class="quick-btn" style="' + (canCraft ? 'color:var(--gold);' : 'color:#555;') + '" onclick="alchemy(\'' + r.name + '\');openAlchemy();"' + (canCraft ? '' : ' disabled') + '>炼制</button>';
    html += '</div>';
  });
  html += '</div><p style="font-size:0.65rem;color:#8899aa;margin-top:8px;">材料可通过探索获得。</p>';
  showModal('🧪 炼丹炉', html);
}

/** 执行炼丹 */
function alchemy(recipeName) {
  const recipe = ALCHEMY_RECIPES.find(r => r.name === recipeName);
  if (!recipe) {
    addLog('无此丹方', 'danger');
    return;
  }

  // 检查材料
  for (const [mat, count] of Object.entries(recipe.materials)) {
    if ((player.materials[mat] || 0) < count) {
      addLog('材料不足：需要 ' + mat + '×' + count, 'danger');
      return;
    }
  }

  // 消耗材料
  for (const [mat, count] of Object.entries(recipe.materials)) {
    player.materials[mat] -= count;
  }

  // 万象道体：炼丹成功率加成
  let successRate = recipe.successRate;
  if (player.physique?.effect?.forgeBoost) {
    successRate += player.physique.effect.forgeBoost;
  }
  // 熟练度加成（每级+0.5%，最高+50%）
  const skillBonus = Math.min(0.5, (player.alchemySkill || 0) * 0.005);
  successRate += skillBonus;
  // 功法加成
  successRate += getSkillBonus('alchemy');
  // 宗门加成（丹霞谷）
  if (player.sect) {
    const sect = SECTS.find(s => s.id === player.sect);
    if (sect && sect.bonuses.alchemy) successRate += sect.bonuses.alchemy;
  }
  successRate = Math.min(1, successRate);

  const isSuccess = Math.random() < successRate;
  if (isSuccess) {
    addToBag(recipe.result, 'consumable', 1);
    player.alchemySkill = (player.alchemySkill || 0) + 1;
    addLog('🧪 炼丹成功！获得【' + recipe.result + '】（熟练度' + player.alchemySkill + '）', 'success');
  } else {
    player.alchemySkill = (player.alchemySkill || 0) + 1;
    addLog('💥 炼丹失败，材料化为灰烬。（熟练度' + player.alchemySkill + '）', 'danger');
  }
  requestUIUpdate();
}

// ==================== 不正经炼器系统 ====================

/** 打开炼器界面 */
function openForge() {
  // 熟练度显示
  addLog('🔧 炼器熟练度：' + (player.forgeSkill || 0) + '（成功率+' + Math.min(30, (player.forgeSkill || 0) * 0.3) + '%）', 'system');

  // 收集所有可用材料
  const allMats = [];
  // 普通材料
  for (const [name, count] of Object.entries(player.materials)) {
    if (count > 0) allMats.push({ name, count, type: 'normal' });
  }
  // 强化石
  if (player.enhanceMaterials['强化石'] > 0) {
    allMats.push({ name: '强化石', count: player.enhanceMaterials['强化石'], type: 'normal' });
  }
  // 不正经材料
  for (const [name, count] of Object.entries(player.unorthodoxMaterials)) {
    if (count > 0) {
      const mat = UNORTHODOX_MATERIALS[name];
      allMats.push({ name, count, type: 'unorthodox', truth: mat ? mat.truth : '' });
    }
  }

  if (allMats.length === 0) {
    addLog('没有任何材料可以炼器。', 'danger');
    return;
  }

  let html = '<div style="max-height:350px;overflow-y:auto;">';
  html += '<p style="margin-bottom:8px;">选择3种材料投入炼器炉（每种至少1个，可不选满）：</p>';
  html += '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">';
  for (let i = 1; i <= 3; i++) {
    html += '<select id="forgeMat' + i + '" style="flex:1;min-width:80px;background:#0a0f16;color:#e0e0e0;border:1px solid var(--border);padding:4px;border-radius:6px;font-family:inherit;font-size:0.7rem;">';
    html += '<option value="">--选材料--</option>';
    allMats.forEach(m => {
      const label = m.type === 'unorthodox' ? '🔮' + m.name + ' (' + m.count + ')' : m.name + ' (' + m.count + ')';
      html += '<option value="' + m.name + '">' + label + '</option>';
    });
    html += '</select>';
  }
  html += '</div>';

  html += '<p style="font-size:0.7rem;">可选灵石供奉：<input id="forgeStones" type="number" value="0" min="0" max="' + player.spiritStones + '" style="width:60px;background:#0a0f16;color:#e0e0e0;border:1px solid var(--border);padding:2px;border-radius:4px;"> 灵石（提高品质）</p>';
  html += '<p style="font-size:0.6rem;color:#8899aa;">天时：' + (player.currentDaytime === 'day' ? '☀️白昼' : '🌙黑夜') + ' | 季节：' + seasonName(player.currentSeason) + ' | 心魔：' + player.innerDemon + '</p>';
  html += '<p style="font-size:0.6rem;color:#d4a574;">越正经材料出正经，越不正经材料越离谱——你自己看！</p>';
  html += '<button class="modal-btn" onclick="forgeArtifact();">🔥 开始炼器</button>';
  html += '</div>';
  showModal('⚒️ 不正经炼器炉', html);
}

/** 执行炼器 */
function forgeArtifact() {
  const mat1 = document.getElementById('forgeMat1')?.value || '';
  const mat2 = document.getElementById('forgeMat2')?.value || '';
  const mat3 = document.getElementById('forgeMat3')?.value || '';
  const stonesInput = parseInt(document.getElementById('forgeStones')?.value || '0');

  const selected = [mat1, mat2, mat3].filter(Boolean);
  if (selected.length === 0) {
    addLog('至少选择一种材料！', 'danger');
    return;
  }

  // 消耗材料
  let unorthCount = 0;
  selected.forEach(name => {
    if (UNORTHODOX_MATERIALS[name]) {
      player.unorthodoxMaterials[name] = (player.unorthodoxMaterials[name] || 0) - 1;
      if (player.unorthodoxMaterials[name] <= 0) delete player.unorthodoxMaterials[name];
      unorthCount++;
    } else if (name === '强化石') {
      player.enhanceMaterials['强化石']--;
    } else {
      player.materials[name]--;
    }
  });

  // 消耗灵石（用于提升品质）
  let stonesUsed = Math.min(stonesInput, player.spiritStones);
  player.spiritStones -= stonesUsed;

  closeModal();

  // 判定异象类型
  let visionType = 'mixed';
  if (unorthCount === 0) visionType = 'pure';
  else if (unorthCount === 1) visionType = 'mixed';
  else visionType = 'chaos';

  const visions = FORGE_VISIONS[visionType];
  const vision = visions[Math.floor(Math.random() * visions.length)];
  addLog(vision, 'special');

  // 决定法器品质
  const forgeSuccessRate = unorthCount === 0 ? 0.6 : unorthCount === 1 ? 0.3 : 0.1;
  // 炼器熟练度加成（每级+0.3%，最高+30%）
  const forgeSkillBonus = Math.min(0.3, (player.forgeSkill || 0) * 0.003);
  const forgeSkillBonus2 = getSkillBonus('forge');
  addLog('🎯 当前炼器成功率约 ' + Math.floor((forgeSuccessRate + forgeSkillBonus + forgeSkillBonus2) * 100) + '%（含熟练度' + Math.floor(forgeSkillBonus * 100) + '%加成）', 'system');
  let artifact = null;
  const isPure = Math.random() < (forgeSuccessRate + forgeSkillBonus + forgeSkillBonus2);

  if (isPure) {
    // 纯正炼器 → 从稀有/史诗中选
    player.forgeSkill = (player.forgeSkill || 0) + 2;
    const pureArtifacts = UNORTHODOX_ARTIFACTS.filter(a => a.rarity === 'rare' || a.rarity === 'epic');
    artifact = pureArtifacts[Math.floor(Math.random() * pureArtifacts.length)];
    addLog('⚒️ 炼器成功！获得法器：【' + artifact.name + '】（熟练度' + player.forgeSkill + '）', 'reward');
    addLog('说明：' + artifact.effectDesc, 'system');
  } else {
    // 不正经炼器 → 从全部中随机
    player.forgeSkill = (player.forgeSkill || 0) + 1;
    artifact = UNORTHODOX_ARTIFACTS[Math.floor(Math.random() * UNORTHODOX_ARTIFACTS.length)];
    // 如果供奉灵石较多，提升品质
    if (stonesUsed >= 50 && Math.random() < 0.6) {
      const epic = UNORTHODOX_ARTIFACTS.filter(a => a.rarity === 'epic');
      if (epic.length > 0) artifact = epic[Math.floor(Math.random() * epic.length)];
    }
    addLog('⚒️ 炼器完成！获得法器：【' + artifact.name + '】！', 'reward');
    addLog('看上去——' + (artifact.rarity === 'epic' ? '光芒万丈' : artifact.rarity === 'rare' ? '颇有灵性' : '品相一般') + '。', 'system');
    addLog('用法：' + artifact.effectDesc, 'system');
  }

  // 装备法器（替换旧法器）
  if (player.equipment.artifact) {
    addLog('原先的法器【' + player.equipment.artifact.name + '】被替换。', 'system');
  }
  player.equipment.artifact = artifact;

  // 检查成就
  checkAchievements();
  requestUIUpdate();
}

// ==================== 法器特效触发 ====================

/** 触发法器特效（在各类行动中调用） */
function triggerArtifactEffect(context) {
  const art = player.equipment.artifact;
  if (!art) return;

  const stats = getEffectiveStats();

  // 九品莲台卡住debuff
  if (player.lotusDebuff > 0 && context !== 'cultivate') {
    addLog('⏳ 莲台卡住的裆还没缓过来……', 'system');
    player.lotusDebuff--;
  }

  switch (art.effectName) {
    case 'renhuangqi':
      if (context === 'fight' && Math.random() < art.effectRate) {
        const dmg = 20 + player.realmIndex * 5;
        addLog('🚩 祭出人皇旗！万千魂魄齐声逼问，敌人道心崩溃！额外造成' + dmg + '伤害！', 'combat');
        player.spiritStones += 10;
        addLog('（魂们偷偷塞了些灵石谢你放风）', 'system');
      }
      break;
    case 'jiulonghuagai':
      if (context === 'fight' && Math.random() < art.effectRate) {
        addLog('🏮 你撑开九龙华盖——三条龙说困了，啪嗒盖下来……本场防御效果减半。', 'danger');
        // 临时减防效果由战斗系统处理（此处仅提示）
      }
      break;
    case 'jiupinliantai':
      if (context === 'cultivate') {
        player.exp += Math.floor(player.exp * 0.05);
        if (Math.random() < art.effectRate && player.lotusDebuff <= 0) {
          player.lotusDebuff = 3;
          addLog('🪷 你从莲台起身时卡住了！裤腰带松了——接下来3次非修炼行动效率降低。', 'danger');
        }
      }
      break;
    case 'yuqingfuchen':
      if (context === 'fight' && Math.random() < art.effectRate) {
        addLog('🧹 你甩出拂尘！咒语忘了，缠脸上了……啥也没发生。', 'system');
      }
      break;
    case 'qibaomiaoshu':
      if (context === 'explore' && Math.random() < art.effectRate) {
        player.currentHP = Math.max(1, player.currentHP - 5);
        player.spiritStones += 10;
        addLog('📿 摇七宝妙树——烂桃砸头！但你发现桃子底下压着10灵石。', 'reward');
      }
      break;
    case 'xuemopifeng':
      if (context === 'fight') {
        const extDmg = 8 + player.realmIndex * 3;
        player.currentHP = Math.max(1, player.currentHP - extDmg);
        addLog('🩸 血魔披风太扎眼，敌人集火！额外受' + extDmg + '伤害。', 'danger');
      }
      break;
    case 'jiuyoudeng':
      if (context === 'fight') {
        player.ageMonths = Math.floor(player.ageMonths + 6);
        addLog('🕯️ 九幽灯幽幽燃了一瞬……你感觉寿命悄悄溜走（-6月）。剩余：' + formatAge(getMaxLifeMonths() - player.ageMonths), 'danger');
      }
      break;
    case 'fuxiansuo':
      if (context === 'fight' && Math.random() < art.effectRate) {
        addLog('⛓️ 缚仙索捆住敌人！但它顺手打了个蝴蝶结……也把自己绕进去了——无事发生。', 'system');
      }
      break;
    case 'zuixianhulu':
      if (context === 'fight' && Math.random() < art.effectRate) {
        const bonus = 15 + Math.floor(Math.random() * 20);
        player.spiritStones += bonus;
        addLog('🍶 你灌了一口醉仙葫芦——敌人闻香倒地。摸走灵石+' + bonus, 'reward');
      }
      break;
    case 'qiankunxiu':
      if (context === 'explore') {
        if (Math.random() < 0.1) {
          player.spiritStones += 15;
          addLog('📦 乾坤袖里摸出了15灵石！运气不错。', 'reward');
        } else if (Math.random() < 0.2) {
          addLog('📦 乾坤袖里摸出半个馒头——上次塞的。', 'system');
        }
      }
      break;
    case 'wudeshan':
      if (context === 'fight' && Math.random() < art.effectRate) {
        const dmg = 10 + Math.floor(Math.random() * 10);
        addLog('🐔 你挥动羽扇——漫天鸡毛！敌人喷嚏连连，额外受' + dmg + '伤害！', 'combat');
      }
      break;
    case 'zhaoyaojing':
      if (context === 'fight' && Math.random() < art.effectRate) {
        const b = 10 + Math.floor(Math.random() * 15);
        player.spiritStones += b;
        addLog('🏮 照妖镜一闪——敌人被自己丑哭了，羞愧赔了' + b + '灵石。', 'reward');
      }
      break;
    case 'wuguiyuncaifu':
      if (!art._used) {
        art._used = true;
        addLog('🧧 五鬼运财符燃尽！扛来一箱冥币——阳间花不出去。但你感觉很富有。', 'special');
        // 消耗法器
        const idx = player.bag.findIndex(i => i.id === art.id);
        if (idx !== -1) player.bag.splice(idx, 1);
        if (player.equipment.artifact === art) player.equipment.artifact = null;
      }
      break;
    case 'bigudanlu':
      if (context === 'explore') {
        const heal = 12 + Math.floor(Math.random() * 8);
        player.currentHP = Math.min(stats.maxHP, player.currentHP + heal);
        addLog('🥟 辟谷丹炉滚出一颗热乎丹药……包子味？回血+' + heal, 'success');
      }
      break;
    case 'chuanxunlinghe':
      if (context === 'explore' && Math.random() < art.effectRate) {
        addLog('🪶 传讯灵鹤飞回来——带回一条过期消息："三日前，道友问你吃不吃席"。', 'system');
      }
      break;
    case 'qianmianmianju':
      if (context === 'explore' && Math.random() < art.effectRate) {
        const d = 8 + Math.floor(Math.random() * 12);
        player.currentHP = Math.max(1, player.currentHP - d);
        addLog('🎭 千面面具变成了你得罪过的人——被追着砍！受' + d + '伤害。', 'danger');
      }
      break;
    case 'xixingpan':
      if (context === 'fight') {
        const bonus = Math.floor(Math.random() * 20 + 10);
        player.spiritStones += bonus;
        addLog('🧲 吸星盘一吸，灵石+' + bonus, 'reward');
        if (Math.random() < art.effectRate && player.equipment.weapon) {
          addLog('⚡ 吸星盘把你的武器也吸走了！快去赎——暂扣攻击加成。', 'danger');
          // 简单处理：暂时移除武器攻击加成（由战斗系统处理）
        }
      }
      break;
    case 'zhenhunling':
      if (context === 'cultivate') {
        player.exp += Math.floor(player.exp * 0.03);
      }
      if (context === 'fight') {
        addLog('🎐 镇魂铃耳鸣发作，攻击-3（本场）。', 'system');
      }
      break;
    default:
      break;
  }
  requestUIUpdate();
}

/** 显示灵兽取名模态框 */
function showPetNameModal(defaultName, callback) {
  const html = `
    <p style="margin-bottom:10px;">🎉 获得一只灵兽！给它取个名字吧：</p>
    <input type="text" id="petNameInput" value="${defaultName}" maxlength="12" style="width:100%;padding:8px 12px;background:#0a0f16;color:#e0e0e0;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:0.9rem;margin-bottom:12px;">
    <div style="display:flex;gap:8px;justify-content:center;">
      <button class="modal-btn" onclick="confirmPetName()" style="margin:0;">确认</button>
      <button class="modal-btn" onclick="confirmPetNameDefault()" style="margin:0;background:#333;">使用默认</button>
    </div>
    <p style="font-size:0.6rem;color:#8899aa;text-align:center;margin-top:6px;">不输入则使用默认名字</p>
  `;
  showModal('🐾 灵兽取名', html);
  setTimeout(() => {
    const input = document.getElementById('petNameInput');
    if (input) { input.focus(); input.select(); }
  }, 100);
  window._petNameCallback = callback;
  window._petNameDefault = defaultName;
}

/** 确认灵兽名字（由模态框按钮调用） */
function confirmPetName() {
  const input = document.getElementById('petNameInput');
  const name = input ? input.value.trim() : '';
  const finalName = name || window._petNameDefault || '无名灵兽';
  if (window._petNameCallback) {
    window._petNameCallback(finalName);
    window._petNameCallback = null;
  }
  closeModal();
}

/** 使用默认名字（忽略输入框内容） */
function confirmPetNameDefault() {
  const finalName = window._petNameDefault || '无名灵兽';
  if (window._petNameCallback) {
    window._petNameCallback(finalName);
    window._petNameCallback = null;
  }
  closeModal();
}

console.log('✅ 行动系统（秘境/炼丹/炼器/商城/装备/背包）已加载');
