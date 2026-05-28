document.addEventListener('DOMContentLoaded', () => {
    try {
        const raw = localStorage.getItem('loggedUser');
        const btn = document.getElementById('acesso-perfil');
        if (!btn) return;

        if (raw) {
            const user = JSON.parse(raw);
            const name = user.nome || user.usuario || user.email || 'Usuário';
            const labelSpan = btn.querySelector('span');
            if (labelSpan) labelSpan.textContent = name;

            if (user.avatar) {
                const existingImg = btn.querySelector('img.header-avatar');
                if (!existingImg) {
                    const svg = btn.querySelector('svg');
                    const img = document.createElement('img');
                    img.className = 'header-avatar';
                    img.src = user.avatar;
                    img.style.width = '32px';
                    img.style.height = '32px';
                    img.style.borderRadius = '50%';
                    img.style.objectFit = 'cover';
                    img.style.marginRight = '8px';
                    if (svg && svg.parentElement) svg.parentElement.replaceChild(img, svg);
                } else {
                    existingImg.src = user.avatar;
                }
            }

            const anchors = btn.querySelectorAll('.dropdown-content a');
            let logoutAnchor = null;
            anchors.forEach(a => {
                if (/sair/i.test((a.textContent || '').trim())) logoutAnchor = a;
            });

            const doLogout = (e) => {
                if (e) e.preventDefault();
                try { localStorage.removeItem('loggedUser'); } catch (err) {}
                // Redirecionar para página "X" após dar logout
                window.location.href = '../paginaInicial/index.html';
            };

            if (logoutAnchor) {
                logoutAnchor.addEventListener('click', doLogout);
            } else {
                const dd = btn.querySelector('.dropdown-content > div');
                if (dd) {
                    const div = document.createElement('div');
                    div.className = 'content-box';
                    const a = document.createElement('a');
                    a.href = '#';
                    a.style.color = 'rgb(253,52,52)';
                    a.textContent = 'Sair';
                    a.addEventListener('click', doLogout);
                    div.appendChild(a);
                    dd.appendChild(div);
                }
            }
        } else {
            const labelSpan = btn.querySelector('span');
            if (labelSpan) labelSpan.textContent = 'Perfil';
        }
    } catch (err) {
        console.warn('userSession error', err);
    }
});
