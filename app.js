const services = [
  { id:'manikur', name:'Manikür', min:800, max:960, duration:45, desc:'Tırnak şekillendirme, kütikül bakımı ve temiz bitiş.', icon:'M' },
  { id:'pedikur', name:'Pedikür', min:900, max:1080, duration:60, desc:'Ayak ve tırnak bakımı, şekillendirme ve özenli bakım.', icon:'P' },
  { id:'kalici-el', name:'Kalıcı Oje · El', min:1600, max:1920, duration:75, desc:'Uzun süre kalıcı, parlak ve düzenli görünüm.', icon:'K' },
  { id:'kalici-ayak', name:'Kalıcı Oje · Ayak', min:1700, max:2040, duration:75, desc:'Pedikür estetiğini kalıcı oje bitişiyle tamamlar.', icon:'A' },
  { id:'jel', name:'Jel Güçlendirme', min:1900, max:2280, duration:90, desc:'Doğal tırnağı destekleyen daha güçlü ve pürüzsüz form.', icon:'J' },
  { id:'protez', name:'Protez Tırnak', min:2500, max:3000, duration:120, desc:'Uzunluk ve formu yeniden tasarlayan premium uygulama.', icon:'O' },
  { id:'kalici-cikarma', name:'Kalıcı Oje Çıkarma', min:300, max:360, duration:30, desc:'Mevcut kalıcı ojenin kontrollü ve özenli şekilde çıkarılması.', icon:'Ç' },
  { id:'protez-cikarma', name:'Protez Tırnak Çıkartma', min:400, max:480, duration:45, desc:'Protez uygulamasının kontrollü şekilde sökülmesi.', icon:'X' },
  { id:'nail-art', name:'Nail Art', min:null, max:null, duration:30, desc:'Minimal çizgilerden özgün tasarımlara kişiselleştirilmiş dokunuş.', icon:'✦' }
];

const state = { selectedServices: new Set(), date: null, time: null, availability: null, availabilityRequest: 0 };
const TRY_PHONE = '905453143741';
const trDays = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
const trMonths = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const serviceGrid = document.getElementById('serviceGrid');
const bookingServices = document.getElementById('bookingServices');
const dateScroller = document.getElementById('dateScroller');
const timeGrid = document.getElementById('timeGrid');
const selectedDateLabel = document.getElementById('selectedDateLabel');

function money(n){ return new Intl.NumberFormat('tr-TR').format(n) + ' TL'; }
function servicePrice(s){ return s.min == null ? 'Tasarım bazlı' : `${money(s.min)} – ${money(s.max)}`; }

function renderServices(){
  serviceGrid.innerHTML = services.map((s,i)=>`
    <article class="service-card reveal" data-service-card="${s.id}">
      <span class="service-number">0${i+1}</span>
      <span class="service-icon">${s.icon}</span>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
      <div class="service-foot">
        <div class="service-price"><small>TAHMİNİ FİYAT</small><strong>${servicePrice(s)}</strong></div>
        <button class="service-select" data-add-service="${s.id}" aria-label="${s.name} seç">+</button>
      </div>
    </article>`).join('');

  bookingServices.innerHTML = services.map(s=>`
    <button class="booking-service" type="button" data-booking-service="${s.id}">
      <span class="check">✓</span>
      <span class="s-copy"><strong>${s.name}</strong><small>${servicePrice(s)} · ~${s.duration} dk</small></span>
    </button>`).join('');

  document.querySelectorAll('[data-add-service]').forEach(btn=>btn.addEventListener('click',()=>{
    toggleService(btn.dataset.addService); document.querySelector('#booking').scrollIntoView({behavior:'smooth'});
  }));
  document.querySelectorAll('[data-booking-service]').forEach(btn=>btn.addEventListener('click',()=>toggleService(btn.dataset.bookingService)));
}

function toggleService(id){
  if(state.selectedServices.has(id)) state.selectedServices.delete(id); else state.selectedServices.add(id);
  document.querySelectorAll(`[data-service-card="${id}"]`).forEach(el=>el.classList.toggle('selected',state.selectedServices.has(id)));
  document.querySelectorAll(`[data-booking-service="${id}"]`).forEach(el=>{
    const selected=state.selectedServices.has(id);
    el.classList.toggle('selected',selected);
    el.setAttribute('aria-pressed',String(selected));
  });
  document.querySelectorAll(`[data-add-service="${id}"]`).forEach(el=>el.setAttribute('aria-pressed',String(state.selectedServices.has(id))));
  updateSummary();
  renderTimes();
}

