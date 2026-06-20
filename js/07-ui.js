// ================================================================
// 第 7 部分：UI渲染 / 指令处理 / 初始化整合
// ================================================================

// ==================== 日志系统 ====================
const LOG_MAX = 100;

/** 添加日志条目 */
function addLog(msg, type = 'system') {
  const area = document.getElementById('logArea');
  if (!area) {
    console.log('[' + type + ']', msg);
    return;
  }

  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  entry.textContent = msg;
  entry.dataset.type = type;

  // 防止重复添加相同内容（可选）
  area.appendChild(entry);

  // 限制数量
  while (area.children.length > LOG_MAX) {
    area.removeChild(area.firstChild);
  }

  // 滚动到底部
  area.scrollTop = area.scrollHeight;

  // 应用当前筛选
  applyLogFilter();
}

/** 应用日志筛选 */
function applyLogFilter() {
  const filter = player?.logFilter || 'all';
  const entries = document.querySelectorAll('.log-entry');
  entries.forEach(e => {
    if (filter === 'all') {
      e.style.display = '';
    } else {
      e.style.display = e.dataset.type === filter ? '' : 'none';
    }
  });
}

/** 清空日志 */
function clearLogs() {
  const area = document.getElementById('logArea');
  if (area) {
    area.innerHTML = '';
    addLog('日志已清空', 'system');
  }
}

// ==================== 模态框系统 ====================

/** 显示模态框（通用） */
function showModal(title, bodyHTML) {
  const overlay = document.getElementById('genericModal');
  if (!overlay) return;

  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = bodyHTML;

  overlay.classList.remove('hidden');
  overlay.classList.add('visible');
}

/** 关闭模态框 */
function closeModal() {
  const overlay = document.getElementById('genericModal');
  if (overlay) {
    overlay.classList.remove('visible');
    overlay.classList.add('hidden');
  }
  _eventLock = false;
  if (player) player._gameOverModal = false;
}

/** 关闭特定模态框（用于内联onclick） */
function closeModalById(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('visible');
    el.classList.add('hidden');
  }
}

// ==================== UI更新系统 ====================

/** 添加人生大事记录 */
function addLifeEvent(text) {
  if (!player) return;
  if (!player.lifeEvents) player.lifeEvents = [];
  player.lifeEvents.push({ text: text, age: formatAge(player.ageMonths), realm: getRealmFullName() });
  if (player.lifeEvents.length > 50) player.lifeEvents.shift();
}

window.addLifeEvent = addLifeEvent;

/** 保存当前人生记录到轮回簿（跨周目持久化） */
function saveLifeRecord() {
  if (!player) return;
  const records = JSON.parse(localStorage.getItem('_pastLifeRecords') || '[]');
  const realm = getCurrentRealm();
  records.push({
    date: new Date().toLocaleDateString(),
    title: realm.name === '仙帝' ? '👑 证道仙帝' : '💀 陨落',
    realm: realm.name,
    age: formatAge(player.ageMonths),
    cultivates: player._cultivateCount || 0,
    fights: player._fightWins || 0,
    explores: player._exploreCount || 0,
    companions: player.companions.length,
    pets: player.pets.length,
    achieves: (player.achievements || []).length,
    deaths: player.deathCount || 0,
    weekly: (player.weeklyCount || 0) + 1,
    events: player.lifeEvents || []
  });
  // 最多保留9世记录
  if (records.length > 9) records.shift();
  localStorage.setItem('_pastLifeRecords', JSON.stringify(records));
}

// ==================== 音频控制 ====================

var _musicEnabled = true;
var _musicVolume = 0.5;
var _currentBgm = null;

/** 初始化音频 */
function initAudio() {
  try {
    var saved = localStorage.getItem('_audioSettings');
    if (saved) { var s = JSON.parse(saved); _musicEnabled = s.enabled !== false; _musicVolume = s.volume || 0.5; }
    var menuAudio = document.getElementById('bgmMenu');
    var gameAudio = document.getElementById('bgmGame');
    if (menuAudio) menuAudio.src = 'audio/bgm_menu.mp3';
    if (gameAudio) gameAudio.src = 'audio/bgm_game.mp3';
  } catch(e) {}
}

/** 播放指定BGM */
function playBgm(id) {
  if (!_musicEnabled) return;
  try {
    if (_currentBgm === id) return;
    var allAudios = [document.getElementById('bgmMenu'), document.getElementById('bgmGame')];
    allAudios.forEach(function(a) { if (a) { a.pause(); a.currentTime = 0; } });
    var audio = document.getElementById(id);
    if (audio) { audio.volume = _musicVolume; audio.play().catch(function(e) { if (e) console.log('BGM play error:', e.message); }); _currentBgm = id; }
  } catch(e) {}
}

/** 停止所有BGM */
function stopBgm() {
  try {
    [document.getElementById('bgmMenu'), document.getElementById('bgmGame')].forEach(function(a) { if (a) { a.pause(); a.currentTime = 0; } });
    _currentBgm = null;
  } catch(e) {}
}

/** 显示设置弹窗 */
function showSettings() {
  var html = '<div style="text-align:center;">';
  html += '<div style="margin:16px 0;">';
  html += '<label style="font-size:0.85rem;color:var(--gold);">🎵 背景音乐</label>';
  html += '<div style="margin-top:8px;">';
  html += '<button class="quick-btn" style="min-width:80px;' + (!_musicEnabled ? 'opacity:0.4;' : '') + '" onclick="toggleMusic();closeModal();showSettings();">' + (_musicEnabled ? '🔊 已开启' : '🔇 已关闭') + '</button>';
  html += '</div></div>';
  html += '<div style="margin:16px 0;">';
  html += '<label style="font-size:0.85rem;color:var(--gold);">🔊 音量</label>';
  html += '<div style="margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px;">';
  html += '<span style="font-size:0.7rem;color:#8899aa;">弱</span>';
  html += '<input type="range" min="0" max="100" value="' + Math.round(_musicVolume * 100) + '" style="width:160px;" onchange="setVolume(this.value/100);closeModal();showSettings();">';
  html += '<span style="font-size:0.7rem;color:#8899aa;">强</span>';
  html += '</div>';
  html += '<div style="font-size:0.7rem;color:#8899aa;margin-top:4px;">当前：' + Math.round(_musicVolume * 100) + '%</div>';
  html += '</div></div>';
  html += '<hr style="border-color:#2c3e50;margin:12px 0;">';
  html += '<button class="quick-btn" style="width:100%;color:#8899aa;border-color:#5a6a7a;" onclick="closeModal();returnToTitle();">🏠 返 回 标 题</button>';
  showModal('⚙️ 设置', html);
}

/** 感谢名单 */
function showThanks() {
  var html = '<div style="text-align:center;font-size:0.85rem;line-height:2;">';
  html += '<p>🙏 感谢龙族同人群群主提供技术帮助和思路</p>';
  html += '<p>💰 感谢龙族同人群运气与贫穷之王赞助88元</p>';
  html += '<div class="modal-btn-group" style="margin-top:12px;">';
  html += '<button class="modal-btn" onclick="closeModal();">收下这份谢意</button>';
  html += '</div>';
  html += '</div>';
  showModal('📜 感谢名单', html);
}

/** 返回标题画面 */
function returnToTitle() {
  stopBgm();
  var splash = document.getElementById('splashScreen');
  if (splash) {
    splash.style.display = '';
    splash.classList.remove('hidden');
  }
  // 清除战斗/事件状态
  player.pendingEvent = null;
  _eventLock = false;
  player._fightInProgress = false;
  fightingCompanion = null;
  var o = document.getElementById('fightOverlay');
  if (o) o.style.display = 'none';
  // 播放菜单BGM
  setTimeout(function() { playBgm('bgmMenu'); }, 300);
}
window.returnToTitle = returnToTitle;

/** 切换音乐开关 */
function toggleMusic() {
  _musicEnabled = !_musicEnabled;
  if (_musicEnabled) {
    // 恢复当前场景的音乐
    var splash = document.getElementById('splashScreen');
    if (splash && !splash.classList.contains('hidden')) playBgm('bgmMenu');
    else playBgm('bgmGame');
  } else {
    stopBgm();
  }
  saveAudioSettings();
}

/** 设置音量 */
function setVolume(v) {
  _musicVolume = Math.max(0, Math.min(1, v));
  var allAudios = [document.getElementById('bgmMenu'), document.getElementById('bgmGame')];
  allAudios.forEach(function(a) { if (a) a.volume = _musicVolume; });
  saveAudioSettings();
}

/** 保存音频设置 */
function saveAudioSettings() {
  try { localStorage.setItem('_audioSettings', JSON.stringify({ enabled: _musicEnabled, volume: _musicVolume })); } catch(e) {}
}

window.showSettings = showSettings;
window.showThanks = showThanks;
window.toggleMusic = toggleMusic;
window.setVolume = setVolume;
window.playBgm = playBgm;
window.stopBgm = stopBgm;

