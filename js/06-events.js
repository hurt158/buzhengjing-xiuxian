// ================================================================
// 第 6 部分：事件系统（奇遇 / 道友事件 / 随机事件 / 心魔）与命运系统
// ================================================================

// ==================== 全局事件锁 ====================
// 防止多个事件同时触发，避免覆盖
let _eventLock = false;

// ==================== 奇遇系统 ====================

/** 触发奇遇（在修炼/探索/战斗后调用） */
function triggerAdventure() {
  if (player.pendingEvent || _eventLock) return;

  // 基础概率
  let baseChance = 0.1;
  // 天赋加成
  if (player.talent?.effect?.type === 'adventureRate') {
    baseChance *= player.talent.effect.val;
  }
  // 体魄加成（九窍玲珑体）
  if (player.physique?.effect?.adventureMult) {
    baseChance *= player.physique.effect.adventureMult;
  }
  // 气运加成
  const luckThreshold = getFateThreshold('luck', player.fate.luck);
  if (luckThreshold && luckThreshold.rareBoost) {
    baseChance *= luckThreshold.rareBoost;
  }
  // 神识加成（每点+1%奇遇概率）
  baseChance *= (1 + (player.spiritualSense || 10) / 100);

  if (Math.random() > baseChance) return;

  // ===== 特殊奇遇：黑袍人问答（5%概率） =====
  if (Math.random() < 0.05) {
    const specialEvent = {
      desc: '一位神秘黑袍人拦住去路：“回答我，何为道？”',
      options: [
        {
          text: '道法自然',
          action: () => {
            player.exp += 200;
            player.spiritStones += 100;
            addLog('黑袍人满意点头：“不错。”修为+200，灵石+100。', 'success');
            checkAchievements();
          }
        },
        {
          text: '拳头就是道',
          action: () => {
            player.currentHP = Math.max(1, player.currentHP - 30);
            player.spiritStones += 30;
            addLog('黑袍人大怒，一掌击来，你损失30生命，但掉落了30灵石。', 'danger');
          }
        },
        {
          text: '不知道',
          action: () => {
            player.spiritStones += 80;
            addLog('黑袍人一愣，丢下80灵石说“诚实也是道”。', 'special');
          }
        }
      ]
    };
    showEventModal('✨ 奇遇抉择', specialEvent.desc, specialEvent.options);
    return;
  }

  // ===== 普通奇遇池 =====
  const events = [
    {
      msg: '🌈 天降祥瑞，修为大增',
      action: () => { player.exp += Math.floor(getExpNeeded() * 0.3); }
    },
    {
      msg: '📜 上古遗迹，获得功法残卷',
      action: () => { player.exp += 80 + player.realmIndex * 30; }
    },
    {
      msg: '🧙 神秘老人赠予丹药',
      action: () => {
        const possible = REALMS.filter(r => r.breakItem).map(r => r.breakItem);
        if (possible.length) {
          const item = possible[Math.floor(Math.random() * possible.length)];
          addToBag(item, 'consumable', 1);
          addLog('获得【' + item + '】', 'reward');
        }
      }
    },
    {
      msg: '💎 天外陨铁，灵石大增',
      action: () => { player.spiritStones += 150 + player.realmIndex * 40; }
    },
    {
      msg: '🌀 空间裂缝，受伤得装备',
      action: () => {
        player.currentHP = Math.max(1, player.currentHP - Math.floor(getEffectiveStats().maxHP * 0.08));
        const type = ['weapon', 'armor', 'accessory'][Math.floor(Math.random() * 3)];
        const eq = randomEquipment(type);
        if (eq) { addToBag(eq, type); addLog('获得【' + eq.name + '】', 'reward'); }
      }
    },
    {
      msg: '🐉 遇幼年神兽',
      action: () => {
        if (player.pets.length < 2) {
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
            addLog('收养幼年神兽【' + finalName + '】', 'success');
            requestUIUpdate();
          });
        } else {
          addLog('灵兽已满，幼年神兽离去。', 'system');
        }
      }
    }
  ];

  const ev = events[Math.floor(Math.random() * events.length)];
  addLog('✨ 奇遇：' + ev.msg, 'special');
  if (ev.action) ev.action();
  checkAchievements();
  requestUIUpdate();
}

// ==================== 道友事件系统 ====================

