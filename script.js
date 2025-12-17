// Accessibility-friendly nav behavior
document.addEventListener('DOMContentLoaded', function(){
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.getElementById('site-nav');
  const submenuToggles = document.querySelectorAll('.has-submenu > .submenu-toggle');
  const yearEl = document.getElementById('year');
  const themeToggle = document.getElementById('theme-toggle');

  // Set year
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  navToggle.addEventListener('click', function(){
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('open');
    // Also update aria on root for submenu state styling
  });

  // Submenu toggles (for mobile + keyboard)
  submenuToggles.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const parent = btn.parentElement;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      parent.setAttribute('aria-expanded', String(!expanded));
    });
    btn.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowDown'){ e.preventDefault(); btn.nextElementSibling.querySelector('a')?.focus(); }
    });
  });

  // Close open menus when clicking outside
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.site-header')){
      document.querySelectorAll('.has-submenu').forEach(li=>{
        li.removeAttribute('aria-expanded');
        li.querySelector('.submenu-toggle')?.setAttribute('aria-expanded','false');
      });
    }
  });

  // Theme toggle (prefers-color-scheme aware)
  function getPreferredTheme(){
    const stored = localStorage.getItem('site-theme');
    if(stored) return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(t){
    if(t === 'dark') document.documentElement.setAttribute('data-theme','dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('site-theme', t);
    themeToggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
  }
  applyTheme(getPreferredTheme());
  themeToggle.addEventListener('click', ()=>{
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // Keyboard navigation: allow Esc to close mobile nav
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      if(siteNav.classList.contains('open')){
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded','false');
      }
      document.querySelectorAll('.has-submenu').forEach(li=>{
        li.removeAttribute('aria-expanded');
        li.querySelector('.submenu-toggle')?.setAttribute('aria-expanded','false');
      });
    }
  });
});
