document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const entrarBtn = document.getElementById('entrar-btn');
    const rgInput = document.getElementById('rg');

    function setFieldError(input, message) {
        if (!input) return;
        input.classList.add('input-error');
        let messageEl = input.parentElement.querySelector('.input-error-message');
        if (!messageEl) {
            messageEl = document.createElement('span');
            messageEl.className = 'input-error-message';
            input.parentElement.appendChild(messageEl);
        }
        messageEl.innerText = message;
    }

    function clearFieldError(input) {
        if (!input) return;
        input.classList.remove('input-error');
        const messageEl = input.parentElement.querySelector('.input-error-message');
        if (messageEl) messageEl.remove();
    }

    function clearAllErrors() {
        [usernameInput, emailInput, senhaInput, rgInput].forEach(input => {
            if (input) clearFieldError(input);
        });
        const popup = document.getElementById('login-error-popup');
        if (popup) popup.remove();
    }

    function showErrorPopup(message) {
        clearAllErrors();
        const popup = document.createElement('div');
        popup.id = 'login-error-popup';
        popup.className = 'error-popup';
        popup.innerText = message;
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.remove();
        }, 4500);
    }

    function formatRG(value) {
        const up = (value || '').toUpperCase();
        const only = up.replace(/[^0-9F]/g, '');
        if (!only) return '';
        let v = only;
        if (v[0] !== 'F') v = 'F' + v.replace(/^F?/, '');
        const digits = v.slice(1).replace(/\D/g, '').slice(0, 10);
        const p1 = digits.slice(0, 3);
        const p2 = digits.slice(3, 6);
        const p3 = digits.slice(6, 9);
        const last = digits.slice(9, 10);
        let out = 'F';
        if (p1) out += p1;
        if (p2) out += '.' + p2;
        if (p3) out += '.' + p3;
        if (last) out += '-' + last;
        return out;
    }

    function checkFormValidity() {
        const isUsernameValid = usernameInput.value.trim() !== '';
        const isEmailValid = emailInput.checkValidity() && emailInput.value.trim() !== '';
        const isSenhaValid = senhaInput.value.trim() !== '';
        const isFormValid = isUsernameValid && isEmailValid && isSenhaValid;

        entrarBtn.disabled = !isFormValid;
        return isFormValid;
    }

    usernameInput.addEventListener('input', checkFormValidity);
    emailInput.addEventListener('input', checkFormValidity);
    senhaInput.addEventListener('input', checkFormValidity);
    if (rgInput) {
        rgInput.addEventListener('input', (e) => {
            const pos = e.target.selectionStart;
            e.target.value = formatRG(e.target.value);
            try { e.target.setSelectionRange(pos, pos); } catch (err) {}
            checkFormValidity();
        });
    }

    entrarBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        clearAllErrors();

        const usuario = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();

        if (!checkFormValidity()) {
            if (usuario === '') setFieldError(usernameInput, 'Nome de usuário obrigatório.');
            if (email === '' || !emailInput.checkValidity()) setFieldError(emailInput, 'Email válido é obrigatório.');
            if (senha === '') setFieldError(senhaInput, 'Senha obrigatória.');
            return;
        }

        let rgFuncional;
        if (rgInput && rgInput.value.trim() !== '') {
            rgFuncional = rgInput.value.toUpperCase().replace(/[^0-9F]/g, '');
            if (!/^F\d{10}$/.test(rgFuncional)) {
                setFieldError(rgInput, 'RG funcional inválido. Formato esperado: F123.456.789-0');
                showErrorPopup('RG funcional inválido. Formato esperado: F123.456.789-0');
                return;
            }
        }

        try {
            const payload = rgFuncional ? { usuario, email, senha, rgFuncional } : { usuario, email, senha };
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.error || 'Email ou senha inválidos.';
                if (errorData.details) {
                    errorData.details.forEach(detail => {
                        if (detail.field === 'usuario') setFieldError(usernameInput, detail.message);
                        if (detail.field === 'email') setFieldError(emailInput, detail.message);
                        if (detail.field === 'senha') setFieldError(senhaInput, detail.message);
                    });
                }
                showErrorPopup(message);
                return;
            }

            let responseData = {};
            try { responseData = await response.json(); } catch (err) { responseData = {}; }

            const savedUser = {
                nome: responseData.nome || usuario,
                usuario: responseData.usuario || usuario,
                email: responseData.email || email,
                role: responseData.role || (rgFuncional ? 'DIRETORIA' : 'VOLUNTARIO'),
                token: responseData.token || responseData.accessToken || null
            };
            try {
                localStorage.setItem('loggedUser', JSON.stringify(savedUser));
            } catch (err) {
                console.warn('Não foi possível salvar usuário no localStorage:', err);
            }

            window.location.href = '../Homepage/homepage.html';
        } catch (error) {
            console.error('Erro de conexão com a API:', error);
            showErrorPopup('Não foi possível conectar com a API. Verifique se o servidor está rodando.');
        }
    });

    checkFormValidity();
});