/** 道友剧情池（好感度越高可触发越多） */
const COMPANION_EVENT_POOL = [
  // 1. 借钱
  {
    descFn: (c) => '道友【' + c.name + '】搓着手凑过来："借点灵石呗？我看中一件宝贝，到手分你一半！"',
    minAff: 0, maxAff: 100,
    options: [
      { text: '💰借100', action: (p, c) => { if (p.spiritStones >= 100) { p.spiritStones -= 100; if (Math.random() < 0.4) { p.spiritStones += 150; addLog(c.name + '真的买了一宝贝回来，卖了150灵石！', 'reward'); c.affection = Math.min(100, c.affection + 10); } else { addLog(c.name + '灵石打水漂了，血本无归……', 'danger'); c.affection = Math.min(100, c.affection + 3); } } else { addLog('你囊中羞涩，' + c.name + '叹了口气。', 'system'); } } },
      { text: '借50', action: (p, c) => { if (p.spiritStones >= 50) { p.spiritStones -= 50; if (Math.random() < 0.5) { p.spiritStones += 80; addLog(c.name + '买了一堆破烂，但居然有人高价收走了！灵石+80', 'reward'); c.affection += 8; } else { addLog(c.name + '被骗了，钱没了。', 'danger'); c.affection += 2; } } else { addLog('你摇了摇头，' + c.name + '失望地走了。', 'system'); c.affection -= 3; } } },
      { text: '👋不借', action: (p, c) => { addLog('你婉拒了' + c.name + '。他撇了撇嘴走了。', 'system'); c.affection = Math.max(0, c.affection - 5); } }
    ]
  },
  // 2. 黑暗料理
  {
    descFn: (c) => '道友【' + c.name + '】端着一锅冒着绿烟的东西跑来："我新研发的十全大补汤！你尝尝！"',
    minAff: 20, maxAff: 100,
    options: [
      { text: '😬尝一口', action: (p, c) => { if (Math.random() < 0.3) { const s = getEffectiveStats(); p.currentHP = Math.min(s.maxHP, p.currentHP + 50); p.exp += 30; addLog('你捏着鼻子喝了一口……居然挺好喝！生命+50，修为+30', 'success'); c.affection += 10; } else { p.currentHP = Math.max(1, p.currentHP - 30); addLog('你吐了三天。生命-30', 'danger'); c.affection += 5; } } },
      { text: '🤢拒绝', action: (p, c) => { addLog('你看着那锅绿烟说刚吃过。' + c.name + '自己喝了，脸绿了三天。', 'system'); c.affection -= 2; } }
    ]
  },
  // 3. 奇怪功法
  {
    descFn: (c) => '道友【' + c.name + '】神秘兮兮掏出一本破书："我刚捡到的《三天成仙秘籍》，免费给你！"',
    minAff: 10, maxAff: 100,
    options: [
      { text: '📖练', action: (p, c) => { if (Math.random() < 0.5) { p.exp += 100; addLog('你按秘籍练了一天……居然真有效！修为+100！', 'success'); } else { p.exp = Math.max(0, p.exp - 50); p.currentHP = Math.max(1, p.currentHP - 20); addLog('秘籍是假的！你练得走火入魔，修为-50，生命-20', 'danger'); } c.affection += 3; } },
      { text: '🔥烧了', action: (p, c) => { addLog('你当场把书烧了，' + c.name + '说"烧得好，我看着就不像正经功法"。', 'system'); c.affection += 2; } }
    ]
  },
  // 4. 半夜闹鬼
  {
    descFn: (c) => '半夜，道友【' + c.name + '】脸色煞白地敲门："我房里……有鬼！一个穿红衣服的女人在梳头！"',
    minAff: 15, maxAff: 100,
    options: [
      { text: '🗡️去看看', action: (p, c) => { if (Math.random() < 0.4) { p.exp += 50; p.spiritStones += 30; addLog('你冲进去——哪有什么鬼，是一件红衣法器！修为+50，灵石+30', 'reward'); c.affection += 10; } else { p.currentHP = Math.max(1, p.currentHP - 30); addMonths(3); addLog('真的有鬼！你被吓掉半条命，生命-30，寿元-3月', 'horror'); c.affection += 5; } } },
      { text: '😴不管', action: (p, c) => { addLog('你翻了个身说"明天再说"。第二天' + c.name + '说那女鬼帮他梳了一夜头，他秃了。', 'system'); c.affection -= 3; } }
    ]
  },
  // 5. 走火入魔
  {
    descFn: (c) => '道友【' + c.name + '】突然七窍冒烟："我不行了……刚才突破岔了气！快帮我！"',
    minAff: 30, maxAff: 100,
    options: [
      { text: '🧸运功相助', action: (p, c) => { p.currentMP = Math.max(0, p.currentMP - 30); p.exp = Math.max(0, p.exp - 50); if (Math.random() < 0.6) { addLog('你耗费修为帮他导气归元，他送你一本功法。修为-50，灵力-30', 'danger'); addToBag('筑基丹', 'consumable', 1); c.affection += 15; } else { addLog('你俩一起岔气了！修为-50，灵力-30，谁也没救成谁。', 'danger'); c.affection += 5; } } },
      { text: '👀旁观', action: (p, c) => { addLog('你看着' + c.name + '在地上打滚，过了一炷香他自己好了。他说"算你狠"。', 'system'); c.affection = Math.max(0, c.affection - 10); } }
    ]
  },
  // 6. 上古洞府
  {
    descFn: (c) => '道友【' + c.name + '】兴奋地跑来："我发现了一座上古洞府！但门口有禁制，我们一起去破！"',
    minAff: 30, maxAff: 100,
    options: [
      { text: '🗺️同去', action: (p, c) => { const roll = Math.random(); if (roll < 0.3) { p.spiritStones += 200; addLog('洞府里堆满了灵石！你发了！+200灵石', 'reward'); c.affection += 10; } else if (roll < 0.6) { p.exp += 150; addLog('洞府里有一卷功法，参悟后修为+150', 'success'); c.affection += 8; } else { p.currentHP = Math.max(1, p.currentHP - 40); addLog('禁制炸了！你被崩飞，生命-40，什么都没捞着。', 'danger'); c.affection += 3; } } },
      { text: '👋不去', action: (p, c) => { addLog('你不感兴趣。' + c.name + '自己去了，回来时鼻青脸肿，说"还好你没去"。', 'system'); c.affection -= 2; } }
    ]
  },
  // 7. 谈恋爱
  {
    descFn: (c) => '道友【' + c.name + '】扭扭捏捏地说："我看上了隔壁山头的小翠……你说我该咋办？"',
    minAff: 25, maxAff: 100,
    options: [
      { text: '💘帮忙撮合', action: (p, c) => { if (Math.random() < 0.5) { p.spiritStones += 50; addLog('你帮' + c.name + '写了一封情书，居然成了！' + c.name + '塞给你50灵石谢媒钱。', 'reward'); c.affection += 12; } else { addLog('你帮' + c.name + '表白，但小翠说她只爱修炼。' + c.name + '哭了一晚上。', 'system'); c.affection += 5; } } },
      { text: '😐劝放弃', action: (p, c) => { addLog('你说"修仙之人谈什么恋爱"。' + c.name + '想了想说"你说得对"，然后半夜偷偷哭了。', 'system'); c.affection -= 3; } }
    ]
  },
  // 8. 灵兽丢了
  {
    descFn: (c) => '道友【' + c.name + '】急得团团转："我的灵兽跑丢了！你看见了没？一只会喷火的……嗯……其实它只会打嗝。"',
    minAff: 10, maxAff: 100,
    options: [
      { text: '🔍帮忙找', action: (p, c) => { if (Math.random() < 0.5) { p.spiritStones += 30; addLog('你在茅房里找到了那只打嗝的灵兽。' + c.name + '给了30灵石。', 'reward'); c.affection += 8; } else { p.currentHP = Math.max(1, p.currentHP - 15); addLog('你找到灵兽了——但它正在被一只野猪追。你被撞了一下，生命-15。', 'danger'); c.affection += 8; } } },
      { text: '🙅不帮', action: (p, c) => { addLog('你没空。三天后' + c.name + '说灵兽自己回来了，还带了一窝崽。', 'system'); c.affection -= 3; } }
    ]
  },
  // 9. 三色药丸
  {
    descFn: (c) => '道友【' + c.name + '】鬼鬼祟祟掏出三颗药丸："我炼了一炉新品！你帮我试试？"颜色分别是红、绿、紫。',
    minAff: 20, maxAff: 100,
    options: [
      { text: '🔴吃红的', action: (p, c) => { const s = getEffectiveStats(); p.currentHP = Math.min(s.maxHP, p.currentHP + 30); p.currentMP = Math.min(s.maxMP, p.currentMP + 20); addLog('红的居然是正经回血丹！生命+30，灵力+20', 'success'); c.affection += 5; } },
      { text: '🟢吃绿的', action: (p, c) => { p.currentHP = Math.max(1, p.currentHP - 25); p.exp += 60; addLog('绿的剧毒！但毒完你发现修为涨了60。以毒攻毒？', 'special'); c.affection += 5; } },
      { text: '🟣吃紫的', action: (p, c) => { if (Math.random() < 0.3) { p.innerDemon = Math.max(0, p.innerDemon - 20); addLog('紫的下肚，你看见了自己的前世——你是一颗土豆。心魔-20', 'special'); } else { p.innerDemon = (p.innerDemon || 0) + 15; addLog('紫的让你产生幻觉，追着自己的尾巴跑了三圈。心魔+15', 'horror'); } c.affection += 5; } }
    ]
  },
  // 10. 古墓探险
  {
    descFn: (c) => '道友【' + c.name + '】挖到了一座古墓的入口："里面有好东西！但我一个人不敢进。"',
    minAff: 35, maxAff: 100,
    options: [
      { text: '⚕️下去', action: (p, c) => { const roll = Math.random(); if (roll < 0.25) { p.spiritStones += 150; addLog('棺材里全是陪葬灵石！+150灵石', 'reward'); } else if (roll < 0.5) { p.exp += 100; addLog('墓壁上刻着功法，修为+100', 'success'); } else if (roll < 0.75) { p.currentHP = Math.max(1, p.currentHP - 35); addLog('触发了机关！万箭齐发！生命-35', 'danger'); } else { addMonths(12); addLog('棺材里冒出一股尸气，折了1年寿元……', 'horror'); } c.affection += 8; } },
      { text: '🏃不去了', action: (p, c) => { addLog('你觉得不吉利。' + c.name + '说"那我也不去了"。', 'system'); c.affection -= 2; } }
    ]
  },
  // 11. 双修邀请
  {
    descFn: (c) => '道友【' + c.name + '】红着脸说："我最近参悟了一门双修之法……你要不要试试？"',
    minAff: 60, maxAff: 100,
    options: [
      { text: '🤝试试', action: (p, c) => { if (Math.random() < 0.6) { p.exp += 120; p.currentMP = Math.max(0, p.currentMP - 20); addLog('你俩折腾了一宿……修为+120，但那门功法不太对，灵力-20', 'special'); c.affection += 15; } else { p.currentHP = Math.max(1, p.currentHP - 30); addLog('配合失误，你被一掌拍飞，生命-30。', 'danger'); c.affection += 5; } } },
      { text: '😅婉拒', action: (p, c) => { addLog('你说"改天吧"。' + c.name + '红着脸跑了，三天没敢见你。', 'system'); c.affection -= 2; } }
    ]
  },
  // 12. 下降头
  {
    descFn: (c) => '道友【' + c.name + '】神色古怪："我总觉得被人下了降头……你看我印堂是不是发黑？"确实发黑，还冒烟。',
    minAff: 20, maxAff: 100,
    options: [
      { text: '🔮帮忙解咒', action: (p, c) => { p.currentMP = Math.max(0, p.currentMP - 40); if (Math.random() < 0.5) { addLog('你瞎念了一段咒语，居然蒙对了！' + c.name + '的印堂不黑了。', 'success'); c.affection += 12; } else { addLog('你念错了咒，' + c.name + '头顶冒出一朵花。他说"算了这样也挺好"。', 'system'); c.affection += 5; } } },
      { text: '👀不管', action: (p, c) => { addLog('你说"可能是没睡好"。三天后他自己好了。', 'system'); c.affection -= 2; } }
    ]
  },
  // 13. 新发明
  {
    descFn: (c) => '道友【' + c.name + '】展示新招式："佛怒火莲·青春版！"一掌拍向石头——石头没碎，他的手肿了。',
    minAff: 10, maxAff: 100,
    options: [
      { text: '👍鼓励', action: (p, c) => { addLog('你说"很有潜力！"' + c.name + '眼睛发光，又去拍石头了。', 'system'); c.affection += 5; } },
      { text: '🤣嘲笑', action: (p, c) => { addLog('你笑了三分钟。' + c.name + '追着你打了三条街。', 'system'); c.affection -= 8; } }
    ]
  },
  // 14. 传送阵
  {
    descFn: (c) => '道友【' + c.name + '】发现了一个传送阵："我试了一下被传到了茅房！你要不要试试？"',
    minAff: 15, maxAff: 100,
    options: [
      { text: '🌀试试', action: (p, c) => { const roll = Math.random(); if (roll < 0.2) { p.spiritStones += 100; addLog('被传到了灵石矿！+100灵石', 'reward'); } else if (roll < 0.4) { p.exp += 80; addLog('被传到了藏经阁，修为+80', 'success'); } else if (roll < 0.7) { p.currentHP = Math.max(1, p.currentHP - 20); addLog('被传到了妖兽窝，生命-20', 'danger'); } else { addLog('被传到了茅房。你俩一起笑了很久。', 'system'); } c.affection += 5; } },
      { text: '❌不试', action: (p, c) => { addLog('"你自己玩吧"。' + c.name + '又被传到了茅房。', 'system'); c.affection -= 2; } }
    ]
  },
  // 15. 奇怪的蛋
  {
    descFn: (c) => '道友【' + c.name + '】捧着一颗画着笑脸的蛋："你帮我孵一下？我最近要出趟远门。"',
    minAff: 25, maxAff: 100,
    options: [
      { text: '🥚接下', action: (p, c) => { if (Math.random() < 0.4) { if (p.pets.length < 2) { p.pets.push({ name: '笑脸蛋', type: '灵兽', effect: { hpBonus: 15 }, desc: '从一颗画着笑脸的蛋里孵出来的', level: 1, exp: 0, maxExp: 30 }); addLog('蛋孵出来了！是一只圆滚滚的笑脸球！', 'success'); } else { addLog('灵兽满了，蛋自己滚走了。', 'system'); } } else { addLog('你孵了七天七夜，蛋一动不动。' + c.name + '回来说"这是煮鸡蛋"。', 'system'); } c.affection += 5; } },
      { text: '🙅不接', action: (p, c) => { addLog('你拒绝了。' + c.name + '把蛋塞给了路过的修士。', 'system'); c.affection -= 3; } }
    ]
  },
  // 16. 看前世
  {
    descFn: (c) => '道友【' + c.name + '】神秘地说："我顿悟的时候看到了你的前世！你想知道吗？"',
    minAff: 50, maxAff: 100,
    options: [
      { text: '🤔想知道', action: (p, c) => { const lives = ['你前世是一块灵石，被修士买了糖葫芦。', '你前世是一颗丹药，被狗吃了。那狗后来成精了。', '你前世是条咸鱼，修炼了三百年变成人形。', '你前世是看门大爷，每天晒太阳。', '你前世是' + c.name + '的灵兽。你俩对视了一眼。', '你前世是一株会骂人的草。']; addLog('🔮 ' + c.name + '说："' + lives[Math.floor(Math.random() * lives.length)] + '"', 'special'); c.affection += 5; } },
      { text: '😐不想知道', action: (p, c) => { addLog('你说"有些事不知道的好"。' + c.name + '点点头。', 'system'); c.affection += 2; } }
    ]
  },
  // 17. 被附身
  {
    descFn: (c) => '道友【' + c.name + '】用从未听过的语气说："我终于找到你了。"他的眼睛变成了绿色。',
    minAff: 10, maxAff: 100,
    options: [
      { text: '🔵驱邪', action: (p, c) => { p.currentMP = Math.max(0, p.currentMP - 50); if (Math.random() < 0.5) { addLog('一道符拍上去，他恢复原色。"我怎么了？"他完全不知道发生了什么。', 'success'); c.affection += 10; } else { addLog('符咒没用！那东西笑了一声走了。第二天' + c.name + '说"睡得真香"。', 'horror'); c.affection += 3; } } },
      { text: '😨快跑', action: (p, c) => { addLog('你转身就跑。身后传来' + c.name + '的笑声："逗你玩的！"', 'system'); c.affection -= 5; } }
    ]
  },
  // 18. 悟道
  {
    descFn: (c) => '道友【' + c.name + '】长叹："修仙的尽头是——"他顿住，"算了不说了。"',
    minAff: 50, maxAff: 100,
    options: [
      { text: '🧘一起参悟', action: (p, c) => { p.exp += 80; addLog('你顺着他的气息入定，修为+80', 'success'); c.affection += 8; } },
      { text: '🤨追问', action: (p, c) => { addLog('你非要他说。他被烦得不行："修仙的尽头是……公务员。"你后悔了。', 'system'); c.affection -= 3; } }
    ]
  }
];