function selectedServiceObjects(){ return services.filter(s=>state.selectedServices.has(s.id)); }
function totalDuration(){ return selectedServiceObjects().reduce((a,s)=>a+s.duration,0); }

function updateSummary(){
  const selected=selectedServiceObjects();
  document.getElementById('summaryServices').textContent = selected.length ? selected.map(s=>s.name).join(', ') : 'Henüz hizmet seçilmedi';
  document.getElementById('summaryDate').textContent = state.date ? formatLongDate(state.date) : '—';
  document.getElementById('summaryTime').textContent = state.time || '—';
  document.getElementById('summaryDuration').textContent = selected.length ? `~${totalDuration()} dk` : '—';
  const priced=selected.filter(s=>s.min!=null);
  const min=priced.reduce((a,s)=>a+s.min,0), max=priced.reduce((a,s)=>a+s.max,0);
  document.getElementById('summaryPrice').textContent = priced.length ? `${money(min)} – ${money(max)}${selected.some(s=>s.min==null)?' + Nail Art':''}` : (selected.length?'Tasarım bazlı':'—');
}

function dateKey(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function parseDateKey(k){ const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); }
function formatLongDate(k){ const d=parseDateKey(k); return `${d.getDate()} ${trMonths[d.getMonth()]} ${d.getFullYear()}`; }

function renderDates(){
  const items=[]; let d=new Date(); d.setHours(0,0,0,0); let guard=0;
  while(items.length<10 && guard<20){
    if(d.getDay()!==0) items.push(new Date(d));
    d.setDate(d.getDate()+1); guard++;
  }
  const todayKey=dateKey(new Date());
  dateScroller.innerHTML=items.map(d=>`
    <button class="date-card ${state.date===dateKey(d)?'active':''}" data-date="${dateKey(d)}">
      <small>${dateKey(d)===todayKey?'Bugün':trDays[d.getDay()]}</small><strong>${d.getDate()}</strong><span>${trMonths[d.getMonth()]}</span>
    </button>`).join('');
  dateScroller.querySelectorAll('.date-card').forEach(b=>b.addEventListener('click',()=>{
    state.date=b.dataset.date; state.time=null; state.availability=null; renderDates(); renderTimes(); updateSummary();
  }));
}

function minutes(t){ const [h,m]=t.split(':').map(Number); return h*60+m; }
function timeFromMinutes(m){ return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }
function overlaps(startA,durA,startB,durB){ const a1=minutes(startA),a2=a1+durA,b1=minutes(startB),b2=b1+durB; return a1<b2 && b1<a2; }

async function renderTimes(){
  if(!state.date){ timeGrid.innerHTML='<div class="empty-slots">Önce bir tarih seçin.</div>'; selectedDateLabel.textContent='Tarih seçin'; return; }
  selectedDateLabel.textContent=formatLongDate(state.date);
  const requestedDate=state.date;
  if(!state.availability || state.availability.date!==requestedDate){
    const requestId=++state.availabilityRequest;
    timeGrid.innerHTML='<div class="empty-slots">Uygun saatler kontrol ediliyor…</div>';
    try{
      const response=await fetch(`/api/availability?date=${encodeURIComponent(requestedDate)}`,{headers:{Accept:'application/json'},cache:'no-store'});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||'Uygun saatler alınamadı.');
      if(requestId!==state.availabilityRequest || requestedDate!==state.date) return;
      state.availability={date:requestedDate,...data};
    }catch(error){
      if(requestId!==state.availabilityRequest) return;
      timeGrid.innerHTML='<div class="empty-slots">Saatler yüklenemedi. Lütfen tekrar deneyin.</div>';
      toast(error.message||'Bağlantı hatası.');
      return;
    }
  }
  const dur=Math.max(totalDuration(),30);
  const busy=(state.availability.busySlots||[]).map(time=>({time,duration:30}));
  const isToday=state.date===state.availability.currentDate;
  const currentMinutes=minutes(state.availability.currentTime||'00:00');
  let slots=[];
  for(let m=10*60;m<=19*60;m+=30){
    const t=timeFromMinutes(m); const ends=m+dur<=20*60; const future=!isToday||m>currentMinutes; const available=ends&&future&&!busy.some(b=>overlaps(t,dur,b.time,b.duration));
    slots.push({t,available});
  }
  if(state.time && !slots.some(slot=>slot.t===state.time&&slot.available)){
    state.time=null;
    updateSummary();
  }
  timeGrid.innerHTML=slots.map(s=>`<button class="time-slot ${state.time===s.t?'active':''} ${s.available?'':'unavailable'}" data-time="${s.t}" ${s.available?'':'disabled'}>${s.t}</button>`).join('');
  timeGrid.querySelectorAll('[data-time]:not([disabled])').forEach(b=>b.addEventListener('click',()=>{state.time=b.dataset.time;renderTimes();updateSummary()}));
}

