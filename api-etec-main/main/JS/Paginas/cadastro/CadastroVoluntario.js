const botaoVoltar = document.getElementById('botao-voltar');

botaoVoltar.addEventListener('click', () => {
    window.location.href = '../../paginaInicial/index.html';
});

const passwordToggle = document.querySelector('.password-toggle');
const passwordInput = document.getElementById('password');
const eyeOpen = document.querySelector('.eye-open');
const eyeClosed = document.querySelector('.eye-closed');

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
    const inputs = [
        document.getElementById('nome'),
        document.getElementById('username'),
        document.getElementById('email'),
        document.getElementById('password'),
        document.getElementById('rg')
    ];
    inputs.forEach(input => {
        if (input) clearFieldError(input);
    });
}

passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

    if (isPassword) {
        eyeOpen.style.opacity = '0';
        eyeClosed.style.opacity = '1';
    } else {
        eyeOpen.style.opacity = '1';
        eyeClosed.style.opacity = '0';
    }
});

function showModal(mensagem) {
    document.getElementById('modal-text').innerText = mensagem;
    document.getElementById('custom-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('custom-modal').style.display = 'none';
    document.getElementById('cadastro').reset();

    document.getElementById('cadastrar-btn').disabled = true;
}

function formatRG(value) {
    const up = (value || '').toUpperCase();
    const only = up.replace(/[^0-9F]/g, '');
    if (!only) return '';
    let v = only;
    if (v[0] !== 'F') {
        v = 'F' + v.replace(/^F?/, '');
    }
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

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cadastro');
    const nomeInput = document.getElementById('nome');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rgInput = document.getElementById('rg');
    const cadastrarBtn = document.getElementById('cadastrar-btn');

    function checkFormValidity() {
        const isNomeValid = nomeInput.value.trim() !== '';
        const isUsernameValid = usernameInput.value.trim() !== '';
        const isEmailValid = emailInput.checkValidity() && emailInput.value.trim() !== '';
        const isPasswordValid = passwordInput.value.length >= 8;
        const isFormValid = isNomeValid && isUsernameValid && isEmailValid && isPasswordValid;

        if (isNomeValid) clearFieldError(nomeInput);
        if (isUsernameValid) clearFieldError(usernameInput);
        if (isEmailValid) clearFieldError(emailInput);
        if (isPasswordValid) clearFieldError(passwordInput);

        cadastrarBtn.disabled = !isFormValid;
    }

    nomeInput.addEventListener('input', checkFormValidity);
    usernameInput.addEventListener('input', checkFormValidity);
    emailInput.addEventListener('input', checkFormValidity);
    passwordInput.addEventListener('input', checkFormValidity);
    if (rgInput) {
        rgInput.addEventListener('input', (e) => {
            const pos = e.target.selectionStart;
            e.target.value = formatRG(e.target.value);
            checkFormValidity();
            e.target.setSelectionRange(pos, pos);
        });
    }

    checkFormValidity();
});

document.getElementById('cadastro').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const usuario = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('password').value;

    clearAllErrors();

    if (senha.length < 8) {
        setFieldError(passwordInput, 'A senha deve ter no mínimo 8 caracteres.');
        showModal("A senha deve ter no mínimo 8 caracteres.");
        return;
    }

    const role = window.location.pathname.includes('cadastroDiretoria.html')
        ? 'DIRETORIA'
        : window.location.pathname.includes('cadastroAdmin.html')
            ? 'ADMIN'
            : 'VOLUNTARIO';

    const dadosUsuario = {
        nome,
        usuario,
        email,
        senha,
        role
    };

    const rgField = document.getElementById('rg');
    if (rgField && role === 'DIRETORIA') {
        const normalizedRg = rgField.value.toUpperCase().replace(/[^0-9F]/g, '');
        if (!/^F\d{10}$/.test(normalizedRg)) {
            setFieldError(rgField, 'RG funcional inválido. Formato esperado: F123.456.789-0');
            showModal('RG funcional inválido. Formato esperado: F123.456.789-0');
            return;
        }
        dadosUsuario.rgFuncional = normalizedRg;
    }

    try {
        const response = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosUsuario)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.details) {
                errorData.details.forEach(detail => {
                    if (detail.field === 'nome') setFieldError(nomeInput, detail.message);
                    if (detail.field === 'usuario') setFieldError(usernameInput, detail.message);
                    if (detail.field === 'email') setFieldError(emailInput, detail.message);
                    if (detail.field === 'senha') setFieldError(passwordInput, detail.message);
                    if (detail.field === 'rgFuncional') setFieldError(rgField, detail.message);
                });
            }
            const message = errorData.error || `Erro ao cadastrar ${role.toLowerCase()}.`;
            showModal(message);
            return;
        }

        const successRole = role === 'DIRETORIA' ? 'diretoria' : role === 'ADMIN' ? 'admin' : 'voluntário';
        showModal(`Cadastro de ${successRole} realizado com sucesso!`);
    } catch (error) {
        console.error('Erro de conexão com a API:', error);
        showModal("Não foi possível conectar com a API. Verifique se o servidor está rodando.");
    }
});
