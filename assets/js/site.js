// progress, active chapters and staged reveal
const progress=document.getElementById('progress');
const heroBg=document.querySelector('.hero-bg');
const chapters=[...document.querySelectorAll('.chapter')];
const navLinks=[...document.querySelectorAll('.side-nav a')];
const chapterPill=document.getElementById('chapterPill');
chapters.forEach((c,i)=>{c.dataset.index=String(i+1).padStart(2,'0')});
navLinks.forEach(a=>{a.dataset.label=a.title||'Chapter'});
document.querySelectorAll('.chapter').forEach(ch=>{[...ch.querySelectorAll('.reveal')].forEach((el,i)=>el.style.setProperty('--delay',Math.min(i%5,4)*70+'ms'))});
let ticking=false;
function onScroll(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h?scrollY/h*100:0)+'%';if(heroBg&&scrollY<innerHeight*1.25)heroBg.style.transform=`scale(1.06) translate3d(0,${scrollY*.12}px,0)`;ticking=false})}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.05});document.querySelectorAll('.reveal').forEach(x=>io.observe(x));}else{document.querySelectorAll('.reveal').forEach(x=>x.classList.add('on'));}
const chapterIO=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;chapters.forEach(c=>c.classList.remove('active-chapter'));e.target.classList.add('active-chapter','chapter-enter');setTimeout(()=>e.target.classList.remove('chapter-enter'),850);const id=e.target.id;const link=navLinks.find(a=>a.getAttribute('href')==='#'+id);navLinks.forEach(a=>a.classList.toggle('active',a===link));const k=e.target.querySelector('.kicker');chapterPill.textContent=k?k.textContent.replace(/•/g,'·'):'Japan Under the Shoguns'}), {rootMargin:'-42% 0px -48% 0px',threshold:0});chapters.forEach(c=>chapterIO.observe(c));
// lightbox
const lb=document.getElementById('lightbox'),lbi=document.getElementById('lightboxImg');document.querySelectorAll('img.zoom').forEach(i=>i.addEventListener('dblclick',()=>{lbi.src=i.src;lb.classList.add('open')}));function closeLightbox(){lb.classList.remove('open')}lb.addEventListener('click',e=>{if(e.target===lb)closeLightbox()});

// richer photo/lightbox interaction
[...document.querySelectorAll('.photo > img.zoom')].forEach(i=>{i.title='Click to enlarge';i.addEventListener('click',()=>{lbi.src=i.src;lb.classList.add('open')})});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLightbox();factPopover.classList.remove('open')}});


// islands
function bump(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}document.querySelectorAll('.island').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.island').forEach(x=>x.classList.remove('active'));b.classList.add('active');const d=document.getElementById('islandDrawer');d.innerHTML='<b>'+b.querySelector('strong').textContent+':</b> '+b.dataset.info;bump(d)}));