/** 展示轮回簿（生平记录） */
function showLifeRecords() {
  const records = JSON.parse(localStorage.getItem('_pastLifeRecords') || '[]');
  if (records.length === 0) {
    showModal('📜 轮回簿', '<p style="text-align:center;color:#8899aa;">暂无记录</p>');
    return;
  }
  let html = '<div style="max-height:400px;overflow-y:auto;">';
  // 从新到旧
  [...records].reverse().forEach((r, i) => {
    html += '<div class="stat-card" style="margin-bottom:8px;">';
    html += '<h3>' + r.title + ' · 第' + r.weekly + '世</h3>';
    html += '<div style="font-size:0.65rem;line-height:1.6;color:#8899aa;">';
    html += '🕯️ ' + r.age + ' · ' + r.realm + '<br>';
    html += '🧘修炼' + r.cultivates + '次 ⚔️战斗' + r.fights + '胜 🗺️探索' + r.explores + '次<br>';
    html += '👥道友' + r.companions + '人 🐾灵兽' + r.pets + '只 🏆成就' + r.achieves + '个<br>';
    if (r.physique || r.talent) html += '💪' + (r.physique || '?') + ' ✨' + (r.talent || '?') + '<br>';
    if (r.deaths > 0) html += '💀死亡' + r.deaths + '次 ';
    html += '📅 ' + r.date;
    html += '</div>';
    // 大事录
    if (r.events && r.events.length > 0) {
      html += '<div style="font-size:0.55rem;color:#5a6a7a;margin-top:4px;border-top:1px solid #1e3044;padding-top:4px;">';
      r.events.forEach(function(e) {
        html += '▸ ' + e.text + '<br>';
      });
      html += '</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  showModal('📜 轮回簿 · 累世记录', html);
}

window.saveLifeRecord = saveLifeRecord;
window.showLifeRecords = showLifeRecords;
function requestUIUpdate() {
  forceUI();
}

// ==================== 微动效触发器 ====================

/** 经验条脉冲动画 */
function pulseExpBar() {
  const bar = document.getElementById('expBar');
  if (bar) { bar.classList.remove('exp-pulse'); void bar.offsetWidth; bar.classList.add('exp-pulse'); }
}

/** 扣血闪烁 */
function flashDamage() {
  const container = document.getElementById('app');
  if (container) { container.classList.remove('damage-flash'); void container.offsetWidth; container.classList.add('damage-flash'); }
}

/** 获得闪光 */
function flashReward(element) {
  if (!element) element = document.getElementById('app');
  element.classList.remove('reward-flash'); void element.offsetWidth; element.classList.add('reward-flash');
}

/** 突破光晕 */
function flashBreakthrough() {
  document.body.classList.remove('break-glow'); void document.body.offsetWidth; document.body.classList.add('break-glow');
}

/** 数字弹跳效果 */
function popNumber(el) {
  if (el) { el.classList.remove('number-pop'); void el.offsetWidth; el.classList.add('number-pop'); }
}

/** 强制刷新UI */
function forceUI() {
  if (!player) return;

  const realm = getCurrentRealm();
  const stats = getEffectiveStats();
  const expNeeded = getExpNeeded();
  const expPercent = Math.min(100, Math.floor((player.exp / expNeeded) * 100));

  // ---- 境界 ----
  document.getElementById('realmIcon').textContent = realm.icon;
  document.getElementById('realmName').textContent = realm.name;
  document.getElementById('realmLayer').textContent = realm.layers > 1 ? '第' + player.layer + '层' : '';

  // 境界背景图
  const realmDisplay = document.querySelector('.realm-display');
  if (realmDisplay) {
    const idx = Math.min(player.realmIndex, 9);
    realmDisplay.style.backgroundImage = "linear-gradient(135deg, rgba(26,10,10,0.7), rgba(26,18,10,0.7)), url('images/bg-realm-" + idx + ".jpg')";
    realmDisplay.style.backgroundSize = 'cover';
    realmDisplay.style.backgroundPosition = 'center';
  }

  // ---- 寿元 ----
  document.getElementById('ageText').textContent = formatAge(player.ageMonths);
  const maxLife = getMaxLifeMonths();
  // 鬼修：隐藏寿元，显示永生
  if (player._ghostCultivator) {
    document.getElementById('maxAgeText').textContent = '👻 鬼修·永生';
    document.getElementById('lifespanStatus').textContent = '👻 逆天改命';
  } else {
    document.getElementById('maxAgeText').textContent = isFinite(maxLife) ? formatAge(maxLife) : '永生';
    if (isFinite(maxLife)) {
      const ratio = player.ageMonths / maxLife;
      let statusText = '';
      if (ratio < 0.2) statusText = '🌱 春秋鼎盛';
      else if (ratio < 0.4) statusText = '🌸 风华正茂';
      else if (ratio < 0.6) statusText = '🍂 人到中年';
      else if (ratio < 0.8) statusText = '🍁 年过半百';
      else if (ratio < 0.95) statusText = '🕯️ 垂垂老矣';
      else statusText = '💀 大限将至';
      document.getElementById('lifespanStatus').textContent = statusText;
    } else {
      document.getElementById('lifespanStatus').textContent = '✨ 永生';
    }
  }

  // ---- 体魄 ----
  document.getElementById('physiqueText').textContent = player.physique ? player.physique.name : '凡体';

  // ---- 修为 ----
  document.getElementById('expBar').style.width = expPercent + '%';
  document.getElementById('expText').textContent = player.exp + '/' + expNeeded;

  // ---- 状态 ----
  document.getElementById('hpText').textContent = Math.floor(player.currentHP) + '/' + stats.maxHP;
  document.getElementById('mpText').textContent = Math.floor(player.currentMP) + '/' + stats.maxMP;
  document.getElementById('hpBar').style.width = Math.floor((player.currentHP / stats.maxHP) * 100) + '%';
  document.getElementById('mpBar').style.width = Math.floor((player.currentMP / stats.maxMP) * 100) + '%';
  document.getElementById('atkText').textContent = stats.atk;
  document.getElementById('defText').textContent = stats.def;
  document.getElementById('spiritStone').textContent = player.spiritStones + ' 💎';
  // 心魔状态文字
  const demon = player.innerDemon || 0;
  let demonText = '';
  if (demon <= 20) demonText = '🧘 心神安宁';
  else if (demon <= 50) demonText = '😤 略感烦躁';
  else if (demon <= 80) demonText = '👿 心魔渐生';
  else demonText = '💀 濒临失控';
  document.getElementById('innerDemonText').textContent = demonText;

  // ---- 装备 ----
  // 装备显示（含属性）
  const slots = [
    { id: 'weaponSlot', key: 'weapon' },
    { id: 'armorSlot', key: 'armor' },
    { id: 'accessorySlot', key: 'accessory' },
    { id: 'artifactSlot', key: 'artifact' }
  ];
  slots.forEach(({ id, key }) => {
    const eq = player.equipment[key];
    const el = document.getElementById(id);
    if (el) {
      if (eq) {
        let statsStr = '';
        if (eq.stats) {
          const parts = [];
          for (const [k, v] of Object.entries(eq.stats)) {
            if (k === 'all') parts.push(v);
            else parts.push('+' + v);
          }
          statsStr = ' [' + parts.join('/') + ']';
        }
        el.textContent = eq.name + statsStr;
        el.className = 'slot-value';
        el.title = eq.name + ' - ' + (eq.desc || statsStr);
      } else {
        el.textContent = '空';
        el.className = 'slot-value empty';
      }
    }
  });

  // ---- 命格 ----
  document.getElementById('fateInt').textContent = player.fate.intelligence;
  document.getElementById('fatePhy').textContent = player.fate.physique;
  document.getElementById('fateLuck').textContent = player.fate.luck;
  document.getElementById('fateFocus').textContent = player.fate.focus;

  // ---- 灵根 ----
  const sr = player.spiritualRoots;
  if (sr) {
    const rootEls = { metal: 'rootMetal', wood: 'rootWood', water: 'rootWater', fire: 'rootFire', earth: 'rootEarth' };
    Object.entries(rootEls).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = sr[key] !== undefined ? sr[key] : '-';
        el.style.cursor = 'pointer';
        el.onclick = function() { showRootCultivate(key); };
        el.title = '点击修炼此灵根';
      }
    });
    document.getElementById('spiritualRootCard').style.display = '';
  } else {
    document.getElementById('spiritualRootCard').style.display = 'none';
  }

  // ---- 天赋 ----
  const talentDisplay = document.getElementById('talentDisplay');
  if (player.talent) {
    talentDisplay.innerHTML = '✨ ' + player.talent.level + '·' + player.talent.name;
  } else {
    talentDisplay.innerHTML = '✨ 天赋未觉醒';
  }

  // ---- 战斗模式 ----
  const modeBtn = document.getElementById('battleModeBtn');
  if (modeBtn) {
    modeBtn.textContent = player.battleMode === 'auto' ? '⚡自动' : '🛠️手动';
    modeBtn.title = player.battleMode === 'auto' ? '当前：自动模式（点击切换手动）' : '当前：手动模式（点击切换自动）';
  }

  // 管理员模式指示
  if (_adminMode) {
    const adminBadge = document.getElementById('adminBadge') || (() => {
      const b = document.createElement('span');
      b.id = 'adminBadge';
      b.className = 'talent-badge';
      b.style.cssText = 'background:#5a1a1a;border-color:#c0392b;color:#ff6b6b;cursor:pointer;';
      b.textContent = '🛡️ 管理员';
      b.title = '管理员模式已开启（点击打开后台）';
      b.onclick = function(){ showAdminPanel(); };
      document.querySelector('.header-right').appendChild(b);
      return b;
    })();
    adminBadge.style.display = '';
  } else {
    const ab = document.getElementById('adminBadge');
    if (ab) ab.style.display = 'none';
  }

  // ---- 道友 ----
  const compList = document.getElementById('companionList');
  if (player.companions.length === 0) {
    compList.textContent = '暂无道友';
    compList.style.color = '#8899aa';
  } else {
    const dao = player.companions.find(c => c.isDaoCompanion);
    const list = player.companions.map(c => c.name + (c.isDaoCompanion ? '💕' : '')).join('、');
    compList.textContent = list;
    compList.style.color = '';
  }

  // ---- 灵兽 ----
  const petList = document.getElementById('petList');
  if (player.pets.length === 0) {
    petList.textContent = '暂无灵兽';
    petList.style.color = '#8899aa';
  } else {
    petList.textContent = player.pets.map(p => p.name + '(Lv.' + (p.level || 1) + ')').join('、');
    petList.style.color = '';
  }

  // ---- 突破信息 ----
  const breakInfo = document.getElementById('breakInfo');
  if (realm.breakItem) {
    const has = player.bag.find(i => i.name === realm.breakItem && i.type === 'consumable');
    if (!has) {
      breakInfo.textContent = '缺少：' + realm.breakItem;
      breakInfo.style.color = '#e74c3c';
    } else {
      breakInfo.textContent = '拥有：' + realm.breakItem;
      breakInfo.style.color = '#27ae60';
    }
  } else {
    breakInfo.textContent = '';
  }

  // ---- 称号显示 ----
  const titleEl = document.getElementById('titleName');
  if (titleEl) {
    if (player.equippedTitle) {
      const t = TITLES.find(t => t.id === player.equippedTitle);
      titleEl.textContent = t ? t.name : '无称号';
    } else {
      titleEl.textContent = '无称号';
    }
  }

  // ---- 警告动画 ----
  const hpBar = document.getElementById('hpBar');
  const mpBar = document.getElementById('mpBar');
  if (player.currentHP < stats.maxHP * 0.2) {
    hpBar.classList.add('warning-bar');
  } else {
    hpBar.classList.remove('warning-bar');
  }
  if (player.currentMP < 10) {
    mpBar.classList.add('warning-bar');
  } else {
    mpBar.classList.remove('warning-bar');
  }

  // ---- 快速按钮冷却状态 ----
  const quickBtns = document.querySelectorAll('.quick-btn');
  const cooldown = player.combatCooldown || 0;
  quickBtns.forEach(btn => {
    const cmd = btn.dataset.cmd;
    if (['修炼', '突破', '探索', '战斗'].includes(cmd)) {
      if (cooldown > 0) {
        btn.style.opacity = '0.5';
        btn.title = '冷却中 (' + cooldown + '回合)';
      } else {
        btn.style.opacity = '';
        btn.title = '';
      }
    }
  });

  // ---- 新手引导（三步走） ----
  const hint = document.getElementById('hintText');
  const cultBtn = document.querySelector('.quick-btn[data-cmd="修炼"]');
  const breakBtn = document.querySelector('.quick-btn[data-cmd="突破"]');
  const exploreBtn = document.querySelector('.quick-btn[data-cmd="探索"]');
  // 清除所有按钮的引导呼吸动画
  document.querySelectorAll('.guide-breathe').forEach(b => b.classList.remove('guide-breathe'));
  if (hint) {
    if (!player._cultivateCount || player._cultivateCount === 0) {
      // 第1步：引导修炼
      hint.textContent = '💡 试试点击 🧘修炼 开始你的修仙之旅';
      hint.style.display = '';
      if (cultBtn) cultBtn.classList.add('guide-breathe');
    } else if (player.exp >= getExpNeeded() * 0.8 && player.realmIndex < REALMS.length - 1) {
      // 第2步：修为满了，引导突破
      hint.textContent = '⚡ 修为已满！点击 ⬆️突破 尝试突破境界！';
      hint.style.display = '';
      if (breakBtn) breakBtn.classList.add('guide-breathe');
    } else if (player.realmIndex >= 1 && !player._exploreCount) {
      // 第3步：突破后引导探索
      hint.textContent = '🗺️ 已入仙途！试试点击 🗺️探索 看看外面的世界';
      hint.style.display = '';
      if (exploreBtn) exploreBtn.classList.add('guide-breathe');
    } else if (player.exp < getExpNeeded() * 0.8 && player._cultivateCount > 0) {
      // 中间阶段：继续修炼
      hint.textContent = '💪 继续修炼提升修为，修为满了记得 ⬆️突破';
      hint.style.display = '';
    } else {
      hint.style.display = 'none';
    }
  }
}

// ==================== 指令处理 ====================

/** 处理命令（核心入口） */
function handleCommand(cmd) {
  // 检查寿元是否耗尽
  const maxLife = getMaxLifeMonths();
  if (player.ageMonths >= maxLife && isFinite(maxLife)) {
    addLog('你已陨落，请刷新页面重新开始。', 'danger');
    return;
  }

  // 检查是否死亡
  if (player.currentHP <= 0) {
    addLog('💀 你已经死了，无法进行操作', 'danger');
    return;
  }

  const command = cmd.trim();

  // ---- 批量指令解析：如 修炼10、探索5、休息3 ----
  const batchMatch = command.match(/^([\u4e00-\u9fff]{2,})(\d+)$/);
  if (batchMatch) {
    const action = batchMatch[1];
    const count = Math.min(parseInt(batchMatch[2]), 99);
    const batchable = ['修炼', '探索', '休息'];
    if (!batchable.includes(action)) {
      addLog('⚠️ 批量指令仅支持：修炼、探索、休息（如：修炼10）', 'system');
      return;
    }
    addLog('⏳ 开始批量执行：' + action + ' ×' + count, 'system');
    for (let i = 0; i < count; i++) {
      if (player.ageMonths >= getMaxLifeMonths() && isFinite(getMaxLifeMonths())) {
        addLog('⌛ 寿元耗尽，批量中止。', 'danger');
        break;
      }
      if (action === '修炼') {
        if (player.combatCooldown > 0) { addLog('冷却中，批量中止。', 'system'); break; }
        cultivate();
      } else if (action === '探索') {
        if (player.currentHP < 20) { addLog('体力不足，批量中止。', 'system'); break; }
        explore();
      } else if (action === '休息') {
        rest();
      }
      // 每5次输出进度
      if ((i + 1) % 5 === 0 || i === count - 1) {
        addLog('📊 批量' + action + '进度：' + (i + 1) + '/' + count, 'system');
      }
    }
    addLog('✅ 批量执行完成：' + action + ' ×' + count, 'system');
    return;
  }

  // 出身被动：算命先生 - 每天首次行动前占卜
  if (hasOriginPassive('fortune') && ['修炼','突破','探索','战斗','休息'].includes(command)) {
    ORIGIN_PASSIVE['算命先生'].dailyFortune();
  }

  // ---- 检查秘密指令 ----
  if (checkSecretCommand(command)) return;

  // ---- 标准指令 ----
  switch (command) {
    case '修炼':
      cultivate();
      break;
    case '突破':
      breakthrough();
      break;
    case '探索':
      explore();
      break;
    case '战斗':
      fight();
      break;
    case '状态':
      showStatus();
      break;
    case '休息':
      rest();
      break;
    case '背包':
      showBag();
      break;
    case '道友':
      showCompanions();
      break;
    case '灵兽':
      showPets();
      break;
    case '商城':
      openShop();
      break;
    case '装备':
      showEquip();
      break;
    case '秘境':
      openDungeonMenu();
      break;
    case '炼丹':
      openAlchemy();
      break;
    case '炼器':
      openForge();
      break;
    case '存':
      showSaveManager('save');
      break;
    case '读':
      showSaveManager('load');
      break;
    case '成就':
      showAchievements();
      break;
    case '称号':
      showTitles();
      break;
    case '悬赏':
      showBounties();
      break;
    case '图鉴':
      showCollection();
      break;
    case '洞府':
      openCave();
      break;
    case 'boss':
    case 'BOSS':
      openBossFight();
      break;
    case '灵田':
    case 'farm':
      openFarm();
      break;
    case '功法':
      showSkills();
      break;
    case '心魔塔':
      openTower();
      break;
    case '地图':
      openMap();
      break;
    case '宗门':
      openSect();
      break;
    case '新游戏':
      newGame();
      break;
    default:
      addLog('可用指令：修炼|突破|探索|战斗|状态|休息|背包|道友|灵兽|商城|装备|秘境|炼丹|炼器|存|读|成就|称号|悬赏|图鉴|洞府|BOSS|灵田|功法|新游戏', 'system');
  }

  // 每次行动后有15%概率进入"新的一天"，重置算命先生占卜状态
  if (['修炼','突破','探索','战斗','休息'].includes(command)) {
    if (Math.random() < 0.15) {
      player._fortuneUsedToday = false;
    }
  }
}

/** 管理员模式标记 */
let _adminMode = false;

/** 提交指令（管理员模式下直接添加物品） */
function submitCommand() {
  const input = document.getElementById('commandInput');
  if (!input || !input.value.trim()) return;
  const raw = input.value.trim();
  input.value = '';
  // 先检查是否是秘密/故事/减少指令（管理员模式也响应）
  if (checkSecretCommand(raw)) return;
  
  if (_adminMode) { handleAdminInput(raw); return; }
  handleCommand(raw);
}

