/* Small, progressive enhancements. All content and FAQs work without JavaScript. */
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav-links');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
  navigation?.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation?.classList.toggle('is-open', open);
});
navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-shell')) closeMenu();
});
const desktop = window.matchMedia('(min-width: 901px)');
desktop.addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

// Treat / and /index.html as the same page so section links never reload it.
const scrollDestinationKey = 'propertylime-scroll-destination';
const pagePath = pathname => pathname.replace(/\/index\.html$/, '/');
const scrollToSection = hash => {
  const section = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!section) return false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
  return true;
};

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') ||
      (link.target && link.target !== '_self')) return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || destination.search !== window.location.search) return;

  // Overview and the brand mark return to the beginning of the current homepage.
  if (!destination.hash && link.closest('.nav-shell') &&
      pagePath(destination.pathname) === pagePath(window.location.pathname)) {
    event.preventDefault();
    closeMenu();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    if (window.location.hash) history.pushState(null, '', window.location.pathname + window.location.search);
    return;
  }

  if (!destination.hash) return;
  if (pagePath(destination.pathname) === pagePath(window.location.pathname)) {
    const section = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    if (!section) return;
    event.preventDefault();
    closeMenu();
    if (window.location.hash !== destination.hash) history.pushState(null, '', destination.hash);
    scrollToSection(destination.hash);
  } else if (link.closest('.nav-shell') && pagePath(destination.pathname).endsWith('/')) {
    // Arrive at the homepage first, then animate to its requested section.
    try {
      sessionStorage.setItem(scrollDestinationKey, JSON.stringify({ path: pagePath(destination.pathname), hash: destination.hash }));
    } catch { return; }
    event.preventDefault();
    destination.hash = '';
    window.location.assign(destination.href);
  }
});

let pendingSection;
try {
  pendingSection = JSON.parse(sessionStorage.getItem(scrollDestinationKey) || 'null');
  sessionStorage.removeItem(scrollDestinationKey);
} catch { pendingSection = null; }
if (pendingSection?.path === pagePath(window.location.pathname)) {
  const finishNavigation = () => {
    if (!document.getElementById(decodeURIComponent(pendingSection.hash.slice(1)))) return;
    history.replaceState(null, '', pendingSection.hash);
    scrollToSection(pendingSection.hash);
  };
  if (document.readyState === 'complete') finishNavigation();
  else window.addEventListener('load', finishNavigation, { once: true });
}
