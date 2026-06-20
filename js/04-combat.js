// ================================================================
// 第 4 部分：核心战斗 / 天劫 / 心魔引擎
// ================================================================

// ==================== 战斗系统 ====================

/** 全局战斗状态 */
let fightingCompanion = null;  // 当前助战道友

/**
 * 核心战斗函数
 * 流程：选择道友助战 → 生成敌人 → 三回合战斗 → 结算
 */
async function fight() {
  // 0. 战斗策略选择（在最前面，优先于所有检查）
  if (!player._battleSkill) {
    showFightSkillModal();
    return;
  }

  // 前置检查
  if (player._fightInProgress) {
    addLog('⏳ 战斗进行中，请稍候...', 'system');
    return;
  }
  if (player.combatCooldown > 0) {
    addLog('⏳ 需要稍作休息（冷却' + player.combatCooldown + '回合）', 'system');
    return;
  }
  if (player.currentHP < 30) {
    addLog('💀 生命过低，无法战斗', 'danger');
    return;
  }
  if (player.pendingEvent) {
    addLog('请先处理当前事件！', 'danger');
    return;
  }

  // 如果有道友且未选择助战，弹出选择界面
  if (player.companions.length > 0 && !player._fightCompanionChosen) {
    chooseFightCompanion();
    return;
  }

  // 重置选择标记
  player._fightCompanionChosen = false;
  player._fightInProgress = true;

  // 生成敌人
  const enemyLvl = player.realmIndex + Math.floor(Math.random() * 3);
  const enemyNames = ['妖兽', '邪修', '魔物', '噬灵虫', '山魈', '怨魂'];
  const eName = enemyNames[Math.floor(Math.random() * enemyNames.length)] + '(Lv.' + enemyLvl + ')';

  const eAtk = 8 + enemyLvl * 20 + Math.floor(Math.random() * 15);
  const eDef = 4 + enemyLvl * 12 + Math.floor(Math.random() * 10);
  let eHP = 30 + enemyLvl * 60 + Math.floor(Math.random() * 40);

  addLog('⚔️ 遭遇【' + eName + '】！', 'combat');
  // 关闭覆盖层的函数（默认空操作）
  window._closeFightOverlay = function() {};
  // 创建战斗覆盖层（手动模式不用覆盖层，用回合选择弹窗）
  if (player.battleMode !== 'manual') {
  let overlay = document.getElementById('fightOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'fightOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:300;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  overlay.innerHTML = '<div style="background:#162130;border:2px solid var(--gold);border-radius:16px;padding:20px;max-width:450px;width:90%;max-height:80vh;overflow-y:auto;color:var(--text);">' +
    '<div style="font-size:0.7rem;line-height:1.8;"><p style="color:var(--gold);font-size:0.85rem;">🗡️ 遭遇 ' + eName + '</p><p style="color:#8899aa;">HP: ' + eHP + '</p><hr style="border-color:#2c3e50;"><div id="fightDetail" style="text-align:left;color:#aab8c2;"></div></div></div>';
  // 关闭覆盖层的函数
  window._closeFightOverlay = function() {
    const o = document.getElementById('fightOverlay');
    if (o) o.style.display = 'none';
  };
  }
  if (fightingCompanion) {
    addLog('👥 道友【' + fightingCompanion.name + '】与你并肩作战！', 'combat');
  }

  // 执行战斗
  const stats = getEffectiveStats();
  const compBonus = getCompanionPetBonus();
  // 功法加成（战斗/防御类）
  const skillAtkBonus = getSkillBonus('combat');
  const skillDefBonus = getSkillBonus('defense');
  // 宗门加成
  let sectAtkBonus = 0, sectDefBonus = 0;
  if (player.sect) {
    const sect = SECTS.find(s => s.id === player.sect);
    if (sect && sect.bonuses.combat) {
      sectAtkBonus = Math.floor((stats.atk + compBonus.atk) * (sect.bonuses.combat - 1));
    }
  }
  // 合并道友灵兽加成到stats
  const combatStats = {
    atk: stats.atk + compBonus.atk + skillAtkBonus + sectAtkBonus,
    def: stats.def + compBonus.def + skillDefBonus,
    hp: stats.maxHP + compBonus.hp,
    mp: stats.maxMP + compBonus.mp
  };

  // 算命先生占卜 - 战斗属性加成
  if (player._fortuneBuff) {
    if (player._fortuneBuff.apply.type === 'atkBoost') {
      const bonus = Math.floor(combatStats.atk * (player._fortuneBuff.apply.val - 1));
      combatStats.atk += bonus;
      player._fortuneBuff.remains--;
      addLog('🔮 占卜【' + player._fortuneBuff.name + '】生效，攻击+' + bonus + '，剩余' + player._fortuneBuff.remains + '次', 'special');
      if (player._fortuneBuff.remains <= 0) player._fortuneBuff = null;
    } else if (player._fortuneBuff.apply.type === 'defBoost') {
      const bonus = Math.floor(combatStats.def * (player._fortuneBuff.apply.val - 1));
      combatStats.def += bonus;
      player._fortuneBuff.remains--;
      addLog('🔮 占卜【' + player._fortuneBuff.name + '】生效，防御+' + bonus + '，剩余' + player._fortuneBuff.remains + '次', 'special');
      if (player._fortuneBuff.remains <= 0) player._fortuneBuff = null;
    }
  }

  let pDmgTotal = 0;
  let eDmgTotal = 0;
  let rounds = 0;

  // 最多5回合
  while (eHP > 0 && player.currentHP > 0 && rounds < 5) {
    rounds++;

    // 手动模式：每回合选择策略
    if (player.battleMode === 'manual') {
      const action = await showManualRoundChoice(rounds, eName, eHP, combatStats);
      if (action === 'flee') {
        addLog('🏃 你试图逃跑……' + (Math.random() < 0.5 ? '成功逃离！' : '逃跑失败！'), 'system');
        if (Math.random() < 0.5) break;
      }
      player._roundAction = action;
    }

    // 玩家攻击
    let pDmg = Math.max(Math.floor(combatStats.atk * 0.05), combatStats.atk - eDef + Math.floor(Math.random() * 10));
    // 出身被动：屠夫 - 对妖兽类敌人额外20%伤害
    if (hasOriginPassive('butcher')) {
      const beastNames = ['妖兽', '魔物', '噬灵虫', '山魈'];
      const isBeast = beastNames.some(b => eName.startsWith(b));
      if (isBeast) {
        const bonusDmg = Math.floor(pDmg * 0.2);
        pDmg += bonusDmg;
        addLog('🔪 出身被动【庖丁解牛】：对妖兽额外+' + bonusDmg + '伤害！', 'combat');
      }
    }
    // 道友助战加成（好感度+境界影响）
    if (fightingCompanion) {
      const aff = fightingCompanion.affection || 50;
      const realmMult = 1 + ((fightingCompanion.realmIndex || 0) * 0.1);
      if (aff >= 60) {
        const extra = Math.floor(pDmg * (aff / 200) * realmMult);
        pDmg += extra;
        addLog('💪 道友助威（' + REALMS[fightingCompanion.realmIndex || 0].name + '），额外伤害+' + extra, 'combat');
      }
      if (aff >= 80) {
        const shield = Math.floor(aff / 10 * realmMult);
        player.currentHP = Math.min(combatStats.hp, player.currentHP + shield);
        addLog('🛡️ 道友护盾（' + REALMS[fightingCompanion.realmIndex || 0].name + '），生命+' + shield, 'combat');
      }
    }

    // === 战斗技能：蓄力 ===
    if (player._battleSkill === 'charge') {
      if (!player._chargeReady) {
        pDmg = 0;
        player._chargeReady = true;
        addLog('⏳ 蓄力中……下一回合伤害翻倍！', 'combat');
      } else {
        pDmg = Math.floor(pDmg * 2);
        player._chargeReady = false;
        addLog('⚡ 蓄力完成！伤害翻倍！', 'combat');
      }
    }

    // === 战斗技能：猛攻 ===
    if (player._battleSkill === 'offense' && pDmg > 0) {
      pDmg = Math.floor(pDmg * 1.2);
    }

    // === 战斗技能：防守（伤害降低） ===
    if (player._battleSkill === 'defense' && pDmg > 0) {
      pDmg = Math.floor(pDmg * 0.8);
    }

    // === 手动模式：回合策略修正 ===
    if (player.battleMode === 'manual' && player._roundAction) {
      if (player._roundAction === 'heavy') {
        pDmg = Math.floor(pDmg * 1.5);
        addLog('💥 全力出击！', 'combat');
      } else if (player._roundAction === 'guard') {
        pDmg = Math.floor(pDmg * 0.6);
        addLog('🛡️ 架起防御姿态。', 'combat');
      }
    }

    eHP -= pDmg;
    pDmgTotal += pDmg;

    // 敌人反击
    let eDmg = 0;
    if (eHP > 0) {
      eDmg = Math.max(Math.floor(eAtk * 0.05), eAtk - combatStats.def + Math.floor(Math.random() * 8));
      // === 战斗技能：猛攻（受伤增加） ===
      if (player._battleSkill === 'offense') {
        eDmg = Math.floor(eDmg * 1.2);
      }
      // === 战斗技能：防守（受伤减少） ===
      if (player._battleSkill === 'defense') {
        eDmg = Math.floor(eDmg * 0.7);
      }
      // === 手动模式：敌方伤害修正 ===
      if (player.battleMode === 'manual' && player._roundAction === 'heavy') {
        eDmg = Math.floor(eDmg * 1.3);
      } else if (player.battleMode === 'manual' && player._roundAction === 'guard') {
        eDmg = Math.floor(eDmg * 0.5);
      }
      // 天罚之体：概率触发天雷追加伤害
      if (player.physique?.effect?.thunderStrike && Math.random() < 0.15) {
        const thunder = 10 + Math.floor(Math.random() * 20);
        eHP -= thunder;
        addLog('⚡ 天罚之体！天雷追加' + thunder + '伤害！', 'combat');
      }
      // 凤凰涅槃体：伤害反弹
      if (player.physique?.effect?.reflectDamage && Math.random() < 0.2) {
        const reflect = Math.floor(eDmg * 0.3);
        eHP -= reflect;
        addLog('🔥 凤凰涅槃体反弹' + reflect + '伤害！', 'combat');
      }
      player.currentHP -= eDmg;
      eDmgTotal += eDmg;
      flashDamage();

      // 混沌剑体吸血
      if (player.talent?.effect?.lifesteal) {
        const heal = Math.floor(pDmg * player.talent.effect.lifesteal);
        player.currentHP = Math.min(combatStats.hp, player.currentHP + heal);
      }
    }

    // 手动模式：清除本轮策略，准备下一轮
    if (player.battleMode === 'manual') player._roundAction = null;

    addLog('⚔️ 回合' + rounds + '：造成' + pDmg + '伤害，受' + (eHP > 0 ? eDmg : 0) + '伤害', 'combat');
    // 更新战斗弹窗
    const detailEl = document.getElementById('fightDetail');
    if (detailEl) {
      detailEl.innerHTML += '<div>回合' + rounds + '：造成' + pDmg + '伤害' + (eHP > 0 ? '，受' + eDmg + '伤害' : '') + ' | 敌HP: ' + Math.max(0, eHP) + ' | 你HP: ' + Math.floor(player.currentHP) + '</div>';
      detailEl.scrollTop = detailEl.scrollHeight;
    }
    requestUIUpdate();
    if (player.battleMode === 'auto') await new Promise(r => setTimeout(r, 50));
    else await new Promise(r => setTimeout(r, 300));

    // 检查敌人是否死亡
    if (eHP <= 0) break;
  }

  // ===== 战斗结算 =====
  if (eHP <= 0 && player.currentHP > 0) {
    // 胜利
    const stoneReward = Math.floor((Math.random() * 40 + 15) * (enemyLvl + 1));
    const expReward = Math.floor((Math.random() * 70 + 30) * (enemyLvl + 1));
    // 灵石加成
    let stones = stoneReward;
    if (player.physique?.effect?.stoneMult) stones = Math.floor(stones * player.physique.effect.stoneMult);
    if (player.talent?.effect?.stoneBoost) stones = Math.floor(stones * player.talent.effect.stoneBoost);
    stones = Math.floor(stones * compBonus.stones);

    player.spiritStones += stones;
    player.exp += expReward;
    pulseExpBar();

    // 算命先生占卜 - 灵石获取加成
    if (player._fortuneBuff && player._fortuneBuff.apply.type === 'stoneBoost') {
      const stoneBonus = Math.floor(stones * (player._fortuneBuff.apply.val - 1));
      player.spiritStones += stoneBonus;
      player._fortuneBuff.remains--;
      addLog('🔮 占卜【' + player._fortuneBuff.name + '】生效，灵石+' + stoneBonus + '，剩余' + player._fortuneBuff.remains + '次', 'special');
      if (player._fortuneBuff.remains <= 0) player._fortuneBuff = null;
    }

    // 出身被动：老乞丐 - 灵石额外+10%（上限5）
    if (hasOriginPassive('oldBeggar')) {
      ORIGIN_PASSIVE['老乞丐'].stoneBonus(stones);
    }

    // 出身被动：镖师 - 战斗额外+5灵石
    if (hasOriginPassive('escort')) {
      ORIGIN_PASSIVE['镖师'].fightBonus();
    }

    addLog('🏆 胜利！灵石+' + stones + '，修为+' + expReward + ' 💥', 'success');
    flashReward();
    // 战斗结束弹窗保留片刻
    await new Promise(r => setTimeout(r, 600));
    closeModal();
    addLog('📊 战斗统计：' + rounds + '回合，造成' + pDmgTotal + '伤害，受到' + eDmgTotal + '伤害', 'system');

    // 不灭剑体：战斗后回血
    if (player.physique?.effect?.fightHeal) {
      const heal = Math.floor(combatStats.hp * 0.05);
      player.currentHP = Math.min(combatStats.hp, player.currentHP + heal);
      addLog('🗡️ 不灭剑体回血+' + heal, 'success');
    }

    // 随机战利品
    if (Math.random() < 0.25) {
      const type = ['weapon', 'armor', 'accessory'][Math.floor(Math.random() * 3)];
      const eq = randomEquipment(type);
      addToBag(eq, type);
      addLog('🎁 战利品【' + eq.name + '】', 'reward');
    }

    // 不正经材料掉落
    if (Math.random() < 0.18) {
      const keys = Object.keys(UNORTHODOX_MATERIALS);
      const name = keys[Math.floor(Math.random() * keys.length)];
      const mat = UNORTHODOX_MATERIALS[name];
      player.unorthodoxMaterials[name] = (player.unorthodoxMaterials[name] || 0) + 1;
      addLog('💀 从敌人身上掉落了【' + name + '】……' + mat.truth, 'special');
    }

    // 随机战斗故事
    if (Math.random() < 0.35) {
      const tale = FIGHT_TALES[Math.floor(Math.random() * FIGHT_TALES.length)];
      addLog(tale.msg, 'special');
      if (tale.eff) tale.eff(player);
    }

    // 道友好感变化
    if (fightingCompanion) {
      fightingCompanion.affection = Math.min(100, (fightingCompanion.affection || 50) + 3);
    }

    // 概率结识新道友
    const maxComp = player.physique?.effect?.companionMax ? 3 + player.physique.effect.companionMax : 3;
    if (Math.random() < 0.2 && player.companions.length < maxComp) {
      const newComp = createCompanion(player.realmIndex);
      addLog('👥 战后遇同道【' + newComp.name + '】（' + REALMS[newComp.realmIndex].name + '）加入', 'special');
      player.companions.push(newComp);
    }

    // 检查突破
    checkBreakthrough();

    // 体魄任务：战斗胜利计数
    player._fightWins = (player._fightWins || 0) + 1;
    checkBodyQuest('fight');

  } else if (player.currentHP <= 0) {
    // 战败
    player.currentHP = 0;
    addLog('💀 被【' + eName + '】击败，战斗持续' + rounds + '回合，造成' + pDmgTotal + '伤害，受到' + eDmgTotal + '伤害', 'danger');
    window._closeFightOverlay();
    if (fightingCompanion) {
      fightingCompanion.affection = Math.max(0, (fightingCompanion.affection || 50) - 5);
    }
    handleDeath(false);
    clearBattleSkill();
    fightingCompanion = null;
    player._fightInProgress = false;
    requestUIUpdate();
    return;
  } else {
    // 平局/逃跑
    addLog('🌪️ 双方僵持，敌人退去。战斗持续' + rounds + '回合，造成' + pDmgTotal + '伤害，受到' + eDmgTotal + '伤害', 'danger');
    window._closeFightOverlay();
    if (fightingCompanion) {
      fightingCompanion.affection = Math.max(0, (fightingCompanion.affection || 50) - 2);
    }
  }

  // 战后处理
  player.combatCooldown = 3;
  addMonths(2);
  regenerate();

  // 触发随机事件
  triggerRandomEvent();
  triggerSectEvent('random');
  triggerAdventure();
  tryAwakenPhysique();
  triggerCompanionEvent();

  // 灵兽成长
  player.pets.forEach(p => petGainExp(p, 10));

  // 命运成长
  if (Math.random() < 0.05) fateGrow('physique', 1);

  // 法器特效
  triggerArtifactEffect('fight');

  // 检查成就
  checkAchievements();

  clearBattleSkill();
  fightingCompanion = null;
  player._fightInProgress = false;
  requestUIUpdate();
}

/** 选择战斗助战道友 */
function chooseFightCompanion() {
  const companions = player.companions;
  if (companions.length === 0) {
    player._fightCompanionChosen = true;
    fight();
    return;
  }

  let html = '<p style="margin-bottom:10px;">选择一位道友助战：</p><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">';
  companions.forEach(c => {
    const aff = c.affection || 50;
    html += '<button class="modal-btn" onclick="selectFightCompanion(\'' + c.name + '\')">' + c.name + ' (好感' + aff + ')</button>';
  });
  html += '<button class="modal-btn" onclick="selectFightCompanion(null)">独自战斗</button></div>';

  showModal('⚔️ 选择助战', html);
}

/** 选择助战道友回调 */
function selectFightCompanion(name) {
  if (name) {
    fightingCompanion = player.companions.find(c => c.name === name);
  } else {
    fightingCompanion = null;
  }
  player._fightCompanionChosen = true;
  closeModal();
  fight();
}

// ==================== 天劫系统 ====================

/**
 * 天劫系统
 * @param {Function} onWin - 天劫成功后的回调（突破继续）
 * @param {number} forcedStrikes - 强制指定雷劫数量（可选）
 */
function startHeavenlyTribulation(onWin, forcedStrikes) {
  const stats = getEffectiveStats();

  // 七窍玲珑心：无视天劫
  if (player.physique?.effect?.immuneTrib) {
    player.baseDef += 10;
    addLog('💖 七窍玲珑心！天劫退散，防御永久+10！当前防御：' + player.baseDef, 'success');
    player.tribulationWins = (player.tribulationWins || 0) + 1;
    requestUIUpdate();
    if (onWin) onWin();
    return;
  }

  const strikes = forcedStrikes || (3 + Math.floor(Math.random() * 3)); // 3-5道
  const realmMult = 1 + (player.realmIndex + 1) * 0.2; // 境界倍率

  // 防御减伤
  const defFactor = Math.max(0.15, 1 - stats.def / (stats.def + 120));
  // 体魄减伤
  const phyFactor = Math.max(0.5, 1 - player.fate.physique * 0.005);
  let factor = Math.max(0.1, defFactor * phyFactor);

  // 雷劫丹减伤
  if (player.pillStacks > 0) {
    factor = Math.max(0.05, factor * (1 - player.pillStacks * 0.1));
    addLog('💊 雷劫丹生效！额外减伤' + (player.pillStacks * 10) + '%', 'combat');
    player.pillStacks = 0; // 消耗所有层数
  }

  addLog('🌩️ ' + strikes + '道天雷劈下！（' + getCurrentRealm().name + '天劫·' + Math.floor(realmMult * 100) + '%威能）', 'combat');
  addLog('🛡️ 防御减伤' + Math.floor((1 - defFactor) * 100) + '% 体魄减伤' + Math.floor((1 - phyFactor) * 100) + '%', 'system');
  // 预计伤害范围
  const estMinPct = Math.floor(stats.maxHP * 0.08 * realmMult * factor / Math.max(1, player.currentHP) * 100);
  const estMaxPct = Math.floor(stats.maxHP * 0.20 * realmMult * factor / Math.max(1, player.currentHP) * 100);
  addLog('⚡ 预计每道天雷造成当前生命值 ' + estMinPct + '%~' + estMaxPct + '% 伤害', 'combat');

  let hp = player.currentHP;
  let totalDmg = 0;
  let failed = false;

  for (let i = 0; i < strikes; i++) {
    const baseDmg = Math.floor(stats.maxHP * (0.08 + Math.random() * 0.12) * realmMult);
    const actualDmg = Math.floor(baseDmg * factor);
    hp -= actualDmg;
    totalDmg += actualDmg;

    addLog('⚡ 第' + (i + 1) + '道天雷！伤害' + actualDmg + '（原始' + baseDmg + '）剩余生命' + Math.max(0, hp), 'combat');

    if (hp < stats.maxHP * 0.2) {
      addLog('💥 血量不足20%！天劫失败！', 'danger');
      failed = true;
      break;
    }
  }

  player.currentHP = Math.max(1, hp);

  if (failed) {
    player.tribulationFails = (player.tribulationFails || 0) + 1;
    addLog('💀 天劫失败（' + player.tribulationFails + '/3次）', 'danger');

    if (player.tribulationFails >= 3) {
      player.tribulationFails = 0;
      if (player.realmIndex > 0) {
        // 跌落一个大境界
        player.realmIndex--;
        player.layer = REALMS[player.realmIndex].layers;
        // 修为降至新境界所需值的80%，避免立刻再次突破
        const newExpNeeded = REALMS[player.realmIndex].expNeeded;
        player.exp = Math.min(player.exp, Math.floor(newExpNeeded * 0.8));
        addLog('💀💀💀 连续三次天劫失败！跌落至【' + getCurrentRealm().name + '】！', 'danger');
      } else {
        addLog('已是最低境界，无法再跌落。', 'danger');
      }
    }
    player.combatCooldown = 5;
    requestUIUpdate();
    return;
  }

  // 天劫成功
  addLog('🌟 天劫淬体！总计承受' + totalDmg + '伤害，肉身愈发强韧！', 'success');
  player.tribulationWins = (player.tribulationWins || 0) + 1;

  // 三次天劫胜利 → 七窍玲珑心觉醒（如果还不是）
  if (player.tribulationWins >= 3 && player.physique?.name !== '七窍玲珑心') {
    player.tribulationWins = 0;
    player.physique = { name: '七窍玲珑心', ...PHYSIQUE_TYPES['七窍玲珑心'] };
    addLog('💖 三次天劫淬炼！你的心脏蜕变——【七窍玲珑心】觉醒！', 'special');
    addLog('此后心魔退散，天劫亦臣服于你。', 'system');
  }

  requestUIUpdate();
  if (onWin) onWin();
}

// ==================== 心魔战斗系统 ====================

/**
 * 心魔战斗
 * @param {Function} onWin - 战胜心魔后的回调
 */
function startInnerDemonFight(onWin) {
  // 七窍玲珑心：无视心魔
  if (player.physique?.effect?.immuneDemon) {
    player.baseAtk += 1;
    addLog('💖 七窍玲珑心！心魔退散，攻击永久+1！当前攻击：' + player.baseAtk, 'success');
    if (onWin) onWin();
    return;
  }

  const stats = getEffectiveStats();
  const scale = 0.75 + Math.random() * 0.1;
  const demonAtk = Math.floor(stats.atk * scale);
  const demonDef = Math.floor(stats.def * scale);
  let demonHP = Math.floor(stats.maxHP * 0.8);

  addLog('💀 心魔化作你的模样，攻' + demonAtk + '，防' + demonDef + '，生命' + demonHP + '。', 'combat');

  // 定力抵抗
  let resist = 0;
  const focusThreshold = getFateThreshold('focus', player.fate.focus);
  if (focusThreshold && focusThreshold.demonResist) {
    resist = focusThreshold.demonResist;
  }
  if (player._fateDemonResist > 0) {
    resist += player._fateDemonResist;
    player._fateDemonResist = 0;
  }
  // 玄冥之体
  if (player.physique?.effect?.demonResist) {
    resist += player.physique.effect.demonResist;
  }

  // 如果抵抗足够，直接胜利
  if (resist >= 0.5 && Math.random() < resist) {
    addLog('🧘 定力深厚，心魔不攻自破！', 'success');
    player.exp += 200;
    player.spiritStones += 100;
    const possible = REALMS.filter(r => r.breakItem).map(r => r.breakItem);
    if (possible.length) {
      const pill = possible[Math.floor(Math.random() * possible.length)];
      addToBag(pill, 'consumable', 1);
      addLog('获得【' + pill + '】作为心魔馈赠。', 'reward');
    }
    requestUIUpdate();
    if (onWin) onWin();
    return;
  }

  // 进入战斗循环
  let playerHP = player.currentHP;
  let rounds = 0;
  const maxRounds = 5;

  while (playerHP > 0 && demonHP > 0 && rounds < maxRounds) {
    rounds++;
    const pDmg = Math.max(1, stats.atk - demonDef + Math.floor(Math.random() * 10));
    demonHP -= pDmg;
    const dDmg = Math.max(1, demonAtk - stats.def + Math.floor(Math.random() * 8));
    playerHP -= dDmg;
    addLog('⚔️ 心魔回合' + rounds + '：你造成' + pDmg + '伤害，心魔造成' + dDmg + '伤害。', 'combat');
  }

  if (demonHP <= 0 && playerHP > 0) {
    // 胜利
    player.currentHP = playerHP;
    addLog('🌟 你战胜心魔，道心愈发坚定！', 'success');

    // 奖励
    const rewardExp = 300 + Math.floor(Math.random() * 300);
    const rewardStones = 100 + Math.floor(Math.random() * 200);
    player.exp += rewardExp;
    player.spiritStones += rewardStones;
    addLog('📈 心魔馈赠：修为+' + rewardExp + '，灵石+' + rewardStones, 'reward');

    const possible = REALMS.filter(r => r.breakItem).map(r => r.breakItem);
    if (possible.length) {
      const pill = possible[Math.floor(Math.random() * possible.length)];
      addToBag(pill, 'consumable', 1);
      addLog('💊 获得【' + pill + '】', 'reward');
    }

    // 定力成长
    fateGrow('focus', 2);

    requestUIUpdate();
    if (onWin) onWin();
  } else {
    // 失败
    player.currentHP = 0;
    addLog('💀 你被心魔吞噬，道消身陨...', 'danger');
    handleDeath(false);
  }
}

// ==================== 突破系统（重构） ====================

/**
 * 突破主流程
 * 修复原版Bug：修为扣除移到天劫成功之后
 */
function breakthrough() {
  if (player.pendingEvent) {
    addLog('请先处理当前事件！', 'danger');
    return;
  }

  // 生命值过低警告
  if (player.currentHP < 10) {
    addLog('⚠️ 你伤势过重，强行突破极其危险！突破失败可能直接陨落！', 'danger');
  }

  const realm = getCurrentRealm();
  const expNeeded = getExpNeeded();

  // 检查修为是否足够
  if (player.exp < expNeeded) {
    addLog('修为不足，需要 ' + expNeeded + ' 经验。当前：' + player.exp, 'danger');
    return;
  }

  // 大境界突破前必须击败对应BOSS（炼气期开始）
  if (player.realmIndex >= 1 && player.layer >= realm.layers && player.realmIndex < REALMS.length - 1) {
    const bossId = 'boss' + player.realmIndex;
    const beaten = player.beatenBosses || [];
    if (!beaten.includes(bossId)) {
      const boss = BOSS_LIST.find(b => b.id === bossId);
      const bossName = boss ? boss.name : '该境界的BOSS';
      addLog('⚠️ 需击败【' + bossName + '】才能突破至下一境界！', 'danger');
      return;
    }
  }

  // 检查突破丹药
  const ignoreItem = player.talent?.effect?.ignoreBreakItem;
  if (realm.breakItem && !ignoreItem) {
    const idx = player.bag.findIndex(i => i.name === realm.breakItem && i.type === 'consumable');
    if (idx === -1) {
      addLog('需要【' + realm.breakItem + '】才能突破！', 'danger');
      return;
    }
    // 消耗丹药
    if (player.bag[idx].count > 1) {
      player.bag[idx].count--;
    } else {
      player.bag.splice(idx, 1);
    }
    addLog('💊 服用【' + realm.breakItem + '】', 'system');
  }

  // 计算成功率
  let successRate = 0.7 - (player.layer - 1) * 0.03;
  if (player.talent?.effect?.breakBonus) successRate += player.talent.effect.breakBonus;
  if (player.talent?.effect?.guaranteedBreak) successRate = 1;
  if (player.physique?.effect?.breakBonus) successRate += player.physique.effect.breakBonus;

  // 命运加成
  applyFateEffects('breakthrough');
  if (player._fateBreakBoost > 0) {
    successRate += player._fateBreakBoost;
    player._fateBreakBoost = 0;
  }

  // 心魔影响
  if (player.innerDemon > 50) {
    successRate -= 0.1;
  }

  successRate = Math.max(0.1, Math.min(1, successRate));

  // 显示成功率
  let rateMsg = '🎯 当前突破成功率：' + Math.floor(successRate * 100) + '%';
  if (player.innerDemon > 50) rateMsg += '（心魔影响-10%）';
  addLog(rateMsg, 'system');

  // 判断是否突破成功
  const isSuccess = Math.random() < successRate;

  if (!isSuccess) {
    // 突破失败
    const loss = Math.floor(getEffectiveStats().maxHP * 0.2);
    player.currentHP = Math.max(1, player.currentHP - loss);
    // 生命过低时突破失败 → 大概率直接陨落
    if (player.currentHP < 10 && Math.random() < 0.8) {
      addLog('💀 伤势过重，突破失败导致经脉尽断……', 'danger');
      handleDeath(false);
      return;
    }
    addLog('💥 突破失败，损失' + loss + '生命', 'danger');
    addMonths(2);
    player.innerDemon += 10;
    requestUIUpdate();
    return;
  }

  // ===== 突破成功 =====
  // 判断是否跨越大境界（需要渡劫）
  // 雷劫仅在突破至以下境界时触发：筑基期(2)、金丹期(3)、元婴期(4)、化神期(5)、合体期(6)、大乘期(7)、渡劫期(8)
  // 凡人→炼气期不触发雷劫，炼气期内层突破不触发，渡劫期→仙帝由红尘劫处理不在此列
  const isMajorBreak = (player.layer >= realm.layers && player.realmIndex >= 1 && player.realmIndex < REALMS.length - 1);

  if (isMajorBreak) {
    // 渡劫期→仙帝：三重考验：雷劫 → 心魔 → 红尘劫
    if (player.realmIndex === REALMS.length - 2) {
      // 散仙选择：拒绝突破，逍遥而去
      const html = '<p style="text-align:center;margin-bottom:12px;">⚡ 你站在仙帝的门槛前……</p>' +
        '<p style="font-size:0.75rem;color:#8899aa;text-align:center;">渡劫→心魔→红尘劫，九死一生。<br>或者放下一切，做個逍遥散仙。</p>' +
        '<div class="modal-btn-group">' +
        '<button class="modal-btn" onclick="closeModal();doBreakXianDi();">👑 证道仙帝</button>' +
        '<button class="modal-btn" onclick="closeModal();doBreakSanXian();" style="background:#333;border-color:#555;">☁️ 做散仙</button>' +
        '</div>';
      showModal('👑 仙帝 or 散仙', html);
      return;
    }
    // 其他大境界突破 → 仅渡雷劫
    addLog('⚡ 天劫降临！雷云翻滚，准备渡劫！', 'combat');
    startHeavenlyTribulation(() => {
      player.exp -= expNeeded;
      proceedBreakthrough();
    });
  } else {
    // 小境界突破或最后一层 → 直接扣除修为并升级
    player.exp -= expNeeded;
    proceedBreakthrough();
  }
}

/**
 * 执行突破升级（在修为扣除之后调用）
 */
function proceedBreakthrough() {
  const realm = getCurrentRealm();

  if (player.layer < realm.layers) {
    // 同境界内升层
    player.layer++;
    addLog('🎉 突破成功！' + getRealmFullName(), 'success');
    flashBreakthrough();
    pulseExpBar();
  } else if (player.realmIndex < REALMS.length - 1) {
    // 大境界晋升
    player.realmIndex++;
    player.layer = 1;

    addLifeEvent('突破至【' + getCurrentRealm().name + '】');

    // 境界专属文案
    const realmStories = [
      '你第一次感受到丹田中涌动的灵气——虽然只有一丝，但你已不再是凡人之躯。',
      '灵气在经脉中流转百遍，终于在丹田凝成基石。筑基已成，仙路始开。',
      '丹田中的液态灵气缓缓旋转，凝结成一颗璀璨金丹。你睁眼，目光如电。',
      '金丹碎裂，一个袖珍的你从丹光中跃出——元婴已成，从此元神不灭。',
      '元婴与肉身合二为一，你第一次触摸到天地法则的门槛。',
      '你的神识融入天地，日月星辰在你眼中流转，万物生灭尽在感知。',
      '九道霞光从天而降！你的修为臻至大乘，距离飞升只差最后一步。',
      '天劫降临——九九八十一道天雷淬体！每一道都是生死考验，你撑过来了。',
      '天劫散尽，天降金莲，万道霞光铺成天路。你，证道仙帝！'
    ];
    const storyIdx = Math.min(player.realmIndex - 1, realmStories.length - 1);
    addLog('📜 ' + realmStories[storyIdx], 'special');
    addLog('🌟 大境界突破！踏入【' + getCurrentRealm().name + '】！', 'success');

    // 命格成长
    fateGrow('intelligence', 2);
    fateGrow('focus', 1);

    // 恢复满状态
    const stats = getEffectiveStats();
    player.currentHP = stats.maxHP;
    player.currentMP = stats.maxMP;

    addMonths(12);
    tryAwakenPhysique();

    // 仙帝结局
    if (player.realmIndex >= REALMS.length - 1) {
      addLog('👑 仙帝！永生不死！', 'reward');
      handleXianDiEnding();
    }
  }

  // 随机突破故事
  if (Math.random() < 0.4) {
    const tale = BREAK_TALES[Math.floor(Math.random() * BREAK_TALES.length)];
    addLog(tale.msg, 'special');
    if (tale.eff) tale.eff(player);
  }

  // 心魔值减少
  player.innerDemon = Math.max(0, player.innerDemon - 15);

  checkBreakthrough();
  requestUIUpdate();
}

// ==================== 修炼系统 ====================

/** 修炼主函数 */
function cultivate() {
  if (player.currentMP < 5) {
    addLog('灵力不足，需要至少5点灵力', 'danger');
    return;
  }

  player.currentMP -= 5;

  // 基础修炼收益
  let base = 10 + player.realmIndex * 5 + player.layer * 2;
  let gain = base + Math.floor(Math.random() * base);

  // 道友加成
  const compBonus = getCompanionPetBonus();
  gain = Math.floor(gain * compBonus.cultivate);

  // 体魄加成
  if (player.physique?.effect?.cultMult) {
    gain = Math.floor(gain * player.physique.effect.cultMult);
  }
  // 玄冥之体：黑夜效率翻倍
  if (player.physique?.effect?.nightCultMult && player.currentDaytime === 'night') {
    gain = Math.floor(gain * player.physique.effect.nightCultMult);
    addLog('🌙 玄冥之体：黑夜修炼效率翻倍！', 'special');
  }
  // 万象道体
  if (player.physique?.effect?.cultMult) {
    gain = Math.floor(gain * player.physique.effect.cultMult);
  }

  // 天赋加成
  if (player.talent?.effect?.type === 'cultivateBoost') {
    gain = Math.floor(gain * player.talent.effect.val);
  }

  // 算命先生占卜 - 修炼加成
  if (player._fortuneBuff && player._fortuneBuff.apply.type === 'cultivateBoost') {
    const buffMult = player._fortuneBuff.apply.val;
    gain = Math.floor(gain * buffMult);
    player._fortuneBuff.remains--;
    addLog('🔮 占卜【' + player._fortuneBuff.name + '】生效，剩余' + player._fortuneBuff.remains + '次', 'special');
    if (player._fortuneBuff.remains <= 0) player._fortuneBuff = null;
  }

  // 灵根加成（最高灵根值/2，单灵根100=+50%，平均20=+10%）
  if (player.spiritualRoots) {
    const maxRoot = Math.max(...Object.values(player.spiritualRoots));
    const rootBonus = maxRoot / 2;
    if (rootBonus > 0) {
      const extra = Math.floor(gain * rootBonus / 100);
      if (extra > 0) {
        gain += extra;
        addLog('🌱 灵根加成（' + maxRoot + '），修炼+' + extra, 'success');
      }
    }
  }

  // 功法加成（修炼类）
  const cultSkillBonus = getSkillBonus('cultivate');
  if (cultSkillBonus > 0) {
    const extra = Math.floor(gain * cultSkillBonus);
    if (extra > 0) {
      gain += extra;
      addLog('📖 功法加成（+' + Math.floor(cultSkillBonus * 100) + '%），修炼+' + extra, 'success');
    }
  }

  // 宗门加成
  if (player.sect) {
    const sect = SECTS.find(s => s.id === player.sect);
    if (sect && sect.bonuses.cultivate) {
      const extra = Math.floor(gain * (sect.bonuses.cultivate - 1));
      if (extra > 0) { gain += extra; addLog('⛰️ 宗门加成（' + sect.name + '），修炼+' + extra, 'success'); }
    }
  }

  // 灵光乍现（15%概率翻倍）
  if (Math.random() < 0.15) {
    gain *= 2;
    addLog('✨ 灵光乍现！修炼效果翻倍', 'success');
  }

  // 命运加成
  applyFateEffects('cultivate');

  player.exp += gain;
  pulseExpBar();
  player._cultivateCount = (player._cultivateCount || 0) + 1;

  const ghostPrefix = player._ghostCultivator ? '👻 吸收阴气修炼' : '🧘 修炼';
  addLog(ghostPrefix + ' +' + gain + ' 修为', 'success');

  // 随机修炼故事（鬼修使用专属故事池）
  const cultivatePool = player._ghostCultivator ? GHOST_TALES : CULTIVATE_TALES;
  if (Math.random() < 0.3) {
    const tale = cultivatePool[Math.floor(Math.random() * cultivatePool.length)];
    addLog(tale.msg, 'special');
    if (tale.eff) tale.eff(player);
  }

  // 恐怖事件
  if (Math.random() < 0.05) {
    const h = HORROR_EVENTS[Math.floor(Math.random() * HORROR_EVENTS.length)];
    addLog(h.msg, 'horror');
    if (h.eff) h.eff(player);
  }

  // 其他触发
  // 出身被动：散修弟子 - 每10次修炼获得材料
  if (hasOriginPassive('disciple')) {
    ORIGIN_PASSIVE['散修弟子'].onCultivate();
  }
  checkBreakthrough();
  addMonths(0.5);
  regenerate();
  triggerRandomEvent();
  triggerSectEvent('random');
  triggerAdventure();
  tryAwakenPhysique();
  triggerCompanionEvent();
  triggerInnerDemon();

  // 灵兽成长
  player.pets.forEach(p => petGainExp(p, 2));

  // 命运成长
  if (Math.random() < 0.05) fateGrow('focus', 1);

  // 法器特效
  triggerArtifactEffect('cultivate');

  // 神识成长（修炼5%概率）
  if (Math.random() < 0.05 && (player.spiritualSense || 10) < 100) {
    player.spiritualSense = (player.spiritualSense || 10) + 1;
    addLog('🧠 神识提升至' + player.spiritualSense + '！', 'special');
  }

  checkAchievements();
  requestUIUpdate();
}

// ==================== 休息系统 ====================

/** 休息恢复 */
function rest() {
  // 死亡检查（兜底）
  if (player.currentHP <= 0) { addLog('💀 你已经死了，无法休息', 'danger'); return; }
  const stats = getEffectiveStats();
  const hpHeal = Math.floor(stats.maxHP * 0.3);
  const mpHeal = Math.floor(stats.maxMP * 0.4);

  // 体魄加成
  let hpBonus = 0;
  const physThreshold = getFateThreshold('physique', player.fate.physique);
  if (physThreshold && physThreshold.restBoost) {
    hpBonus = Math.floor(hpHeal * (physThreshold.restBoost - 1));
  }

  player.currentHP = Math.min(stats.maxHP, player.currentHP + hpHeal + hpBonus);
  player.currentMP = Math.min(stats.maxMP, player.currentMP + mpHeal);

  // 出身被动：流浪乞儿 - 额外恢复20%生命
  if (hasOriginPassive('beggar')) {
    const extra = ORIGIN_PASSIVE['流浪乞儿'].restBonus(hpHeal);
    player.currentHP = Math.min(stats.maxHP, player.currentHP + extra);
  }

  // 算命先生占卜 - 生命恢复加成
  let hpRegenExtra = 0;
  if (player._fortuneBuff && player._fortuneBuff.apply.type === 'hpRegenBoost') {
    hpRegenExtra = Math.floor((hpHeal + hpBonus) * (player._fortuneBuff.apply.val - 1));
    player.currentHP = Math.min(stats.maxHP, player.currentHP + hpRegenExtra);
    player._fortuneBuff.remains--;
    if (player._fortuneBuff.remains <= 0) player._fortuneBuff = null;
  }

  addLog('🛌 打坐恢复生命+' + (hpHeal + hpBonus) + '，灵力+' + mpHeal + (hpRegenExtra > 0 ? '（🔮占卜额外+' + hpRegenExtra + '）' : ''), 'success');
  player.combatCooldown = Math.max(0, player.combatCooldown - 2);
  addMonths(0.2);

  applyFateEffects('rest');
  // 出身被动：茶馆老板 - 随机道友好感+2
  if (hasOriginPassive('innkeeper')) {
    ORIGIN_PASSIVE['茶馆老板'].restCompanion();
  }
  requestUIUpdate();
}

// ==================== 探索系统 ====================

/** 探索主函数 */
function explore() {
  if (player.currentHP < 20) {
    addLog('伤势过重，无法探索', 'danger');
    return;
  }

  // 消耗体力
  player.currentHP -= Math.floor(Math.random() * 8) + 3;

  // 神识加成（每点+0.5%探索效率）
  const senseMult = 1 + (player.spiritualSense || 10) / 200;

  const roll = Math.random();

  if (roll < 0.25) {
    // 获得灵石
    let stones = Math.floor(Math.random() * 25 + 8) * (player.realmIndex + 1);
    stones = Math.floor(stones * senseMult);
    const compBonus = getCompanionPetBonus();
    stones = Math.floor(stones * compBonus.stones);
    if (player.physique?.effect?.stoneMult) stones = Math.floor(stones * player.physique.effect.stoneMult);
    if (player.talent?.effect?.stoneBoost) stones = Math.floor(stones * player.talent.effect.stoneBoost);
    player.spiritStones += stones;
    // 出身被动：老乞丐 - 灵石额外+10%（上限5）
    if (hasOriginPassive('oldBeggar')) {
      ORIGIN_PASSIVE['老乞丐'].stoneBonus(stones);
    }
    addLog('⛰️ 发现灵石矿脉！+' + stones + ' 💎', 'reward');

  } else if (roll < 0.5) {
    // 获得突破丹
    const possible = REALMS.filter(r => r.breakItem).map(r => r.breakItem);
    if (possible.length) {
      const item = possible[Math.floor(Math.random() * Math.min(3, possible.length))];
      addToBag(item, 'consumable', 1);
      addLog('🔮 获得【' + item + '】', 'reward');
    }

  } else if (roll < 0.7) {
    // 获得修为
    const gain = Math.floor((Math.random() * 35 + 15) * (player.realmIndex + 1) * senseMult);
    player.exp += gain;
    pulseExpBar();
    addLog('📖 参悟古迹，修为+' + gain, 'success');
    checkBreakthrough();

  } else if (roll < 0.85) {
    // 获得装备
    const type = ['weapon', 'armor', 'accessory'][Math.floor(Math.random() * 3)];
    const eq = randomEquipment(type);
    addToBag(eq, type);
    addLog('🗡️ 获得装备【' + eq.name + '】', 'reward');

  } else if (roll < 0.95) {
    // 结识道友
    const maxComp = player.physique?.effect?.companionMax ? 3 + player.physique.effect.companionMax : 3;
    if (player.companions.length < maxComp) {
      const comp = createCompanion(player.realmIndex);
      player.companions.push(comp);
      addLog('👥 仙缘相遇！结识道友【' + comp.name + '】（' + REALMS[comp.realmIndex].name + '）', 'special');
    } else {
      addLog('道友已满，未能结识新人。', 'system');
    }

  } else {
    // 妖兽袭击
    const dmg = Math.floor(Math.random() * 18 + 8);
    player.currentHP = Math.max(0, player.currentHP - dmg);
    addLog('⚠️ 妖兽袭击，受' + dmg + '伤害', 'danger');
    if (player.currentHP <= 0) {
      handleDeath(false);
      return;
    }
  }

  // 探索故事（鬼修专属）
  if (Math.random() < 0.35) {
    const explorePool = player._ghostCultivator ? GHOST_TALES : EXPLORE_TALES;
    const tale = explorePool[Math.floor(Math.random() * explorePool.length)];
    addLog(tale.msg, 'special');
    if (tale.eff) tale.eff(player);
  }

  // 恐怖事件
  if (Math.random() < 0.06) {
    const h = HORROR_EVENTS[Math.floor(Math.random() * HORROR_EVENTS.length)];
    addLog(h.msg, 'horror');
    if (h.eff) h.eff(player);
  }

  // 采集材料
  if (Math.random() < 0.3) {
    const mats = ['草药', '矿石', '灵泉水'];
    const mat = mats[Math.floor(Math.random() * mats.length)];
    player.materials[mat] = (player.materials[mat] || 0) + 1;
    addLog('🌿 采集到【' + mat + '】×1', 'reward');
  }

  // 不正经材料
  if (Math.random() < 0.12) {
    const keys = Object.keys(UNORTHODOX_MATERIALS);
    const name = keys[Math.floor(Math.random() * keys.length)];
    const mat = UNORTHODOX_MATERIALS[name];
    player.unorthodoxMaterials[name] = (player.unorthodoxMaterials[name] || 0) + 1;
    addLog('🔮 捡到一件奇怪的【' + name + '】！' + mat.desc, 'special');
  }

  addMonths(1);
  regenerate();
  triggerRandomEvent();
  triggerSectEvent('random');
  triggerAdventure();
  tryAwakenPhysique();
  triggerCompanionEvent();

  player.pets.forEach(p => petGainExp(p, 5));

  if (Math.random() < 0.05) fateGrow('luck', 1);
  if (Math.random() < 0.03) fateGrow('physique', 1);
  // 神识成长
  if (Math.random() < 0.1 && (player.spiritualSense || 10) < 100) {
    player.spiritualSense = (player.spiritualSense || 10) + 1;
    addLog('🧠 神识提升至' + player.spiritualSense + '！', 'special');
  }

  applyFateEffects('explore');
  triggerArtifactEffect('explore');
  // 体魄任务：探索计数
  player._exploreCount = (player._exploreCount || 0) + 1;
  checkBodyQuest('explore');
  checkAchievements();
  requestUIUpdate();
}

// ==================== 死亡处理 ====================

/**
 * 死亡处理
 * @param {boolean} isOldAge - 是否寿元耗尽
 */
function handleDeath(isOldAge) {
  if (isOldAge) {
    addLog('⌛ 寿元耗尽，大道无望……', 'danger');
    player.currentHP = 0;
    requestUIUpdate();
    // 鬼修寿元耗尽同样检查
    if (player._ghostCultivator) {
      showGhostEnding();
    } else {
      showGameOver();
    }
    return;
  }

  // 统计复活次数
  player._reviveCount = (player._reviveCount || 0) + 1;

  // 鬼修模式：第二次死亡直接魂飞魄散
  if (player._ghostCultivator) {
    player.currentHP = 0;
    requestUIUpdate();
    showGhostEnding();
    return;
  }

  // 万毒不侵体：免疫死亡惩罚
  if (player.physique?.effect?.deathImmune) {
    const stats = getEffectiveStats();
    player.currentHP = Math.floor(stats.maxHP * 0.3);
    addLog('🍃 万毒不侵体免疫死亡惩罚', 'success');
    player.combatCooldown = 3;
    requestUIUpdate();
    return;
  }

  // 凤凰涅槃体：免费复活
  if (player.physique?.effect?.reviveOnce && !player._reviveUsed) {
    player._reviveUsed = true;
    const stats = getEffectiveStats();
    player.currentHP = stats.maxHP;
    player.currentMP = stats.maxMP;
    addLog('🔥 凤凰涅槃体！原地复活！', 'success');
    requestUIUpdate();
    return;
  }

  // 万古不朽天赋：复活一次
  if (player.talent?.effect?.revive && !player.reviveUsed) {
    player.reviveUsed = true;
    const stats = getEffectiveStats();
    player.currentHP = stats.maxHP;
    player.currentMP = stats.maxMP;
    addLog('🌟 万古不朽！原地复活！', 'success');
    requestUIUpdate();
    return;
  }

  // 不死血脉：死亡惩罚减半（50%生命复活一次）
  if (player.talent?.effect?.deathPenalty && !player._undyingUsed) {
    player._undyingUsed = true;
    const stats = getEffectiveStats();
    player.currentHP = Math.floor(stats.maxHP * 0.5);
    player.currentMP = Math.floor(stats.maxMP * 0.5);
    player.combatCooldown = 3;
    addLog('🩸 不死血脉！肉体重组……', 'success');
    requestUIUpdate();
    return;
  }

  // 出身被动：赌场看场 - 30%概率免死
  if (hasOriginPassive('gambler')) {
    if (ORIGIN_PASSIVE['赌场看场'].tryCheatDeath()) {
      player.combatCooldown = 3;
      requestUIUpdate();
      return;
    }
  }

  // 5%概率转为鬼修
  if (Math.random() < 0.05 && !player._ghostCultivator) {
    player._ghostCultivator = true;
    player.currentHP = Math.floor(getEffectiveStats().maxHP * 0.3);
    player.currentMP = Math.floor(getEffectiveStats().maxMP * 0.3);
    // 失去体魄加成
    player.physique = { name: '鬼修之体', effect: {} };
    // 天赋减半
    if (player.talent?.effect) {
      for (const key in player.talent.effect) {
        if (typeof player.talent.effect[key] === 'number') player.talent.effect[key] *= 0.5;
      }
    }
    // 基础属性减20%
    player.baseHP = Math.floor(player.baseHP * 0.8);
    player.baseMP = Math.floor(player.baseMP * 0.8);
    player.baseAtk = Math.floor(player.baseAtk * 0.8);
    player.baseDef = Math.floor(player.baseDef * 0.8);
    addLog('👻 由于怨气过重，天地意志赋予你重来一世的机会——你转为鬼修！', 'special');
    addLog('⚠️ 体魄失效、天赋减半、属性-20%。下一次死亡将魂飞魄散。', 'danger');
    requestUIUpdate();
    saveGame();
    return;
  }

  // 普通死亡 → 游戏结束
  player.deathCount = (player.deathCount || 0) + 1;
  player.currentHP = 0;
  player.currentMP = 0;
  addLog('💀 你死了……', 'danger');
  addLifeEvent('死亡（第' + player.deathCount + '次）');
  requestUIUpdate();
  showGameOver();
  checkAchievements();
}

/** 鬼修魂飞魄散结局 */
function showGhostEnding() {
  saveLifeRecord();
  const count = player.deathCount || 0;
  const html = '<p style="text-align:center;font-size:0.85rem;margin-bottom:12px;">👻 鬼修之身终究难逃天道轮回……</p>' +
    '<p style="text-align:center;font-size:0.7rem;color:#8899aa;">魂飞魄散，不入轮回。</p>' +
    '<div class="modal-btn-group">' +
    '<button class="modal-btn" onclick="closeModal();showSaveManager(\'load\');">📂 读档</button>' +
    '<button class="modal-btn" onclick="closeModal();newGame();">🆕 重新开始</button>' +
    '</div>';
  showModal('👻 魂飞魄散', html);
}

// ==================== 红尘劫系统 ====================

/**
 * 红尘劫 - 仙帝证道前的最终考验
 * 三重试炼：财、情、名，考验道心是否真正超脱尘世
 * 自动执行，玩家需要硬抗三道红尘冲击
 */
function startHongChenJie(onWin) {
  const stats = getEffectiveStats();

  // 红尘三劫：财劫、情劫、名劫
  const hpCost = Math.floor(stats.maxHP * 0.25);
  const mpCost = Math.floor(stats.maxMP * 0.25);
  const expCost = Math.floor(player.exp * 0.05);

  addLog('🌊 红尘劫起！三灾六难，道心为证——', 'combat');

  // 第一劫：财
  player.currentHP = Math.max(1, player.currentHP - hpCost);
  addLog('💰 第一劫·财：你散尽身外之物，气血翻涌，生命-' + hpCost + '（剩余' + Math.floor(player.currentHP) + '）', 'combat');

  if (player.currentHP <= 0) {
    addLog('💀 红尘财劫未能渡过，道消身陨...', 'danger');
    handleDeath(false);
    return;
  }

  // 第二劫：情
  player.currentMP = Math.max(0, player.currentMP - mpCost);
  if (player.companions.length > 0) {
    // 好感最高的道友离你而去
    const comp = player.companions.reduce((a, b) => (a.affection || 0) > (b.affection || 0) ? a : b);
    comp.affection = Math.max(0, comp.affection - 20);
    addLog('💔 第二劫·情：道友【' + comp.name + '】与你诀别（好感-20），灵力-' + mpCost + '（剩余' + Math.floor(player.currentMP) + '）', 'combat');
    // 如果好感为0，道友离去
    if (comp.affection <= 0) {
      player.companions = player.companions.filter(c => c.name !== comp.name);
      addLog('🍂 【' + comp.name + '】转身离去，仙路殊途。', 'danger');
    }
  } else {
    addLog('💔 第二劫·情：你斩断最后一缕尘缘，灵力-' + mpCost + '（剩余' + Math.floor(player.currentMP) + '）', 'combat');
  }

  // 第三劫：名
  const expLost = player.exp - Math.max(0, player.exp - expCost);
  player.exp = Math.max(0, player.exp - expCost);
  addLog('🏆 第三劫·名：你放下虚名，返璞归真，修为-' + expLost + '（剩余' + player.exp + '）', 'combat');

  // 最终检查
  if (player.currentHP <= 0) {
    addLog('💀 红尘劫未能圆满，魂归天地...', 'danger');
    handleDeath(false);
    return;
  }

  addLog('🌟 红尘劫尽，道心圆满无暇，终证仙帝之位！', 'reward');
  addLog('🎉 与天同寿，永生不死！', 'reward');

  // 红尘劫奖励：永久属性加成
  player.baseHP += 200;
  player.baseMP += 100;
  player.innerDemon = 0;
  addLog('📈 红尘淬体：生命+200，灵力+100，心魔尽消。', 'success');

  requestUIUpdate();
  if (onWin) onWin();
}

/** 显示战斗策略选择模态框 */
function showFightSkillModal() {
  const html = `
    <p style="margin-bottom:12px;">选择本场战斗的策略：</p>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="modal-btn" onclick="selectBattleSkill('offense')" style="margin:0;width:100%;text-align:left;">
        ⚔️ 猛攻 <span style="display:block;font-size:0.65rem;color:#d4a574;font-weight:normal;">伤害+20%，受伤+20%</span>
      </button>
      <button class="modal-btn" onclick="selectBattleSkill('defense')" style="margin:0;width:100%;text-align:left;">
        🛡️ 防守 <span style="display:block;font-size:0.65rem;color:#d4a574;font-weight:normal;">伤害-20%，受伤-30%</span>
      </button>
      <button class="modal-btn" onclick="selectBattleSkill('charge')" style="margin:0;width:100%;text-align:left;">
        ⚡ 蓄力 <span style="display:block;font-size:0.65rem;color:#d4a574;font-weight:normal;">第一回合蓄力，第二回合伤害×2</span>
      </button>
    </div>
    <button class="modal-btn" onclick="cancelBattleSkill()" style="margin-top:12px;background:#333;border-color:#555;">取消</button>
  `;
  showModal('⚔️ 选择战斗策略', html);
}

/** 选择战斗策略 */
function selectBattleSkill(skill) {
  player._battleSkill = skill;
  player._chargeReady = false;
  closeModal();
  fight();
}

/** 取消战斗策略选择 */
function cancelBattleSkill() {
  player._battleSkill = null;
  player._chargeReady = false;
  closeModal();
}

/** 清空战斗技能状态 */
function clearBattleSkill() {
  player._battleSkill = null;
  player._chargeReady = false;
}

/** 手动模式：每回合策略选择弹窗 */
function showManualRoundChoice(round, eName, eHP, stats) {
  return new Promise((resolve) => {
    const hpPct = Math.floor(player.currentHP / stats.hp * 100);
    const enemyPct = Math.floor(eHP / (30 + (player.realmIndex + Math.floor(Math.random() * 3)) * 60 + 40) * 100);
    const html = `
      <div style="text-align:center;margin-bottom:10px;">
        <p style="font-size:0.85rem;font-weight:bold;">第 ${round} 回合</p>
        <p style="font-size:0.7rem;color:#8899aa;">
          🗡️ ${eName} HP: ${enemyPct}% &nbsp;|&nbsp; ❤️ 你 HP: ${hpPct}%
        </p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
        <button class="modal-btn" onclick="resolveManualRound('normal')" style="margin:0;flex:1;min-width:80px;">⚔️ 攻击</button>
        <button class="modal-btn" onclick="resolveManualRound('heavy')" style="margin:0;flex:1;min-width:80px;">💥 全力</button>
        <button class="modal-btn" onclick="resolveManualRound('guard')" style="margin:0;flex:1;min-width:80px;">🛡️ 防御</button>
        <button class="modal-btn" onclick="resolveManualRound('flee')" style="margin:0;flex:1;min-width:80px;background:#333;">🏃 逃跑</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;font-size:0.55rem;color:#8899aa;justify-content:center;">
        <span>⚔️ 普通</span>
        <span>💥 伤敌×1.5 受伤×1.3</span>
        <span>🛡️ 伤敌×0.6 受伤×0.5</span>
        <span>🏃 50%逃离</span>
      </div>
    `;
    window._resolveManualRound = resolve;
    showModal('⚔️ 选择本回合行动', html);
  });
}

/** 手动模式回合选择确认 */
function resolveManualRound(action) {
  if (window._resolveManualRound) {
    window._resolveManualRound(action);
    window._resolveManualRound = null;
  }
  closeModal();
}

/** BOSS战界面 */
function openBossFight() {
  if (!player.beatenBosses) player.beatenBosses = [];
  const available = BOSS_LIST.filter(b => b.realmReq <= player.realmIndex && !player.beatenBosses.includes(b.id));
  const beaten = BOSS_LIST.filter(b => player.beatenBosses.includes(b.id));
  let html = '<div style="max-height:350px;overflow-y:auto;">';
  if (available.length === 0) {
    html += '<p style="text-align:center;color:#8899aa;">当前境界没有可挑战的BOSS</p>';
  } else {
    available.forEach(b => {
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
      html += '<div><span style="font-weight:bold;">' + b.icon + ' ' + b.name + '</span><br><span style="font-size:0.6rem;color:#8899aa;">' + b.desc + '</span></div>';
      html += '<button class="quick-btn" style="color:var(--danger);" onclick="startBossFight(\'' + b.id + '\')">挑战</button>';
      html += '</div>';
    });
  }
  if (beaten.length > 0) {
    html += '<p style="font-size:0.6rem;color:#666;margin-top:8px;">已击败：' + beaten.map(b => b.icon + b.name).join('、') + '</p>';
  }
  html += '</div>';
  showModal('⚔️ BOSS挑战', html);
}

/** 开始BOSS战 */
async function startBossFight(bossId) {
  const boss = BOSS_LIST.find(b => b.id === bossId);
  if (!boss) return;

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
  const combatStats = {
    atk: stats.atk + compBonus.atk + skillAtkBonus + sectAtkBonus,
    def: stats.def + compBonus.def + skillDefBonus,
    hp: stats.maxHP + compBonus.hp
  };

  let eHP = boss.hp;
  const eAtk = boss.atk;
  const eDef = boss.def;
  let pDmgTotal = 0, eDmgTotal = 0, rounds = 0;

  // 算命先生占卜 - 战斗属性加成
  if (player._fortuneBuff) {
    if (player._fortuneBuff.apply.type === 'atkBoost') {
      const bonus = Math.floor(combatStats.atk * (player._fortuneBuff.apply.val - 1));
      combatStats.atk += bonus;
      player._fortuneBuff.remains--;
      addLog('🔮 占卜【' + player._fortuneBuff.name + '】生效，攻击+' + bonus, 'special');
      if (player._fortuneBuff.remains <= 0) player._fortuneBuff = null;
    } else if (player._fortuneBuff.apply.type === 'defBoost') {
      const bonus = Math.floor(combatStats.def * (player._fortuneBuff.apply.val - 1));
      combatStats.def += bonus;
      player._fortuneBuff.remains--;
      addLog('🔮 占卜【' + player._fortuneBuff.name + '】生效，防御+' + bonus, 'special');
      if (player._fortuneBuff.remains <= 0) player._fortuneBuff = null;
    }
  }

  addLog('⚔️ BOSS战：【' + boss.icon + ' ' + boss.name + '】出现了！', 'combat');
  showModal('⚔️ BOSS战中', '<div id="bossFightLog" style="text-align:center;font-size:0.7rem;line-height:1.8;"><p style="color:var(--gold);">🗡️ 迎战 ' + boss.name + '</p><p style="color:#8899aa;">HP: ' + boss.hp + ' | 攻击: ' + boss.atk + ' | 防御: ' + boss.def + '</p><hr style="border-color:#2c3e50;"><div id="bossFightDetail" style="text-align:left;color:#aab8c2;"></div></div>');

  while (eHP > 0 && player.currentHP > 0 && rounds < 10) {
    rounds++;
    let pDmg = Math.max(Math.floor(combatStats.atk * 0.05), combatStats.atk - eDef + Math.floor(Math.random() * 10));
    eHP -= pDmg;
    pDmgTotal += pDmg;
    let roundDetail = '⚔️ 回合' + rounds + '：造成' + pDmg + '伤害';
    if (eHP > 0) {
      let eDmg = Math.max(Math.floor(eAtk * 0.05), eAtk - combatStats.def + Math.floor(Math.random() * 8));
      // 天罚之体：概率触发天雷追加伤害
      if (player.physique?.effect?.thunderStrike && Math.random() < 0.15) {
        const thunder = 10 + Math.floor(Math.random() * 20);
        eHP -= thunder;
        addLog('⚡ 天罚之体！天雷追加' + thunder + '伤害！', 'combat');
      }
      // 凤凰涅槃体：伤害反弹
      if (player.physique?.effect?.reflectDamage && Math.random() < 0.2) {
        const reflect = Math.floor(eDmg * 0.3);
        eHP -= reflect;
        addLog('🔥 凤凰涅槃体反弹' + reflect + '伤害！', 'combat');
      }
      player.currentHP -= eDmg;
      eDmgTotal += eDmg;
      // 混沌剑体吸血
      if (player.talent?.effect?.lifesteal) {
        const heal = Math.floor(pDmg * player.talent.effect.lifesteal);
        player.currentHP = Math.min(combatStats.hp, player.currentHP + heal);
      }
      roundDetail += '，受' + eDmg + '伤害';
    }
    addLog(roundDetail, 'combat');
    // 更新弹窗内战斗详情
    const detailEl = document.getElementById('bossFightDetail');
    if (detailEl) {
      detailEl.innerHTML += '<div>' + roundDetail + ' | BOSS HP: ' + Math.max(0, eHP) + '</div>';
      detailEl.scrollTop = detailEl.scrollHeight;
    }
    requestUIUpdate();
    await new Promise(r => setTimeout(r, 100));
    if (eHP <= 0) break;
  }

  if (eHP <= 0 && player.currentHP > 0) {
    const r = boss.rewards;
    player.spiritStones += r.stones;
    player.exp += r.exp;
    if (r.item) addToBag(r.item, boss.itemType || 'consumable', 1);
    if (!player.beatenBosses) player.beatenBosses = [];
    player.beatenBosses.push(boss.id);
    flashReward();
    // 算命先生占卜 - 灵石获取加成
    if (player._fortuneBuff && player._fortuneBuff.apply.type === 'stoneBoost') {
      const stoneBonus = Math.floor(r.stones * (player._fortuneBuff.apply.val - 1));
      player.spiritStones += stoneBonus;
      player._fortuneBuff.remains--;
      addLog('🔮 占卜【' + player._fortuneBuff.name + '】生效，灵石+' + stoneBonus, 'special');
      if (player._fortuneBuff.remains <= 0) player._fortuneBuff = null;
    }
    addLog('🏆 击败【' + boss.name + '】！灵石+' + r.stones + '，修为+' + r.exp + (r.item ? '，获得【' + r.item + '】' : ''), 'reward');
    addLifeEvent('击败【' + boss.name + '】');
    checkAchievements();
    closeModal();
  } else {
    addLog('💀 被【' + boss.name + '】击败……', 'danger');
    closeModal();
    handleDeath(false);
    requestUIUpdate();
    return;
  }
  player.combatCooldown = 3;
  addMonths(1);
  regenerate();
  requestUIUpdate();
}

/** 游戏结束弹窗（含10种嘲讽） */
function showGameOver() {
  saveLifeRecord();
  const taunts = [
    // 1. 直接开骂
    { title: '💀 菜', msg: '菜就多练，别搁这浪费仙缘。下辈子注意点。' },
    // 2. 阴阳怪气
    { title: '💀 哎呀', msg: '哎呀，这不是大名鼎鼎的修仙奇才吗？怎么躺地上了？起来继续啊——哦起不来了，那算了。' },
    // 3. 摆烂自嘲
    { title: '💀 安慰奖', msg: '没事，你已经很棒了……棒到连一只山魈都打不过。真的，特别棒。' },
    // 4. 哲学
    { title: '💀 哲理', msg: '死亡不是终点。但对你来说，可能是最快的终点。' },
    // 5. 现实暴力
    { title: '💀 建议', msg: '建议卸载游戏，找个班上。修仙不适合你，搬砖适合。' },
    // 6. 装傻
    { title: '💀 疑惑', msg: '咦？你怎么死了？哦——我看看战斗记录……嗯，菜死的。' },
    // 7. 毒鸡汤
    { title: '💀 毒鸡汤', msg: '上天是公平的：它给了你修仙的机会，但没有给你修仙的命。' },
    // 8. 对比伤害
    { title: '💀 别人家的孩子', msg: '隔壁王老头八十岁才开始修仙，人家现在都筑基了。你呢？哦，你死了。' },
    // 9. 冷漠无情
    { title: '💀 冷漠', msg: '下一位。' },
    // 10. 系统讽刺
    { title: '💀 系统提示', msg: '检测到玩家操作过于下饭，已自动保存录像并上传修仙界论坛——播放量已破万。恭喜。' }
  ];
  const t = taunts[Math.floor(Math.random() * taunts.length)];
  const count = player.deathCount || 1;
  const titleExtra = count >= 5 ? '（第' + count + '次了，阴德亏损' + Math.floor(count / 5) + '点）' : '';
  const html = '<p style="text-align:center;font-size:0.85rem;margin-bottom:12px;">' + t.msg + '</p>' +
    '<p style="text-align:center;font-size:0.6rem;color:#8899aa;">累计死亡：' + count + '次' + titleExtra + '</p>' +
    '<div class="modal-btn-group">' +
    '<button class="modal-btn" onclick="closeModal();showSaveManager(\'load\');">📂 读档</button>' +
    '<button class="modal-btn" onclick="closeModal();newGame();">🆕 重新开始</button>' +
    '</div>';
  showModal(t.title, html);
  // 标记游戏结束，防止按 Escape/点击遮罩跳过死亡
  player._gameOverModal = true;
}

/** 散仙结局处理 */
function doBreakSanXian() {
  saveLifeRecord();
  addLog('☁️ 你放下执念，不再追求仙帝之位，化作散仙逍遥天地间。', 'special');
  const html = '<p style="text-align:center;font-size:1rem;color:#8899aa;">☁️</p>' +
    '<p style="text-align:center;font-size:0.85rem;color:var(--gold);">你不愿与天争，选择做了散仙。</p>' +
    '<p style="text-align:center;font-size:0.7rem;color:#8899aa;">从此天地任你遨游，不再受寿元束缚。</p>' +
    '<div class="modal-btn-group">' +
    '<button class="modal-btn" onclick="closeModal();startNewWeek();closeModal();">🔄 轮回转世</button>' +
    '<button class="modal-btn" onclick="closeModal();">继续游玩</button>' +
    '</div>';
  showModal('☁️ 散仙逍遥', html);
  checkAchievements();
}

/** 证道仙帝（调用后续流程） */
function doBreakXianDi() {
  addLog('⚡👑 三重天劫降临！雷劫→心魔→红尘劫，证道仙帝的最后考验！', 'combat');
  startHeavenlyTribulation(() => {
    addLog('⚡ 雷劫已渡！心魔来袭...', 'success');
    startInnerDemonFight(() => {
      addLog('🧘 心魔已斩！红尘劫起...', 'success');
      startHongChenJie(() => {
        addLog('👑 红尘劫尽！证道仙帝！', 'reward');
        player.exp -= getExpNeeded();
        proceedBreakthrough();
      });
    });
  });
}

/** 心魔塔界面 */
function openTower() {
  if (!player.towerFloor) player.towerFloor = 0;
  let html = '<div style="max-height:400px;overflow-y:auto;">';
  TOWER_FLOORS.forEach(f => {
    const cleared = player.towerFloor >= f.floor;
    const canFight = player.towerFloor === f.floor - 1;
    html += '<div class="stat-card" style="margin-bottom:6px;' + (cleared ? 'opacity:0.6;' : '') + '">';
    html += '<h3>' + (cleared ? '✅' : '🔥') + ' 第' + f.floor + '层 · ' + f.name + '</h3>';
    html += '<div style="font-size:0.65rem;color:#8899aa;">' + f.desc + '</div>';
    html += '<div style="font-size:0.6rem;color:#8899aa;">心魔 HP:' + f.demonHp + ' 攻:' + f.demonAtk + ' ｜ 奖励：灵石+' + f.reward.stones + ' 修为+' + f.reward.exp + (f.reward.item ? ' 【' + f.reward.item + '】' : '') + '</div>';
    if (canFight) {
      html += '<button class="quick-btn" style="margin-top:4px;color:var(--danger);" onclick="closeModal();showTowerStrategy(' + f.floor + ');">挑战</button>';
    } else if (cleared) {
      html += '<span style="font-size:0.6rem;color:var(--success);">已通关</span>';
    } else {
      html += '<span style="font-size:0.6rem;color:#666;">先通关上一层</span>';
    }
    html += '</div>';
  });
  html += '</div>';
  showModal('🏯 心魔塔', html);
}

/** 心魔塔策略选择 */
function showTowerStrategy(floor) {
  var f = TOWER_FLOORS.find(function(x) { return x.floor === floor; });
  if (!f) return;
  var html = '<div class="stat-card" style="margin-bottom:8px;text-align:center;">';
  html += '<h3>第' + floor + '层 · ' + f.name + '</h3>';
  html += '<div style="font-size:0.65rem;color:#8899aa;margin-bottom:8px;">' + f.desc + '</div>';
  html += '</div>';
  html += '<p style="font-size:0.7rem;color:#8899aa;margin-bottom:8px;">选择应对方式：</p>';
  html += '<div style="display:flex;flex-direction:column;gap:6px;">';
  html += '<button class="modal-btn" onclick="closeModal();startTowerFight(' + floor + ',\'combat\');">⚔️ 正面硬刚</button>';
  html += '<button class="modal-btn" onclick="closeModal();startTowerFight(' + floor + ',\'meditate\');" style="background:#1a2a3a;border-color:#3498db;">🧘 禅定破魔（消耗灵力减伤心魔）</button>';
  html += '<button class="modal-btn" onclick="closeModal();startTowerFight(' + floor + ',\'trick\');" style="background:#2a1a1a;border-color:#e67e22;">🎲 剑走偏锋（高风险高回报）</button>';
  html += '</div>';
  showModal('🏯 心魔塔 · 策略', html);
}

/** 心魔塔战斗 */
async function startTowerFight(floor, strategy) {
  const f = TOWER_FLOORS.find(x => x.floor === floor);
  if (!f) return;

  const stats = getEffectiveStats();
  const compBonus = getCompanionPetBonus();
  const skillAtkBonus = getSkillBonus('combat');
  const skillDefBonus = getSkillBonus('defense');
  const towerAtk = stats.atk + compBonus.atk + skillAtkBonus;
  const towerDef = stats.def + compBonus.def + skillDefBonus;
  let dHP = f.demonHp;
  
  // 策略加成
  if (strategy === 'meditate') {
    var mpCost = Math.min(player.currentMP, 40);
    if (mpCost > 0) {
      dHP -= Math.floor(mpCost * 2);
      player.currentMP -= mpCost;
      addLog('🧘 禅定破魔消耗' + mpCost + '灵力，心魔-' + Math.floor(mpCost * 2), 'success');
    }
  } else if (strategy === 'trick') {
    if (Math.random() < 0.4) {
      dHP = 0;
      addLog('🎲 剑走偏锋成功！直击心魔要害！', 'reward');
    } else {
      player.currentHP = Math.max(1, player.currentHP - Math.floor(f.demonAtk * 0.5));
      addLog('🎲 剑走偏锋失败，被心魔反噬！', 'danger');
    }
  }
  
  const dAtk = f.demonAtk;
  let pDmgTotal = 0, dDmgTotal = 0, rounds = 0;

  addLog('🏯 心魔塔 第' + floor + '层：' + f.name, 'combat');
  showModal('🏯 心魔塔', '<div id="towerFightLog" style="font-size:0.7rem;line-height:1.8;"><p style="color:var(--danger);">🔥 ' + f.name + '</p><p style="color:#8899aa;">心魔 HP:' + f.demonHp + '</p><hr style="border-color:#2c3e50;"><div id="towerDetail" style="text-align:left;color:#aab8c2;"></div></div>');

  while (dHP > 0 && player.currentHP > 0 && rounds < 10) {
    rounds++;
    let pDmg = Math.max(Math.floor(towerAtk * 0.05), towerAtk - 5 + Math.floor(Math.random() * 10));
    dHP -= pDmg;
    pDmgTotal += pDmg;
    let dDmg = 0;
    if (dHP > 0) {
      dDmg = Math.max(Math.floor(dAtk * 0.05), dAtk - towerDef + Math.floor(Math.random() * 8));
      player.currentHP -= dDmg;
      dDmgTotal += dDmg;
    }
    addLog('⚔️ 回合' + rounds + '：造成' + pDmg + '伤害' + (dHP > 0 ? '，受' + dDmg + '伤害' : ''), 'combat');
    const detail = document.getElementById('towerDetail');
    if (detail) {
      detail.innerHTML += '<div>回合' + rounds + '：造成' + pDmg + '伤害' + (dHP > 0 ? '，受' + dDmg + '伤害' : '') + ' | 心魔HP: ' + Math.max(0, dHP) + '</div>';
    }
    requestUIUpdate();
    await new Promise(r => setTimeout(r, 100));
  }

  closeModal();
  if (dHP <= 0 && player.currentHP > 0) {
    const r = f.reward;
    player.spiritStones += r.stones;
    player.exp += r.exp;
    if (r.item) addToBag(r.item, 'consumable', 1);
    player.towerFloor = Math.max(player.towerFloor || 0, floor);
    flashReward();

    // 第10层特殊结局
    if (floor === 10) {
      addLog('👑 你在镜中直面真我，看破虚妄，心魔尽散！', 'reward');
      addLog('✨ 心魔塔十层尽破，你已降伏其心，道心坚如磐石！', 'special');
      addLifeEvent('🏯 通关心魔塔第十层·降伏其心');
      // 永久属性奖励
      player.baseAtk += 5;
      player.baseDef += 5;
      addLog('🗡️ 突破心魔界限！攻击+5，防御+5（永久）', 'success');
      // 心魔归零
      player.innerDemon = 0;
      addLog('🧘 心魔尽散，道心清明（心魔已清零）', 'success');
      // 检查称号成就
      checkAchievements();
    }

    addLog('🏯 通关心魔塔第' + floor + '层！灵石+' + r.stones + '，修为+' + r.exp + (r.item ? '，获得【' + r.item + '】' : ''), 'reward');
  } else {
    addLog('💀 被心魔击败……', 'danger');
    handleDeath(false);
    return;
  }
  addMonths(1);
  regenerate();
  requestUIUpdate();
}

/** 大地图探索 */
function openMap() {
  let html = '<div style="max-height:400px;overflow-y:auto;">';
  MAP_REGIONS.forEach(r => {
    const unlocked = player.realmIndex >= r.realmReq;
    html += '<div class="stat-card" style="margin-bottom:6px;' + (unlocked ? '' : 'opacity:0.5;') + '">';
    html += '<h3>' + r.icon + ' ' + r.name + '</h3>';
    html += '<div style="font-size:0.65rem;color:#8899aa;">' + r.desc + '（需求：' + REALMS[r.realmReq].name + '）</div>';
    html += '<div style="font-size:0.6rem;color:#8899aa;">可能获得：灵石' + r.rewards.stones[0] + '~' + r.rewards.stones[1] + ' 修为' + r.rewards.exp[0] + '~' + r.rewards.exp[1] + '</div>';
    if (unlocked) {
      html += '<button class="quick-btn" style="margin-top:4px;" onclick="closeModal();exploreMap(\'' + r.id + '\');">🗺️ 探索</button>';
    } else {
      html += '<span style="font-size:0.6rem;color:#666;">未解锁</span>';
    }
    html += '</div>';
  });
  html += '</div>';
  showModal('🗺️ 大地图', html);
}

/** 探索指定区域 */
function exploreMap(regionId) {
  const region = MAP_REGIONS.find(r => r.id === regionId);
  if (!region) return;

  // 消耗体力
  player.currentHP -= 5 + Math.floor(Math.random() * 10);

  // 随机收益
  const stones = Math.floor(Math.random() * (region.rewards.stones[1] - region.rewards.stones[0] + 1) + region.rewards.stones[0]);
  const expGain = Math.floor(Math.random() * (region.rewards.exp[1] - region.rewards.exp[0] + 1) + region.rewards.exp[0]);

  player.spiritStones += stones;
  player.exp += expGain;

  // 随机事件
  const eventMsg = region.events[Math.floor(Math.random() * region.events.length)];

  addLog('🗺️ 探索【' + region.name + '】灵石+' + stones + ' 修为+' + expGain, 'reward');
  addLog('📖 ' + eventMsg, 'special');
  // 区域专属奇遇
  if (Math.random() < 0.3) triggerMapSpecial(region);
  pulseExpBar();

  // 小概率额外收获
  if (Math.random() < 0.15) {
    const mats = ['草药', '矿石', '灵泉水'];
    const mat = mats[Math.floor(Math.random() * mats.length)];
    player.materials[mat] = (player.materials[mat] || 0) + 1;
    addLog('🌿 顺带采集到【' + mat + '】×1', 'reward');
  }

  addMonths(0.5);
  // 体魄任务：探索计数
  player._exploreCount = (player._exploreCount || 0) + 1;
  regenerate();
  checkAchievements();
  requestUIUpdate();
}

/** 地图区域专属奇遇 */
const MAP_SPECIALS = {
  r1: { msg: '🏘️ 青牛镇老修士传了你一招', good: true, action: function(p) { p.exp += 30; } },
  r2: { msg: '⛰️ 落霞山采到千年灵芝', good: true, action: function(p) { p.materials['草药'] = (p.materials['草药'] || 0) + 3; } },
  r3: { msg: '🌊 云梦泽海市蜃楼陷阱！损失体力', good: false, action: function(p) { p.currentHP = Math.max(1, p.currentHP - 20); } },
  r4: { msg: '🏛️ 苍梧秘境残碑发光，获得上古功法', good: true, action: function(p) { p.exp += 80; } },
  r5: { msg: '🌋 黑风岭击退妖兽，捡到稀有矿石', good: true, action: function(p) { p.materials['矿石'] = (p.materials['矿石'] || 0) + 5; } },
  r6: { msg: '🏔️ 天池淬体三天三夜，肉身增强', good: true, action: function(p) { var s = getEffectiveStats(); p.currentHP = Math.min(s.maxHP, p.currentHP + 30); } },
  r7: { msg: '🌀 归墟之地捡到来自未来的遗物', good: true, action: function(p) { p.exp += 200; p.spiritStones += 100; } }
};
function triggerMapSpecial(region) {
  if (!region || !MAP_SPECIALS[region.id]) return;
  var sp = MAP_SPECIALS[region.id];
  addLog('✨ ' + sp.msg, sp.good ? 'special' : 'danger');
  if (sp.action) sp.action(player);
  requestUIUpdate();
}

console.log('✅ 核心战斗/天劫/心魔/红尘劫引擎已加载');