function triggerCompanionEvent() {
  if (player.pendingEvent || _eventLock) return;
  if (player.companions.length === 0) return;
  if (Math.random() > 0.05) return;
  const comp = player.companions[Math.floor(Math.random() * player.companions.length)];
  const aff = comp.affection || 50;
  const candidates = COMPANION_EVENT_POOL.filter(e => aff >= e.minAff && aff <= e.maxAff);
  if (candidates.length === 0) return;
  const ev = candidates[Math.floor(Math.random() * candidates.length)];
  const options = ev.options.map(opt => ({
    text: opt.text,
    action: () => { opt.action(player, comp); requestUIUpdate(); saveGame(); }
  }));
  showEventModal('⚡ 道友事件', ev.descFn(comp), options);
}

// ==================== 随机事件系统（含昼夜/季节影响） ====================

/** 触发随机事件（在修炼/探索/战斗后调用，较低概率） */
function triggerRandomEvent() {
  if (player.pendingEvent || _eventLock) return;

  let prob = 0.12;
  if (player.currentDaytime === 'night') prob += 0.06;
  if (player.currentSeason === 'winter') prob += 0.03;
  if (player.currentHP < getEffectiveStats().maxHP * 0.3) prob += 0.05;
  if (Math.random() > prob) return;

  // 随机事件池
  let events = [
    { msg: '🐦 乌鸦抢走灵石', action: () => { const loss = Math.min(player.spiritStones, 8); player.spiritStones -= loss; addLog('损失' + loss + '灵石'); } },
    { msg: '💤 修炼睡着，灵力恢复', action: () => { player.currentMP = Math.min(getEffectiveStats().maxMP, player.currentMP + 12); } },
    { msg: '🌧️ 灵雨淋身，修为微涨', action: () => { player.exp += 6; } },
    { msg: '👻 幽灵捉弄，丢失修为', action: () => { player.exp = Math.max(0, player.exp - 10); } },
    { msg: '🍗 蹭饭成功，生命恢复', action: () => { player.currentHP = Math.min(getEffectiveStats().maxHP, player.currentHP + 8); } }
  ];

  // 夜间特殊事件
  if (player.currentDaytime === 'night') {
    events.push(
      { msg: '🕯️ 阴风阵阵，烛火全灭。你摸黑修炼，走火入魔，生命-15。', action: () => { player.currentHP = Math.max(1, player.currentHP - 15); } },
      { msg: '🌙 月光下修炼效率加倍，修为+12。', action: () => { player.exp += 12; } },
      { msg: '🐺 远方传来狼嚎，你心惊胆战，灵力-5。', action: () => { player.currentMP = Math.max(0, player.currentMP - 5); } }
    );
  }

  // 冬季特殊事件
  if (player.currentSeason === 'winter') {
    events.push(
      { msg: '❄️ 寒风刺骨，你打了个寒颤，灵力-3。', action: () => { player.currentMP = Math.max(0, player.currentMP - 3); } },
      { msg: '☃️ 堆雪人时意外发现灵石，获得15灵石。', action: () => { player.spiritStones += 15; } }
    );
  }

  // 冷却高时触发战斗欲望事件
  if ((player.combatCooldown || 0) >= 3) {
    events.push({
      msg: '⚔️ 你感觉战斗欲望高涨，攻击临时+3（本场战斗有效，此处仅提示）。',
      action: () => { player.baseAtk += 3; addLog('攻击力暂时提升！'); }
    });
  }

  const ev = events[Math.floor(Math.random() * events.length)];
  addLog('🎲 事件：' + ev.msg);
  if (ev.action) ev.action();
  checkAchievements();
  requestUIUpdate();
}