// photo tile reveals
document.querySelectorAll('.photo-tile').forEach(t=>t.addEventListener('click',()=>t.classList.toggle('open')));
// hierarchy
document.querySelectorAll('.rank').forEach(r=>r.addEventListener('click',()=>{document.querySelectorAll('.rank').forEach(x=>x.classList.remove('active'));r.classList.add('active');const d=document.getElementById('rankDrawer');d.textContent=r.dataset.text;bump(d)}));
// hotspots
const factPopover=document.getElementById('factPopover'),factPopoverText=document.getElementById('factPopoverText');let factTimer;
function showFact(text){factPopoverText.textContent=text;factPopover.classList.add('open');clearTimeout(factTimer);factTimer=setTimeout(()=>factPopover.classList.remove('open'),8500)}
factPopover.querySelector('button').addEventListener('click',()=>factPopover.classList.remove('open'));
document.querySelectorAll('.hotspot').forEach(h=>h.addEventListener('click',e=>{e.stopPropagation();showFact(h.dataset.hot)}));
// timeline
let timeline=[];document.querySelectorAll('#timelineBtns button').forEach(b=>b.addEventListener('click',()=>{b.classList.add('used');timeline.push({o:+b.dataset.order,t:b.textContent});renderTimeline()}));function renderTimeline(){document.getElementById('timelineOutput').innerHTML=timeline.map(x=>'<span>'+x.t+'</span>').join('')}function checkTimeline(){const f=document.getElementById('timelineFeedback');if(timeline.length<6){f.textContent='Add all six periods first.';return}f.textContent=timeline.every((x,i)=>x.o===i+1)?'Correct — your chronology is in order.':'Not yet. Reset and try again from the earliest period.'}function resetTimeline(){timeline=[];document.querySelectorAll('#timelineBtns button').forEach(b=>b.classList.remove('used'));renderTimeline();document.getElementById('timelineFeedback').textContent=''}
// role scenarios
const roleText={samurai:'You serve a daimyo. In wartime you train as a warrior; in long periods of peace you may also work as an administrator. Loyalty, education and status shape your life.',peasant:'You produce food on land controlled by the warrior elite. Your work is essential, but taxes and crop failure can make life difficult.',artisan:'You make specialised goods — pottery, tools, paper, cloth or swords — that farmers and warrior households cannot easily make themselves.',merchant:'Your formal social status is low because you do not produce food or goods, yet trade and lending can make you wealthy in growing towns.'};document.querySelectorAll('.role').forEach(r=>r.addEventListener('click',()=>{document.querySelectorAll('.role').forEach(x=>x.classList.remove('active'));r.classList.add('active');const d=document.getElementById('roleDrawer');d.innerHTML='<b>'+r.querySelector('h3').textContent+':</b> '+roleText[r.dataset.role];bump(d)}));
// flash cards
document.querySelectorAll('.flash').forEach(f=>f.addEventListener('click',()=>f.classList.toggle('flipped')));
// policies
document.querySelectorAll('.policy').forEach(p=>p.addEventListener('click',()=>{const d=document.getElementById('policyResult');d.innerHTML='<b>Effect:</b> '+p.dataset.policy;bump(d)}));
// myths
document.querySelectorAll('.myth button').forEach(b=>b.addEventListener('click',()=>{const truth=b.dataset.myth==='true',box=b.parentElement.querySelector('.result');box.textContent=truth?'FACT — this is supported by the historical information above.':'MYTH — restrictions were severe, but controlled outside contact continued.';b.disabled=true}));
// scoring
let score=0,answered=new Set();const quizzes=[...document.querySelectorAll('.quiz-card')];function updateScore(){const total=quizzes.length;document.getElementById('scorePill').textContent=`${score} / ${total} correct`;document.getElementById('finalScore').textContent=`${score} / ${total}`;document.getElementById('scoreFill').style.width=(total?score/total*100:0)+'%';if(answered.size===total){const title=document.getElementById('finishTitle'),txt=document.getElementById('finishText'),pct=score/total;if(pct>=.88){title.textContent='Shogun-level mastery';txt.textContent='Excellent. You connected chronology, political control, society, culture and change across the whole unit.'}else if(pct>=.7){title.textContent='Strong historian';txt.textContent='You have a solid understanding. Revisit the questions you missed and use the explanations to strengthen detail.'}else if(pct>=.5){title.textContent='Developing historian';txt.textContent='You know the core story, but some details are mixed. Revisit the chapters with the most red answers.'}else{title.textContent='Return to the journey';txt.textContent='Use the photo clues, vocabulary cards and chapter explanations, then reset and try again.'}}}
quizzes.forEach((q,qi)=>{q.querySelectorAll('.option').forEach((o,oi)=>o.addEventListener('click',()=>{if(answered.has(qi))return;answered.add(qi);const correct=+q.dataset.answer;const opts=[...q.querySelectorAll('.option')];opts.forEach((b,i)=>{b.disabled=true;if(i===correct)b.classList.add('correct')});const fb=q.querySelector('.feedback'),ex=q.querySelector('.explain')?.textContent||'';if(oi===correct){score++;q.dataset.state='correct';fb.textContent='Correct. '+ex}else{q.dataset.state='wrong';o.classList.add('wrong');fb.textContent='Not quite. '+ex}updateScore()}))});updateScore();

// subtle depth on interactive panels (desktop only)
if(matchMedia('(hover:hover) and (pointer:fine)').matches){document.querySelectorAll('.photo').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`translateY(-6px) perspective(1000px) rotateX(${(-y*1.4).toFixed(2)}deg) rotateY(${(x*1.4).toFixed(2)}deg)`});card.addEventListener('pointerleave',()=>card.style.transform='')})}

// ambient sound using WebAudio only
let audioCtx=null,osc=null,gain=null,sound=false;function toggleSound(){const btn=document.getElementById('soundBtn');if(!sound){audioCtx=new (window.AudioContext||window.webkitAudioContext)();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=174;gain.gain.value=.018;osc.connect(gain);gain.connect(audioCtx.destination);osc.start();sound=true;btn.textContent='Sound: on'}else{try{osc.stop()}catch(e){}sound=false;btn.textContent='Sound: off'}}
function resetAll(){score=0;answered.clear();quizzes.forEach(q=>{delete q.dataset.state;q.querySelectorAll('.option').forEach(b=>{b.disabled=false;b.classList.remove('correct','wrong')});q.querySelector('.feedback').textContent=''});document.querySelectorAll('.island,.rank,.role').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.flash').forEach(x=>x.classList.remove('flipped'));document.querySelectorAll('.myth button').forEach(b=>b.disabled=false);document.querySelectorAll('.myth .result').forEach(r=>r.textContent='');document.getElementById('islandDrawer').innerHTML='<b>Tap an island.</b> A geography clue will appear here.';document.getElementById('rankDrawer').innerHTML='<b>Tap a rank.</b>';document.getElementById('roleDrawer').innerHTML='<b>Tap a social group.</b> You will receive a role scenario.';document.getElementById('policyResult').innerHTML='<b>Select a policy.</b>';document.getElementById('finishTitle').textContent='Complete the quizzes to unlock your result.';document.getElementById('finishText').textContent='Correct answers add to your live score. Wrong answers reveal the correct option and an explanation.';resetTimeline();updateScore();window.scrollTo({top:0,behavior:'smooth'})}



    function revealAll(){document.querySelectorAll('.reveal').forEach(function(el){el.style.opacity='1';el.style.transform='none';el.style.filter='none';el.style.visibility='visible';});}
    window.addEventListener('error',revealAll);
    document.addEventListener('DOMContentLoaded',revealAll);
    setTimeout(revealAll,500);
