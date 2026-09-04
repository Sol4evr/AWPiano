(()=>{
'use strict';
const SONG_VALUE='old-macdonald-v110';
const COLORS={C:'#ff6fae',D:'#ff9a5f',E:'#ffd65a',F:'#56d7a3',G:'#4ecde0',A:'#6fa6ff',B:'#a77bff'};
const LI={C:0,D:1,E:2,F:3,G:4,A:5,B:6};
const N=(note,finger=1,beats=1)=>({note,finger,hand:'R',beats});
const notes=[
  N('G4',5),N('G4',5),N('G4',5),N('D4',2),N('E4',3),N('E4',3),N('D4',2,2),
  N('B4',5),N('B4',5),N('A4',5),N('A4',5),N('G4',5,2),
  N('D4',2),N('G4',5),N('G4',5),N('G4',5),N('D4',2),N('E4',3),N('E4',3),N('D4',2,2),
  N('B4',5),N('B4',5),N('A4',5),N('A4',5),N('G4',5,2),
  N('D4',2),N('D4',2),N('G4',5),N('G4',5),N('G4',5),N('D4',2),N('D4',2),N('G4',5),N('G4',5),N('G4',5),
  N('G4',5),N('G4',5),N('G4',5),N('G4',5),N('G4',5),N('G4',5),N('G4',5),N('G4',5),N('G4',5),N('G4',5),
  N('G4',5),N('G4',5),N('G4',5),N('D4',2),N('E4',3),N('E4',3),N('D4',2,2),
  N('B4',5),N('B4',5),N('A4',5),N('A4',5),N('G4',5,2)
];
const song={name:'Old MacDonald Had a Farm',subtitle:'Traditional • full beginner melody • right hand',level:'Beginner',notes};
let active=false,mode='idle',index=0,timer=null,paused=false,audio=null,attempts=0,correct=0;
const $=s=>document.querySelector(s);
const select=$('#songSelect'),sheet=$('#sheetSvg'),viewport=$('#sheetViewport'),track=$('#sheetTrack'),keyboard=$('#keyboard');
if(!select||!sheet||!viewport||!keyboard)return;

document.querySelectorAll('.hand .finger').forEach((f,i)=>f.dataset.finger=String(i+1));

function tempo(){return Math.max(55,Math.min(125,Number($('#tempo')?.value)||82));}
function midi(note){const semi={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};const m=note.match(/^([A-G]#?)(\d)$/);return 12*(+m[2]+1)+semi[m[1]];}
function tone(note,beats=1){try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime,dur=Math.max(.16,60/tempo()*beats*.82);o.type='triangle';o.frequency.value=440*Math.pow(2,(midi(note)-69)/12);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.13,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g).connect(audio.destination);o.start(now);o.stop(now+dur+.03);}catch(e){}}
function diatonic(note){const m=note.match(/^([A-G])#?(\d)$/);return +m[2]*7+LI[m[1]];}
function yFor(note){return 128-(diatonic(note)-diatonic('C4'))*8;}
function renderSheet(){
  const spacing=68,start=110,w=Math.max(viewport.clientWidth||900,start+notes.length*spacing+180),h=230;
  sheet.setAttribute('viewBox',`0 0 ${w} ${h}`);sheet.setAttribute('width',w);sheet.setAttribute('height',h);
  let s='';[62,78,94,110,126].forEach(y=>s+=`<line class="staff-line" x1="32" y1="${y}" x2="${w-20}" y2="${y}"/>`);s+=`<text class="clef" x="42" y="111">𝄞</text>`;
  notes.forEach((it,i)=>{const x=start+i*spacing,y=yFor(it.note),state=i<index?'played':i===index&&mode!=='idle'?'current':'upcoming';if(i%4===0&&i>0)s+=`<line class="bar-line" x1="${x-34}" y1="62" x2="${x-34}" y2="126"/>`;if(y>132)s+=`<line class="ledger" x1="${x-15}" y1="142" x2="${x+15}" y2="142"/>`;if(y<58)s+=`<line class="ledger" x1="${x-15}" y1="46" x2="${x+15}" y2="46"/>`;if(state==='current')s+=`<circle class="current-halo" cx="${x}" cy="${y}" r="22"/>`;if(state==='played')s+=`<circle class="played-ring" cx="${x}" cy="${y}" r="17"/>`;const cls=state==='played'?'note-played':state==='current'?'note-current':'note-upcoming';s+=`<ellipse data-i="${i}" class="${cls}" cx="${x}" cy="${y}" rx="11" ry="8" transform="rotate(-18 ${x} ${y})" fill="${COLORS[it.note[0]]}"/>`;s+=`<line class="stem" x1="${x+8}" y1="${y}" x2="${x+8}" y2="${y-34}"/>`;s+=`<circle class="finger-badge-svg" cx="${x}" cy="${y-48}" r="10"/><text class="finger-text-svg" x="${x}" y="${y-44}" text-anchor="middle">${it.finger}</text>`;s+=`<text class="note-name-svg" x="${x}" y="190" text-anchor="middle">${it.note.replace(/\d/,'')}</text>`;});
  sheet.innerHTML=s;
}
function updateUI(){
  $('#songTitle').textContent=song.name;$('#songSubtitle').textContent=song.subtitle;
  $('#progressText').textContent=`${Math.min(index,notes.length)} / ${notes.length}`;
  $('#progressFill').style.width=`${notes.length?Math.min(100,index/notes.length*100):0}%`;
  $('#feedback').textContent=mode==='practice'?'Play the highlighted key with the shown finger.':'Old MacDonald is ready — press Watch Song or Start Practice.';
  const a=attempts?Math.round(correct/attempts*100):0;$('#scoreNum')&&( $('#scoreNum').textContent=String(correct*100));$('#accuracy')&&( $('#accuracy').textContent=attempts?`${a}%`:'—');
  renderSheet();
}
function pulseKey(note){keyboard.querySelectorAll('.active').forEach(k=>k.classList.remove('active'));const k=keyboard.querySelector(`[data-note="${CSS.escape(note)}"]`);if(!k)return;k.classList.remove('keypulse');void k.offsetWidth;k.classList.add('active','keypulse');setTimeout(()=>k.classList.remove('keypulse','active'),220);}
function showHand(it){
  const h=$('#rightHand'),other=$('#leftHand');if(!h)return;other?.classList.add('dim');h.classList.remove('dim','press');h.querySelectorAll('.finger').forEach(f=>f.classList.remove('active'));
  const f=h.querySelector(`.f${it.finger}`);if(f){f.classList.add('active');f.style.setProperty('--r',[-42,-10,-2,8,18][it.finger-1]+'deg');}
  const key=keyboard.querySelector(`[data-note="${CSS.escape(it.note)}"]`),stage=$('.hands-stage');if(key&&stage){const kr=key.getBoundingClientRect(),br=keyboard.getBoundingClientRect(),ratio=(kr.left+kr.width/2-br.left)/Math.max(1,br.width),usable=Math.max(0,br.width-178),left=Math.max(0,Math.min(usable,ratio*br.width-89));h.style.left=`${left}px`;}
  void h.offsetWidth;h.classList.add('press');
}
function playCurrent(){if(index>=notes.length){finish();return;}const it=notes[index];renderSheet();pulseKey(it.note);showHand(it);tone(it.note,it.beats);$('#feedback').textContent=`${it.note.replace(/\d/,'')} • finger ${it.finger}`;const delay=Math.max(150,(60000/tempo())*it.beats);timer=setTimeout(()=>{if(paused)return;index++;updateUI();playCurrent();},delay);}
function startWatch(){clearTimeout(timer);mode='watch';paused=false;index=0;attempts=0;correct=0;$('#pauseBtn').disabled=false;updateUI();playCurrent();}
function startPractice(){clearTimeout(timer);mode='practice';paused=false;index=0;attempts=0;correct=0;$('#pauseBtn').disabled=true;updateUI();const it=notes[index];pulseKey(it.note);showHand(it);}
function finish(){clearTimeout(timer);mode='idle';paused=false;index=notes.length;updateUI();$('#feedback').textContent='Song complete! Great playing 🎉';$('#pauseBtn').disabled=true;}
function reset(){clearTimeout(timer);mode='idle';paused=false;index=0;attempts=0;correct=0;keyboard.querySelectorAll('.active').forEach(k=>k.classList.remove('active'));updateUI();$('#pauseBtn').disabled=true;}
function practicePress(note){if(mode!=='practice'||index>=notes.length)return;attempts++;const it=notes[index];if(note===it.note){correct++;tone(note,it.beats);pulseKey(note);showHand(it);index++;if(index>=notes.length){finish();return;}updateUI();const next=notes[index];pulseKey(next.note);showHand(next);}else{$('#feedback').textContent=`Try again — play ${it.note.replace(/\d/,'')} with finger ${it.finger}`;updateUI();}}
function addSongUI(){
  if(!select.querySelector(`option[value="${SONG_VALUE}"]`)){const o=document.createElement('option');o.value=SONG_VALUE;o.textContent=song.name;select.appendChild(o);}
  const list=$('#songList');if(list&&!list.querySelector('[data-v110-oldmac]')){const b=document.createElement('button');b.type='button';b.className='song-item';b.dataset.v110Oldmac='1';b.innerHTML='<span class="song-icon">🚜</span><span><b>Old MacDonald Had a Farm</b><small>Traditional beginner melody</small></span><span class="level">Beginner</span>';b.addEventListener('click',()=>{select.value=SONG_VALUE;select.dispatchEvent(new Event('change',{bubbles:true}));});list.appendChild(b);}
}

document.addEventListener('change',e=>{if(e.target!==select)return;if(select.value===SONG_VALUE){e.stopImmediatePropagation();active=true;mode='idle';index=0;document.querySelectorAll('.song-item').forEach(x=>x.classList.toggle('active',x.dataset.v110Oldmac==='1'));updateUI();}else if(active){active=false;clearTimeout(timer);document.querySelector('[data-v110-oldmac]')?.classList.remove('active');}},true);
document.addEventListener('click',e=>{if(!active)return;const id=e.target?.id;if(!['watchBtn','practiceBtn','pauseBtn','resetBtn'].includes(id))return;e.preventDefault();e.stopImmediatePropagation();if(id==='watchBtn')startWatch();else if(id==='practiceBtn')startPractice();else if(id==='resetBtn')reset();else if(id==='pauseBtn'&&mode==='watch'){paused=!paused;clearTimeout(timer);e.target.textContent=paused?'▶ Resume':'⏸ Pause';if(!paused)playCurrent();}},true);
document.addEventListener('pointerdown',e=>{if(!active||mode!=='practice')return;const k=e.target.closest?.('[data-note]');if(!k)return;e.preventDefault();e.stopImmediatePropagation();practicePress(k.dataset.note);},true);
addSongUI();
})();