// ==================== 心魔触发系统 ====================

/** 触发心魔（在修炼时概率触发） */
function triggerInnerDemon() {
  if (player.pendingEvent || _eventLock) return;
  if (player.innerDemon < 20 && Math.random() > 0.15) return;

  // 心魔触发概率随内魔值提高
  const baseChance = 0.15;
  const extra = player.innerDemon * 0.002;
  if (Math.random() > baseChance + extra) return;

  // 心魔事件池
  const demonEvents = [
    {
      desc: '心魔低语：“放弃吧，你终将老死。”',
      options: [
        {
          text: '坚守道心',
          action: () => {
            player.innerDemon = Math.max(0, player.innerDemon - 10);
            addLog('你坚定了道心，心魔退散。', 'success');
          }
        },
        {
          text: '动摇',
          action: () => {
            player.innerDemon += 20;
            player.exp = Math.max(0, player.exp - 50);
            addLog('你道心动摇，修为流失。', 'danger');
          }
        }
      ]
    },
    {
      desc: '幻象中你看见自己修为尽失，沦为凡人。',
      options: [
        {
          text: '破妄存真',
          action: () => {
            player.innerDemon = Math.max(0, player.innerDemon - 5);
            addLog('你破除幻象，道心稳固。', 'success');
          }
        },
        {
          text: '沉溺恐惧',
          action: () => {
            player.currentHP = Math.max(1, player.currentHP - 30);
            player.innerDemon += 15;
            addLog('你沉溺恐惧，生命受损。', 'danger');
          }
        }
      ]
    },
    {
      desc: '心魔化作你最爱的人，让你放弃修仙。',
      options: [
        {
          text: '斩断情丝',
          action: () => {
            player.innerDemon = Math.max(0, player.innerDemon - 15);
            player.exp += 30;
            addLog('你斩断情丝，道心清明，修为+30。', 'success');
          }
        },
        {
          text: '犹豫',
          action: () => {
            player.innerDemon += 10;
            player.currentMP = Math.max(0, player.currentMP - 20);
            addLog('你犹豫不决，心魔趁机入侵，灵力-20。', 'danger');
          }
        }
      ]
    }
  ];

  // 出身被动：守墓人 - 添加镇魂选项
  if (hasOriginPassive('graveKeeper')) {
    demonEvents.push({
      desc: '🪦 阴气弥漫，你感受到体内心魔蠢蠢欲动。',
      options: [
        ORIGIN_PASSIVE['守墓人'].getZhenHunOption(),
        {
          text: '😤 硬抗',
          action: () => {
            player.innerDemon += 10;
            addLog('你选择硬抗心魔，心魔值+10。', 'danger');
          }
        }
      ]
    });
  }

  const ev = demonEvents[Math.floor(Math.random() * demonEvents.length)];
  // 标记为心魔事件，以便在 resolveEvent 中特殊处理
  player.pendingEvent = { comp: null, options: ev.options, isDemon: true };
  showEventModal('💀 心魔侵袭', ev.desc, ev.options, true);
}

