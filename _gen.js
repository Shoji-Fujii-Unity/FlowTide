globalThis.document={addEventListener:function(){},querySelector:function(){return null},querySelectorAll:function(){return []},documentElement:{setAttribute:function(){}},getElementById:function(){return null},body:{setAttribute:function(){}}};

"use strict";
/* =========================================================================
   FLOWTIDE — Flow Connect の改良版
   Improvements: proper random-Hamiltonian puzzle generator (varied boards,
   obstacle cells), smooth pointer drawing with interpolation, rounded ribbons
   with flow animation, undo / hint / resume, 3 modes, keyboard play,
   colour-blind glyphs, themes, ambient audio, 4 languages.
   ========================================================================= */
(function(){

/* ---------------- tiny helpers ---------------- */
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
function clamp(v,a,b){return v<a?a:(v>b?b:v)}
function fmt(s){var m=Math.floor(s/60);return m+':'+String(Math.floor(s%60)).padStart(2,'0')}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(a,rng){for(var i=a.length-1;i>0;i--){var j=Math.floor(rng()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function dateKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function svgEl(name,attrs){var e=document.createElementNS('http://www.w3.org/2000/svg',name);for(var k in attrs)e.setAttribute(k,attrs[k]);return e}
function copyPaths(p){return p.map(function(a){return a.map(function(o){return {r:o.r,c:o.c}})})}

/* ---------------- palette ---------------- */
var PALETTE=['#ff5a6b','#2fd7c0','#9b74ff','#ffcb3d','#ff8a3c','#41d97e','#ff74cf','#4ea8ff','#b8e04a','#7ef0ff'];
var GLYPHS=['A','B','C','D','E','F','G','H','I','J'];
var U=100; // svg units per cell

/* ---------------- i18n ---------------- */
var I18N={
ja:{
 tagline:'同色を結べ。盤面を、光で満たせ。',
 mode_puzzle:'パズルで遊ぶ',mode_puzzle_sub:'30ステージ／星と最高スコアを記録',
 mode_daily:'今日の一枚',mode_daily_sub:'毎日変わる1問・連続挑戦記録',
 mode_zen:'禅モード',mode_zen_sub:'制限なし。無限に湧く盤面をじっくり',
 records:'記録',settings:'設定',continue:'続きから始める',no_data:'まだ記録がありません。まず1問クリアしよう。',
 level_select:'ステージ選択',levels_foot:'★3＝ヒントなし＆時給内／★2＝ヒントなし／★1＝ヒント使用',
 stars:'星',locked:'未開放',level:'Lv',cleared:'クリア',streak:'連続日数',
 zen_pick:'盤面のサイズを選ぶ',zen_solved:'解いた数',zen_foot:'スコアは付きません。気楽にどうぞ。',
 howto:'端点からドラッグして同色を結ぶ。<br>全マスを埋めればクリア。壁（斜線）は通れない。',
 moves:'手数',time:'時間',hints:'ヒント',score:'スコア',best:'最高',
 remaining:'残り {n} マス',filled:'{p}% 充填',
 btn_hint:'💡 ヒント',btn_reset:'リセット',btn_undo:'戻す',quit:'やめる',
 next:'次へ →',replay:'もう一度',levels:'ステージ選択',close:'閉じる',start:'開始',
 toast_hint:'ヒントで1本の道を示した（スコアに影響）',
 toast_no_more_hint:'これ以上ヒントは使えない',
 toast_wall:'そこは壁だ',
 toast_erased:'道を消した',
 toast_newboard:'新しい盤面を作った',
 toast_locked:'まだ遊べないステージ',
 toast_daily_done:'今日はすでに完了済み。スコアは記録済みだよ',
 tip_start:'端点（白リング）を押したままドラッグ！',
 win:'見事！盤面が光に満ちた',win_daily:'今日の一枚、完了！',win_zen:'美しい潮流だ',
 new_record:'新記録',
 set_lang:'言語 / Language',set_sound:'効果音',set_sound_sub:'操作に合わせた音色',
 set_music:'環境音',set_music_sub:'静かなアンビエント',
 set_cb:'色の識別サポート',set_cb_sub:'端点に文字を表示',
 set_motion:'アニメーション',set_motion_sub:'オフで動作が軽くなります',
 set_theme:'テーマ',theme_nebula:'ネビュラ（濃）',theme_aqua:'アクア（明）',
 data:'データ',data_reset:'記録をすべて消去',data_reset_q:'すべての記録を消去しますか？',
 about:'FLOWTIDE v2 · 元の Flow Connect をベースに盤面生成・操作感・機能を刷新。<br>GSAP / canvas-confetti / Google Fonts を CDN から読み込み。',
 kbd:'キーボード: <kbd>←↑→↓</kbd> カーソル ／ <kbd>Space</kbd> 描画開始・終了 ／ <kbd>U</kbd> 戻す ／ <kbd>H</kbd> ヒント ／ <kbd>R</kbd> リセット'
},
en:{
 tagline:'Tie the colours. Flood the board with light.',
 mode_puzzle:'Puzzle Campaign',mode_puzzle_sub:'30 stages · stars & high scores',
 mode_daily:'Daily Tide',mode_daily_sub:'One board a day · streak tracking',
 mode_zen:'Zen Mode',mode_zen_sub:'No limits. Endless calm boards',
 records:'Records',settings:'Settings',continue:'Resume',no_data:'No records yet — clear one board first.',
 level_select:'Select Stage',levels_foot:'★3 = no hints & under par · ★2 = no hints · ★1 = hints used',
 stars:'Stars',locked:'Locked',level:'Lv',cleared:'Cleared',streak:'Streak',
 zen_pick:'Pick a board size',zen_solved:'Solved',zen_foot:'No scoring here — just flow.',
 howto:'Drag from an endpoint to connect matching colours.<br>Fill every cell to win. Hatched cells are walls.',
 moves:'Moves',time:'Time',hints:'Hints',score:'Score',best:'Best',
 remaining:'{n} cells left',filled:'{p}% filled',
 btn_hint:'💡 Hint',btn_reset:'Reset',btn_undo:'Undo',quit:'Quit',
 next:'Next →',replay:'Replay',levels:'Stages',close:'Close',start:'Start',
 toast_hint:'Hint revealed one path (affects score)',
 toast_no_more_hint:'No hints left',
 toast_wall:'That cell is a wall',
 toast_erased:'Path erased',
 toast_newboard:'Fresh board generated',
 toast_locked:'Stage still locked',
 toast_daily_done:'Already completed today — your score is saved',
 tip_start:'Press an endpoint (white ring) and drag!',
 win:'Brilliant — the board is glowing',win_daily:'Daily tide completed!',win_zen:'Beautiful flow',
 new_record:'NEW',
 set_lang:'Language',set_sound:'Sound effects',set_sound_sub:'Tones that follow your drawing',
 set_music:'Ambience',set_music_sub:'Quiet generative pad',
 set_cb:'Colour-blind support',set_cb_sub:'Letters on endpoints',
 set_motion:'Animation',set_motion_sub:'Turn off for lighter motion',
 set_theme:'Theme',theme_nebula:'Nebula (dark)',theme_aqua:'Aqua (light)',
 data:'Data',data_reset:'Erase all records',data_reset_q:'Erase all saved records?',
 about:'FLOWTIDE v2 · rebuilt from the original Flow Connect: new generator, controls and features.<br>Libraries from CDN: GSAP / canvas-confetti / Google Fonts.',
 kbd:'Keyboard: <kbd>←↑→↓</kbd> cursor · <kbd>Space</kbd> start/stop drawing · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> reset'
},
ko:{
 tagline:'같은 색을 잇고, 판을 빛으로 채워라',
 mode_puzzle:'퍼즐 모드',mode_puzzle_sub:'30 스테이지 · 별과 최고 점수',
 mode_daily:'오늘의 판',mode_daily_sub:'매일 바뀌는 한 판 · 연속 기록',
 mode_zen:'선 모드',mode_zen_sub:'제한 없이 느긋하게',
 records:'기록',settings:'설정',continue:'이어서 하기',no_data:'기록이 없습니다. 먼저 한 판 해결하세요.',
 level_select:'스테이지 선택',levels_foot:'★3 = 힌트 없이 파타임 내 · ★2 = 힌트 없이 · ★1 = 힌트 사용',
 stars:'별',locked:'잠김',level:'Lv',cleared:'클리어',streak:'연속 일수',
 zen_pick:'판 크기 선택',zen_solved:'푼 판',zen_foot:'점수 없음. 편안하게.',
 howto:'끝점에서 드래그해 같은 색을 잇는다.<br>모든 칸을 채우면 클리어. 빗금 칸은 벽.',
 moves:'이동',time:'시간',hints:'힌트',score:'점수',best:'최고',
 remaining:'{n} 칸 남음',filled:'{p}% 채움',
 btn_hint:'💡 힌트',btn_reset:'초기화',btn_undo:'되돌리기',quit:'나가기',
 next:'다음 →',replay:'다시 하기',levels:'스테이지',close:'닫기',start:'시작',
 toast_hint:'힌트로 길 하나를 표시함(점수 영향)',
 toast_no_more_hint:'힌트 횟수를 다 썼습니다',
 toast_wall:'벽 칸입니다',
 toast_erased:'경로를 지웠습니다',
 toast_newboard:'새 판을 만들었습니다',
 toast_locked:'아직 잠긴 스테이지',
 toast_daily_done:'오늘은 이미 완료 — 점수는 저장됨',
 tip_start:'끝점(흰 링)을 누른 채 드래그!',
 win:'훌륭합니다! 판이 빛으로 가득 찼다',win_daily:'오늘의 판 완료!',win_zen:'아름다운 흐름',
 new_record:'신기록',
 set_lang:'언어',set_sound:'효과음',set_sound_sub:'그림에 반응하는 소리',
 set_music:'배경음',set_music_sub:'잔잔한 앰비언트',
 set_cb:'색각 보조',set_cb_sub:'끝점에 글자 표시',
 set_motion:'애니메이션',set_motion_sub:'끄면 가벼워집니다',
 set_theme:'테마',theme_nebula:'네뷸라(어둡게)',theme_aqua:'아쿠아(밝게)',
 data:'데이터',data_reset:'모든 기록 삭제',data_reset_q:'모든 기록을 삭제할까요?',
 about:'FLOWTIDE v2 · 기존 Flow Connect 기반으로 생성기·조작·기능을 새로 설계.<br>CDN 라이브러리: GSAP / canvas-confetti / Google Fonts.',
 kbd:'키보드: <kbd>←↑→↓</kbd> 커서 · <kbd>Space</kbd> 그리기 시작/종료 · <kbd>U</kbd> 되돌리기 · <kbd>H</kbd> 힌트 · <kbd>R</kbd> 초기화'
},
zh:{
 tagline:'连接同色，让棋盘充满光。',
 mode_puzzle:'闯关模式',mode_puzzle_sub:'30 关 · 星星与最高分',
 mode_daily:'每日一题',mode_daily_sub:'每天一题 · 连续挑战',
 mode_zen:'禅模式',mode_zen_sub:'不限时，题目无限生成',
 records:'记录',settings:'设置',continue:'继续上次',no_data:'暂无记录——先通关一题吧。',
 level_select:'选择关卡',levels_foot:'★3＝没用提示且在限时内 · ★2＝没用提示 · ★1＝用了提示',
 stars:'星',locked:'未解锁',level:'关',cleared:'通关',streak:'连续天数',
 zen_pick:'选择棋盘大小',zen_solved:'已解',zen_foot:'不计分，慢慢玩。',
 howto:'从端点拖动，连接相同颜色。<br>填满所有格子即通关；斜线格是墙。',
 moves:'步数',time:'时间',hints:'提示',score:'得分',best:'最高',
 remaining:'还剩 {n} 格',filled:'已填 {p}%',
 btn_hint:'💡 提示',btn_reset:'重置',btn_undo:'撤销',quit:'退出',
 next:'下一关 →',replay:'再来一次',levels:'关卡',close:'关闭',start:'开始',
 toast_hint:'提示给出一条路径（影响得分）',
 toast_no_more_hint:'提示已用完',
 toast_wall:'那是墙',
 toast_erased:'已清除路径',
 toast_newboard:'已生成新棋盘',
 toast_locked:'该关尚未解锁',
 toast_daily_done:'今天已完成，成绩已保存',
 tip_start:'按住端点（白环）并拖动！',
 win:'出色！棋盘已被光充满',win_daily:'每日一题完成！',win_zen:'漂亮的流线',
 new_record:'新纪录',
 set_lang:'语言',set_sound:'音效',set_sound_sub:'随绘制变化的音色',
 set_music:'氛围音',set_music_sub:'安静的生成音垫',
 set_cb:'色觉辅助',set_cb_sub:'在端点显示字母',
 set_motion:'动画',set_motion_sub:'关闭后更流畅',
 set_theme:'主题',theme_nebula:'星云（深色）',theme_aqua:'水光（浅色）',
 data:'数据',data_reset:'清除全部记录',data_reset_q:'确定清除全部记录吗？',
 about:'FLOWTIDE v2 · 基于原 Flow Connect 重做了生成器、操作与功能。<br>CDN 库：GSAP / canvas-confetti / Google Fonts。',
 kbd:'键盘：<kbd>←↑→↓</kbd> 光标 · <kbd>Space</kbd> 开始/结束绘制 · <kbd>U</kbd> 撤销 · <kbd>H</kbd> 提示 · <kbd>R</kbd> 重置'
}};
var lang='ja';
function t(k){var d=I18N[lang]||I18N.ja;return (d[k]!=null?d[k]:(I18N.ja[k]!=null?I18N.ja[k]:k))}
function tf(k,o){var s=t(k);for(var x in o)s=s.split('{'+x+'}').join(o[x]);return s}
function applyI18n(){
  document.documentElement.lang=lang;
  $$('[data-i18n]').forEach(function(el){el.innerHTML=t(el.getAttribute('data-i18n'))});
  document.title='FLOWTIDE｜'+(lang==='ja'?'光の潮流':'Light Tides');
  $('#btn-hint').textContent=t('btn_hint');
  refreshStatic();
}

/* ---------------- store ---------------- */
var SKEY='flowtide_v2';
var store={
  v:2, lang:'ja',
  settings:{sound:true,music:false,cb:false,motion:true,theme:'nebula'},
  campaign:{},           // lv -> {stars,score,moves,time}
  zen:{solved:0},
  daily:{last:'',streak:0,best:0},
  resume:null,           // {mode,lv,seed,size,colors,walls,paths,moves,time,hints}
  tipSeen:false
};
function loadStore(){
  try{
    var raw=localStorage.getItem(SKEY);
    if(raw){
      var o=JSON.parse(raw);
      if(o&&o.v===2){
        store=Object.assign(store,o);
        store.settings=Object.assign({sound:true,music:false,cb:false,motion:true,theme:'nebula'},o.settings||{});
      }
    }
  }catch(e){}
  lang=I18N[store.lang]?store.lang:'ja';
}
function saveStore(){try{localStorage.setItem(SKEY,JSON.stringify(store))}catch(e){}}

/* ---------------- audio ---------------- */
var AU={ctx:null,master:null,pad:null,
 init:function(){
  if(this.ctx)return;
  var C=window.AudioContext||window.webkitAudioContext; if(!C)return;
  this.ctx=new C();
  this.master=this.ctx.createGain(); this.master.gain.value=0.9;
  var comp=this.ctx.createDynamicsCompressor?this.ctx.createDynamicsCompressor():null;
  if(comp){this.master.connect(comp);comp.connect(this.ctx.destination)}else{this.master.connect(this.ctx.destination)}
 },
 resume:function(){this.init();if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume()},
 blip:function(freq,dur,type,vol){
  if(!store.settings.sound||!this.ctx)return;
  var c=this.ctx,o=c.createOscillator(),g=c.createGain();
  o.type=type||'sine';o.frequency.value=freq;
  g.gain.setValueAtTime(0.0001,c.currentTime);
  g.gain.linearRampToValueAtTime(vol||0.12,c.currentTime+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+(dur||0.1));
  o.connect(g);g.connect(this.master);o.start();o.stop(c.currentTime+(dur||0.1)+0.02);
 },
 scale:[0,2,4,7,9,12,14,16,19,21,24],
 step:function(i){var n=this.scale[Math.min(i,this.scale.length-1)];this.blip(392*Math.pow(2,n/12),0.07,'triangle',0.07)},
 back:function(){this.blip(240,0.05,'sine',0.05)},
 connect:function(){this.blip(660,0.13,'sine',0.15);var s=this;setTimeout(function(){s.blip(990,0.2,'sine',0.11)},90)},
 nope:function(){this.blip(120,0.09,'square',0.05)},
 hint:function(){var s=this;[880,1174,1568].forEach(function(f,i){setTimeout(function(){s.blip(f,0.22,'sine',0.1)},i*70)})},
 click:function(){this.blip(520,0.035,'square',0.035)},
 win:function(){var s=this;[523,659,784,1047,1319].forEach(function(f,i){setTimeout(function(){s.blip(f,0.4,'triangle',0.14)},i*110)})},
 musicOn:function(on){
  this.init(); if(!this.ctx)return;
  if(on&&!this.pad){
   var c=this.ctx,g=c.createGain();g.gain.value=0.0;g.connect(this.master);
   var f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=520;f.Q.value=6;f.connect(g);
   var lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=0.06;lg.gain.value=260;lfo.connect(lg);lg.connect(f.frequency);lfo.start();
   var oscs=[110,110*1.5,220*1.005].map(function(fr,i){var o=c.createOscillator();o.type=i===2?'triangle':'sawtooth';o.frequency.value=fr;o.connect(f);o.start();return o});
   g.gain.linearRampToValueAtTime(0.055,c.currentTime+3);
   this.pad={g:g,f:f,oscs:oscs,lfo:lfo};
  }else if(!on&&this.pad){
   var p=this.pad,c2=this.ctx;p.g.gain.linearRampToValueAtTime(0.0001,c2.currentTime+1.2);
   setTimeout(function(){p.oscs.forEach(function(o){try{o.stop()}catch(e){}});try{p.lfo.stop()}catch(e){}},1600);
   this.pad=null;
  }
 }
};

/* =======================================================================
   PUZZLE GENERATOR
   Finds a random Hamiltonian path over the free cells (Warnsdorff order +
   dead-end & connectivity pruning), then slices it into colour segments.
   Guarantees a full-board solution and gives far more varied boards than
   the original serpentine-only generator.
   ======================================================================= */
function serpentine(rows,cols,blocked){
  var out=[];
  for(var r=0;r<rows;r++){
    if(r%2===0){for(var c=0;c<cols;c++)if(!blocked.has(r*cols+c))out.push({r:r,c:c})}
    else{for(var c2=cols-1;c2>=0;c2--)if(!blocked.has(r*cols+c2))out.push({r:r,c:c2})}
  }
  return out;
}
function hamiltonian(rows,cols,blocked,rng,budget){
  var N=rows*cols, free=[];
  for(var i=0;i<N;i++) if(!blocked.has(i)) free.push(i);
  var n=free.length; if(n<4) return null;
  var isFree=new Uint8Array(N); free.forEach(function(i){isFree[i]=1});
  var adj=[]; for(var i2=0;i2<N;i2++)adj.push([]);
  var DR=[-1,1,0,0],DC=[0,0,-1,1];
  free.forEach(function(i){
    var r=Math.floor(i/cols),c=i%cols;
    for(var k=0;k<4;k++){var nr=r+DR[k],nc=c+DC[k];
      if(nr<0||nc<0||nr>=rows||nc>=cols)continue;
      var j=nr*cols+nc; if(isFree[j])adj[i].push(j);}
  });
  var starts=shuffle(free.slice(),rng).slice(0,8);
  var steps=0, visited=new Uint8Array(N), path=new Array(n);
  function freeDeg(v){                 // unvisited neighbours of v
    var d=0,nb=adj[v];
    for(var z=0;z<nb.length;z++) if(!visited[nb[z]]) d++;
    return d;
  }
  function countRemainder(){           // size of the unvisited component holding the first free cell
    var start=-1,k;
    for(k=0;k<N;k++) if(isFree[k]&&!visited[k]){start=k;break}
    if(start<0)return 0;
    var st=[start],seen=new Uint8Array(N);seen[start]=1;var nc=1;
    while(st.length){var x=st.pop(),a=adj[x];for(var q=0;q<a.length;q++){var y=a[q];if(!visited[y]&&!seen[y]){seen[y]=1;nc++;st.push(y)}}}
    return nc;
  }
  function dfs(pos,depth,left){        // left = cells still to place after pos
    if(++steps>budget) return false;
    path[depth]=pos; visited[pos]=1;
    if(left===0) return true;
    var a=adj[pos],q,cands=[];
    for(q=0;q<a.length;q++) if(!visited[a[q]]) cands.push(a[q]);
    if(left===1){                      // the last cell must touch pos
      var last=false;
      for(q=0;q<cands.length;q++){ if(dfs(cands[q],depth+1,0)){last=true;break} }
      if(!last) visited[pos]=0;
      return last;
    }
    var ok=true,ones=0,oneAdj=false;
    for(var m=0;m<N;m++){
      if(!isFree[m]||visited[m])continue;
      var d=freeDeg(m),nb=adj[m];
      if(d===0){ok=false;break}         // stranded cell
      if(d===1){ones++;if(nb.indexOf(pos)>=0)oneAdj=true;if(ones>2){ok=false;break}}
    }
    if(ok&&ones===2&&!oneAdj) ok=false;
    if(ok) ok=(countRemainder()===left);  // remainder must stay in one piece
    var found=false;
    if(ok){
      cands.sort(function(x,y){var dx=freeDeg(x),dy=freeDeg(y);return dx!==dy?dx-dy:(rng()-0.5)});
      for(q=0;q<cands.length;q++){ if(dfs(cands[q],depth+1,left-1)){found=true;break} }
    }
    if(!found) visited[pos]=0;
    return found;
  }
  for(var s=0;s<starts.length;s++){
    if(steps>budget)break;
    visited.fill(0);
    if(dfs(starts[s],0,n-1)) return path.map(function(p){return {r:Math.floor(p/cols),c:p%cols}});
  }
  return null;
}
function pickWalls(rows,cols,k,rng){
  var set=new Set();
  if(k<=0)return set;
  var cand=[],tries=0;
  for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)cand.push({r:r,c:c});
  shuffle(cand,rng);
  function bal(){var b=0,w=0;set.forEach(function(i){var r2=Math.floor(i/cols),c2=i%cols;((r2+c2)%2===0)?b++:w++});return [b,w]}
  while(set.size<k&&tries<400){
    var cell=cand[tries++%cand.length];
    if(cell.r<1||cell.c<1||cell.r>=rows-1||cell.c>=cols-1)continue; // keep border clean
    var bad=false;
    for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){if(set.has((cell.r+dr)*cols+(cell.c+dc)))bad=true}
    if(bad)continue;
    var idx=cell.r*cols+cell.c;
    set.add(idx);
    var b=bal(); if(Math.abs(b[0]-b[1])>1) set.delete(idx); // keep bipartite balance
  }
  // verify region still connected
  var arr=[];for(var r3=0;r3<rows;r3++)for(var c3=0;c3<cols;c3++)if(!set.has(r3*cols+c3))arr.push(r3*cols+c3);
  if(!arr.length)return new Set();
  var seen={},st=[arr[0]];seen[arr[0]]=1;var cnt=1;
  while(st.length){var x=st.pop(),xr=Math.floor(x/cols),xc=x%cols,ns=[[1,0],[-1,0],[0,1],[0,-1]];
    for(var q=0;q<4;q++){var nr=xr+ns[q][0],nc=xc+ns[q][1];if(nr<0||nc<0||nr>=rows||nc>=cols)continue;var j=nr*cols+nc;
      if(set.has(j)||seen[j])continue;seen[j]=1;cnt++;st.push(j)}}
  if(cnt!==arr.length)return new Set();
  return set;
}
function evenLens(n,c){var out=[],base=Math.floor(n/c),rem=n-base*c;for(var i=0;i<c;i++)out.push(base+(i<rem?1:0));return out}
function sliceWith(path,rows,cols,blocked,colorCount,lens){
  var eps=[],sol=[],idx=0;
  for(var ci=0;ci<colorCount;ci++){
    var seg=path.slice(idx,idx+lens[ci]); idx+=lens[ci];
    if(seg.length<2) return null;
    var a=seg[0],b=seg[seg.length-1];
    if(seg.length>=4&&Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1) return null; // no adjacent endpoints on a long path
    eps.push({color:ci,r1:a.r,c1:a.c,r2:b.r,c2:b.c});
    sol.push(seg);
  }
  if(idx!==path.length) return null;
  return {rows:rows,cols:cols,blocked:blocked,colors:colorCount,eps:eps,solution:sol};
}
function slicePuzzle(path,rows,cols,blocked,colorCount,rng){
  var n=path.length; if(n<colorCount*2) return null;
  var minLen=clamp(Math.floor(n/colorCount)-1,2,4);
  for(var attempt=0;attempt<40;attempt++){
    var lens=[],rem=n,bad=false;
    for(var i=0;i<colorCount-1;i++){
      var maxL=rem-minLen*(colorCount-1-i);
      if(maxL<minLen){bad=true;break}
      var v=clamp(minLen+Math.floor(rng()*Math.max(1,(maxL-minLen+1)*0.85)),minLen,maxL);
      lens.push(v); rem-=v;
    }
    if(bad||rem<minLen)continue;
    lens.push(rem);
    var p=sliceWith(path,rows,cols,blocked,colorCount,lens);
    if(p)return p;
  }
  return sliceWith(path,rows,cols,blocked,colorCount,evenLens(n,colorCount));
}
function buildPuzzle(rows,cols,blocked,colorCount,rng){
  var path=hamiltonian(rows,cols,blocked,rng,4000);
  if(!path) return null;
  return slicePuzzle(path,rows,cols,blocked,colorCount,rng);
}
function makeBoard(o){ // {rows,cols,colors,walls,seed} — always returns a playable, fully-solvable board
  var rng=mulberry32(o.seed>>>0);
  for(var a=0;a<18;a++){
    var walls=pickWalls(o.rows,o.cols,o.walls||0,rng);
    var p=buildPuzzle(o.rows,o.cols,walls,o.colors,rng);
    if(p)return p;
  }
  if(o.walls){                       // obstacles made it unfindable → drop them
    for(var b=0;b<6;b++){
      var p2=buildPuzzle(o.rows,o.cols,new Set(),o.colors,mulberry32((o.seed+b*2654435761)>>>0));
      if(p2)return p2;
    }
  }
  // last resort: serpentine sweep (always a valid Hamiltonian path on an open rectangle)
  return slicePuzzle(serpentine(o.rows,o.cols,new Set()),o.rows,o.cols,new Set(),o.colors,mulberry32((o.seed^0x9e3779b9)>>>0));
}

/* ---------------- level table ---------------- */
var LEVELS=[];
(function(){
  var size=[5,5,5,6,6, 6,6,7,7,7, 7,7,8,8,8, 8,8,9,9,9, 9,9,10,10,10, 10,10,11,11,11];
  var cols=[4,4,5,5,4, 5,6,5,6,5, 6,7,6,7,6, 7,8,7,8,7, 8,9,8,9,8, 9,9,10,9,10];
  for(var i=0;i<30;i++) LEVELS.push({size:size[i],colors:cols[i],walls:i<14?0:Math.min(5,Math.floor((i-13)/4)+1)});
})();
function seedFor(mode,lv,extra){
  if(mode==='daily')return hashStr('flowtide-daily-'+dateKey());
  if(mode==='zen')return (hashStr('flowtide-zen-'+Date.now().toString(36)+'-'+Math.random())^(extra||0))>>>0;
  return (hashStr('flowtide-lv-'+(lv+1))^(extra||0))>>>0;
}

/* =======================================================================
   GAME STATE
   ======================================================================= */
var G={mode:'campaign',lv:0,seed:0,rows:0,cols:0,colors:0,walls:0,
       eps:[],solution:[],blocked:new Set(),free:0};
var paths=[],drawing=-1,lastCell=null,preStroke=null,tapTarget=-1,pointerMoved=false;
var moves=0,hintsUsed=0,maxHints=3,undoStack=[];
var t0=0,tAcc=0,tInt=null,over=false,kb={on:false,r:0,c:0,active:false};
var els=[]; // per-colour svg refs

/* ---------------- board build ---------------- */
function setupBoard(cfg){
  G.mode=cfg.mode; G.lv=cfg.lv||0; G.seed=cfg.seed;
  var p=makeBoard({rows:cfg.size,cols:cfg.size,colors:cfg.colors,walls:cfg.walls,seed:cfg.seed});
  G.rows=p.rows;G.cols=p.cols;G.colors=p.colors;G.eps=p.eps;G.solution=p.solution;G.blocked=p.blocked;G.walls=cfg.walls||0;
  G.free=G.rows*G.cols-G.blocked.size;
  paths=[];for(var i=0;i<G.colors;i++)paths.push([]);
  if(cfg.paths){ paths=cfg.paths; moves=cfg.moves||0; hintsUsed=cfg.hints||0; }
  else {moves=0;hintsUsed=0;}
  maxHints=(cfg.mode==='zen')?99:3;
  undoStack=[];drawing=-1;lastCell=null;over=false;
  kb.r=Math.floor(G.rows/2);kb.c=Math.floor(G.cols/2);kb.active=false;
  buildStatic();layoutBoard();redraw();
  tAcc=cfg.time||0;t0=Date.now();startTimer();
}
function buildStatic(){
  var svg=$('#board');
  svg.setAttribute('viewBox','0 0 '+(G.cols*U)+' '+(G.rows*U));
  var cells=$('#lyr-cells'),fill=$('#lyr-fill'),rib=$('#lyr-ribbon'),ep=$('#lyr-ep');
  cells.innerHTML='';fill.innerHTML='';rib.innerHTML='';ep.innerHTML='';
  var frag=document.createDocumentFragment();
  for(var r=0;r<G.rows;r++)for(var c=0;c<G.cols;c++){
    if(G.blocked.has(r*G.cols+c)){
      frag.appendChild(svgEl('rect',{x:c*U+2,y:r*U+2,width:U-4,height:U-4,rx:16,class:'blockbg'}));
      frag.appendChild(svgEl('rect',{x:c*U+2,y:r*U+2,width:U-4,height:U-4,rx:16,fill:'url(#hatch)'}));
      frag.appendChild(svgEl('rect',{x:c*U+4,y:r*U+4,width:U-8,height:U-8,rx:14,class:'block'}));
      continue;
    }
    frag.appendChild(svgEl('rect',{x:c*U+2,y:r*U+2,width:U-4,height:U-4,rx:16,class:'cellbg'+(((r+c)%2)?' alt':'')}));
  }
  cells.appendChild(frag);
  els=[];
  for(var i2=0;i2<G.colors;i2++){
    var g=svgEl('g',{});
    var f=svgEl('g',{class:'fills'+i2});fill.appendChild(f);
    var rg=svgEl('g',{});
    var flow=svgEl('path',{class:'flow',stroke:'#fff'});
    var rb=svgEl('path',{class:'ribbon',stroke:PALETTE[i2]});
    rg.appendChild(rb);rg.appendChild(flow);rib.appendChild(rg);
    els.push({fill:f,ribbon:rb,flow:flow});
  }
  var efrag=document.createDocumentFragment();
  G.eps.forEach(function(e){
    var col=PALETTE[e.color];
    [[e.r1,e.c1],[e.r2,e.c2]].forEach(function(pos){
      var cx=(pos[1]+.5)*U,cy=(pos[0]+.5)*U;
      efrag.appendChild(svgEl('circle',{cx:cx,cy:cy,r:52,fill:col,class:'halo','data-c':e.color}));
      efrag.appendChild(svgEl('circle',{cx:cx,cy:cy,r:38,class:'ring'}));
      efrag.appendChild(svgEl('circle',{cx:cx,cy:cy,r:25,fill:col,class:'core'}));
      var tx=svgEl('text',{x:cx,y:cy,class:'glyph'});
      tx.textContent=GLYPHS[e.color];
      tx.style.display=store.settings.cb?'':'none';
      tx.setAttribute('data-glyph',e.color);
      efrag.appendChild(tx);
    });
  });
  ep.appendChild(efrag);
}
function layoutBoard(){
  var wrap=$('#board-wrap'),svg=$('#board');
  var availW=Math.min(window.innerWidth,560)-34;
  var availH=window.innerHeight-300;
  var size=Math.floor(Math.min(availW,availH));
  size=clamp(size,220,470);
  svg.style.width=size+'px';svg.style.height=size+'px';
  wrap.style.width=(size+18)+'px';
}

/* ---------------- geometry ---------------- */
function centre(p){return {x:(p.c+.5)*U,y:(p.r+.5)*U}}
function ribbonD(pts){
  if(!pts.length)return '';
  var P=pts.map(centre);
  if(P.length===1)return 'M'+P[0].x+' '+P[0].y+'L'+P[0].x+' '+P[0].y;
  var r=U*0.32,d='M'+P[0].x+' '+P[0].y;
  for(var i=1;i<P.length-1;i++){
    var a=P[i-1],b=P[i],c=P[i+1];
    var v1={x:Math.sign(b.x-a.x),y:Math.sign(b.y-a.y)};
    var v2={x:Math.sign(c.x-b.x),y:Math.sign(c.y-b.y)};
    if(v1.x===v2.x&&v1.y===v2.y)continue;
    var p1={x:b.x-v1.x*r,y:b.y-v1.y*r},p2={x:b.x+v2.x*r,y:b.y+v2.y*r};
    d+=' L'+p1.x+' '+p1.y+' Q'+b.x+' '+b.y+' '+p2.x+' '+p2.y;
  }
  var last=P[P.length-1];d+=' L'+last.x+' '+last.y;
  return d;
}

/* ---------------- model queries ---------------- */
function inBounds(r,c){return r>=0&&c>=0&&r<G.rows&&c<G.cols}
function blocked(r,c){return G.blocked.has(r*G.cols+c)}
function epAt(r,c){for(var i=0;i<G.eps.length;i++){var e=G.eps[i];if((e.r1===r&&e.c1===c)||(e.r2===r&&e.c2===c))return e.color}return -1}
function isEpOf(ci,r,c){var e=G.eps[ci];return (e.r1===r&&e.c1===c)||(e.r2===r&&e.c2===c)}
function hasPath(ci,r,c){var a=paths[ci];for(var i=0;i<a.length;i++)if(a[i].r===r&&a[i].c===c)return true;return false}
function ownerOf(r,c,skip){for(var i=0;i<G.colors;i++){if(i===skip)continue;if(hasPath(i,r,c))return i}return -1}
function connected(ci){var e=G.eps[ci];return paths[ci].length>1&&hasPath(ci,e.r1,e.c1)&&hasPath(ci,e.r2,e.c2)}
function usedCells(){var n=0;paths.forEach(function(p){n+=p.length});return n}

/* ---------------- drawing ---------------- */
function pushUndo(){undoStack.push({p:copyPaths(paths),m:moves});if(undoStack.length>60)undoStack.shift()}
function doUndo(){
  if(!undoStack.length)return false;
  var s=undoStack.pop();paths=s.p;moves=s.m;drawing=-1;lastCell=null;
  AU.back();redraw();saveResume();return true;
}
function stepTo(cell){
  if(drawing<0||!cell)return false;
  var r=cell.r,c=cell.c;
  if(!inBounds(r,c)||blocked(r,c))return false;
  var pts=paths[drawing],n=pts.length,last=pts[n-1];
  if(Math.abs(last.r-r)+Math.abs(last.c-c)!==1)return false;
  if(n>=2){var pr=pts[n-2];if(pr.r===r&&pr.c===c){pts.pop();AU.back();afterStep();return true}}
  if(hasPath(drawing,r,c))return false;
  var other=ownerOf(r,c,drawing);
  if(other>=0){
    if(isEpOf(other,r,c))return false;                 // cannot cover another colour's endpoint
    var arr=paths[other],cut=-1;
    for(var i=0;i<arr.length;i++)if(arr[i].r===r&&arr[i].c===c){cut=i;break}
    if(cut<=0)return false;
    paths[other]=arr.slice(0,cut);
  }
  pts.push({r:r,c:c});
  lastCell={r:r,c:c};
  AU.step(pts.length-1);
  afterStep();
  return true;
}
function afterStep(){moves++;redraw()}
function walkTo(target){
  if(!lastCell)return;
  var guard=0;
  while((lastCell.r!==target.r||lastCell.c!==target.c)&&guard++<12){
    var dr=target.r-lastCell.r, dc=target.c-lastCell.c;
    var prim,alt;
    if(Math.abs(dr)>=Math.abs(dc)){prim={r:lastCell.r+Math.sign(dr),c:lastCell.c};alt={r:lastCell.r,c:lastCell.c+(dc?Math.sign(dc):0)}}
    else{prim={r:lastCell.r,c:lastCell.c+Math.sign(dc)};alt={r:lastCell.r+(dr?Math.sign(dr):0),c:lastCell.c}}
    if(!stepTo(prim)){ if(alt.r!==prim.r||alt.c!==prim.c){ if(!stepTo(alt))break } else break }
  }
}
function beginDraw(ci,cell){
  if(!preStroke)preStroke={p:copyPaths(paths),m:moves};
  paths[ci]=[cell];drawing=ci;lastCell=cell;afterStep();
}

/* ---------------- pointer input ---------------- */
function cellFromEvent(ev){
  var svg=$('#board'),rc=svg.getBoundingClientRect();
  var x=(ev.clientX-rc.left)/rc.width*G.cols*U, y=(ev.clientY-rc.top)/rc.height*G.rows*U;
  var c=Math.floor(x/U),r=Math.floor(y/U);
  if(!inBounds(r,c))return null;
  return {r:r,c:c};
}
function onDown(ev){
  if(over||!G.colors)return;
  AU.resume();
  var cell=cellFromEvent(ev);if(!cell)return;
  ev.preventDefault();
  try{if(ev.pointerId!=null)$('#board').setPointerCapture(ev.pointerId)}catch(e){}
  tapTarget=-1;pointerMoved=false;
  preStroke={p:copyPaths(paths),m:moves};
  var ep=epAt(cell.r,cell.c);
  if(ep>=0){
    var wasOn=connected(ep);
    beginDraw(ep,cell);
    if(wasOn)AU.blip(300,0.06,'sine',0.06);
    kb.active=true;kb.r=cell.r;kb.c=cell.c;
    return;
  }
  if(blocked(cell.r,cell.c)){AU.nope();toast(t('toast_wall'));preStroke=null;return}
  var tail=-1;
  for(var i=0;i<G.colors;i++){var a=paths[i];if(a.length){var L=a[a.length-1];if(L.r===cell.r&&L.c===cell.c)tail=i}}
  if(tail>=0){drawing=tail;lastCell=cell;kb.active=true;kb.r=cell.r;kb.c=cell.c;return}
  var oc=ownerOf(cell.r,cell.c);
  if(oc>=0){tapTarget=oc;return}
  preStroke=null;
}
function onMove(ev){
  if(over)return;
  if(tapTarget>=0){pointerMoved=true;return}
  if(drawing<0)return;
  ev.preventDefault();
  var cell=cellFromEvent(ev);if(!cell)return;
  if(cell.r===lastCell.r&&cell.c===lastCell.c)return;
  pointerMoved=true;
  walkTo(cell);
}
function onUp(){
  if(over)return;
  if(drawing>=0){
    var ci=drawing;drawing=-1;lastCell=null;kb.active=false;
    if(connected(ci)){AU.connect();pulse(ci)}
    commitStroke();redraw();checkWin();
  }else if(tapTarget>=0){
    if(!pointerMoved){pushUndo();paths[tapTarget]=[];AU.blip(200,0.09,'sine',0.08);toast(t('toast_erased'));redraw();saveResume()}
    else if(preStroke&&JSON.stringify(preStroke.p)!==JSON.stringify(paths))commitStroke();
    tapTarget=-1;
  }else if(preStroke&&JSON.stringify(preStroke.p)!==JSON.stringify(paths))commitStroke();
  preStroke=null;
}
function commitStroke(){
  if(!preStroke)return;
  if(JSON.stringify(preStroke.p)!==JSON.stringify(paths)||preStroke.m!==moves){
    undoStack.push(preStroke);if(undoStack.length>60)undoStack.shift();
    saveResume();
  }
}

/* ---------------- keyboard ---------------- */
function onKey(ev){
  var gameOn=$('#scr-game').classList.contains('on');
  var overlayOn=$('#overlay').classList.contains('on');
  if(overlayOn){ if(ev.key==='Escape')closeOverlay(); return }
  if(!gameOn)return;
  var k=ev.key;
  if(k==='ArrowUp'||k==='ArrowDown'||k==='ArrowLeft'||k==='ArrowRight'){
    ev.preventDefault();
    var dr=k==='ArrowUp'?-1:k==='ArrowDown'?1:0, dc=k==='ArrowLeft'?-1:k==='ArrowRight'?1:0;
    if(kb.active){
      var nc={r:kb.r+dr,c:kb.c+dc};
      if(stepTo(nc)){kb.r=nc.r;kb.c=nc.c;updateCursor();return}
      AU.nope();
    }
    kb.r=clamp(kb.r+dr,0,G.rows-1);kb.c=clamp(kb.c+dc,0,G.cols-1);
    updateCursor();return;
  }
  if(k===' '||k==='Enter'){
    ev.preventDefault();
    AU.resume();
    if(kb.active){
      var ended=drawing;kb.active=false;drawing=-1;lastCell=null;
      if(ended>=0&&connected(ended)){AU.connect();pulse(ended)}
      commitStroke();redraw();checkWin();return}
    var ep=epAt(kb.r,kb.c);
    if(ep>=0){beginDraw(ep,{r:kb.r,c:kb.c});kb.active=true;return}
    for(var j=0;j<G.colors;j++){var a=paths[j];if(a.length&&a[a.length-1].r===kb.r&&a[a.length-1].c===kb.c){drawing=j;lastCell={r:kb.r,c:kb.c};kb.active=true;AU.click();return}}
    var oc=ownerOf(kb.r,kb.c);
    if(oc>=0){pushUndo();paths[oc]=[];toast(t('toast_erased'));redraw();return}
    AU.nope();
    return;
  }
  if(k==='u'||k==='U'||k==='Backspace'){ev.preventDefault();doUndo();return}
  if(k==='h'||k==='H'){useHint();return}
  if(k==='r'||k==='R'){resetBoard();return}
  if(k==='Escape'){quitGame();return}
}
function updateCursor(){
  var el=$('#kbc');
  if(!$('#scr-game').classList.contains('on')){el.classList.remove('on');return}
  el.classList.add('on');
  el.setAttribute('x',kb.c*U+4);el.setAttribute('y',kb.r*U+4);
  el.setAttribute('width',U-8);el.setAttribute('height',U-8);
}

/* ---------------- redraw ---------------- */
function redraw(){
  var used=0;
  for(var ci=0;ci<G.colors;ci++){
    var pts=paths[ci],e=els[ci],on=connected(ci);
    used+=pts.length;
    var d=ribbonD(pts);
    e.ribbon.setAttribute('d',d);
    e.flow.setAttribute('d',d);
    e.ribbon.setAttribute('class','ribbon'+(on?' on':''));
    e.flow.setAttribute('class','flow'+(on&&store.settings.motion?' on':''));
    var frag=document.createDocumentFragment();
    for(var i=0;i<pts.length;i++){
      frag.appendChild(svgEl('rect',{x:pts[i].c*U+4,y:pts[i].r*U+4,width:U-8,height:U-8,rx:14,
        fill:PALETTE[ci],opacity:on?0.30:0.20}));
    }
    e.fill.innerHTML='';e.fill.appendChild(frag);
  }
  // endpoints glow
  $$('#lyr-ep .halo').forEach(function(h){h.classList.toggle('on',connected(+h.getAttribute('data-c')))});
  $$('#lyr-ep [data-glyph]').forEach(function(g){g.style.display=store.settings.cb?'':'none'});
  updateHud(used);
  updateLegend();
}
function pulse(ci){
  var el=els[ci].ribbon;el.classList.remove('pulse');
  requestAnimationFrame(function(){el.classList.add('pulse');setTimeout(function(){el.classList.remove('pulse')},520)});
}
function updateHud(used){
  used=(used==null)?usedCells():used;
  var pct=Math.round(used/G.free*100);
  $('#pfill').style.width=pct+'%';
  $('#ptxt-left').textContent=tf('remaining',{n:Math.max(0,G.free-used)});
  $('#ptxt-right').textContent=tf('filled',{p:pct});
  $('#hud-moves').textContent=moves;
  $('#hud-hints').textContent=(maxHints>=99?'∞':Math.max(0,maxHints-hintsUsed));
  $('#hud-chip').textContent=chipText();
}
function chipText(){
  if(G.mode==='daily')return '📅 '+dateKey();
  if(G.mode==='zen')return '🧘 '+G.rows+'×'+G.cols;
  return t('level')+' '+(G.lv+1)+' · '+G.rows+'×'+G.cols;
}
function updateLegend(){
  var lg=$('#legend');
  if(lg.childElementCount!==G.colors){
    var h='';
    for(var i=0;i<G.colors;i++)h+='<span class="tag" data-i="'+i+'"><span class="swatch" style="background:'+PALETTE[i]+'"></span><span class="lb">'+GLYPHS[i]+'</span></span>';
    lg.innerHTML=h;
  }
  $$('#legend .tag').forEach(function(el){
    var i=+el.getAttribute('data-i'),on=connected(i);
    el.classList.toggle('ok',on);
    el.querySelector('.lb').textContent=store.settings.cb?(GLYPHS[i]+(on?' ✓':'')):(on?'✓':'○');
  });
}

/* ---------------- timer ---------------- */
function elapsed(){return tAcc+(tInt?((Date.now()-t0)/1000):0)}
function startTimer(){stopTimer();t0=Date.now();tInt=setInterval(function(){$('#hud-time').textContent=fmt(elapsed())},250);$('#hud-time').textContent=fmt(tAcc)}
function stopTimer(){if(tInt){var e=tAcc+(Date.now()-t0)/1000;clearInterval(tInt);tInt=null;tAcc=e}}

/* ---------------- hint / reset ---------------- */
function useHint(){
  if(over)return;
  if(hintsUsed>=maxHints){AU.nope();toast(t('toast_no_more_hint'));return}
  var target=-1;
  for(var i=0;i<G.colors;i++)if(!connected(i)){target=i;break}
  if(target<0){ // all connected but not filled → fix a path that differs from the solution
    for(var j=0;j<G.colors;j++){
      var a=paths[j],b=G.solution[j];
      if(a.length!==b.length){target=j;break}
    }
    if(target<0)return;
  }
  pushUndo();
  var seg=G.solution[target];
  for(var q=0;q<seg.length;q++){
    var o=ownerOf(seg[q].r,seg[q].c,target);
    if(o>=0){var arr=paths[o],cut=arr.length;
      for(var z=0;z<arr.length;z++)if(arr[z].r===seg[q].r&&arr[z].c===seg[q].c){cut=z;break}
      paths[o]=arr.slice(0,cut);}
  }
  paths[target]=copyPaths([seg])[0];
  hintsUsed++;
  AU.hint();toast(t('toast_hint'));redraw();saveResume();checkWin();
}
function resetBoard(){
  paths=[];for(var i=0;i<G.colors;i++)paths.push([]);
  moves=0;hintsUsed=0;undoStack=[];drawing=-1;over=false;
  tAcc=0;startTimer();
  AU.click();redraw();saveResume();
}
function newBoard(){
  var extra=(Math.random()*1e9)|0;
  var lv=G.lv,sz=G.rows;
  var cfg=G.mode==='campaign'?{mode:G.mode,lv:lv,size:LEVELS[lv].size,colors:LEVELS[lv].colors,walls:LEVELS[lv].walls,seed:seedFor('campaign',lv,extra)}
        :G.mode==='daily'?{mode:'daily',size:G.rows,colors:G.colors,walls:G.walls,seed:seedFor('daily',0,extra)}
        :{mode:'zen',size:G.rows,colors:G.colors,walls:G.walls,seed:seedFor('zen',0,extra)};
  setupBoard(cfg);
  toast(t('toast_newboard'));
}

/* ---------------- win ---------------- */
function scoreOf(sec){
  var par=G.free*2.4;
  var base=G.free*95;
  var s=base-moves*3-Math.floor(sec)*4-hintsUsed*Math.round(base*0.18);
  if(sec<par)s=Math.round(s*1.15);
  s=Math.max(60,Math.round(s));
  var stars=hintsUsed===0?(sec<=par?3:2):1;
  if(G.mode==='zen')stars=0;
  return {score:s,stars:stars,moves:moves,time:sec};
}
function checkWin(){
  if(over)return;
  for(var i=0;i<G.colors;i++)if(!connected(i)){return}
  if(usedCells()!==G.free)return;
  over=true;stopTimer();
  var sec=elapsed(),res=scoreOf(sec),isNew=false;
  if(G.mode==='campaign'){
    var prev=store.campaign[G.lv];
    isNew=!prev||res.score>prev.score;
    if(!prev) store.campaign[G.lv]={stars:res.stars,score:res.score,moves:res.moves,time:Math.round(res.time)};
    else{
      prev.stars=Math.max(prev.stars||0,res.stars);
      if(res.score>prev.score){prev.score=res.score;prev.moves=res.moves;prev.time=Math.round(res.time)}
    }
  }else if(G.mode==='daily'){
    var today=dateKey();
    if(store.daily.last!==today){
      var y=new Date();y.setDate(y.getDate()-1);
      store.daily.streak=(store.daily.last===dateKey(y))?store.daily.streak+1:1;
      store.daily.last=today;
    }
    isNew=res.score>store.daily.best;
    if(isNew)store.daily.best=res.score;
  }else{store.zen.solved++}
  store.resume=null;
  saveStore();
  AU.win();
  celebrate();
  showWin(res,isNew);
}
function celebrate(){
  if(!store.settings.motion)return;
  if(typeof window.confetti!=='function')return;
  var x=window.innerWidth/2,y=window.innerHeight*0.45;
  window.confetti({particleCount:90,spread:65,startVelocity:38,origin:{x:x/window.innerWidth,y:y/window.innerHeight},colors:PALETTE.slice(0,G.colors),disableForReducedMotion:true,zIndex:60});
  setTimeout(function(){window.confetti({particleCount:50,spread:100,launchAngle:60,origin:{x:0.1,y:0.6},colors:PALETTE.slice(0,G.colors),zIndex:60})},160);
  setTimeout(function(){window.confetti({particleCount:50,spread:100,launchAngle:120,origin:{x:0.9,y:0.6},colors:PALETTE.slice(0,G.colors),zIndex:60})},260);
}
function starHtml(n,max){
  var h='';for(var i=0;i<(max||3);i++)h+='<span class="s'+(i<n?'':' off')+'">★</span>';
  return h;
}
function showWin(res,isNew){
  var title=G.mode==='daily'?t('win_daily'):(G.mode==='zen'?t('win_zen'):t('win'));
  var nextHtml='';
  if(G.mode==='campaign'&&G.lv<LEVELS.length-1)nextHtml='<button class="btn primary" id="w-next">'+t('next')+'</button>';
  if(G.mode==='zen')nextHtml='<button class="btn primary" id="w-next">'+t('next')+'</button>';
  $('#panel').innerHTML=
    '<h3 class="display">'+title+'</h3>'+
    (G.mode==='campaign'?'<div class="stars">'+starHtml(res.stars)+'</div>':'')+
    '<div class="metrics">'+
      '<div class="metric"><div class="k">'+t('moves')+'</div><div class="v">'+res.moves+'</div></div>'+
      '<div class="metric"><div class="k">'+t('time')+'</div><div class="v">'+fmt(res.time)+'</div></div>'+
      '<div class="metric"><div class="k">'+t('hints')+'</div><div class="v">'+hintsUsed+'</div></div>'+
    '</div>'+
    '<div class="bigscore display">'+res.score.toLocaleString()+
      (isNew&&G.mode!=='zen'?'<span class="newrec">'+t('new_record')+'</span>':'')+'</div>'+
    '<div class="row" style="margin-top:20px">'+
      nextHtml+
      '<button class="btn" id="w-replay">'+t('replay')+'</button>'+
      '<button class="btn ghost" id="w-levels">'+(G.mode==='campaign'?t('levels'):t('close'))+'</button>'+
    '</div>';
  openOverlay();
  var b=$('#w-next');if(b)b.onclick=function(){closeOverlay();
    if(G.mode==='zen')startZen(G.rows);else startCampaign(G.lv+1)};
  $('#w-replay').onclick=function(){closeOverlay();
    if(G.mode==='zen')startZen(G.rows);else if(G.mode==='daily')startDaily();else startCampaign(G.lv)};
  $('#w-levels').onclick=function(){closeOverlay();
    if(G.mode==='campaign')showScreen('levels');else showScreen('title')};
  // gsap entrance
  if(window.gsap){
    gsap.fromTo('#panel',{y:26,scale:.94,opacity:0},{y:0,scale:1,opacity:1,duration:.5,ease:'back.out(1.7)'});
    if(G.mode==='campaign')gsap.from('#panel .stars .s',{scale:0,opacity:0,duration:.5,stagger:.14,ease:'back.out(2.4)',delay:.15});
    gsap.from('#panel .metric',{y:14,opacity:0,duration:.4,stagger:.07,delay:.1});
  }
}

/* ---------------- overlay / toast ---------------- */
function openOverlay(){$('#overlay').classList.add('on')}
function closeOverlay(){$('#overlay').classList.remove('on')}
var toastTimer=null;
function toast(msg){
  var el=$('#toast');el.textContent=msg;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove('show')},1900);
}

/* ---------------- screens ---------------- */
function showScreen(id){
  $$('.screen').forEach(function(s){s.classList.remove('on')});
  $('#scr-'+id).classList.add('on');
  $('#kbc').classList.remove('on');
  if(id==='game'){requestAnimationFrame(layoutBoard);}
}
function backTarget(){
  if(G.mode==='zen')showScreen('zen');
  else if(G.mode==='daily')showScreen('title');
  else showScreen('levels');
  refreshStatic();
}
function quitGame(){store.resume=collectResume();saveStore();AU.click();stopTimer();backTarget()}

/* ---------------- level / zen / daily launch ---------------- */
function startCampaign(lv){
  lv=clamp(lv,0,LEVELS.length-1);
  if(!unlocked(lv)){AU.nope();toast(t('toast_locked'));return}
  var cfg=LEVELS[lv];
  setupBoard({mode:'campaign',lv:lv,size:cfg.size,colors:cfg.colors,walls:cfg.walls,seed:seedFor('campaign',lv)});
  showScreen('game');firstTip();
}
function startDaily(){
  var cfg={mode:'daily',size:9,colors:8,walls:4,seed:seedFor('daily')};
  setupBoard(cfg);showScreen('game');
  if(store.daily.last===dateKey())toast(t('toast_daily_done'));
}
function startZen(size){
  var colors=Math.round(size*0.85);
  setupBoard({mode:'zen',size:size,colors:colors,walls:size>=7?2:0,seed:seedFor('zen')});
  showScreen('game');
}
function unlocked(lv){return lv===0||!!store.campaign[lv-1]}
function firstTip(){
  if(store.tipSeen)return;
  store.tipSeen=true;saveStore();
  setTimeout(function(){toast(t('tip_start'))},420);
}

/* ---------------- resume ---------------- */
function collectResume(){
  if(!G.colors||over)return null;
  return {mode:G.mode,lv:G.lv,seed:G.seed,size:G.rows,colors:G.colors,walls:G.walls,
          paths:copyPaths(paths),moves:moves,time:elapsed(),hints:hintsUsed};
}
function saveResume(){
  store.resume=collectResume();
  saveStore();
  $('#resume-row').style.display=store.resume?'flex':'none';
}
function resumeGame(){
  var r=store.resume;if(!r)return;
  if(r.mode==='campaign'&&!unlocked(r.lv)){store.resume=null;saveStore();return}
  setupBoard({mode:r.mode,lv:r.lv,size:r.size,colors:r.colors,walls:r.walls,seed:r.seed,
              paths:r.paths,moves:r.moves,time:r.time,hints:r.hints});
  showScreen('game');
}

/* ---------------- static screens refresh ---------------- */
function refreshStatic(){
  var total=0;
  Object.keys(store.campaign).forEach(function(k){total+=store.campaign[k].stars||0});
  $('#badge-stars').textContent='★ '+total+'/'+(LEVELS.length*3);
  $('#lv-total').textContent=total;
  $('#zen-count').textContent=store.zen.solved;
  var badge=$('#badge-streak');
  badge.textContent=store.daily.streak?('🔥 '+store.daily.streak):'';
  $('#daily-sub').textContent=(store.daily.last===dateKey())?t('toast_daily_done'):t('mode_daily_sub');
  $('#resume-row').style.display=store.resume?'flex':'none';
  // zen size buttons
  var zs=$('#zen-sizes');
  if(!zs.childElementCount){
    [5,7,9,11].forEach(function(s){
      var b=document.createElement('button');b.className='btn';b.textContent=s+'×'+s;
      b.onclick=function(){AU.click();startZen(s)};zs.appendChild(b);
    });
  }
}
function renderLevels(){
  var g=$('#lvgrid');g.innerHTML='';
  LEVELS.forEach(function(cfg,i){
    var rec=store.campaign[i],ok=unlocked(i);
    var b=document.createElement('button');
    b.className='lv'+(rec?' done':'')+(i===G.lv&&G.mode==='campaign'?' cur':'')+(ok?'':' lock');
    b.innerHTML='<span>'+(ok?(i+1):'🔒')+'</span><span class="st">'+(rec?starHtml(rec.stars,3):'')+'</span>';
    b.onclick=function(){AU.click();if(ok)startCampaign(i);else{AU.nope();toast(t('toast_locked'))}};
    g.appendChild(b);
  });
}
function renderRecords(){
  var total=0,cleared=0;
  Object.keys(store.campaign).forEach(function(k){total+=store.campaign[k].stars||0;cleared++});
  $('#r-stars').textContent=total;
  $('#r-clear').textContent=cleared+'/'+LEVELS.length;
  $('#r-streak').textContent=store.daily.streak+(store.daily.best?(' · '+store.daily.best.toLocaleString()):'');
  var list=$('#r-list');list.innerHTML='';
  if(!cleared&&!store.zen.solved){list.innerHTML='<div class="empty">'+t('no_data')+'</div>';return}
  Object.keys(store.campaign).map(Number).sort(function(a,b){return a-b}).forEach(function(k){
    var rec=store.campaign[k];
    var row=document.createElement('div');row.className='lrow';
    row.innerHTML='<span class="n">'+t('level')+' '+(k+1)+'</span><span class="st">'+starHtml(rec.stars,3)+'</span>'+
      '<span class="v">'+rec.score.toLocaleString()+'</span>';
    list.appendChild(row);
  });
  if(store.daily.best){var d=document.createElement('div');d.className='lrow';
    d.innerHTML='<span class="n">'+t('mode_daily')+'</span><span class="st"></span><span class="v">'+store.daily.best.toLocaleString()+'</span>';list.appendChild(d)}
  if(store.zen.solved){var z=document.createElement('div');z.className='lrow';
    z.innerHTML='<span class="n">'+t('mode_zen')+'</span><span class="st"></span><span class="v">'+store.zen.solved+'</span>';list.appendChild(z)}
}

/* ---------------- settings ---------------- */
function openSettings(){
  var s=store.settings;
  $('#panel').innerHTML=
   '<h3 class="display">'+t('settings')+'</h3>'+
   '<div class="set">'+
     '<div class="srow"><label for="sel-lang">'+t('set_lang')+'</label>'+
       '<select id="sel-lang">'+['ja','en','ko','zh'].map(function(l){return '<option value="'+l+'"'+(l===lang?' selected':'')+'>'+({ja:'🇯🇵 日本語',en:'🇬🇧 English',ko:'🇰🇷 한국어',zh:'🇨🇳 中文'})[l]+'</option>'}).join('')+'</select></div>'+
     swRow('sw-sound',t('set_sound'),t('set_sound_sub'),s.sound)+
     swRow('sw-music',t('set_music'),t('set_music_sub'),s.music)+
     swRow('sw-cb',t('set_cb'),t('set_cb_sub'),s.cb)+
     swRow('sw-motion',t('set_motion'),t('set_motion_sub'),s.motion)+
     '<div class="srow"><label for="sel-theme">'+t('set_theme')+'</label>'+
       '<select id="sel-theme"><option value="nebula"'+(s.theme==='nebula'?' selected':'')+'>'+t('theme_nebula')+'</option><option value="aqua"'+(s.theme==='aqua'?' selected':'')+'>'+t('theme_aqua')+'</option></select></div>'+
     '<div class="srow"><label>'+t('data')+'</label><button class="btn sm" id="btn-wipe">'+t('data_reset')+'</button></div>'+
   '</div>'+
   '<p class="foot" style="max-width:100%">'+t('about')+'</p>'+
   '<p class="foot" style="max-width:100%">'+t('kbd')+'</p>'+
   '<div class="row" style="margin-top:16px"><button class="btn primary" id="set-close">'+t('close')+'</button></div>';
  openOverlay();
  $('#sel-lang').onchange=function(e){setLang(e.target.value)};
  $('#sel-theme').onchange=function(e){store.settings.theme=e.target.value;applyTheme();saveStore();AU.click()};
  bindSwitch('sw-sound',function(v){store.settings.sound=v;saveStore()});
  bindSwitch('sw-music',function(v){store.settings.music=v;AU.musicOn(v);saveStore()});
  bindSwitch('sw-cb',function(v){store.settings.cb=v;saveStore();redraw();updateLegend();applyI18n()});
  bindSwitch('sw-motion',function(v){store.settings.motion=v;document.body.setAttribute('data-motion',v?'on':'off');saveStore();redraw()});
  $('#btn-wipe').onclick=function(){
    if(!window.confirm(t('data_reset_q')))return;
    localStorage.removeItem(SKEY);
    store.campaign={};store.zen={solved:0};store.daily={last:'',streak:0,best:0};store.resume=null;
    saveStore();refreshStatic();toast(t('data_reset'));AU.nope();
  };
  $('#set-close').onclick=function(){closeOverlay();refreshStatic()};
  if(window.gsap)gsap.fromTo('#panel',{y:20,opacity:0},{y:0,opacity:1,duration:.35,ease:'power2.out'});
}
function swRow(id,label,sub,on){
  return '<div class="srow"><label>'+label+'<span class="hinttxt">'+sub+'</span></label>'+
    '<button class="switch" id="'+id+'" role="switch" aria-checked="'+(on?'true':'false')+'"><i></i></button></div>';
}
function bindSwitch(id,fn){
  var el=$('#'+id);if(!el)return;
  el.onclick=function(){
    var v=el.getAttribute('aria-checked')!=='true';
    el.setAttribute('aria-checked',v?'true':'false');AU.click();fn(v);
    if(id==='sw-motion'&&window.gsap)gsap.fromTo(el,{x:-3},{x:0,duration:.3,ease:'back.out(3)'});
  };
}
function applyTheme(){document.documentElement.setAttribute('data-theme',store.settings.theme||'nebula')}
function setLang(v){lang=I18N[v]?v:'ja';store.lang=lang;saveStore();applyI18n();if($('#scr-levels').classList.contains('on'))renderLevels();if($('#scr-records').classList.contains('on'))renderRecords();if($('#scr-game').classList.contains('on')){updateHud();updateLegend();$('#hud-chip').textContent=chipText()}}

/* =======================================================================
   BOOT
   ======================================================================= */
function bind(){
  $('#go-campaign').onclick=function(){AU.click();renderLevels();showScreen('levels')};
  $('#go-daily').onclick=function(){AU.click();startDaily()};
  $('#go-zen').onclick=function(){AU.click();showScreen('zen')};
  $('#go-records').onclick=function(){AU.click();renderRecords();showScreen('records')};
  $('#go-settings').onclick=function(){AU.click();openSettings()};
  $('#btn-resume').onclick=function(){AU.click();resumeGame()};
  $('#btn-quit').onclick=quitGame;
  $('#btn-undo').onclick=function(){AU.click();doUndo()};
  $('#btn-newboard').onclick=function(){AU.click();newBoard()};
  $('#btn-sound').onclick=function(){store.settings.sound=!store.settings.sound;saveStore();syncSoundBtn();if(store.settings.sound){AU.resume();AU.click()}};
  $('#btn-hint').onclick=function(){AU.click();useHint()};
  $('#btn-reset').onclick=function(){AU.click();resetBoard()};
  $$('[data-back]').forEach(function(b){b.onclick=function(){AU.click();showScreen(b.getAttribute('data-back'));refreshStatic()}});
  $('#overlay').addEventListener('pointerdown',function(e){if(e.target.id==='overlay')closeOverlay()});

  var svg=$('#board');
  svg.addEventListener('pointerdown',onDown,{passive:false});
  svg.addEventListener('pointermove',onMove,{passive:false});
  window.addEventListener('pointerup',onUp);
  window.addEventListener('pointercancel',onUp);
  window.addEventListener('contextmenu',function(e){if($('#scr-game').classList.contains('on'))e.preventDefault()});
  window.addEventListener('keydown',onKey);
  window.addEventListener('resize',function(){if($('#scr-game').classList.contains('on'))layoutBoard()});
  window.addEventListener('orientationchange',function(){setTimeout(function(){if($('#scr-game').classList.contains('on'))layoutBoard()},250)});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){store.resume=collectResume();saveStore();}
  });
  window.addEventListener('pointerdown',function once(){AU.resume();if(store.settings.music)AU.musicOn(true);window.removeEventListener('pointerdown',once)},{once:true});
}
function syncSoundBtn(){var b=$('#btn-sound');b.textContent=store.settings.sound?'🔊':'🔇';b.classList.toggle('off',!store.settings.sound)}

function boot(){
  loadStore();
  applyTheme();
  document.body.setAttribute('data-motion',store.settings.motion?'on':'off');
  applyI18n();
  syncSoundBtn();
  refreshStatic();
  bind();
  showScreen('title');
}
module.exports={};globalThis.__FT={makeBoard:makeBoard,LEVELS:LEVELS,seedFor:seedFor,hashStr:hashStr,buildPuzzle:buildPuzzle,pickWalls:pickWalls};
})();