function goStep(n){
  if(n===2 && !state.selectedServices.size){ toast('Devam etmek için en az bir hizmet seçmelisin.'); return; }
  if(n===3 && (!state.date || !state.time)){ toast('Devam etmek için tarih ve saat seçmelisin.'); return; }
  document.querySelectorAll('.booking-panel').forEach(p=>p.classList.toggle('active',Number(p.dataset.panel)===n));
  document.querySelectorAll('.step').forEach(s=>{
    const active=Number(s.dataset.step)===n;
    s.classList.toggle('active',active);
    if(active)s.setAttribute('aria-current','step');else s.removeAttribute('aria-current');
  });
  document.querySelector('.booking-card').scrollIntoView({behavior:'smooth',block:'center'});
}

document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>goStep(Number(b.dataset.next))));
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>goStep(Number(b.dataset.back))));
document.querySelectorAll('.step').forEach(b=>b.addEventListener('click',()=>{
  const n=Number(b.dataset.step); if(n===1) goStep(1); if(n===2) goStep(2); if(n===3) goStep(3);
}));

function toast(message){ const el=document.getElementById('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2600); }

const bookingForm=document.getElementById('bookingForm');
bookingForm.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!state.selectedServices.size || !state.date || !state.time){ toast('Randevu bilgileri eksik.'); return; }
  const selected=selectedServiceObjects();
  const customer={name:document.getElementById('customerName').value.trim(),phone:document.getElementById('customerPhone').value.trim(),note:document.getElementById('customerNote').value.trim()};
  const submitButton=bookingForm.querySelector('[type="submit"]');
  submitButton.disabled=true; submitButton.setAttribute('aria-busy','true');
  let booking;
  try{
    const response=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({date:state.date,time:state.time,serviceIds:selected.map(s=>s.id),customer})});
    const data=await response.json();
    if(!response.ok){
      if(response.status===409){state.time=null;state.availability=null;updateSummary();renderTimes();}
      throw new Error(data.error||'Randevu oluşturulamadı.');
    }
    booking=data.booking;
  }catch(error){
    toast(error.message||'Bağlantı hatası.');
    return;
  }finally{
    submitButton.disabled=false; submitButton.removeAttribute('aria-busy');
  }

  const priced=selected.filter(s=>s.min!=null); const min=priced.reduce((a,s)=>a+s.min,0), max=priced.reduce((a,s)=>a+s.max,0);
  document.getElementById('modalSummary').innerHTML=`<strong>${booking.services.join(', ')}</strong><br>${formatLongDate(booking.date)} · ${booking.time}<br>Yaklaşık ${booking.duration} dk · ${priced.length?`${money(min)} – ${money(max)}`:'Fiyat görüşülecek'}<br>Randevu kodu: ${booking.id}`;
  const msg=`Merhaba Onyx Nail Studio, yeni randevu talebi oluşturmak istiyorum.%0A%0AAd Soyad: ${encodeURIComponent(customer.name)}%0ATelefon: ${encodeURIComponent(customer.phone)}%0AHizmetler: ${encodeURIComponent(booking.services.join(', '))}%0ATarih: ${encodeURIComponent(formatLongDate(booking.date))}%0ASaat: ${encodeURIComponent(booking.time)}%0ARandevu Kodu: ${encodeURIComponent(booking.id)}${customer.note?`%0ANot: ${encodeURIComponent(customer.note)}`:''}`;
  document.getElementById('whatsappConfirm').href=`https://wa.me/${TRY_PHONE}?text=${msg}`;
  state.availability=null;
  openModal(); renderTimes();
});