// ==================== 宗门事件 ====================

/** 触发宗门事件 */
function triggerSectEvent(type) {
  if (!player.sect) return;
  if (player.pendingEvent || _eventLock) return;
  
  const sect = SECTS.find(s => s.id === player.sect);
  if (!sect) return;
  
  const candidates = SECT_EVENTS.filter(function(e) {
    return e.type === type && player.sectRank >= e.minRank && (!e.sectId || e.sectId === player.sect);
  });
  if (candidates.length === 0) return;
  
  // 5% 概率触发
  if (Math.random() > 0.05) return;
  
  const ev = candidates[Math.floor(Math.random() * candidates.length)];
  const rank = player.sectRank || 0;
  
  const options = ev.options.map(opt => ({
    text: opt.text,
    action: () => {
      opt.action(player);
      requestUIUpdate();
      saveGame();
      addLifeEvent(opt.text.includes('教训') ? '击退敌对宗门挑衅' :
                    opt.text.includes('清剿') ? '带队清剿魔修' :
                    opt.text.includes('救') ? '抢救宗门丹房' :
                    opt.text.includes('斩') ? '屠龙成功' :
                    opt.text.includes('御敌') ? '抵御妖兽入侵' :
                    opt.text.includes('巡查') ? '巡查宗门周边' :
                    opt.text.includes('比武') ? '宗门大比' :
                    '宗门事件：' + ev.desc(sect).slice(0, 20));
    }
  }));
  
  showEventModal('🏛️ ' + sect.name, ev.desc(sect), options);
}

