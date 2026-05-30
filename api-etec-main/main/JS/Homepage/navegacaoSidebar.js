document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('#sidebar-links .expand');

    const mapping = {
        'Inicio': './homepage.html',
        'Cadastros': './escolaCadastrada.html',
        'Escolas': './escolas.html',
        'Doações': './doações.html',
        'Notificações': './notificações.html'
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            const textEl = btn.querySelector('.link-text');
            const key = textEl.textContent.trim();
            const target = mapping[key];

            if (target) {
                window.location.href = target;
            } else {
                console.log('Rota não encontrada para:', key);
            }
        });
    });
});