/** 管理员输入处理 */
function handleAdminInput(text) {
  const m = text.match(/^(.+?)\s*(\d*)$/);
  if (!m) return;
  const item = m[1].trim();
  const cnt = parseInt(m[2]) || 1;

  if (item === '灵石') { player.spiritStones += cnt; addLog('🧀 灵石+' + cnt, 'reward'); }
  else if (item === '修为') { player.exp += cnt; addLog('🧀 修为+' + cnt, 'success'); pulseExpBar(); }
  else if (item === '生命') { const s = getEffectiveStats(); player.currentHP = Math.min(s.maxHP, player.currentHP + cnt); addLog('🧀 生命+' + cnt, 'success'); }
  else if (item === '灵力') { const s = getEffectiveStats(); player.currentMP = Math.min(s.maxMP, player.currentMP + cnt); addLog('🧀 灵力+' + cnt, 'success'); }
  else if (item === '复活') {
    const s = getEffectiveStats();
    player.currentHP = s.maxHP;
    player.currentMP = s.maxMP;
    player.combatCooldown = 0;
    player._ghostCultivator = false;
    addLog('🧀 已复活，状态全满，鬼修状态清除！', 'success');
  }
  else if (['草药','矿石','灵泉水','灵屁花'].includes(item)) { player.materials[item] = (player.materials[item] || 0) + cnt; addLog('🧀 ' + item + '+' + cnt, 'reward'); }
  else {
    const eq = [...(EQUIPMENT_POOL.weapon||[]), ...(EQUIPMENT_POOL.armor||[]), ...(EQUIPMENT_POOL.accessory||[])].find(e => e.name === item);
    if (eq) { const t = EQUIPMENT_POOL.weapon.includes(eq) ? 'weapon' : EQUIPMENT_POOL.armor.includes(eq) ? 'armor' : 'accessory'; for (let i=0;i<cnt;i++) addToBag({...eq}, t); addLog('🧀 【' + item + '】×' + cnt, 'reward'); }
    else { addToBag(item, 'consumable', cnt); addLog('🧀 【' + item + '】×' + cnt, 'reward'); }
  }
  requestUIUpdate();
}

/** 显示状态（详细） */
function showStatus() {
  const stats = getEffectiveStats();
  addLog('境界：' + getRealmFullName() + ' | 年龄：' + formatAge(player.ageMonths) + ' | 寿限：' + (isFinite(getMaxLifeMonths()) ? formatAge(getMaxLifeMonths()) : '永生'), 'system');
  addLog('生命：' + Math.floor(player.currentHP) + '/' + stats.maxHP + ' 灵力：' + Math.floor(player.currentMP) + '/' + stats.maxMP, 'system');
  addLog('攻击：' + stats.atk + ' 防御：' + stats.def + ' 灵石：' + player.spiritStones, 'system');
  if (player.talent) addLog('天赋：' + player.talent.level + '·' + player.talent.name + '（' + player.talent.desc + '）', 'system');
  if (player.physique) addLog('体魄：' + player.physique.name + '（' + player.physique.desc + '）', 'system');
  if (player.origin && player.origin.passive) addLog('🔰 出身被动：【' + player.origin.passive.name + '】' + player.origin.passive.desc, 'system');
  if (player.companions.length > 0) {
    const dao = player.companions.find(c => c.isDaoCompanion);
    const daoStr = dao ? ' 💕道侣：' + dao.name : '';
    addLog('道友：' + player.companions.map(c => c.name).join('、') + daoStr, 'system');
  }
  if (player.pets.length > 0) addLog('灵兽：' + player.pets.map(p => p.name).join('、'), 'system');
  addLog('材料：强化石×' + (player.enhanceMaterials['强化石'] || 0) + ' 洗练符×' + (player.enhanceMaterials['洗练符'] || 0) + ' 草药×' + (player.materials['草药'] || 0) + ' 矿石×' + (player.materials['矿石'] || 0) + ' 灵泉水×' + (player.materials['灵泉水'] || 0), 'system');
  // 体魄任务线进度（仅凡体时显示）
  if (player.physique && player.physique.name === '凡体') {
    const f = Math.min((player._fightWins || 0), 10);
    const p = Math.min((player._pillUsed || 0), 30);
    const e = Math.min((player._exploreCount || 0), 20);
    addLog('📋 体魄任务：战斗 ' + f + '/10 ｜ 嗑药 ' + p + '/30 ｜ 探索 ' + e + '/20', 'system');
  } else if (player.physique) {
    addLog('✅ 体魄已觉醒：' + player.physique.name + '，任务线完成。', 'system');
  }
  addLog('🔧 炼丹熟练度：' + (player.alchemySkill || 0) + ' | 炼器熟练度：' + (player.forgeSkill || 0), 'system');
  // 灵根显示
  if (player.spiritualRoots) {
    const rootMap = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
    const roots = Object.entries(player.spiritualRoots).map(([k, v]) => rootMap[k] + v).join(' ');
    const maxRoot = Math.max(...Object.values(player.spiritualRoots));
    addLog('🌱 灵根：' + roots + '（最高' + maxRoot + '，修炼加成+' + Math.floor(maxRoot / 2) + '%）', 'system');
  }
  addLog('🧠 神识：' + (player.spiritualSense || 10) + '（探索效率+' + Math.floor((player.spiritualSense || 10) / 2) + '%，奇遇概率+' + (player.spiritualSense || 10) + '%）', 'system');
  addLog('🌍 季节：' + seasonName(player.currentSeason) + ' | 昼夜：' + (player.currentDaytime === 'day' ? '白昼' : '黑夜') + ' | 💀 心魔值：' + player.innerDemon, 'system');
}

/** 灵根修炼 */
const ROOT_NAMES = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
function showRootCultivate(key) {
  var val = player.spiritualRoots[key] || 0;
  var cost = Math.floor(val / 5) + 10;
  var html = '<div class="stat-card" style="text-align:center;">';
  html += '<h3>🌱 ' + ROOT_NAMES[key] + '灵根修炼</h3>';
  html += '<div style="font-size:1.2rem;color:var(--gold);margin:8px 0;">当前：' + val + '</div>';
  html += '<div style="font-size:0.7rem;color:#8899aa;">消耗 ' + cost + ' 灵石提升灵根</div>';
  html += '<div style="display:flex;gap:4px;justify-content:center;margin-top:8px;">';
  html += '<button class="quick-btn" onclick="closeModal();cultivateRoot(\'' + key + '\');">💎 修炼（' + cost + '灵石）</button>';
  html += '</div></div>';
  showModal('🌱 灵根修炼', html);
}
function cultivateRoot(key) {
  var val = player.spiritualRoots[key] || 0;
  var cost = Math.floor(val / 5) + 10;
  if (player.spiritStones < cost) { addLog('灵石不足！需要' + cost + '灵石', 'danger'); return; }
  player.spiritStones -= cost;
  var gain = Math.floor(Math.random() * 5) + 1;
  player.spiritualRoots[key] = Math.min(100, val + gain);
  addLog('🌱 ' + ROOT_NAMES[key] + '灵根 +' + gain + '（当前' + player.spiritualRoots[key] + '）', 'success');
  saveGame();
  requestUIUpdate();
}

/** 秘密指令检查（返回true表示已处理） */
function checkSecretCommand(cmd) {
  switch (cmd) {
    case '摸鱼':
      player.exp += 20;
      player._slackCount = (player._slackCount || 0) + 1;
      addLog('🐟 你偷偷摸鱼，修为意外增加20！（摸鱼' + player._slackCount + '次）', 'special');
      checkTitles();
      
      return true;
    case '急急如律令':
      player.spiritStones += 50;
      addLog('📜 咒语生效，灵石+50！', 'special');
      
      return true;
    case '咸鱼翻身':
      const s = getEffectiveStats();
      player.currentHP = s.maxHP;
      player.currentMP = s.maxMP;
      addLog('🐟 咸鱼翻身，状态全满！', 'special');
      
      return true;
    case '不正经':
      addLog('这游戏确实不正经。', 'system');
      return true;
    case '我是谁':
      addLog('你是天选之子，也是不正经的修仙者。', 'system');
      return true;
    case '系统':
      addLog('系统繁忙，请稍后再试。或者不给钱也行。', 'system');
      return true;
    case '我要成仙':
      addLog('你的愿望已收到，系统处理中... 预计等待999年。', 'system');
      return true;
    case '作者是谁':
      addLog('作者是一位匿名的仙道程序员，正在渡劫中。', 'system');
      return true;
    case '你好':
      addLog('道友你好，祝你早日飞升。', 'system');
      return true;
    case '再见':
      addLog('青山不改，绿水长流，后会有期。', 'system');
      return true;
    case '充钱':
      player.spiritStones += 1;
      addLog('本游戏无内购，全靠肝。灵石+1以示鼓励。', 'reward');
      
      return true;
    case '我是管理员阿苏勒':
      _adminMode = !_adminMode;
      if (_adminMode) addLog('🧑‍💼 管理员模式已开启，输入物品名直接添加', 'special');
      else addLog('🧑‍💼 管理员模式已关闭', 'system');
      
      return true;
    // ---- 故事测试指令 ----
    case '修炼故事':
      { const t = CULTIVATE_TALES[Math.floor(Math.random() * CULTIVATE_TALES.length)]; addLog('📖 ' + t.msg, 'special'); if (t.eff) t.eff(player); requestUIUpdate(); }
      return true;
    case '突破故事':
      { const t = BREAK_TALES[Math.floor(Math.random() * BREAK_TALES.length)]; addLog('⬆️ ' + t.msg, 'special'); if (t.eff) t.eff(player); requestUIUpdate(); }
      return true;
    case '探索故事':
      { const t = EXPLORE_TALES[Math.floor(Math.random() * EXPLORE_TALES.length)]; addLog('🗺️ ' + t.msg, 'special'); if (t.eff) t.eff(player); requestUIUpdate(); }
      return true;
    case '战斗故事':
      { const t = FIGHT_TALES[Math.floor(Math.random() * FIGHT_TALES.length)]; addLog('⚔️ ' + t.msg, 'special'); if (t.eff) t.eff(player); requestUIUpdate(); }
      return true;
    case '恐怖事件':
    case '恐怖故事':
      { const t = HORROR_EVENTS[Math.floor(Math.random() * HORROR_EVENTS.length)]; addLog('👻 ' + t.msg, 'horror'); if (t.eff) t.eff(player); requestUIUpdate(); }
      return true;
    case '道友事件':
    case '道友故事':
      // 手动触发，跳过随机概率检查
      if (player.pendingEvent || _eventLock) { addLog('⏳ 当前有未处理的事件', 'system'); return true; }
      if (player.companions.length === 0) { addLog('👥 你还没有道友', 'system'); return true; }
      {
        const comp = player.companions[Math.floor(Math.random() * player.companions.length)];
        const aff = comp.affection || 50;
        const candidates = COMPANION_EVENT_POOL.filter(e => aff >= e.minAff && aff <= e.maxAff);
        if (candidates.length === 0) { addLog('没有适合当前道友的事件', 'system'); return true; }
        const ev = candidates[Math.floor(Math.random() * candidates.length)];
        const options = ev.options.map(opt => ({
          text: opt.text,
          action: () => { opt.action(player, comp); requestUIUpdate(); saveGame(); }
        }));
        showEventModal('⚡ 道友事件', ev.descFn(comp), options);
      }
      return true;
    // ---- 减少指令 ----
    default:
      const reduceMatch = cmd.match(/^[减減少](少)?(.+)$/);
      if (reduceMatch) {
        const target = reduceMatch[2];
        // 提取数字（如 "生命10" → 10, "灵石" → 默认值）
        const numMatch = target.match(/(\d+)$/);
        const num = numMatch ? parseInt(numMatch[1]) : null;
        // 去掉数字部分得到纯名称
        const name = numMatch ? target.slice(0, -numMatch[1].length) : target;
        const def = num || 50; // 默认扣50
        
        if (name.includes('灵石')) { const v = Math.min(player.spiritStones, num || 100); player.spiritStones -= v; addLog('💰 灵石减少' + v, 'danger'); }
        else if (name.includes('生命') || name.includes('血')) { const v = Math.min(Math.floor(player.currentHP), def); player.currentHP -= v; addLog('❤️ 生命减少' + v, 'danger'); }
        else if (name.includes('灵力') || name.includes('蓝')) { const v = Math.min(Math.floor(player.currentMP), def); player.currentMP = Math.max(0, player.currentMP - v); addLog('💧 灵力减少' + v, 'danger'); }
        else if (name.includes('修为')) { const v = Math.min(player.exp, num || 500); player.exp -= v; addLog('📖 修为减少' + v, 'danger'); }
        else if (name.includes('心魔')) { const v = num || 20; player.innerDemon = Math.max(0, (player.innerDemon || 0) - v); addLog('🧘 心魔减少' + v, 'system'); }
        else if (name.includes('攻击') || name.includes('攻击力')) { const v = num || 10; player.baseAtk = Math.max(0, (player.baseAtk || 0) - v); addLog('⚔️ 攻击减少' + v, 'danger'); }
        else if (name.includes('防御') || name.includes('防御力')) { const v = num || 10; player.baseDef = Math.max(0, (player.baseDef || 0) - v); addLog('🛡️ 防御减少' + v, 'danger'); }
        else { addLog('❌ 不认识"' + name + '"，试试：减生命10 / 减灵石 / 减修为500', 'system'); }
        requestUIUpdate();
        return true;
      }
      return false;
  }
}

// ==================== 成就系统 ====================

/** 检查并解锁成就 */
function checkAchievements() {
  if (!player.achievements) player.achievements = [];
  ACHIEVEMENTS.forEach(ach => {
    if (!player.achievements.includes(ach.id) && ach.check(player)) {
      player.achievements.push(ach.id);
      addLog('🏆 成就解锁：【' + ach.name + '】——' + ach.desc + '！' + (ach.reward !== '无' ? ' ' + ach.reward : ''), 'special');
      if (ach.apply) ach.apply(player);
      
    }
  });
  // 同步检查称号
  checkTitles();
  // 同步检查悬赏
  checkBounties();
}