// ==================== 事件模态框统一处理 ====================

/**
 * 显示事件模态框
 * @param {string} title - 标题
 * @param {string} desc - 描述
 * @param {Array} options - 选项数组 [{ text, action }]
 */
function showEventModal(title, desc, options, isDemon) {
  // 存储事件到 pendingEvent
  player.pendingEvent = { options, isDemon: !!isDemon };

  let html = '<p style="margin-bottom:12px;">' + desc + '</p>';
  html += '<div class="modal-btn-group">';
  options.forEach(opt => {
    html += '<button class="modal-btn" onclick=\'resolveEvent(' + JSON.stringify(opt.text) + ')\'>' + opt.text + '</button>';
  });
  html += '</div>';

  showModal(title, html);
}

/** 解析事件选择（由模态框按钮调用） */
function resolveEvent(choiceText) {
  if (!player.pendingEvent) {
    addLog('没有待处理的事件', 'system');
    return;
  }

  const options = player.pendingEvent.options;
  const chosen = options.find(o => o.text === choiceText);
  if (chosen) {
    // 执行动作
    if (chosen.action) chosen.action();
    // 如果是心魔事件，额外处理
    if (player.pendingEvent.isDemon) {
      // 心魔事件后，降低心魔值（或者已经由动作处理）
    }
  } else {
    addLog('无效选项', 'danger');
  }

  // 清除事件状态
  player.pendingEvent = null;
  closeModal();
  requestUIUpdate();
  checkAchievements();
}