let modalTrigger=null;
function setPageInert(value){document.querySelectorAll('header,main,footer').forEach(el=>{el.inert=value})}
function openModal(){const m=document.getElementById('successModal');modalTrigger=document.activeElement;m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setPageInert(true);m.querySelector('.modal-close').focus()}
function closeModal(){const m=document.getElementById('successModal');if(!m.classList.contains('open'))return;m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');setPageInert(false);if(modalTrigger&&modalTrigger.focus)modalTrigger.focus()}
document.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{
  const modal=document.getElementById('successModal');
  if(e.key==='Escape')closeModal();
  if(e.key==='Tab'&&modal.classList.contains('open')){
    const focusable=[...modal.querySelectorAll('a[href],button:not([disabled]),input,textarea')];
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});

const mobileBtn=document.getElementById('mobileMenuBtn'), mobileMenu=document.getElementById('mobileMenu');
mobileBtn.addEventListener('click',()=>{const open=mobileMenu.hasAttribute('hidden'); if(open) mobileMenu.removeAttribute('hidden'); else mobileMenu.setAttribute('hidden',''); mobileBtn.setAttribute('aria-expanded',open?'true':'false');mobileBtn.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç')});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.setAttribute('hidden','');mobileBtn.setAttribute('aria-expanded','false');mobileBtn.setAttribute('aria-label','Menüyü aç')}));

document.getElementById('brandLogo').addEventListener('error',e=>{e.currentTarget.style.display='none'});
document.getElementById('year').textContent=new Date().getFullYear();

const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target)}}),{threshold:.08});
function observe(){document.querySelectorAll('.reveal:not(.visible)').forEach(el=>io.observe(el))}

renderServices(); renderDates(); renderTimes(); updateSummary(); observe();

function initCinematicHero(){
  const section=document.getElementById('cinematicHero');
  const video=document.getElementById('cinematicVideo');
  const loading=document.getElementById('cinematicLoading');
  if(!section||!video) return;
  const brand=section.querySelector('[data-cinematic-brand]');
  const detail=section.querySelector('.cinematic-detail');
  const signature=section.querySelector('.cinematic-signature');
  const final=section.querySelector('.cinematic-final');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let duration=0, targetTime=0, frameId=0;

  function showReady(){
    video.classList.add('is-ready');
    loading.classList.add('is-hidden');
  }
  function updateFrame(){
    frameId=0;
    if(!duration||reduced.matches) return;
    const bounds=section.getBoundingClientRect();
    if(bounds.bottom<0||bounds.top>window.innerHeight){return;}
    const travel=Math.max(section.offsetHeight-window.innerHeight,1);
    const progress=Math.min(1,Math.max(0,-bounds.top/travel));
    targetTime=progress*duration;
    video.currentTime += (targetTime-video.currentTime)*.2;
    animateCopy(progress);
    if(Math.abs(targetTime-video.currentTime)>.015) frameId=requestAnimationFrame(updateFrame);
  }
  function animateCopy(progress){
    const fade=(start,end)=>Math.min(1,Math.max(0,(progress-start)/(end-start)));
    const visibility=(start,end)=>{
      const fadeInEnd=start+.06, fadeOutStart=end-.06;
      if(progress<start||progress>end) return 0;
      if(progress<fadeInEnd) return fade(start,fadeInEnd);
      if(progress>fadeOutStart) return 1-fade(fadeOutStart,end);
      return 1;
    };
    const set=(element,opacity,y)=>{element.style.opacity=opacity;element.style.transform=`translateY(${y}px) scale(${.98+opacity*.02})`};
    set(brand,visibility(.1,.25),28-visibility(.1,.25)*28);
    set(detail,visibility(.3,.52),30-visibility(.3,.52)*30);
    set(signature,visibility(.57,.8),30-visibility(.57,.8)*30);
    const finalVisibility=visibility(.86,1);
    set(final,finalVisibility,22-finalVisibility*22);
  }
  function onScroll(){
    if(!reduced.matches){
      const bounds=section.getBoundingClientRect();
      const travel=Math.max(section.offsetHeight-window.innerHeight,1);
      const progress=Math.min(1,Math.max(0,-bounds.top/travel));
      targetTime=progress*duration;
      animateCopy(progress);
      if(duration&&!frameId) frameId=requestAnimationFrame(updateFrame);
    }
  }
  function ready(){
    duration=video.duration;
    if(!Number.isFinite(duration)||duration<=0) return;
    showReady();
    if(reduced.matches){video.currentTime=0;animateCopy(1);return;}
    requestAnimationFrame(updateFrame);
  }
  video.addEventListener('loadedmetadata',ready,{once:true});
  video.addEventListener('error',()=>{loading.querySelector('span:last-child').textContent='Video yüklenemedi';video.classList.add('is-ready')},{once:true});
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  if(video.readyState>=1) ready();
}

initCinematicHero();