/** 检查称号解锁 */
function checkTitles() {
  if (!player.titles) player.titles = [];
  TITLES.forEach(t => {
    if (!player.titles.includes(t.id) && t.check(player)) {
      player.titles.push(t.id);
      addLog('🏅 称号获得：【' + t.name + '】——' + t.desc, 'special');
      
      saveGame();
    }
  });
}

/** 显示称号界面 */
function showTitles() {
  let html = '<div style="max-height:300px;overflow-y:auto;">';
  if (!player.titles || player.titles.length === 0) {
    html += '<p style="color:#666;text-align:center;">尚未获得任何称号</p>';
  } else {
    TITLES.forEach(t => {
      const unlocked = player.titles.includes(t.id);
      if (!unlocked) return;
      const equipped = player.equippedTitle === t.id;
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;color:var(--gold);">';
      html += '<span>🏅 ' + t.name + '<br><span style="font-size:0.6rem;color:#8899aa;">' + t.desc + '</span></span>';
      if (equipped) {
        html += '<span style="color:var(--success);">✅ 佩戴中</span>';
      } else {
        html += '<button class="quick-btn" style="color:var(--gold);" onclick="equipTitle(\'' + t.id + '\');closeModal();showTitles();">佩戴</button>';
      }
      html += '</div>';
    });
  }
  html += '</div>';
  showModal('🏅 称号簿', html);
}

/** 佩戴称号 */
function equipTitle(id) {
  player.equippedTitle = id;
  addLog('🏅 佩戴称号：【' + TITLES.find(t => t.id === id).name + '】', 'success');
  saveGame();
  
}

/** 检查悬赏任务完成 */
function checkBounties() {
  if (!player.completedBounties) player.completedBounties = [];
  BOUNTY_TASKS.forEach(t => {
    if (!player.completedBounties.includes(t.id) && t.check(player)) {
      player.completedBounties.push(t.id);
      const r = t.reward;
      player.spiritStones += r.stones;
      player.exp += r.exp;
      let msg = '📜 悬赏完成：【' + t.name + '】灵石+' + r.stones + '，修为+' + r.exp;
      if (t.item) { addToBag(t.item, 'consumable', 1); msg += '，获得【' + t.item + '】'; }
      addLog(msg, 'reward');
      flashReward();
      saveGame();
      
    }
  });
}

/** 显示悬赏榜 */
function showBounties() {
  if (!player.completedBounties) player.completedBounties = [];
  const active = BOUNTY_TASKS.filter(t => !player.completedBounties.includes(t.id));
  const done = BOUNTY_TASKS.filter(t => player.completedBounties.includes(t.id));
  let html = '<div style="max-height:350px;overflow-y:auto;">';
  if (active.length === 0) {
    html += '<p style="color:var(--success);text-align:center;">🎉 所有悬赏已完成！</p>';
  } else {
    active.forEach(t => {
      const cur = t.progress(player);
      const pct = Math.min(100, Math.floor(cur / t.target * 100));
      html += '<div style="padding:6px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;">';
      html += '<div><span style="color:var(--gold);">' + t.name + '</span> — ' + t.desc + '</div>';
      html += '<div style="font-size:0.6rem;color:#8899aa;">进度：' + cur + '/' + t.target + '</div>';
      html += '<div class="progress-bar-bg" style="height:4px;margin-top:2px;"><div class="progress-bar-fill exp-fill" style="width:' + pct + '%;height:100%;"></div></div>';
      html += '<div style="font-size:0.55rem;color:#8899aa;margin-top:2px;">奖励：灵石+' + t.reward.stones + ' 修为+' + t.reward.exp + (t.item ? ' 【' + t.item + '】' : '') + '</div>';
      html += '</div>';
    });
  }
  if (done.length > 0) {
    html += '<p style="font-size:0.6rem;color:#666;margin-top:8px;">已完成：' + done.map(t => t.name).join('、') + '</p>';
  }
  html += '</div>';
  showModal('📜 悬赏榜', html);
}

/** 显示成就界面 */
function showAchievements() {
  let html = '<div style="max-height:300px;overflow-y:auto;">';
  ACHIEVEMENTS.forEach(ach => {
    const unlocked = player.achievements.includes(ach.id);
    html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e3044;font-size:0.75rem;color:' + (unlocked ? 'var(--gold)' : '#555') + ';">';
    html += '<span>' + (unlocked ? '🏆' : '🔒') + ' ' + ach.name + ' - ' + ach.desc + '</span>';
    html += '<span>' + (unlocked ? ach.reward : '未解锁') + '</span>';
    html += '</div>';
  });
  html += '</div>';
  showModal('🏆 成就丰碑', html);
}

// ==================== 图鉴系统 ====================

/** 扫描当前状态更新图鉴 */
function updateCollection() {
  if (!player.collection) player.collection = { equipment: [], pets: [], materials: [], artifacts: [], consumables: [] };
  const c = player.collection;
  // 扫描背包
  player.bag.forEach(item => {
    const name = item.name || item.id;
    if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
      if (!c.equipment.includes(name)) c.equipment.push(name);
    } else if (item.type === 'consumable') {
      if (!c.consumables.includes(name)) c.consumables.push(name);
    } else if (item.type === 'material') {
      if (!c.materials.includes(name)) c.materials.push(name);
    }
  });
  // 扫描已装备
  ['weapon', 'armor', 'accessory'].forEach(slot => {
    const eq = player.equipment[slot];
    if (eq && eq.name && !c.equipment.includes(eq.name)) c.equipment.push(eq.name);
  });
  // 扫描法器
  if (player.equipment.artifact && player.equipment.artifact.name) {
    if (!c.artifacts.includes(player.equipment.artifact.name)) c.artifacts.push(player.equipment.artifact.name);
  }
  // 扫描灵兽
  player.pets.forEach(p => {
    if (!c.pets.includes(p.name)) c.pets.push(p.name);
  });
  // 扫描材料库存
  Object.keys(player.materials || {}).forEach(mat => {
    if ((player.materials[mat] || 0) > 0 && !c.materials.includes(mat)) c.materials.push(mat);
  });
  Object.keys(player.unorthodoxMaterials || {}).forEach(mat => {
    if ((player.unorthodoxMaterials[mat] || 0) > 0 && !c.materials.includes(mat)) c.materials.push(mat);
  });
}

/** 展示图鉴 */
function showCollection() {
  updateCollection();
  const c = player.collection;
  const totalEquip = 15, totalPets = 20, totalArtifacts = 18;
  const conCount = c.consumables.length, matCount = c.materials.length;
  let html = '<div style="max-height:350px;overflow-y:auto;">';
  html += '<div class="stat-card" style="margin-bottom:6px;"><h3>🗡️ 装备 (' + c.equipment.length + '/' + totalEquip + ')</h3><div style="font-size:0.65rem;">' + (c.equipment.length > 0 ? c.equipment.join('、') : '暂无') + '</div></div>';
  html += '<div class="stat-card" style="margin-bottom:6px;"><h3>🐾 灵兽 (' + c.pets.length + '/' + totalPets + ')</h3><div style="font-size:0.65rem;">' + (c.pets.length > 0 ? c.pets.join('、') : '暂无') + '</div></div>';
  html += '<div class="stat-card" style="margin-bottom:6px;"><h3>🔮 法器 (' + c.artifacts.length + '/' + totalArtifacts + ')</h3><div style="font-size:0.65rem;">' + (c.artifacts.length > 0 ? c.artifacts.join('、') : '暂无') + '</div></div>';
  html += '<div class="stat-card" style="margin-bottom:6px;"><h3>💊 丹药 (' + conCount + ')</h3><div style="font-size:0.65rem;">' + (conCount > 0 ? c.consumables.join('、') : '暂无') + '</div></div>';
  html += '<div class="stat-card"><h3>🧪 材料 (' + matCount + ')</h3><div style="font-size:0.65rem;">' + (matCount > 0 ? c.materials.join('、') : '暂无') + '</div></div>';
  html += '</div>';
  showModal('📚 修仙图鉴', html);
}

// ==================== 洞府系统 ====================

// ==================== 洞府事件 ====================

const CAVE_EVENTS = [
  { weight: 1,
    msg: '🚪 一位散修路过你的洞府，想借宿一晚。作为回报，他留下了一本功法残篇。',
    good: true, action: function(p) { p.exp += 30; addLog('参悟残篇，修为+30', 'success'); }
  },
  { weight: 1,
    msg: '🐭 洞府里闹老鼠！啃坏了你的储物袋，灵石漏了一地。',
    good: false, action: function(p) { p.spiritStones = Math.max(0, p.spiritStones - 30); addLog('灵石损失30', 'danger'); }
  },
  { weight: 1,
    msg: '🌊 洞府地下涌出一股灵泉！水质清澈，灵气充沛。',
    good: true, action: function(p) { p.materials['灵泉水'] = (p.materials['灵泉水'] || 0) + 5; addLog('获得灵泉水×5', 'reward'); }
  },
  { weight: 1,
    msg: '📦 洞府门口多了一个包裹，里面装着不知名修士送来的灵石。',
    good: true, action: function(p) { p.spiritStones += 60; addLog('灵石+60！', 'reward'); }
  },
  { weight: 1,
    msg: '💥 洞府附近的灵脉震动！墙壁裂了几道缝，修缮花了你一些灵石。',
    good: false, action: function(p) { p.spiritStones = Math.max(0, p.spiritStones - 50); addLog('修缮花费50灵石', 'danger'); }
  },
  { weight: 1,
    msg: '🌱 洞府墙角长出一株奇怪的植物，结了一颗果实。你吃了——修为涨了！',
    good: true, action: function(p) { p.exp += 50; addLog('吃掉灵果，修为+50', 'success'); }
  }
];

/** 触发洞府事件 */
function triggerCaveEvent() {
  if (!player || !player.cave) return;
  if (player.pendingEvent || _eventLock) return;
  if (Math.random() > 0.25) return;
  var ev = CAVE_EVENTS[Math.floor(Math.random() * CAVE_EVENTS.length)];
  addLog('🏠 ' + ev.msg, ev.good ? 'reward' : 'danger');
  if (ev.action) ev.action(player);
  requestUIUpdate();
}

/** 计算洞府产出 */
function getCaveProduction(level) {
  const l = level || 1;
  return {
    stonesPerMin: l * 2,
    matsPerMin: Math.ceil(l / 2),
    maxLevel: 10
  };
}

/** 计算洞府升级费用 */
function getCaveUpgradeCost(level) {
  return {
    stones: level * 200,
    ore: level * 3,
    water: Math.ceil(level / 2)
  };
}

/** 打开洞府 */
function openCave() {
  if (!player.cave) player.cave = { level: 1, lastVisit: Date.now() };
  const c = player.cave;
  const prod = getCaveProduction(c.level);

  // 计算离线产出
  const now = Date.now();
  const elapsedMin = (now - (c.lastVisit || now)) / 60000;
  const maxMin = c.level * 60;
  const earnedMin = Math.min(elapsedMin, maxMin);
  let stoneGain = Math.floor(prod.stonesPerMin * earnedMin);
  let matGain = Math.floor(prod.matsPerMin * earnedMin);

  // 洞府存储上限
  const maxStone = c.level * 50;
  const maxMat = c.level * 20;
  stoneGain = Math.min(stoneGain, maxStone);
  matGain = Math.min(matGain, maxMat);

  if (stoneGain > 0 || matGain > 0) {
    player.spiritStones += stoneGain;
    player.materials['矿石'] = (player.materials['矿石'] || 0) + Math.ceil(matGain / 2);
    player.materials['草药'] = (player.materials['草药'] || 0) + Math.floor(matGain / 2);
    addLog('🏠 洞府产出：灵石+' + stoneGain + '，矿石+' + Math.ceil(matGain / 2) + '，草药+' + Math.floor(matGain / 2) + '（离线' + Math.floor(earnedMin) + '分钟）', 'reward');
  }
  c.lastVisit = now;

  // 洞府随机事件
  triggerCaveEvent();

  // 升级费用
  const cost = getCaveUpgradeCost(c.level);
  const canUpgrade = c.level < prod.maxLevel
    && player.spiritStones >= cost.stones
    && (player.materials['矿石'] || 0) >= cost.ore
    && (player.materials['灵泉水'] || 0) >= cost.water;

  let html = '<div style="max-height:350px;overflow-y:auto;">';
  html += '<div class="stat-card" style="margin-bottom:8px;text-align:center;">';
  html += '<h3>🏠 洞府 Lv.' + c.level + '</h3>';
  html += '<div style="font-size:0.75rem;color:#8899aa;">每分钟产出：灵石+' + prod.stonesPerMin + '，材料+' + prod.matsPerMin + '</div>';
  html += '<div style="font-size:0.65rem;color:#8899aa;">存储上限：灵石' + maxStone + '，材料' + maxMat + '</div>';
  html += '</div>';

  if (c.level < prod.maxLevel) {
    html += '<div class="stat-card" style="margin-bottom:8px;">';
    html += '<h3>⬆️ 升级至 Lv.' + (c.level + 1) + '</h3>';
    html += '<div style="font-size:0.7rem;">需求：灵石' + cost.stones + '，矿石' + cost.ore + '，灵泉水' + cost.water + '</div>';
    html += '<button class="modal-btn" onclick="upgradeCave();closeModal();"' + (canUpgrade ? '' : ' disabled style="opacity:0.5;"') + '>升级</button>';
    html += '</div>';
  } else {
    html += '<p style="color:var(--gold);text-align:center;">✨ 洞府已达最高级！</p>';
  }
  html += '</div>';
  showModal('🏠 洞府', html);
  saveGame();
}