// ==================== 命运四维系统 ====================

/**
 * 获取命运阈值效果（根据属性值返回匹配的最高阈值）
 * @param {string} stat - 'intelligence' | 'physique' | 'luck' | 'focus'
 * @param {number} val - 当前属性值
 * @returns {Object|null} 阈值对象
 */
function getFateThreshold(stat, val) {
  const thresholds = FATE_THRESHOLDS[stat];
  if (!thresholds) return null;
  let active = null;
  for (const t of thresholds) {
    if (val >= t.val) active = t;
  }
  return active;
}

/**
 * 应用命运效果（在各类行动中调用）
 * @param {string} context - 'cultivate' | 'breakthrough' | 'explore' | 'rest' | 'event' | 'demon'
 * @returns {boolean} 是否触发了效果
 */
function applyFateEffects(context) {
  const f = player.fate;
  let changed = false;

  // ----- 聪慧 (Intelligence) -----
  const intT = getFateThreshold('intelligence', f.intelligence);
  if (intT) {
    if (context === 'cultivate' && intT.cultBoost) {
      // 修炼加成在 cultivate 函数中已经通过 boost 处理，此处仅做额外提示
      // 但我们可以在这里添加额外事件效果
      if (Math.random() < 0.1) {
        addLog('🧠 聪慧过人，修炼感悟更深。', 'special');
      }
    }
    if (context === 'breakthrough' && intT.breakBoost) {
      player._fateBreakBoost = (player._fateBreakBoost || 0) + intT.breakBoost;
      changed = true;
    }
  }

  // ----- 体魄 (Physique) -----
  const phyT = getFateThreshold('physique', f.physique);
  if (phyT) {
    if (context === 'explore' && phyT.expInjury) {
      // 减少探索伤害
      const reduce = Math.abs(phyT.expInjury);
      // 由 explore 函数处理，此处仅提示
      if (Math.random() < 0.3) {
        addLog('💪 体魄强健，探索中减少了伤害。', 'special');
      }
    }
    if (context === 'rest' && phyT.restBoost) {
      // 休息加成在 rest 中已经处理
    }
  }

  // ----- 气运 (Luck) -----
  const luckT = getFateThreshold('luck', f.luck);
  if (luckT) {
    if (context === 'explore' && luckT.doubleStoneChance) {
      if (Math.random() < luckT.doubleStoneChance) {
        const bonus = 20 + Math.floor(Math.random() * 30);
        player.spiritStones += bonus;
        addLog('🍀 气运亨通！额外获得' + bonus + '灵石！', 'reward');
        changed = true;
      }
    }
    if (luckT.rareBoost) {
      // 奇遇概率提升由 triggerAdventure 使用 rareBoost
    }
  }

  // ----- 定力 (Focus) -----
  const focT = getFateThreshold('focus', f.focus);
  if (focT) {
    if (context === 'event' && focT.negEventImmune) {
      if (Math.random() < focT.negEventImmune) {
        addLog('🧘 定力深厚，免疫了随机负面事件。', 'special');
        // 返回特殊标记，调用方可以跳过负面事件
        return true;
      }
    }
    if (context === 'demon' && focT.demonResist) {
      player._fateDemonResist = (player._fateDemonResist || 0) + focT.demonResist;
      changed = true;
    }
  }

  return changed;
}

