(() => {
"use strict";
const $ = id => document.getElementById(id);
const SAVE_KEY = "citySurvivalSave_v1";
let state = null, data = null, currentView = "daily", toastTimer;

window.addEventListener("gamedata-ready", () => {
  data = window.GameData;
  updateContinueButton();
  $("newGameButton").addEventListener("click", startNewGame);
  $("continueButton").addEventListener("click", continueGame);
  $("saveButton").addEventListener("click", () => saveGame(true));
  $("backToTitle").addEventListener("click", () => { saveGame(); $("gameScreen").classList.add("hidden"); $("startScreen").classList.remove("hidden"); });
  $("modalClose").addEventListener("click", closeModal);
  document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
  render();
});
function freshState(name){
 return {name,day:1,birth:"",district:"",career:"",careerType:"",rankIndex:0,rep:0,an:0,hp:100,maxHp:100,stagger:50,maxStagger:50,light:3,maxLight:3,strength:5,vitality:5,agility:5,connections:0,infamy:0,blood:0,grade:0,heatStyle:"",mind:false,hope:0,tattoos:0,revenge:[],weapon:"fist",skillSlots:["fist_punch","fist_kick","fist_evade"],dead:false,logs:["도시에서의 첫날이 시작되었다."],todayQuests:[],trainingUsed:0,injury:0,careerBonus:0,company:"",directive:null};
}
function startNewGame(){
 const name = $("characterName").value.trim() || "이름 없는 사람";
 state = freshState(name);
 const roll = Math.random()*100;
 if(roll < 90){
   state.birth="평범한 시민";
   const districtRoll=Math.random()*100;
   if(districtRoll<35){state.district="뒷골목";state.hp=110;state.maxHp=110;state.an=50;state.connections=2;}
   else if(districtRoll<85){state.district="일반 주거지";state.hp=100;state.maxHp=100;state.an=150;}
   else {state.district="부유 지구";state.hp=90;state.maxHp=90;state.an=500;state.connections=2;}
 }else if(roll<97){
   state.birth="소지 출신 가문";state.district="소지";state.an=180;state.connections=20;state.strength=6;state.vitality=6;state.agility=6;
 }else{
   state.birth="혈귀";state.grade=Math.random()<.6?3:(Math.random()<.75?2:1);state.district="혈귀";state.hp=120+(4-state.grade)*15;state.maxHp=state.hp;state.an=100;state.blood=10;state.strength=7+(3-state.grade)*2;state.vitality=7+(3-state.grade)*2;state.agility=7+(3-state.grade);
 }
 state.stagger=Math.floor(state.maxHp*.5);state.maxStagger=state.stagger;
 log(`${state.birth}으로 태어났다. 시작 구역: ${state.district}.`);
 if(state.birth==="혈귀") log(`${state.grade}등급 혈귀로 태어났다. 혈기 관리에 주의해야 한다.`);
 state.pendingCareer=true;
 $("startScreen").classList.add("hidden");$("gameScreen").classList.remove("hidden");
 saveGame(); showView("daily"); render();
 if(state.pendingCareer) openCareerChoice();
}
function continueGame(){
 const saved=loadSaved(); if(!saved){toast("저장된 기록이 없어.");return;}
 state=saved;$("startScreen").classList.add("hidden");$("gameScreen").classList.remove("hidden");render();showView("daily");toast("기록을 불러왔어.");
}
function loadSaved(){try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch{return null;}}
function updateContinueButton(){const s=loadSaved();$("continueButton").disabled=!s;$("continueHint").textContent=s?`저장된 기록: ${s.name} · ${s.day}일차`:"저장된 기록이 없습니다.";}
function saveGame(show=false){if(!state)return;localStorage.setItem(SAVE_KEY,JSON.stringify(state));$("saveStatus").textContent="저장됨";updateContinueButton();if(show)toast("현재 기록을 저장했어.");}
function log(text){if(!state)return;state.logs.unshift(`[${state.day}일차] ${text}`);state.logs=state.logs.slice(0,40);}
function toast(text){const el=$("toast");el.textContent=text;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2100);}
function showView(view){currentView=view;document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));$(`view-${view}`).classList.remove("hidden");renderView();}
function render(){if(!state)return;$("dayLabel").textContent=`DAY ${state.day}`;$("characterTitle").textContent=state.name;$("careerLabel").textContent=`${state.career||"미소속"} · ${state.district} 출신`;$("rankLabel").textContent=getRankName();renderStats();renderView();}
function renderStats(){
 const stats=[["생명력",state.hp],["안",state.an],["평판",state.rep],["힘",state.strength],["체질",state.vitality],["민첩",state.agility]];
 $("statGrid").innerHTML=stats.map(([n,v])=>`<div class="stat"><span>${n}</span><strong>${fmt(v)}</strong></div>`).join("");
 const bars=[["생명력",state.hp,state.maxHp,""],["흐트러짐",state.stagger,state.maxStagger,"red"],["빛",state.light,state.maxLight,""]];
 $("barGrid").innerHTML=bars.map(([n,v,m,c])=>`<div class="bar-wrap"><div class="bar-label"><span>${n}</span><b>${v}/${m}</b></div><div class="bar ${c}"><i style="width:${Math.max(0,Math.min(100,v/m*100))}%"></i></div></div>`).join("");
}
function fmt(n){return Math.floor(n).toLocaleString("ko-KR");}
function getRankList(){
 if(!state.career)return [{name:"진로 미정",rep:0}];
 if(state.careerType==="fixer")return data.ranks.fixer;
 if(state.careerType==="finger")return (data.ranks.fingers[state.career]||[]).map(x=>({name:x[0],rep:x[1],equiv:x[2]}));
 return data.ranks.companies;
}
function getRankName(){const list=getRankList();state.rankIndex=Math.max(0,Math.min(state.rankIndex||0,list.length-1));return list[state.rankIndex]?.name||"무명";}
function openModal(html){$("modalContent").innerHTML=html;$("modal").classList.remove("hidden");}
function closeModal(){$("modal").classList.add("hidden");}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function card(title,desc,meta="",button="",disabled=false){return `<article class="game-card"><div class="meta">${meta}</div><h4>${title}</h4><p>${desc}</p>${button?button:""}</article>`;}
function btn(label,action,cls="action-btn",disabled=false){return `<button class="${cls}" data-action="${action}" ${disabled?"disabled":""}>${label}</button>`;}
function renderView(){
 if(!state||!data)return;
 const view=$(`view-${currentView}`);
 if(currentView==="daily") view.innerHTML=renderDaily();
 if(currentView==="quests") view.innerHTML=renderQuests();
 if(currentView==="career") view.innerHTML=renderCareer();
 if(currentView==="equipment") view.innerHTML=renderEquipment();
 if(currentView==="shop") view.innerHTML=renderShop();
 if(currentView==="special") view.innerHTML=renderSpecial();
 view.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>handleAction(b.dataset.action)));
}
function renderDaily(){
 const event=state.currentEvent || data.events[(state.day-1)%data.events.length];
 state.currentEvent=event;
 return `<h3>일상</h3><p class="view-intro">${state.day}일차. 도시의 하루가 시작되었다. 오늘 할 일을 정하고, 하루를 마무리하자.</p>
 <div class="game-card"><div class="meta">오늘의 사건 · ${event.title}</div><h4>${event.title}</h4><p>${event.text}</p><div class="choice-list">${event.choices.map((c,i)=>`<button class="choice-btn" data-action="event:${i}"><strong>${c.label}</strong><br><span class="inline-note">${c.desc}</span></button>`).join("")}</div></div>
 <div class="section-row"><h4>하루 일정</h4><span class="inline-note">하루를 넘기면 생활비와 혈기가 반영돼.</span></div>
 <div class="card-grid">${card("의뢰 확인","오늘 배정된 의뢰를 확인하고 수락할 수 있다.","활동",btn("의뢰 게시판 열기","goto:quests","action-btn"))}${card("치료 및 정비","생명력과 흐트러짐을 회복한다.","휴식",btn("치료소 열기","goto:shop","action-btn"))}${card("하루 마감","생활비를 지불하고 다음 날로 넘어간다.","시간 진행",btn("하루 마감","nextday","action-btn"))}</div>
 <div class="section-row"><h4>최근 기록</h4></div><div class="log-box">${state.logs.slice(0,8).map(esc).join("<br>")}</div>`;
}
function renderQuests(){
 const list=state.todayQuests.length?state.todayQuests:generateQuests();
 state.todayQuests=list;
 return `<h3>의뢰 게시판</h3><p class="view-intro">현재 환산 등급을 기준으로 의뢰가 배정된다. 의뢰 전투에서 생명력이 0이 되면 삶이 끝난다.</p><div class="card-grid">${list.map((q,i)=>card(q.title,q.description,`${q.rank} · 위험도 ${q.difficulty}/5 · 보상 ${q.rewardAn}안 / ${q.rewardRep}평판`,btn("의뢰 수락",`quest:${i}`))).join("")}</div><div class="section-row"><span class="inline-note">의뢰는 하루에 한 번 새로 배정할 수 있어.</span>${btn("의뢰 새로고침","refreshquests","soft-btn")}</div>`;
}
function generateQuests(){
 const pool=data.quests;
 const idx=Math.min(4,Math.floor(state.rep/1200));
 const selected=[pool[Math.min(idx,pool.length-1)],pool[Math.max(0,idx-1)],pool[Math.min(pool.length-1,idx+1)]];
 return selected.map(q=>({...q}));
}
function renderCareer(){
 const choices=[["해결사","fixer","의뢰 보상금 +5%"],["엄지","finger","의뢰 보상금 +10%, 패배 시 상납금 15%"],["검지","finger","매일 지령을 수행하고 평판 획득"],["중지","finger","패배한 적을 앙갚음 장부에 기록"],["약지","finger","가입 시 화풍을 선택"],["소지","finger","전용 훈련 가능"],["기업","company","직급별 일급 지급"]];
 const careerText=state.career?`현재 소속: ${state.career} / ${getRankName()}`:"아직 진로를 선택하지 않았다.";
 return `<h3>진로·평판</h3><p class="view-intro">${careerText} 성인이 된 뒤 하나의 진로를 선택한다. 소속을 선택하면 기본적으로 변경할 수 없다. (소지 고위 계급 이적은 추후 확장)</p>
 <div class="card-grid">${choices.map(([n,t,d])=>card(n,d,"진로",btn(state.career?"선택 완료": "선택",`career:${n}`, "action-btn",!!state.career))).join("")}</div>
 <div class="section-row"><h4>승급</h4><span class="inline-note">요구 평판에 도달하면 응시료를 내고 1대1 시험을 치른다.</span></div>
 <div class="game-card"><div class="meta">현재 계급 · ${getRankName()}</div><h4>평판 ${fmt(state.rep)}</h4><p>다음 계급: ${nextRankText()}</p>${btn("승급시험 응시","promotion", "action-btn",!state.career||!canPromote())}</div>`;
}
function nextRankText(){const l=getRankList(),next=l[(state.rankIndex||0)+1];return next?`${next.name} · ${fmt(next.rep)} 평판`:"최고 계급";}
function canPromote(){const next=getRankList()[(state.rankIndex||0)+1];return !!next&&state.rep>=next.rep;}
function renderEquipment(){
 const weapons=data.weapons;const current=weapons.find(w=>w.id===state.weapon);
 const skills=data.skills.filter(s=>current?.skills.includes(s.id));
 return `<h3>장비·스킬</h3><p class="view-intro">무기는 사용할 수 있는 스킬 묶음이다. 전투에서 사용할 스킬을 최대 5개까지 편성한다.</p><div class="section-row"><h4>현재 무기: ${current?.name||"맨손"}</h4></div><div class="card-grid">${weapons.map(w=>card(w.name,`가격 ${w.price}안 · 스킬 ${w.skills.length}개`,w.id===state.weapon?"장착 중":"무기",btn(w.id===state.weapon?"장착 중":"장착",`equip:${w.id}`,"action-btn",w.id===state.weapon))).join("")}</div>
 <div class="section-row"><h4>사용 가능 스킬</h4><span class="inline-note">슬롯 ${state.skillSlots.length}/5</span></div><div class="card-grid">${skills.map(s=>card(s.name,`${s.effect} · 위력 ${s.power[0]}~${s.power[1]}`,s.type==="attack"?`공격 ${"★".repeat(s.stars)} · 빛 ${s.cost}`:s.type==="defend"?"방어":"회피",btn(state.skillSlots.includes(s.id)?"슬롯 해제":"슬롯 장착",`slot:${s.id}`,"action-btn",!state.skillSlots.includes(s.id)&&state.skillSlots.length>=5))).join("")}</div>`;
}
function renderShop(){
 return `<h3>상점·치료소</h3><p class="view-intro">도시의 화폐 안으로 장비를 구매하거나 부상을 치료할 수 있다.</p><div class="card-grid">${data.weapons.filter(w=>w.id!=="fist").map(w=>card(w.name,`무기 스킬 ${w.skills.length}개`,`${w.price}안`,btn("구매",`buy:${w.id}`,"action-btn",state.an<w.price))).join("")}
 ${card("기초 치료","생명력과 흐트러짐을 일부 회복한다.","60안",btn("치료하기","heal:basic","action-btn",state.an<60||state.hp===state.maxHp))}
 ${card("집중 치료","생명력과 흐트러짐을 완전히 회복한다.","150안",btn("집중 치료","heal:full","action-btn",state.an<150||state.hp===state.maxHp))}</div>`;
}
function renderSpecial(){
 let body="";
 if(state.career==="소지")body=`<div class="game-card"><h4>소지 수련장</h4><p>하루 최대 3회 훈련할 수 있다. 기본 능력치를 올린다. (${state.trainingUsed}/3)</p>${btn("힘 훈련","train:strength","action-btn",state.trainingUsed>=3||state.an<20)}${btn("체질 훈련","train:vitality","action-btn",state.trainingUsed>=3||state.an<20)}${btn("민첩 훈련","train:agility","action-btn",state.trainingUsed>=3||state.an<20)}</div>`;
 else if(state.career==="중지")body=`<div class="game-card"><h4>앙갚음 장부</h4><p>패배한 적: ${state.revenge.length?state.revenge.map(esc).join(", "):"기록 없음"}</p><p>강화문신: ${state.tattoos}개 · 합 위력 보너스 +${state.tattoos}</p></div>`;
 else if(state.career==="검지")body=`<div class="game-card"><h4>오늘의 지령</h4><p>${state.directive||"아직 지령이 내려오지 않았다."}</p>${btn("지령 확인","directive","action-btn")}</div>`;
 else if(state.career==="약지")body=`<div class="game-card"><h4>약지 화풍</h4><p>선택한 화풍: ${state.heatStyle||"미선택"}</p>${["점묘파","야수파","신체파","입체파"].map(x=>btn(x,`style:${x}`,"action-btn",!!state.heatStyle)).join("")}</div>`;
 else if(state.birth==="혈귀")body=`<div class="game-card"><h4>혈기 관리</h4><p>혈기 ${state.blood}/100 · 등급 ${state.grade}</p><p>혈기를 낮추지 않으면 능력치와 생명력에 불이익이 생길 수 있다.</p>${btn("혈액팩 구매 (80안)","bloodpack","action-btn",state.an<80||state.blood===0)}</div>`;
 else body=`<div class="game-card"><h4>소속 전용 기능</h4><p>현재 사용할 수 있는 소속 전용 기능이 없다. 진로를 선택하거나 특별 출생 기능을 확인하자.</p></div>`;
 return `<h3>소속 전용</h3><p class="view-intro">출생과 소속에 따라 사용할 수 있는 고유 시스템이다.</p>${body}`;
}
function handleAction(a){
 if(a.startsWith("goto:"))return showView(a.split(":")[1]);
 if(a.startsWith("event:"))return chooseEvent(+a.split(":")[1]);
 if(a.startsWith("career:"))return chooseCareer(a.split(":")[1]);
 if(a.startsWith("quest:"))return startQuest(+a.split(":")[1]);
 if(a.startsWith("equip:"))return equip(a.split(":")[1]);
 if(a.startsWith("slot:"))return toggleSlot(a.split(":")[1]);
 if(a.startsWith("buy:"))return buyWeapon(a.split(":")[1]);
 if(a.startsWith("heal:"))return heal(a.split(":")[1]);
 if(a.startsWith("train:"))return train(a.split(":")[1]);
 if(a.startsWith("style:")){state.heatStyle=a.split(":")[1];log(`약지의 화풍을 ${state.heatStyle}(으)로 정했다.`);render();return;}
 if(a==="nextday")return nextDay();
 if(a==="refreshquests"){state.todayQuests=generateQuests();render();toast("의뢰 목록을 새로 배정했어.");return;}
 if(a==="promotion")return promotion();
 if(a==="directive"){state.directive="오늘의 의뢰 중 하나를 완료한다.";toast("지령: 오늘 의뢰 1개 완료");return;}
 if(a==="bloodpack"){state.an-=80;state.blood=Math.max(0,state.blood-35);log("혈액팩을 구매해 혈기를 낮췄다.");render();return;}
}
function chooseEvent(i){
 const e=state.currentEvent,c=e.choices[i];if(!c)return;
 applyEffects(c.effects);log(`${e.title}: ${c.label}. ${c.desc}`);state.currentEvent=null;saveGame();render();
 if(state.hp<=0)die();
}
function applyEffects(e){for(const [k,v] of Object.entries(e||{})){if(k==="hp")state.hp=Math.min(state.maxHp,state.hp+v);else if(k==="strength")state.strength+=v;else if(k==="vitality"){state.vitality+=v;state.maxHp+=5*v;state.hp+=5*v;}else if(k==="agility")state.agility+=v;else state[k]=(state[k]||0)+v;}}
function chooseCareer(name){
 if(state.career){toast("이미 진로를 선택했어.");return;}
 if(name==="해결사"){state.career=name;state.careerType="fixer";state.careerBonus=5;state.rankIndex=0;}
 else if(name==="기업"){state.company="L사";openModal(`<h3>기업 선택</h3><p>입사할 회사를 선택해.</p>${["L사","W사"].map(x=>btn(x,`company:${x}`)).join("")}`);return;}
 else {state.career=name;state.careerType="finger";state.rankIndex=0;}
 if(name==="약지"){state.heatStyle="";}
 state.pendingCareer=false;log(`${name}의 길을 선택했다.`);closeModal();saveGame();render();showView("daily");
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-action^='company:']");if(b){const company=b.dataset.action.split(":")[1];state.company=company;state.career=company;state.careerType="company";state.rankIndex=0;state.pendingCareer=false;log(`${company}에 입사했다.`);closeModal();render();showView("daily");}});
function openCareerChoice(){
 openModal(`<p class="eyebrow">CAREER SELECTION</p><h3>진로를 선택하라</h3><p class="view-intro">도시에서 어떤 방식으로 살아갈 것인가?</p><div class="choice-list">${["해결사","엄지","검지","중지","약지","소지","기업"].map(n=>`<button class="choice-btn" data-action="career:${n}"><strong>${n}</strong><br><span class="inline-note">${careerDescription(n)}</span></button>`).join("")}</div>`);
 $("modalContent").querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>handleAction(b.dataset.action)));
}
function careerDescription(n){return ({해결사:"의뢰 보상금 +5%",엄지:"의뢰 보상금 +10%, 패배 시 상납금",검지:"매일 지령 수행",중지:"앙갚음 장부와 강화문신",약지:"화풍 선택",소지:"전용 훈련",기업:"L사 또는 W사 입사"})[n];}
function equip(id){const w=data.weapons.find(x=>x.id===id);if(!w)return;state.weapon=id;state.skillSlots=w.skills.slice(0,5);log(`${w.name}을 장착했다.`);render();}
function toggleSlot(id){if(state.skillSlots.includes(id))state.skillSlots=state.skillSlots.filter(x=>x!==id);else if(state.skillSlots.length<5)state.skillSlots.push(id);render();}
function buyWeapon(id){const w=data.weapons.find(x=>x.id===id);if(!w||state.an<w.price)return;state.an-=w.price;equip(id);toast(`${w.name} 구매 완료`);}
function heal(type){const cost=type==="full"?150:60;if(state.an<cost)return;state.an-=cost;state.hp=type==="full"?state.maxHp:Math.min(state.maxHp,state.hp+Math.ceil(state.maxHp*.35));state.stagger=state.maxStagger;log("치료소에서 치료를 받았다.");render();}
function train(stat){if(state.career!=="소지"||state.trainingUsed>=3||state.an<20)return;state.an-=20;state.trainingUsed++;if(stat==="vitality"){state.vitality++;state.maxHp+=5;state.hp+=5;}else state[stat]++;log(`${stat} 훈련을 마쳤다.`);render();}
function startQuest(i){
 const q=state.todayQuests[i];if(!q)return;
 const enemy={name:q.enemy,hp:q.enemyHp,maxHp:q.enemyHp,power:q.enemyPower,stagger:Math.ceil(q.enemyHp*.5),maxStagger:Math.ceil(q.enemyHp*.5),light:3,maxLight:3};
 openBattle(q,enemy);
}
function openBattle(q,enemy){
 let battle={q,enemy,round:1,playerStaggered:false,enemyStaggered:false,log:[]};
 const draw=()=>{
  openModal(`<p class="eyebrow">COMBAT · ROUND ${battle.round}</p><h3>${esc(enemy.name)}</h3>
  <div class="card-grid"><div class="game-card"><h4>${esc(state.name)}</h4><p>생명력 ${state.hp}/${state.maxHp}<br>흐트러짐 ${state.stagger}/${state.maxStagger}<br>빛 ${state.light}/${state.maxLight}</p></div><div class="game-card"><h4>${esc(enemy.name)}</h4><p>생명력 ${enemy.hp}/${enemy.maxHp}<br>흐트러짐 ${enemy.stagger}/${enemy.maxStagger}<br>빛 ${enemy.light}/${enemy.maxLight}</p></div></div>
  <p class="view-intro">스킬을 선택하면 적의 행동과 합을 판정한다. 방어·회피는 빛을 소모하지 않는다.</p>
  <div class="choice-list">${state.skillSlots.map(id=>data.skills.find(s=>s.id===id)).filter(Boolean).map(s=>`<button class="choice-btn" data-battle="${s.id}" ${s.cost>state.light||battle.playerStaggered?"disabled":""}><strong>${s.name}</strong> · ${s.type==="attack"?"공격 "+ "★".repeat(s.stars):s.type==="defend"?"방어":"회피"} · 빛 ${s.cost}<br><span class="inline-note">위력 ${s.power[0]}~${s.power[1]}</span></button>`).join("")}</div>
  <div class="log-box">${battle.log.slice(-7).map(esc).join("<br>")}</div>`);
  $("modalContent").querySelectorAll("[data-battle]").forEach(b=>b.addEventListener("click",()=>turn(data.skills.find(s=>s.id===b.dataset.battle))));
 };
 const turn=skill=>{
  state.light=Math.min(state.maxLight,state.light+1);
  state.light-=skill.cost;
  enemy.light=Math.min(enemy.maxLight,enemy.light+1);
  const enemySkill={type:"attack",power:enemy.power,cost:1};
  let p=roll(skill.power),e=roll(enemySkill.power);
  p+=Math.floor(state.strength/5)+state.hope*3+state.tattoos;
  e+=Math.floor((q.difficulty+1)/2);
  if(skill.type==="attack"){
    if(p>e){let dmg=p; if(battle.enemyStaggered)dmg*=2;enemy.hp-=dmg;enemy.stagger-=dmg;battle.log.push(`${skill.name}: 합 승리, 적에게 ${dmg} 피해.`);}
    else battle.log.push(`${skill.name}: 합 패배.`);
  }else if(skill.type==="defend"){
    const dmg=Math.max(0,e-p);state.hp-=dmg;state.stagger-=dmg;battle.log.push(`방어 판정: ${dmg} 피해를 받았다.`);
  }else{
    if(p>e){state.light=Math.min(state.maxLight,state.light+1);battle.log.push("회피 성공. 피해를 받지 않았다.");}
    else {state.hp-=e;state.stagger-=e;battle.log.push(`회피 실패. ${e} 피해를 받았다.`);}
  }
  if(enemy.hp>0){const incoming=e;if(skill.type==="attack"&&p>e){}else if(skill.type!=="defend"&&skill.type!=="evade"){state.hp-=incoming;state.stagger-=incoming;battle.log.push(`적의 공격으로 ${incoming} 피해.`);} }
  if(enemy.stagger<=0){battle.enemyStaggered=true;enemy.stagger=enemy.maxStagger;battle.log.push("적이 흐트러졌다.");}
  if(state.stagger<=0){battle.playerStaggered=true;state.stagger=state.maxStagger;battle.log.push("캐릭터가 흐트러졌다.");}
  if(enemy.hp<=0){state.hp=Math.max(1,state.hp);questWin(q);return;}
  if(state.hp<=0){
    if(state.inPromotion){state.inPromotion=false;state.hp=1;state.stagger=state.maxStagger;log("승급시험에 패배했다. 응시료는 반환되지 않는다.");closeModal();saveGame();render();toast("승급시험에 불합격했어.");return;}
    if(state.career==="중지")state.revenge.push(enemy.name);die();return;
  }
  if(battle.playerStaggered)battle.playerStaggered=false;
  if(battle.enemyStaggered)battle.enemyStaggered=false;
  battle.round++;if(battle.round%3===0)state.maxLight=Math.min(9,state.maxLight+1);
  draw();renderStats();
 };
 draw();
}
function roll(range){return Math.floor(Math.random()*(range[1]-range[0]+1))+range[0];}
function questWin(q){
 if(state.inPromotion){
   state.rankIndex=(state.rankIndex||0)+1;state.inPromotion=false;
   state.hp=Math.max(1,state.hp);state.stagger=state.maxStagger;
   log(`승급시험에 합격했다. 새로운 계급: ${getRankName()}.`);
   closeModal();saveGame();render();toast(`승급 성공! ${getRankName()}`);return;
 }
 let bonus=state.career==="해결사"?1.05:state.career==="엄지"?1.10:1;
 const an=Math.floor(q.rewardAn*bonus);state.an+=an;state.rep+=q.rewardRep;state.hp=Math.max(1,state.hp);log(`의뢰 성공: ${q.title}. ${an}안과 ${q.rewardRep}평판 획득.`);
 if(state.career==="검지")state.directive=null;
 if(state.career==="중지"&&state.revenge.length){state.tattoos++;state.revenge.shift();}
 closeModal();saveGame();render();toast("의뢰를 성공적으로 마쳤어.");
}
function nextDay(){
 const living=10;state.an=Math.max(0,state.an-living);if(state.birth==="혈귀")state.blood=Math.min(100,state.blood+(state.grade===1?15:state.grade===2?10:6));
 if(state.blood>=60){state.strength=Math.max(1,state.strength-1);state.hp-=5;log("혈기가 높아져 능력과 생명력에 부담이 생겼다.");}
 state.day++;state.trainingUsed=0;state.light=Math.min(state.maxLight,state.light+1);state.todayQuests=generateQuests();state.currentEvent=null;
 if(state.career==="검지")state.directive="오늘 의뢰 1개를 완료한다.";
 log(`하루가 끝났다. 생활비 ${living}안을 지불했다.`);saveGame();render();showView("daily");
}
function promotion(){
 const list=getRankList(),idx=state.rankIndex||0,next=list[idx+1];if(!next||state.rep<next.rep)return;
 const fee=Math.ceil(next.rep*.1);if(state.an<fee){toast(`응시료 ${fee}안이 필요해.`);return;}
 state.an-=fee;
 const enemyHp=50+idx*22,enemy={name:`${next.name} 승급 심사관`,hp:enemyHp,maxHp:enemyHp,power:[3+idx,6+idx*2],stagger:Math.ceil(enemyHp*.5),maxStagger:Math.ceil(enemyHp*.5),light:3,maxLight:3};
 state.inPromotion=true;
 openBattle({title:"승급시험",rewardAn:0,rewardRep:0,difficulty:idx+1},enemy);
}
function die(){
 state.dead=true;saveGame();
 openModal(`<div class="death-panel"><p class="eyebrow">RECORD TERMINATED</p><h2>기록 종료</h2><p>${esc(state.name)}의 생애는 ${state.day}일차에 끝났다.<br>평판 ${fmt(state.rep)} · 최종 소속 ${esc(state.career||"미소속")}<br><br>도시는 멈추지 않는다. 새로운 삶을 시작할 수 있다.</p><button class="primary-btn" id="restartAfterDeath">새로운 삶 시작</button></div>`);
 $("restartAfterDeath").addEventListener("click",()=>{localStorage.removeItem(SAVE_KEY);closeModal();$("gameScreen").classList.add("hidden");$("startScreen").classList.remove("hidden");updateContinueButton();});
}
})();