/** 升级洞府 */
function upgradeCave() {
  const c = player.cave;
  const cost = getCaveUpgradeCost(c.level);
  if (c.level >= 10) { addLog('洞府已达最高级！', 'system'); return; }
  if (player.spiritStones < cost.stones) { addLog('灵石不足！', 'danger'); return; }
  if ((player.materials['矿石'] || 0) < cost.ore) { addLog('矿石不足！', 'danger'); return; }
  if ((player.materials['灵泉水'] || 0) < cost.water) { addLog('灵泉水不足！', 'danger'); return; }
  player.spiritStones -= cost.stones;
  player.materials['矿石'] -= cost.ore;
  player.materials['灵泉水'] -= cost.water;
  c.level++;
  addLog('🏠 洞府升级至 Lv.' + c.level + '！每分钟产出+' + getCaveProduction(c.level).stonesPerMin + '灵石', 'success');
  openCave();
}

// ==================== 灵田系统 ====================

// ==================== 灵田事件 ====================

const FARM_EVENTS = [
  // 种植时
  { phase: 'plant', weight: 1, msg: '天降灵雨！种子疯狂吸收灵气',
    good: true, action: function(p, idx) {
      var plot = p.farm.plots[idx];
      if (plot) { plot.elapsed = Math.floor(plot.totalGrowth * 0.4); addLog('🌧️ 灵雨灌溉，生长进度+40%！', 'success'); }
    }},
  { phase: 'plant', weight: 1, msg: '仙鹤俯冲叼走了种子！',
    good: false, action: function(p, idx) {
      p.farm.plots[idx] = { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0, ready: false };
      addLog('🐦 仙鹤叼走了种子……白种了', 'danger');
    }},
  { phase: 'plant', weight: 1, msg: '种子种在了灵脉上！',
    good: true, action: function(p, idx) {
      var plot = p.farm.plots[idx];
      if (plot) { plot.totalGrowth = Math.floor(plot.totalGrowth * 0.6); addLog('✨ 灵脉滋养，生长周期缩短40%！', 'reward'); }
    }},
  // 生长时
  { phase: 'grow', weight: 1, msg: '金光虫灾！啃食灵草',
    good: false, action: function(p, idx) {
      var plot = p.farm.plots[idx];
      if (plot && plot.planted) { plot.elapsed = Math.max(0, (plot.elapsed || 0) - Math.floor(plot.totalGrowth * 0.3)); addLog('🐛 虫灾蔓延，生长进度倒退30%', 'danger'); }
    }},
  { phase: 'grow', weight: 1, msg: '灵草变异了！七彩光芒',
    good: true, action: function(p, idx) {
      addLog('🌟 灵草变异！收获时额外获得稀有材料', 'reward');
      p._farmBonusMat = (p._farmBonusMat || 0) + 2;
    }},
  { phase: 'grow', weight: 1, msg: '灵气旋风带来肥料',
    good: true, action: function(p, idx) {
      var plot = p.farm.plots[idx];
      if (plot) { plot.elapsed = Math.min(plot.totalGrowth, (plot.elapsed || 0) + Math.floor(plot.totalGrowth * 0.25)); addLog('💨 天降肥料，生长进度+25%', 'success'); }
    }},
  { phase: 'grow', weight: 1, msg: '野猪拱地！',
    good: false, action: function(p, idx) {
      p.farm.plots[idx] = { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0, ready: false };
      addLog('🐗 野猪把灵田拱了……作物没了', 'danger');
    }},
  // 收获时
  { phase: 'harvest', weight: 1, msg: '产量翻倍！',
    good: true, action: function(p, idx, seed) {
      if (seed && seed.harvest) {
        if (!p.materials[seed.harvest.mat]) p.materials[seed.harvest.mat] = 0;
        p.materials[seed.harvest.mat] += seed.harvest.count;
        addLog('🎉 大丰收！额外收获' + seed.harvest.mat + '×' + seed.harvest.count, 'reward');
      }
    }},
  { phase: 'harvest', weight: 1, msg: '蘑菇爆炸！',
    good: false, action: function(p, idx) {
      p.currentHP = Math.max(1, p.currentHP - 10);
      addLog('🍄 收获时蘑菇爆炸！生命-10', 'danger');
    }},
  { phase: 'harvest', weight: 1, msg: '作物根部结了灵石！',
    good: true, action: function(p, idx) {
      p.spiritStones += 30;
      addLog('🔮 挖到灵石+30！', 'reward');
    }}
];

/** 触发灵田事件 */
function triggerFarmEvent(phase, plotIdx, seed) {
  if (!player || !player.farm) return;
  if (player.pendingEvent || _eventLock) return;
  if (Math.random() > 0.3) return;
  var evs = FARM_EVENTS.filter(function(e) { return e.phase === phase; });
  if (evs.length === 0) return;
  var ev = evs[Math.floor(Math.random() * evs.length)];
  ev.action(player, plotIdx, seed);
}

const SEED_TYPES = [
  { name: '草药种子', desc: '生长3个月 → 草药×3', cost: 20, growthMonths: 3, harvest: { mat: '草药', count: 3 } },
  { name: '灵泉水种', desc: '生长5个月 → 灵泉水×2', cost: 30, growthMonths: 5, harvest: { mat: '灵泉水', count: 2 } },
  { name: '灵屁花种', desc: '生长4个月 → 灵屁花×2', cost: 25, growthMonths: 4, harvest: { mat: '灵屁花', count: 2 } },
  { name: '蘑菇菌种', desc: '生长2个月 → 蘑菇弹片×3', cost: 15, growthMonths: 2, harvest: { mat: '蘑菇弹片', count: 3 } }
];

/** 打开灵田 */
function openFarm() {
  if (!player.farm) {
    player.farm = { plots: [{ planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 }, { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 }, { planted: false, seed: null, plantedAt: null, totalGrowth: 0, elapsed: 0 }], maxPlots: 3 };
  }
  // 生长中地块概率触发事件
  player.farm.plots.forEach(function(plot, i) {
    if (plot.planted && !plot.ready) triggerFarmEvent('grow', i);
  });
  let html = '<div style="max-height:350px;overflow-y:auto;">';
  player.farm.plots.forEach((plot, i) => {
    html += '<div class="stat-card" style="margin-bottom:6px;">';
    html += '<h3>🌱 灵田 #' + (i + 1) + '</h3>';
    if (!plot.planted) {
      html += '<p style="font-size:0.7rem;color:#8899aa;">空地</p>';
      html += '<select id="farmSeed' + i + '" style="width:100%;background:#0a0f16;color:#e0e0e0;border:1px solid var(--border);padding:4px;border-radius:6px;font-family:inherit;font-size:0.7rem;">';
      html += '<option value="">--选择种子--</option>';
      SEED_TYPES.forEach(s => { html += '<option value="' + s.name + '">' + s.name + ' (' + s.cost + '灵石)</option>'; });
      html += '</select>';
      html += '<button class="quick-btn" style="margin-top:4px;" onclick="plantSeed(' + i + ');closeModal();">🌱种植</button>';
    } else if (plot.ready) {
      html += '<p style="color:var(--success);font-size:0.75rem;">✅ 已成熟！</p>';
      html += '<button class="quick-btn" style="margin-top:4px;" onclick="harvestPlot(' + i + ');closeModal();">🧺收获</button>';
    } else {
      const pct = Math.floor((plot.elapsed || 0) / plot.totalGrowth * 100);
      html += '<p style="font-size:0.7rem;">正在生长：' + plot.seed + '</p>';
      html += '<div class="progress-bar-bg" style="height:4px;"><div class="progress-bar-fill exp-fill" style="width:' + pct + '%;height:100%;"></div></div>';
      html += '<p style="font-size:0.6rem;color:#8899aa;">' + pct + '%</p>';
    }
    html += '</div>';
  });
  html += '</div>';
  showModal('🌾 灵田', html);
}

/** 种植 */
function plantSeed(plotIdx) {
  const seedName = document.getElementById('farmSeed' + plotIdx)?.value;
  if (!seedName) { addLog('请先选择种子！', 'danger'); return; }
  const seed = SEED_TYPES.find(s => s.name === seedName);
  if (!seed) return;
  if (player.spiritStones < seed.cost) { addLog('灵石不足！需要' + seed.cost + '灵石', 'danger'); return; }
  player.spiritStones -= seed.cost;
  player.farm.plots[plotIdx] = { planted: true, seed: seed.name, plantedAt: Date.now(), totalGrowth: seed.growthMonths, elapsed: 0, ready: false };
  addLog('🌱 在灵田#' + (plotIdx + 1) + '种下了【' + seed.name + '】，预计' + seed.growthMonths + '个月后成熟', 'success');
  triggerFarmEvent('plant', plotIdx);
  openFarm();
}

/** 收获 */
function harvestPlot(plotIdx) {
  const plot = player.farm.plots[plotIdx];
  if (!plot || !plot.ready) { addLog('还没有成熟！', 'system'); return; }
  const seed = SEED_TYPES.find(s => s.name === plot.seed);
  if (!seed) return;
  if (!player.materials[seed.harvest.mat]) player.materials[seed.harvest.mat] = 0;
  player.materials[seed.harvest.mat] += seed.harvest.count;
  addLog('🧺 收获【' + seed.harvest.mat + '】×' + seed.harvest.count + '！', 'reward');
  triggerFarmEvent('harvest', plotIdx, seed);
  // 变异奖励
  if (player._farmBonusMat && player._farmBonusMat > 0) {
    if (!player.materials[seed.harvest.mat]) player.materials[seed.harvest.mat] = 0;
    player.materials[seed.harvest.mat] += player._farmBonusMat;
    player._farmBonusMat = 0;
  }
  plot.planted = false;
  plot.seed = null;
  plot.ready = false;
  plot.elapsed = 0;
  saveGame();
  
}

// ==================== 轮回/新游戏 ====================

/** 仙帝结局处理 */
function handleXianDiEnding() {
  saveLifeRecord(); // 记录到轮回簿
  if (player.realmIndex >= REALMS.length - 1 && getCurrentRealm().name === '仙帝') {
    // 判定结局类型
    const isGhost = player._ghostCultivator;
    const isDemon = (player.innerDemon || 0) >= 80;

    const maxRoot = player.spiritualRoots ? Math.max(...Object.values(player.spiritualRoots)) + '灵根' : '未知';
    const totalCultivate = player._cultivateCount || 0;
    const totalFight = player._fightWins || 0;
    const totalExplore = player._exploreCount || 0;
    const totalAlchemy = player.alchemySkill || 0;
    const totalForge = player.forgeSkill || 0;
    const reviveCount = player._reviveCount || 0;
    const totalCompanions = player.companions.length;
    const totalPets = player.pets.length;
    const totalAchieve = (player.achievements || []).length;
    const totalTitle = (player.titles || []).length;
    const finalAge = formatAge(player.ageMonths);
    const totalWeekly = (player.weeklyCount || 0) + 1;

    // 选择结局标题和文案
    let endTitle, endIcon, endDesc;
    if (isGhost) {
      endTitle = '👻 鬼帝临天';
      endIcon = '👻';
      endDesc = '你以鬼修之身证道，阴气化帝，万鬼朝拜。';
    } else if (isDemon) {
      endTitle = '👿 魔尊降世';
      endIcon = '👿';
      endDesc = '你被心魔吞噬，以力证道，天地同悲。';
    } else {
      endTitle = '👑 证道仙帝';
      endIcon = '👑';
      endDesc = '历经 ' + totalWeekly + ' 世，终登仙道之巅。';
    }

    const html = `
      <div style="text-align:center;">
        <p style="font-size:1.2rem;color:var(--gold);">${endTitle}</p>
        <p style="font-size:0.75rem;color:#8899aa;">${endDesc}</p>
        <div class="stat-card" style="margin:10px 0;text-align:left;">
          <h3>📊 修仙总览</h3>
          <div style="font-size:0.7rem;line-height:1.8;">
            🧘 修炼 ${totalCultivate} 次 | ⚔️ 战斗 ${totalFight} 胜
            🗺️ 探索 ${totalExplore} 次
            🧪 炼丹 ${totalAlchemy} 次 | ⚒️ 炼器 ${totalForge} 次
            💀 复活 ${reviveCount} 次 | 👥 结交 ${totalCompanions} 人
            🐾 灵兽 ${totalPets} 只 | 🏆 成就 ${totalAchieve}/${ACHIEVEMENTS.length}
            🏅 称号 ${totalTitle}/${TITLES.length} | 🌱 灵根 ${maxRoot}
          </div>
        </div>
        <!-- 人生大事录 -->
        <div class="stat-card" style="margin:10px 0;text-align:left;max-height:200px;overflow-y:auto;">
          <h3>📜 人生大事录</h3>
          <div style="font-size:0.6rem;line-height:1.8;color:#8899aa;">
            ${(player.lifeEvents || []).slice(-20).map(e =>
              '▸ ' + e.text + '（' + (e.age || '?') + '·' + (e.realm || '?') + '）'
            ).join('<br>') || '（暂无记录）'}
          </div>
        </div>
        <p style="font-size:0.7rem;color:#8899aa;">终年 ${finalAge}</p>
      </div>
      <div class="modal-btn-group">
        <button class="modal-btn" onclick="startNewWeek();closeModal();">🔄 轮回转世</button>
        <button class="modal-btn" onclick="closeModal();">继续游玩</button>
      </div>
    `;
    showModal(endTitle, html);
  }
}

