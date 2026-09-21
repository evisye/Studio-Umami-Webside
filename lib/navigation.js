(() => {
 const header = document.querySelector('.su-header');
 const button = document.querySelector('.su-menu-toggle');
 const navigation = document.querySelector('.su-navigation');
 if (!header || !button || !navigation) return;
 header.classList.add('su-enhanced');
 const close = () => { button.setAttribute('aria-expanded', 'false'); navigation.classList.remove('is-open'); };
 button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open', open); });
 navigation.addEventListener('click', event => { if (event.target.closest('a')) close(); });
 header.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); button.focus(); } });
 document.addEventListener('click', event => { if (!header.contains(event.target)) close(); });
})();
