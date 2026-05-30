const API_URL = 'http://localhost:3000/api';

function getLoggedUser() {
  try {
    return JSON.parse(localStorage.getItem('loggedUser')) || null;
  } catch (error) {
    console.warn('Erro ao ler loggedUser do localStorage', error);
    return null;
  }
}

function saveLoggedUser(user) {
  try {
    localStorage.setItem('loggedUser', JSON.stringify(user));
  } catch (error) {
    console.warn('Erro ao salvar loggedUser no localStorage', error);
  }
}

function redirectToLogin() {
  window.location.href = '../paginaInicial/index.html';
}

async function fetchUserDetails(loggedUser) {
  if (!loggedUser) return null;

  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
      console.warn('Não foi possível buscar usuário na API:', response.status);
      return null;
    }

    const users = await response.json();
    if (!Array.isArray(users)) return null;

    return users.find(user => {
      return (
        (user.usuario && user.usuario === loggedUser.usuario) ||
        (user.email && user.email === loggedUser.email)
      );
    }) || null;
  } catch (error) {
    console.warn('Erro ao buscar usuário na API:', error);
    return null;
  }
}

function createSchoolItem({ title, subtitle }) {
  const item = document.createElement('div');
  item.className = 'info-item';
  item.innerHTML = `
    <span>${title}</span>
    <p>${subtitle}</p>
  `;
  return item;
}

function renderSchoolSection(role, schoolsList, schoolTitle, apiUser) {
  if (!schoolsList || !schoolTitle) return;

  schoolsList.innerHTML = '';
  const roleUpper = String(role || '').toUpperCase();

  if (roleUpper === 'DIRETORIA' || roleUpper === 'ADMIN') {
    schoolTitle.textContent = 'Minha Escola';

    const schoolInfo = apiUser?.school || {
      title: 'Colégio TonJunFort',
      subtitle: 'Instituição de referência da diretoria'
    };

    schoolsList.appendChild(createSchoolItem(schoolInfo));
    return;
  }

  schoolTitle.textContent = 'Escolas Cadastradas';
  const schools = apiUser?.schools || [
    { title: 'Escola Municipal TonJunFort', subtitle: 'São Paulo - SP' },
    { title: 'Escola Estadual Unidade 03', subtitle: 'Rio de Janeiro - RJ' }
  ];

  if (schools.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Nenhuma escola cadastrada ainda.';
    empty.style.color = '#5b677d';
    empty.style.margin = '0';
    schoolsList.appendChild(empty);
    return;
  }

  schools.forEach(school => schoolsList.appendChild(createSchoolItem(school)));
}

function renderProfile(userData) {
  const nameEl = document.getElementById('profile-name');
  const roleEl = document.getElementById('profile-role');
  const emailEl = document.getElementById('profile-email');
  const phoneEl = document.getElementById('profile-phone');

  if (!nameEl || !roleEl || !emailEl || !phoneEl) return;

  const name = userData.nome || userData.usuario || 'Usuário';
  const email = userData.email || 'sem-email@exemplo.com';
  const role = String(userData.role || 'VOLUNTARIO').toUpperCase();
  const roleLabel = role === 'DIRETORIA' ? 'Diretoria' : role === 'ADMIN' ? 'Admin' : 'Voluntário';

  nameEl.textContent = name;
  roleEl.textContent = roleLabel;
  emailEl.textContent = email;
  phoneEl.textContent = userData.telefone || 'Não informado';
}

function applyAvatarPreview(avatarUrl) {
  const avatarImage = document.getElementById('avatar-image');
  if (!avatarImage) return;
  if (avatarUrl) avatarImage.src = avatarUrl;
}

function setupAvatarUpload(loggedUser) {
  const avatarInput = document.getElementById('upload-avatar');
  const avatarForm = document.getElementById('avatar-upload');

  if (!avatarInput || !avatarForm) return;

  avatarForm.addEventListener('submit', event => event.preventDefault());
  avatarInput.addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      applyAvatarPreview(dataUrl);
      const current = getLoggedUser() || {};
      saveLoggedUser({ ...current, avatar: dataUrl });
    };
    reader.readAsDataURL(file);
  });
}

async function initMeuPerfil() {
  const loggedUser = getLoggedUser();
  if (!loggedUser) {
    redirectToLogin();
    return;
  }

  applyAvatarPreview(loggedUser.avatar);
  setupAvatarUpload(loggedUser);

  const schoolTitle = document.getElementById('school-section-title');
  const schoolsList = document.getElementById('schools-list');

  const apiUser = await fetchUserDetails(loggedUser);
  const mergedUser = { ...loggedUser, ...(apiUser || {}) };

  renderProfile(mergedUser);
  renderSchoolSection(mergedUser.role, schoolsList, schoolTitle, apiUser);
}

document.addEventListener('DOMContentLoaded', initMeuPerfil);