/** 开始新周目（轮回） */
function startNewWeek() {
  // 保存当前周目数据
  player.weeklyCount = (player.weeklyCount || 0) + 1;
  const week = Math.min(player.weeklyCount, 3);
  const bonus = WEEKLY_BONUSES[week] || WEEKLY_BONUSES[3];

  // 保留部分资源
  const oldStones = player.spiritStones;
  const oldBag = player.bag.filter(i => i.rarity === 'legendary' || i.type === 'consumable');
  const oldAchievements = player.achievements;
  const oldAlchemy = player.alchemySkill || 0;
  const oldForge = player.forgeSkill || 0;
  const oldMaterials = { ...(player.materials || {}) };
  const oldRealm = player.realmIndex; // 用于属性继承

  // 重新生成角色
  const origin = rollOrigin();
  player.origin = origin;
  player.fate = rollFateStats(origin);
  player.ageMonths = origin.age[0] + Math.floor(Math.random() * (origin.age[1] - origin.age[0]));
  player.realmIndex = 0;
  player.layer = 1;
  player.exp = 0;
  player.baseHP = 100 + oldRealm * 10;  // 继承部分属性
  player.baseMP = 50 + oldRealm * 5;
  player.baseAtk = 10 + Math.floor(oldRealm / 2);
  player.baseDef = 5 + Math.floor(oldRealm / 3);
  player.spiritStones = Math.floor(oldStones * 0.2) + (bonus.stones || 0); // 20%→更好开局
  player.bag = oldBag;
  player.equipment = { weapon: null, armor: null, accessory: null, artifact: null };
  player.companions = [];
  player.pets = [];
  player.combatCooldown = 0;
  player.reviveUsed = false;
  player.ageStopRemaining = 0;
  player.lotusDebuff = 0;
  player.tribulationFails = 0;
  player.tribulationWins = 0;
  player.pillStacks = 0;
  player.innerDemon = 0;
  player.currentSeason = 'spring';
  player.currentDaytime = 'day';
  player.pendingEvent = null;
  player.currentDungeon = null;
  player._cultivateCount = 0;
  player._ageWarned = false;
  player._fateBreakBoost = 0;
  player._fateDemonResist = 0;
  player._fightCompanionChosen = false;
  player._gamblerDeathUsed = false;
  player._fortuneUsedToday = false;
  player._fortuneBuff = null;

  // 继承熟练度（保留30%）
  player.alchemySkill = Math.floor(oldAlchemy * 0.3);
  player.forgeSkill = Math.floor(oldForge * 0.3);

  // 继承部分材料（保留20%）
  player.materials = {
    '草药': Math.floor((oldMaterials['草药'] || 0) * 0.2),
    '矿石': Math.floor((oldMaterials['矿石'] || 0) * 0.2),
    '灵泉水': Math.floor((oldMaterials['灵泉水'] || 0) * 0.2)
  };

  // 保留成就
  player.achievements = oldAchievements;

  // 生成新天赋（有一定概率继承）
  if (Math.random() < 0.3 && player.talent) {
    // 保留原天赋
  } else {
    player.talent = randomTalent();
  }
  player.physique = randomPhysique(true);

  // 重新生成灵根
  const rootNames = ['metal', 'wood', 'water', 'fire', 'earth'];
  let rootVals = rootNames.map(() => 5 + Math.floor(Math.random() * 30));
  const rootTotal = rootVals.reduce((a, b) => a + b, 0);
  if (rootTotal > 0) { const r = 100 / rootTotal; rootVals = rootVals.map(v => Math.max(1, Math.round(v * r))); }
  let rootDiff = 100 - rootVals.reduce((a, b) => a + b, 0);
  for (let i = 0; rootDiff > 0; i = (i + 1) % 5) { rootVals[i]++; rootDiff--; }
  player.spiritualRoots = { metal: rootVals[0], wood: rootVals[1], water: rootVals[2], fire: rootVals[3], earth: rootVals[4] };

  // 初始奖励
  if (player.talent.effect.type === 'startStones') {
    player.spiritStones += player.talent.effect.val;
  }
  if (origin.bonus && origin.bonus.spiritStones) {
    player.spiritStones += origin.bonus.spiritStones;
  }

  const stats = getEffectiveStats();
  player.currentHP = stats.maxHP;
  player.currentMP = stats.maxMP;

  addLog('🔄 轮回成功！新的人生开始。', 'special');
  addLog('🎭 出身：【' + origin.name + '】，命格：聪慧' + player.fate.intelligence + ' 体魄' + player.fate.physique + ' 气运' + player.fate.luck + ' 定力' + player.fate.focus, 'system');
  if (origin.passive) {
    addLog('🔰 出身被动【' + origin.passive.name + '】：' + origin.passive.desc, 'special');
  }
  addLog('🌟 天赋：【' + player.talent.level + '·' + player.talent.name + '】- ' + player.talent.desc, 'special');
  addLog('🗿 体魄：【' + player.physique.name + '】' + (player.physique.name !== '凡体' ? '——' + player.physique.desc : ''), 'system');
  addLog('📦 轮回继承：灵石×' + Math.floor(oldStones * 0.2) + '，炼丹熟练度' + Math.floor(oldAlchemy * 0.3) + '，炼器熟练度' + Math.floor(oldForge * 0.3) + '，部分材料', 'system');
  saveGame();
  
  checkAchievements();
}

/** 新游戏（重置全部） */
function newGame() {
  var html = '<p style="text-align:center;margin-bottom:12px;">⚠️ 确定要重新开始吗？</p>' +
    '<p style="text-align:center;font-size:0.7rem;color:#c0392b;">当前进度将被永久删除，不可恢复。</p>' +
    '<div class="modal-btn-group">' +
    '<button class="modal-btn" onclick="closeModal();doDeleteAndRestart();">🗑️ 删除并重新开始</button>' +
    '<button class="modal-btn" onclick="closeModal();" style="background:#333;border-color:#555;">取消</button>' +
    '</div>';
  showModal('⚠️ 新游戏', html);
}

function doDeleteAndRestart() {
  var slot = player._saveSlot || 0;
  localStorage.removeItem('buzhengjing_save_' + slot);
  // 更新 meta
  try {
    var meta = getSaveMeta();
    if (meta[slot]) meta[slot] = null;
    setSaveMeta(meta);
  } catch(e) {}
  returnToTitle();
}

/** 生成示例轮回记录（首次启动时） */
function seedLifeRecords() {
  var ver = localStorage.getItem('_lifeRecordsSeedVer');
  if (ver === 'v5') return;
  
  var records = [
    {
      date: '2026/05/12', title: '💀 陨落', realm: '金丹期', age: '152岁',
      cultivates: 342, fights: 87, explores: 156,
      companions: 4, pets: 1, achieves: 12, deaths: 2, weekly: 1,
      physique: '玄铁体', talent: '地·修炼奇才',
      events: [
        { text: '第3年·突破至【练气期】' },
        { text: '第5年·击败【山贼王】' },
        { text: '第8年·突破至【筑基期】' },
        { text: '第12年·击败【妖狼王】' },
        { text: '第15年·招募道友【王铁柱】' },
        { text: '第18年·获得灵兽【小白】' },
        { text: '第22年·突破至【金丹期】' },
        { text: '第25年·与【李翠花】结为道侣' },
        { text: '第30年·被妖兽重伤·死亡（第1次）' },
        { text: '第38年·击败【金丹魔修】' },
        { text: '第42年·加入【青云宗】' },
        { text: '第50年·秘境遇险·死亡（第2次）' },
        { text: '第60年·宗门大比获奖' },
        { text: '第80年·闭关十年·修为精进' },
        { text: '第100年·收了一名散修做徒弟' },
        { text: '第120年·金丹寿元将尽·冲击元婴失败' },
        { text: '第152年·寿元耗尽·坐化' }
      ]
    },
    {
      date: '2026/06/01', title: '👑 证道仙帝', realm: '仙帝', age: '886岁',
      cultivates: 1520, fights: 412, explores: 678,
      companions: 8, pets: 2, achieves: 28, deaths: 1, weekly: 2,
      physique: '混沌体', talent: '天·天道之子',
      events: [
        { text: '第3年·突破至【练气期】' },
        { text: '第6年·击败【山贼王】' },
        { text: '第9年·突破至【筑基期】' },
        { text: '第12年·击败【妖狼王】' },
        { text: '第15年·招募道友【慕容雪】' },
        { text: '第18年·突破至【金丹期】' },
        { text: '第22年·击败【金丹魔修】' },
        { text: '第26年·与【慕容雪】结为道侣' },
        { text: '第30年·突破至【元婴期】' },
        { text: '第35年·击败【血影老魔】' },
        { text: '第42年·获得灵兽【墨玉麒麟】' },
        { text: '第50年·加入【天剑门】' },
        { text: '第60年·突破至【化神期】' },
        { text: '第75年·击败【天外心魔】' },
        { text: '第90年·突破至【合体期】' },
        { text: '第110年·击败【万妖之王】' },
        { text: '第150年·突破至【大乘期】' },
        { text: '第200年·击败【上古凶兽】' },
        { text: '第280年·突破至【渡劫期】' },
        { text: '第350年·渡天劫·重伤濒死（唯一一次）' },
        { text: '第400年·击败【天劫主宰】' },
        { text: '第500年·击败【天道化身】' },
        { text: '第886年·证道仙帝·与天地同寿' }
      ]
    },
    {
      date: '2026/06/15', title: '👿 魔尊降世', realm: '化神期', age: '95岁',
      cultivates: 689, fights: 203, explores: 289,
      companions: 3, pets: 0, achieves: 15, deaths: 3, weekly: 3,
      physique: '天魔骨', talent: '玄·福缘深厚',
      events: [
        { text: '第2年·突破至【练气期】' },
        { text: '第5年·击败【山贼王】' },
        { text: '第8年·突破至【筑基期】' },
        { text: '第11年·招募道友【鬼见愁】' },
        { text: '第15年·被魔修偷袭·死亡（第1次）' },
        { text: '第20年·击败【邪修散人】' },
        { text: '第25年·突破至【金丹期】' },
        { text: '第30年·心魔发作·死亡（第2次）' },
        { text: '第40年·击败【金丹魔修】' },
        { text: '第50年·突破至【元婴期】' },
        { text: '第60年·修行走火入魔·死亡（第3次）' },
        { text: '第75年·突破至【化神期】' },
        { text: '第85年·心魔彻底失控' },
        { text: '第95年·被心魔吞噬·化作【魔尊】' }
      ]
    }
  ];
  localStorage.setItem('_pastLifeRecords', JSON.stringify(records));
  localStorage.setItem('_lifeRecordsSeedVer', 'v5');
}

/** 启动画面：开始游戏按钮 */
function handleStartGame() {
  // 始终显示存档位选择（无论是否有已有存档）
  try {
    var meta = getSaveMeta();
    var html = '<p style="font-size:0.7rem;color:#8899aa;margin-bottom:10px;">选择一个存档位开始新游戏：</p><div style="max-height:300px;overflow-y:auto;">';
    for (var i = 0; i < 3; i++) {
      var m = meta[i];
      var exists = !!m && !!localStorage.getItem('buzhengjing_save_' + i);
      html += '<div class="stat-card" style="margin-bottom:6px;text-align:left;">';
      html += '<h3>' + (exists ? '📦' : '🆕') + ' 槽位 ' + (i + 1) + '</h3>';
      if (exists) {
        html += '<div style="font-size:0.7rem;">境界：' + (m.realm || '?') + ' | 年龄：' + (m.age || '?') + '</div>';
        html += '<div style="display:flex;gap:4px;margin-top:4px;">';
        html += '<button class="quick-btn" style="color:var(--danger);" onclick="closeModal();startNewGameAtSlot(' + i + ',true);">覆盖并开始</button>';
        html += '</div>';
      } else {
        html += '<div style="font-size:0.7rem;color:var(--success);">空</div>';
        html += '<div style="display:flex;gap:4px;margin-top:4px;">';
        html += '<button class="quick-btn" onclick="closeModal();startNewGameAtSlot(' + i + ',false);">使用此槽位</button>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    showModal('🆕 选择存档位', html);
  } catch(e) { console.error(e); }
}

/** 从启动画面选择槽位开始新游戏 */
function startNewGameAtSlot(slot, needConfirm) {
  if (needConfirm) {
    showModal('⚠️ 覆盖存档', '<p style="text-align:center;margin-bottom:12px;">该槽位已有存档，确定覆盖吗？</p><div class="modal-btn-group"><button class="modal-btn" onclick="closeModal();doStartNewGame(' + slot + ');">✅ 确认覆盖</button><button class="modal-btn" onclick="closeModal();" style="background:#333;border-color:#555;">取消</button></div>');
  } else {
    doStartNewGame(slot);
  }
}
function doStartNewGame(slot) {
  // 清除该槽位存档
  localStorage.removeItem('buzhengjing_save_' + slot);
  // 更新meta
  try {
    const meta = getSaveMeta();
    if (meta[slot]) meta[slot] = null;
    setSaveMeta(meta);
  } catch(e) {}
  // 重置玩家为全新状态，指定存档槽位
  player = DEFAULT_PLAYER();
  player._saveSlot = parseInt(slot);
  // 重新初始化
  initNewGame();
  // 隐藏启动画面
  document.getElementById('splashScreen').classList.add('hidden');
  setTimeout(() => { const s = document.getElementById('splashScreen'); if (s) s.style.display = 'none'; }, 1000);
  setTimeout(function() { playBgm('bgmGame'); }, 600);
  // 显示欢迎弹窗
  const modal = document.getElementById('introModal');
  if (modal) { modal.style.display = ''; modal.classList.remove('hidden'); modal.classList.add('visible'); }
  requestUIUpdate();
}
window.startNewGameAtSlot = startNewGameAtSlot;
window.doStartNewGame = doStartNewGame;

// ==================== 初始化与启动 ====================

/** 游戏启动 */
function initGame() {
  const modal = document.getElementById('introModal');
  if (!modal) {
    console.error('❌ 找不到 #introModal，请检查 HTML');
    return;
  }

  autoLoadOrNew();

  // 检查是否从存档加载（此时弹窗应隐藏）
  if (player && player._loadedFromSave) {
    player._loadedFromSave = false;
    modal.style.display = 'none';
    modal.classList.remove('visible');
    modal.classList.add('hidden');
    // 隐藏启动封面
    const splash = document.getElementById('splashScreen');
    if (splash) { splash.classList.add('hidden'); splash.style.display = 'none'; }
  } else {
    // 新游戏：保持启动封面可见，用户点击"开始游戏"后进入
    // 不主动弹出欢迎弹窗，以免遮挡启动封面
    modal.style.display = 'none';
    modal.classList.add('hidden');
    // 首次加载自动播放菜单音乐（部分浏览器/Electron会阻止，后续用户点击会触发）
    setTimeout(function() {
      if (typeof playBgm === 'function') playBgm('bgmMenu');
    }, 500);
  }
}

// ==================== 事件绑定 ====================

/** 绑定UI事件 */
function bindEvents() {
  // 提交指令
  document.getElementById('submitCmd').addEventListener('click', submitCommand);
  document.getElementById('commandInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitCommand();
  });
  
  // 紧急关闭弹窗：按 Escape 键（游戏结束弹窗除外）
  document.addEventListener('keydown', function(e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && !player?._gameOverModal) {
      closeModal();
      var o = document.getElementById('fightOverlay');
      if (o) o.style.display = 'none';
      if (player.pendingEvent) player.pendingEvent = null;
      // 重置战斗状态
      player._fightInProgress = false;
      fightingCompanion = null;
      addLog('⏹️ 已强制退出当前战斗/事件', 'system');
    }
  });

  // 快速按钮
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const cmd = this.dataset.cmd;
      if (cmd) handleCommand(cmd);
    });
  });

  // 日志标签切换
  document.getElementById('logTabs').addEventListener('click', function (e) {
    const tab = e.target.closest('.log-tab');
    if (!tab) return;
    const filter = tab.dataset.filter;
    if (filter) {
      player.logFilter = filter;
      document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      applyLogFilter();
    }
    if (tab.id === 'clearLogBtn') {
      clearLogs();
    }
  });

  // 帮助按钮
  document.getElementById('helpBtn').addEventListener('click', function () {
    showHelpPage();
  });

  // 欢迎弹窗关闭 - 使用事件监听
  document.getElementById('introCloseBtn').addEventListener('click', function () {
    window.closeIntro();
  });

  // 天赋点击显示详情
  document.getElementById('talentDisplay').addEventListener('click', function () {
    if (player.talent) {
      const html = '<p><b>天赋等级：</b>' + player.talent.level + '</p>' +
        '<p><b>名称：</b>' + player.talent.name + '</p>' +
        '<p><b>效果：</b>' + player.talent.desc + '</p>' +
        '<p style="font-size:0.7rem;color:#8899aa;">点击任意处关闭</p>';
      showModal('✨ 天赋详情', html);
    } else {
      addLog('暂无天赋', 'system');
    }
  });

  // 战斗模式切换
  document.getElementById('battleModeBtn').addEventListener('click', function () {
    player.battleMode = player.battleMode === 'auto' ? 'manual' : 'auto';
    this.textContent = player.battleMode === 'auto' ? '⚡自动' : '🛠️手动';
    addLog('⚙️ 战斗模式切换为：' + (player.battleMode === 'auto' ? '自动' : '手动'), 'system');
    saveGame();
  });

  // 体魄点击显示详情
  document.getElementById('physiqueText').addEventListener('click', function () {
    if (player.physique) {
      const html = '<p><b>体魄：</b>' + player.physique.name + '</p>' +
        '<p><b>效果：</b>' + player.physique.desc + '</p>' +
        '<p style="font-size:0.7rem;color:#8899aa;">点击任意处关闭</p>';
      showModal('🗿 体魄详情', html);
    } else {
      addLog('暂无体魄', 'system');
    }
  });

  // 点击模态框外部关闭（通用）—— 游戏结束弹窗除外
  document.getElementById('genericModal').addEventListener('click', function (e) {
    if (e.target === this) {
      if (!player.pendingEvent && !player._gameOverModal) {
        closeModal();
      }
    }
  });

  // ☰ 说明书按钮
  document.getElementById('panelToggleBtn').addEventListener('click', function () {
    const panel = document.getElementById('leftPanel');
    if (panel) {
      if (window.innerWidth > 750) {
        // 电脑端：打开欢迎弹窗
        window.toggleIntro();
      } else {
        // 手机端：展开/收起左面板
        panel.classList.toggle('expanded');
      }
    }
  });
}