/** 命运属性成长（在各类行动后调用） */
function fateGrow(stat, amount) {
  if (!stat || !player.fate || player.fate[stat] === undefined) return;
  const cap = 100;
  if (player.fate[stat] >= cap) return;
  // 出身被动：落榜书生 - 聪慧成长+20%
  let finalAmount = (amount || 1);
  if (hasOriginPassive('scholar') && stat === 'intelligence') {
    finalAmount = Math.ceil(finalAmount * 1.2);
  }
  player.fate[stat] = Math.min(cap, player.fate[stat] + finalAmount);
  // 每成长10点触发一次提示
  if (player.fate[stat] % 10 === 0) {
    const nameMap = { intelligence: '聪慧', physique: '体魄', luck: '气运', focus: '定力' };
    addLog('📈 ' + nameMap[stat] + '提升至 ' + player.fate[stat] + ' 点！', 'special');
  }
}

// ==================== 体魄后天觉醒 ====================

/** 尝试后天觉醒体魄（在各类行动后概率触发） */
function tryAwakenPhysique() {
  if (player.physique && player.physique.name !== '凡体') return;
  // 基础概率4%，受命运体魄影响
  let chance = 0.04;
  const phyVal = player.fate.physique;
  if (phyVal >= 50) chance += 0.02;
  if (phyVal >= 75) chance += 0.03;
  if (Math.random() > chance) return;

  const rare = Object.entries(PHYSIQUE_TYPES).filter(([k]) => k !== '凡体');
  const [name, data] = rare[Math.floor(Math.random() * rare.length)];
  player.physique = { name, ...data };
  addLog('💥 后天觉醒！体魄蜕变为【' + name + '】——' + data.desc, 'special');
  requestUIUpdate();
}

// ==================== 套装加成（已在前文定义，此处保留调用接口） ====================
// getSetBonus 已在第3部分定义，此处无需重复

// ==================== 成就检查（已在前文定义，此处保留调用接口） ====================
// checkAchievements 将在第7部分实现

console.log('✅ 事件系统与命运系统已加载');
