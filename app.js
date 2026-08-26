const BOOKING_URL = 'https://www.kolayrandevu.com/isletme/onyx-nail-studio?website=1';

const services = [
  { id: 'manikur', name: 'Manikür', desc: 'Tırnak şekillendirme, kütikül bakımı ve temiz bitiş.', icon: 'M' },
  { id: 'pedikur', name: 'Pedikür', desc: 'Ayak ve tırnak bakımı, şekillendirme ve özenli bakım.', icon: 'P' },
  { id: 'kalici-el', name: 'Kalıcı Oje · El', desc: 'Uzun süre kalıcı, parlak ve düzenli görünüm.', icon: 'K' },
  { id: 'kalici-ayak', name: 'Kalıcı Oje · Ayak', desc: 'Pedikür estetiğini kalıcı oje bitişiyle tamamlar.', icon: 'A' },
  { id: 'jel', name: 'Jel Güçlendirme', desc: 'Doğal tırnağı destekleyen daha güçlü ve pürüzsüz form.', icon: 'J' },
  { id: 'protez', name: 'Protez Tırnak', desc: 'Uzunluk ve formu yeniden tasarlayan premium uygulama.', icon: 'O' },
  { id: 'kalici-cikarma', name: 'Kalıcı Oje Çıkarma', desc: 'Mevcut kalıcı ojenin kontrollü ve özenli şekilde çıkarılması.', icon: 'Ç' },
  { id: 'protez-cikarma', name: 'Protez Tırnak Çıkartma', desc: 'Protez uygulamasının kontrollü şekilde sökülmesi.', icon: 'X' },
  { id: 'nail-art', name: 'Nail Art', desc: 'Minimal çizgilerden özgün tasarımlara kişiselleştirilmiş dokunuş.', icon: '✦' },
];

const serviceGrid = document.getElementById('serviceGrid');

function renderServices() {
  if (!serviceGrid) return;
  serviceGrid.innerHTML = services.map((service, index) => `
    <article class="service-card reveal">
      <span class="service-number">0${index + 1}</span>
      <span class="service-icon" aria-hidden="true">${service.icon}</span>
      <h3>${service.name}</h3>
      <p>${service.desc}</p>
      <div class="service-foot">
        <span class="service-action-copy">RANDEVU OLUŞTUR</span>
        <a class="service-select" href="${BOOKING_URL}" target="_blank" rel="noopener noreferrer" aria-label="${service.name} için randevu al">↗</a>
      </div>
    </article>
  `).join('');
}

const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

function setMobileMenu(open) {
  if (!mobileBtn || !mobileMenu) return;
  mobileMenu.toggleAttribute('hidden', !open);
  mobileBtn.setAttribute('aria-expanded', String(open));
  mobileBtn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
}

mobileBtn?.addEventListener('click', () => setMobileMenu(mobileMenu?.hasAttribute('hidden') ?? false));
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMobileMenu(false)));
document.addEventListener('click', (event) => {
  if (mobileBtn && mobileMenu && !mobileMenu.hasAttribute('hidden') && !mobileMenu.contains(event.target) && !mobileBtn.contains(event.target)) {
    setMobileMenu(false);
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenu && !mobileMenu.hasAttribute('hidden')) {
    setMobileMenu(false);
    mobileBtn?.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 1020) setMobileMenu(false);
}, { passive: true });

document.getElementById('brandLogo')?.addEventListener('error', (event) => {
  event.currentTarget.style.display = 'none';
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.08 });

function observeReveals() {
  document.querySelectorAll('.reveal:not(.visible)').forEach((element) => observer.observe(element));
}

renderServices();
observeReveals();