// ===== 关闭欢迎弹窗（全局） =====
window.closeIntro = function () {
  const modal = document.getElementById('introModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('visible');
    modal.classList.add('hidden');
  }
  // 关闭欢迎弹窗时同时隐藏启动封面
  const splash = document.getElementById('splashScreen');
  if (splash && !splash.classList.contains('hidden')) {
    splash.classList.add('hidden');
    setTimeout(function() { if (splash) splash.style.display = 'none'; }, 1000);
  }
};

window.toggleIntro = function () {
  const modal = document.getElementById('introModal');
  if (modal) {
    if (modal.style.display === 'none' || modal.classList.contains('hidden')) {
      modal.style.display = '';
      modal.classList.remove('hidden');
      modal.classList.add('visible');
    } else {
      modal.style.display = 'none';
      modal.classList.remove('visible');
      modal.classList.add('hidden');
    }
  }
};

// ==================== 自动保存与恢复定时器 ====================

/** 启动自动保存（每3分钟，存入独立自动存档槽位） */
function startAutoSave() {
  setInterval(() => {
    if (player && isFinite(getMaxLifeMonths()) && player.ageMonths < getMaxLifeMonths()) {
      saveGame(undefined, 'buzhengjing_save_auto');
    }
  }, 180000); // 3分钟
}

/** 自动恢复（每15秒） */
function startAutoRegen() {
  setInterval(() => {
    if (!player) return;
    if (player.ageMonths >= getMaxLifeMonths() && isFinite(getMaxLifeMonths())) return;
    regenerate();
    if (player.combatCooldown > 0) player.combatCooldown--;
    // 宗门危机/争端事件（极低概率，约每10分钟1次）
    if (player.sect && Math.random() < 0.01) {
      const type = Math.random() < 0.5 ? 'crisis' : 'conflict';
      triggerSectEvent(type);
    }
    // 灵田事件（若有种植中的地块）
    if (player.farm) {
      player.farm.plots.forEach(function(plot, i) {
        if (plot.planted && !plot.ready && Math.random() < 0.02) triggerFarmEvent('grow', i);
      });
    }
  }, 15000); // 15秒
}

// ==================== 移动端辅助滚动 ====================

/** 为快速按钮栏添加滚动箭头（移动端） */
// ==================== 启动游戏 ====================

// 重写部分函数引用（解决依赖顺序问题）
// 注意：所有函数已经在之前定义，此处仅做整合

// 暴露全局函数（供HTML onclick使用）
window.addLog = addLog;
window.showModal = showModal;
window.closeModal = closeModal;
window.closeModalById = closeModalById;
window.requestUIUpdate = requestUIUpdate;
window.forceUI = forceUI;
window.pulseExpBar = pulseExpBar;
window.flashDamage = flashDamage;
window.flashReward = flashReward;
window.flashBreakthrough = flashBreakthrough;
window.handleCommand = handleCommand;
window.submitCommand = submitCommand;
window.showStatus = showStatus;
window.showBag = showBag;
window.showCompanions = showCompanions;
window.showPets = showPets;
window.openShop = openShop;
window.showRootCultivate = showRootCultivate;
window.cultivateRoot = cultivateRoot;
window.showEquip = showEquip;
window.openDungeonMenu = openDungeonMenu;
window.openAlchemy = openAlchemy;
window.openForge = openForge;
window.saveGame = saveGame;
window.doSave = doSave;
window.doLoad = doLoad;
window.doLoadAuto = doLoadAuto;
window.loadGame = loadGame;
window.showAchievements = showAchievements;
window.showSkills = showSkills;
window.learnSkill = learnSkill;
window.upgradeSkill = upgradeSkill;
window.showTitles = showTitles;
window.showBounties = showBounties;
window.showHelpPage = showHelpPage;
window.switchPage = switchPage;
window.initPageNav = initPageNav;
window.handleStartGame = handleStartGame;
window.showCollection = showCollection;
window.openCave = openCave;
window.upgradeCave = upgradeCave;
window.openBossFight = openBossFight;
window.startBossFight = startBossFight;
window.doBreakXianDi = doBreakXianDi;
window.doBreakSanXian = doBreakSanXian;
window.openFarm = openFarm;
window.openTower = openTower;
window.startTowerFight = startTowerFight;
window.openMap = openMap;
window.exploreMap = exploreMap;
window.openSect = openSect;
window.joinSect = joinSect;
window.leaveSect = leaveSect;
window.doSectTask = doSectTask;
window.plantSeed = plantSeed;
window.harvestPlot = harvestPlot;
window.equipTitle = equipTitle;
window.newGame = newGame;
window.equipItem = equipItem;
window.enhanceEquipment = enhanceEquipment;
window.rerollEquipment = rerollEquipment;
window.sellItem = sellItem;
window.sellAllItems = sellAllItems;
window.buyItem = buyItem;
window.breakWithCompanion = breakWithCompanion;
window.giveGiftPrompt = giveGiftPrompt;
window.giveGift = giveGift;
window.makeDaoCompanion = makeDaoCompanion;
window.abandonPet = abandonPet;
window.enterDungeon = enterDungeon;
window.alchemy = alchemy;
window.forgeArtifact = forgeArtifact;
window.selectFightCompanion = selectFightCompanion;
window.resolveEvent = resolveEvent;
window.startNewWeek = startNewWeek;
window.checkAchievements = checkAchievements;
window.showPetNameModal = showPetNameModal;
window.confirmPetName = confirmPetName;
window.selectBattleSkill = selectBattleSkill;
window.cancelBattleSkill = cancelBattleSkill;
window.resolveManualRound = resolveManualRound;
window.showFightSkillModal = showFightSkillModal;

// 启动
document.addEventListener('DOMContentLoaded', function () {
  // 初始化数据
  initGame();

  // 首次启动：生成示例轮回记录
  seedLifeRecords();

  // 初始化音频（但先不播放，等用户点击后再播）
  initAudio();

  // 启动画面按钮（HTML onclick 已绑定，此处不再重复绑定）

  // 绑定事件
  bindEvents();

  // 初始化手机端分页导航
  initPageNav();

  // 启动自动保存与恢复
  startAutoSave();
  startAutoRegen();

  // 初始UI刷新

  console.log('🎮 不正经修仙模拟器 已启动！');
  console.log('📖 输入 help 查看指令，或点击按钮操作。');
});

// ================================================================
// 全部代码整合完毕
// ================================================================

/** 当前页码（手机端） */
let _mobilePage = 1;

/** 切换页面 */
function switchPage(n) {
  _mobilePage = n;
  // 更新圆点高亮
  const dots = document.querySelectorAll('.dot');
  dots.forEach(d => d.classList.remove('active'));
  const activeDot = document.querySelector('.dot[data-page="' + n + '"]');
  if (activeDot) activeDot.classList.add('active');
  
  // 显示/隐藏对应页的按钮
  const btns = document.querySelectorAll('.quick-btn[data-page]');
  btns.forEach(btn => {
    const page = parseInt(btn.dataset.page);
    btn.classList.toggle('btn-hidden', page !== n);
  });
}

/** 初始化分页导航 */
function initPageNav() {
  // 点圆点切换
  const dots = document.querySelectorAll('.dot');
  dots.forEach(dot => {
    dot.addEventListener('click', function () {
      const page = parseInt(this.dataset.page);
      if (!isNaN(page)) switchPage(page);
    });
  });
  
  // 触摸滑动
  const container = document.getElementById('quickActions');
  if (container) {
    let startX = 0;
    container.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    
    container.addEventListener('touchend', function (e) {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) < 30) return;
      if (diff > 0 && _mobilePage < 3) {
        switchPage(_mobilePage + 1);
      } else if (diff < 0 && _mobilePage > 1) {
        switchPage(_mobilePage - 1);
      }
    }, { passive: true });
  }
  
  // 初始显示第1页
  switchPage(1);
}

/** 说明书/帮助页 */
function showHelpPage() {
  const html = `
    <div style="font-size:0.75rem;line-height:1.8;">
      <h4 style="color:var(--gold);margin-bottom:6px;">🎮 基础操作</h4>
      <p>点击上方按钮执行对应操作，或在输入框输入指令后按回车。</p>
      <h4 style="color:var(--gold);margin-top:10px;margin-bottom:6px;">⚡ 批量指令</h4>
      <p>在输入框输入 <b>修炼10</b> → 连续修炼10次</p>
      <p>在输入框输入 <b>探索5</b> → 连续探索5次</p>
      <p>在输入框输入 <b>休息3</b> → 连续休息3次</p>
      <p style="font-size:0.65rem;color:#8899aa;">批量指令会在寿元耗尽/体力不足/冷却时自动停止。</p>
      <h4 style="color:var(--gold);margin-top:10px;margin-bottom:6px;">📖 常用指令列表</h4>
      <p>修炼 / 突破 / 探索 / 战斗 / 状态 / 休息 / 背包</p>
      <p>商城 / 装备 / 秘境 / 炼丹 / 炼器 / 存 / 读</p>
      <p>成就 / 称号 / 悬赏 / 图鉴 / 洞府 / BOSS / 灵田</p>
      <h4 style="color:var(--gold);margin-top:10px;margin-bottom:6px;">🤫 秘密指令</h4>
      <p style="font-size:0.65rem;color:#8899aa;">摸鱼 / 急急如律令 / 咸鱼翻身 / 不正经 / 我是谁 / 我要成仙</p>
      <h4 style="color:var(--gold);margin-top:10px;margin-bottom:6px;">💀 死亡处理</h4>
      <p>死亡后只能读档或重新开始。记得经常 💾存 档！</p>
    </div>
  `;
  showModal('📖 修仙手册', html);
}

/** 功法系统 */
function showSkills() {
  if (!player.skills) player.skills = [];
  const owned = player.skills.map(s => s.id);
  let html = '<div style="max-height:400px;overflow-y:auto;">';
  SKILLS.forEach(skill => {
    const ownedSkill = player.skills.find(s => s.id === skill.id);
    const lvl = ownedSkill ? ownedSkill.level || 1 : 0;
    const canLearn = skill.realmReq <= player.realmIndex;
    const canUpgrade = ownedSkill && lvl < skill.maxLevel && player.spiritStones >= skill.costPerLevel * (lvl + 1);
    const learnCost = skill.costPerLevel;
    html += '<div class="stat-card" style="margin-bottom:6px;">';
    html += '<h3>' + (skill.type === 'cultivate' ? '🧘' : skill.type === 'combat' ? '⚔️' : skill.type === 'defense' ? '🛡️' : '📖') + ' ' + skill.name + ' <span style="font-size:0.6rem;color:#8899aa;">Lv.' + lvl + '/' + skill.maxLevel + '</span></h3>';
    html += '<div style="font-size:0.7rem;">' + skill.desc + '</div>';
    html += '<div style="font-size:0.6rem;color:#8899aa;">学习费用：' + learnCost + '灵石 ｜ 需求：' + REALMS[skill.realmReq].name + '</div>';
    if (lvl === 0 && canLearn) {
      html += '<button class="quick-btn" style="margin-top:4px;" onclick="learnSkill(\'' + skill.id + '\');closeModal();showSkills();">学习</button>';
    } else if (canUpgrade) {
      html += '<button class="quick-btn" style="margin-top:4px;" onclick="upgradeSkill(\'' + skill.id + '\');closeModal();showSkills();">升级（' + (skill.costPerLevel * (lvl + 1)) + '灵石）</button>';
    } else if (lvl >= skill.maxLevel) {
      html += '<span style="font-size:0.6rem;color:var(--success);">已满级</span>';
    } else if (!canLearn) {
      html += '<span style="font-size:0.6rem;color:#666;">需求：' + REALMS[skill.realmReq].name + '</span>';
    } else {
      html += '<span style="font-size:0.6rem;color:#666;">灵石不足</span>';
    }
    html += '</div>';
  });
  html += '</div>';
  showModal('📖 功法阁', html);
}
function learnSkill(id) {
  const skill = SKILLS.find(s => s.id === id);
  if (!skill) return;
  if (player.spiritStones < skill.costPerLevel) { addLog('灵石不足！', 'danger'); return; }
  player.spiritStones -= skill.costPerLevel;
  player.skills.push({ id: id, level: 1 });
  addLog('📖 习得功法【' + skill.name + '】', 'success');
  saveGame();
  
}
function upgradeSkill(id) {
  const owned = player.skills.find(s => s.id === id);
  if (!owned) return;
  const skill = SKILLS.find(s => s.id === id);
  if (!skill) return;
  const cost = skill.costPerLevel * (owned.level + 1);
  if (player.spiritStones < cost) { addLog('灵石不足！', 'danger'); return; }
  player.spiritStones -= cost;
  owned.level = (owned.level || 1) + 1;
  addLog('⬆️ 【' + skill.name + '】升级至 Lv.' + owned.level, 'success');
  saveGame();
  
}

// ==================== 宗门系统 ====================

/** 宗门界面 */
function openSect() {
  if (player.sect) {
    showSectInfo();
  } else {
    showSectList();
  }
}

/** 宗门列表 */
function showSectList() {
  let html = '<div style="max-height:350px;overflow-y:auto;"><p style="font-size:0.7rem;color:#8899aa;margin-bottom:8px;">选择一个宗门加入：</p>';
  SECTS.forEach(s => {
    var alignColor = s.alignment === '正' ? '#3498db' : (s.alignment === '邪' ? '#c0392b' : '#8899aa');
    var alignIcon = s.alignment === '正' ? '😇' : (s.alignment === '邪' ? '😈' : '😐');
    html += '<div class="stat-card" style="margin-bottom:6px;cursor:pointer;" onclick="closeModal();joinSect(\'' + s.id + '\');">';
    html += '<h3>' + s.icon + ' ' + s.name + ' <span style="font-size:0.55rem;color:' + alignColor + ';">' + alignIcon + s.alignment + '</span></h3>';
    html += '<div style="font-size:0.65rem;color:#8899aa;">' + s.desc + '</div>';
    html += '<div style="font-size:0.6rem;color:#8899aa;">加成：' + (s.bonuses.cultivate ? '修炼×' + s.bonuses.cultivate + ' ' : '') + (s.bonuses.combat ? '战斗×' + s.bonuses.combat + ' ' : '') + (s.bonuses.alchemy ? '炼丹+' + (s.bonuses.alchemy*100) + '% ' : '') + (s.bonuses.stoneBoost ? '灵石×' + s.bonuses.stoneBoost + ' ' : '') + (s.bonuses.doubleCultivate ? '双修加成 ' : '') + (s.bonuses.poisonAtk ? '毒攻+' + s.bonuses.poisonAtk + ' ' : '') + '</div>';
    html += '</div>';
  });
  html += '</div>';
  showModal('🏛️ 选择宗门', html);
}

/** 加入宗门 */
function joinSect(id) {
  const sect = SECTS.find(s => s.id === id);
  if (!sect) return;
  player.sect = id;
  player.sectRank = 0;
  player.sectContrib = 0;
  addLog('⛰️ 加入【' + sect.name + '】，从外门弟子做起！', 'success');
  addLifeEvent('加入【' + sect.name + '】');
  requestUIUpdate();
  saveGame();
}

/** 宗门详情 */
function showSectInfo() {
  const sect = SECTS.find(s => s.id === player.sect);
  if (!sect) return;
  const rank = player.sectRank || 0;
  const nextRank = rank < sect.ranks.length - 1 ? sect.ranks[rank + 1] : null;
  const nextContrib = rank < sect.ranks.length - 1 ? sect.contribNeeded[rank + 1] : Infinity;

  let html = '<div style="max-height:400px;overflow-y:auto;">';

  // 宗门信息
  html += '<div class="stat-card" style="margin-bottom:6px;text-align:center;">';
  html += '<h3>' + sect.icon + ' ' + sect.name + '</h3>';
  html += '<div style="font-size:0.7rem;">职位：<b>' + sect.ranks[rank] + '</b></div>';
  html += '<div style="font-size:0.65rem;color:#8899aa;">贡献：' + player.sectContrib + ' 点</div>';
  if (nextRank) {
    html += '<div style="font-size:0.6rem;color:#8899aa;">下一阶：' + nextRank + '（需贡献' + nextContrib + '点）</div>';
  } else {
    html += '<div style="font-size:0.6rem;color:var(--gold);">已达最高职位</div>';
  }
  html += '<div style="font-size:0.6rem;color:#8899aa;">每日俸禄：' + sect.stipend[rank] + '灵石</div>';
  html += '<button class="quick-btn" style="margin-top:4px;" onclick="closeModal();receiveStipend();showSectInfo();">💰 领取俸禄</button>';
  html += '</div>';

  // 宗门任务
  html += '<div class="stat-card"><h3>📋 宗门任务</h3>';
  SECT_TASKS.forEach(t => {
    const canDo = t.check(player);
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:0.7rem;border-bottom:1px solid #1e3044;">';
    html += '<span>' + t.name + '<br><span style="font-size:0.55rem;color:#8899aa;">' + t.desc + '</span></span>';
    html += '<span>' + (canDo ? '<button class="quick-btn" onclick="closeModal();doSectTask(' + SECT_TASKS.indexOf(t) + ');showSectInfo();">提交</button>' : '<span style="color:#666;font-size:0.6rem;">条件不足</span>') + '</span>';
    html += '</div>';
  });
  html += '</div>';

  // 退出宗门
  html += '<button class="quick-btn" style="color:var(--danger);width:100%;margin-top:6px;" onclick="closeModal();leaveSect();">🚪 退出宗门</button>';

  html += '</div>';
  showModal('🏛️ ' + sect.name, html);
}

/** 提交宗门任务 */
function doSectTask(taskIdx) {
  const task = SECT_TASKS[taskIdx];
  if (!task || !task.check(player)) { addLog('条件不足！', 'danger'); return; }
  task.doTask(player);
  player.sectContrib = (player.sectContrib || 0) + task.contrib;
  addLog('📋 完成宗门任务【' + task.name + '】贡献+' + task.contrib, 'reward');
  // 自动晋升检测
  const sect = SECTS.find(s => s.id === player.sect);
  if (sect) {
    const r = player.sectRank || 0;
    if (r < sect.ranks.length - 1 && player.sectContrib >= sect.contribNeeded[r + 1]) {
      player.sectRank = r + 1;
      addLog('🎉 晋升为【' + sect.ranks[player.sectRank] + '】！', 'special');
    }
  }
  requestUIUpdate();
  saveGame();
}

/** 退出宗门 */
function leaveSect() {
  if (!player.sect) return;
  const sect = SECTS.find(s => s.id === player.sect);
  addLog('🚪 退出【' + (sect ? sect.name : '宗门') + '】', 'danger');
  player.sect = null;
  player.sectRank = 0;
  player.sectContrib = 0;
  requestUIUpdate();
  saveGame();
}

/** 领取宗门俸禄 */
function receiveStipend() {
  if (!player.sect) return;
  const sect = SECTS.find(s => s.id === player.sect);
  if (!sect) return;
  const now = Date.now();
  if (now - (player._lastStipendTime || 0) < 60000) { // 60秒冷却
    addLog('⏳ 俸禄还需等待才能领取', 'system');
    return;
  }
  const rank = player.sectRank || 0;
  const stipend = sect.stipend[rank];
  player.spiritStones += stipend;
  player._lastStipendTime = now;
  addLog('💰 领取宗门俸禄：' + stipend + '灵石', 'reward');
  requestUIUpdate();
  saveGame();
}

/** 管理员后台 */
function showAdminPanel() {
  if (!player) return;

  function adminRow(label, val) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid #1e3044;font-size:0.7rem;">' +
      '<span>' + label + ': <b>' + val + '</b></span></div>';
  }

  const s = getEffectiveStats();
  let html = '<div style="max-height:400px;overflow-y:auto;">';
  html += '<p style="text-align:center;font-size:0.65rem;color:var(--danger);margin-bottom:6px;">⚠️ 管理员工具 — 滥用会破坏游戏体验</p>';

  // 快捷操作
  html += '<div class="stat-card"><h3>⚡ 快捷操作</h3>';
  html += '<button class="quick-btn" onclick="player.spiritStones+=1000;addLog(\'🧀 灵石+1000\',\'reward\');requestUIUpdate();showAdminPanel();">灵石+1000</button> ';
  html += '<button class="quick-btn" onclick="player.exp+=5000;addLog(\'🧀 修为+5000\',\'success\');pulseExpBar();requestUIUpdate();showAdminPanel();">修为+5000</button> ';
  html += '<button class="quick-btn" onclick="player.currentHP=getEffectiveStats().maxHP;player.currentMP=getEffectiveStats().maxMP;addLog(\'🧀 状态全满\',\'success\');requestUIUpdate();showAdminPanel();">状态全满</button> ';
  html += '<button class="quick-btn" onclick="var st=getEffectiveStats();player.currentHP=st.maxHP;player.currentMP=st.maxMP;player.combatCooldown=0;player._ghostCultivator=false;addLog(\'🧀 已复活\',\'success\');requestUIUpdate();showAdminPanel();">💀复活</button>';
  html += '</div>';

  // 属性编辑
  html += '<div class="stat-card"><h3>📊 属性编辑</h3>';
  html += adminRow('灵石', player.spiritStones);
  html += adminRow('修为', player.exp);
  html += adminRow('生命', Math.floor(player.currentHP) + '/' + s.maxHP);
  html += adminRow('灵力', Math.floor(player.currentMP) + '/' + s.maxMP);
  html += '<div style="font-size:0.7rem;padding:3px 0;">境界: <b>' + getRealmFullName() + '</b></div>';
  html += '<div style="display:flex;gap:4px;margin-top:4px;">';
  html += '<select id="adminRealm" style="flex:1;background:#0a0f16;color:#e0e0e0;border:1px solid var(--border);padding:4px;border-radius:6px;font-family:inherit;font-size:0.7rem;">';
  REALMS.forEach((r, i) => {
    html += '<option value="' + i + '" ' + (i === player.realmIndex ? 'selected' : '') + '>' + r.icon + ' ' + r.name + '</option>';
  });
  html += '</select>';
  html += '<button class="quick-btn" onclick="var r=parseInt(document.getElementById(\'adminRealm\').value);player.realmIndex=r;player.layer=1;var st=getEffectiveStats();player.currentHP=st.maxHP;player.currentMP=st.maxMP;addLog(\'🧀 境界变更为 \'+REALMS[r].name,\'success\');requestUIUpdate();saveGame();showAdminPanel();">设置</button>';
  html += '</div>';
  html += '</div>';

  // 自定义添加
  html += '<div class="stat-card"><h3>✏️ 自定义添加</h3>';
  html += '<input id="adminVal" type="number" value="100" min="1" style="width:100%;background:#0a0f16;color:#e0e0e0;border:1px solid var(--border);padding:4px;border-radius:6px;font-family:inherit;margin-bottom:4px;">';
  html += '<button class="quick-btn" onclick="var v=parseInt(document.getElementById(\'adminVal\').value||100);player.spiritStones+=v;addLog(\'🧀 灵石+\'+v,\'reward\');requestUIUpdate();showAdminPanel();">加灵石</button> ';
  html += '<button class="quick-btn" onclick="var v=parseInt(document.getElementById(\'adminVal\').value||100);player.exp+=v;pulseExpBar();addLog(\'🧀 修为+\'+v,\'success\');requestUIUpdate();showAdminPanel();">加修为</button> ';
  html += '<button class="quick-btn" onclick="var v=parseInt(document.getElementById(\'adminVal\').value||100);var st=getEffectiveStats();player.currentHP=Math.min(st.maxHP,player.currentHP+v);addLog(\'🧀 生命+\'+v,\'success\');requestUIUpdate();showAdminPanel();">加生命</button>';
  html += '</div>';

  // 资源
  html += '</div>';

  html += '</div>';
  showModal('🛠️ 管理员后台', html);
}

console.log('✅ 第七部分（UI/指令/初始化）已加载 — 游戏完整！');
