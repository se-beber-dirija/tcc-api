const API_URL = 'http://localhost:3000/api';

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
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

function showNotFound(message) {
  const mainPerfil = document.getElementById('main-perfil');
  if (!mainPerfil) return;

  mainPerfil.innerHTML = `
    <div class="detalhes-card" style="width:100%; padding:40px; text-align:center;">
      <h2>Perfil não encontrado</h2>
      <p style="margin-top:12px; color:#586278;">${message}</p>
    </div>
  `;
  document.title = 'Perfil não encontrado';
}

async function fetchUserByUsername(usuario) {
  if (!usuario) return null;
  try {
    const cleanUsuario = String(usuario).replace(/^@/, '').trim();
    const response = await fetch(`${API_URL}/user?usuario=${encodeURIComponent(cleanUsuario)}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      console.warn('Não foi possível buscar usuário na API:', response.status);
      return null;
    }
    const user = await response.json();
    return user;
  } catch (error) {
    console.warn('Erro ao buscar usuário na API:', error);
    return null;
  }
}

function renderProfile(userData) {
  const nameEl = document.getElementById('profile-name');
  const usernameEl = document.getElementById('profile-username');
  const roleEl = document.getElementById('profile-role');
  const emailEl = document.getElementById('profile-email');
  const phoneEl = document.getElementById('profile-phone');
  const rgContainer = document.getElementById('profile-rg-container');
  const rgEl = document.getElementById('profile-rg');
  const avatarImg = document.getElementById('avatar-image');

  if (!nameEl || !usernameEl || !roleEl || !emailEl || !phoneEl || !avatarImg) return;

  const name = userData.nome || userData.usuario || 'Usuário';
  const username = userData.usuario ? `@${userData.usuario}` : '@desconhecido';
  const email = userData.email || 'sem-email@exemplo.com';
  const phone = userData.telefone || 'Não informado';
  const role = String(userData.role || 'VOLUNTARIO').toUpperCase();
  const roleLabel = role === 'DIRETORIA' ? 'Diretoria' : role === 'ADMIN' ? 'Admin' : 'Voluntário';

  nameEl.textContent = name;
  usernameEl.textContent = username;
  roleEl.textContent = roleLabel;
  emailEl.textContent = email;
  phoneEl.textContent = phone;

  if (userData.rgFuncional) {
    rgEl.textContent = userData.rgFuncional;
    if (rgContainer) {
      rgContainer.style.display = 'flex';
    }
  } else if (rgContainer) {
    rgContainer.style.display = 'none';
  }

  if (userData.avatar) {
    avatarImg.src = userData.avatar;
  }
  document.title = `${name} • Perfil`;
}

function renderSchoolSection(role, schoolsList, schoolTitle, userData) {
  if (!schoolsList || !schoolTitle) return;
  schoolsList.innerHTML = '';

  const roleUpper = String(role || '').toUpperCase();
  if (roleUpper === 'DIRETORIA' || roleUpper === 'ADMIN') {
    schoolTitle.textContent = 'Minha Escola';
    const school = userData?.school;

    if (!school) {
      const empty = document.createElement('p');
      empty.textContent = 'Esse usuário não tem uma escola.';
      empty.style.color = '#5b677d';
      empty.style.margin = '0';
      schoolsList.appendChild(empty);
      return;
    }

    schoolsList.appendChild(createSchoolItem({
      title: school.title || 'Minha escola',
      subtitle: school.subtitle || 'Informações da escola não disponíveis',
    }));
    return;
  }

  schoolTitle.textContent = 'Escolas Cadastradas';
  const schools = userData?.schools || [
    { title: 'Escola Municipal TonJunFort', subtitle: 'São Paulo - SP' },
    { title: 'Escola Estadual Unidade 03', subtitle: 'Rio de Janeiro - RJ' }
  ];

  if (!schools.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Nenhuma escola cadastrada.';
    empty.style.color = '#5b677d';
    empty.style.margin = '0';
    schoolsList.appendChild(empty);
    return;
  }

  schools.forEach(school => schoolsList.appendChild(createSchoolItem(school)));
}

async function initPerfilPage() {
  const usuario = getQueryParam('usuario');
  if (!usuario) {
    showNotFound('Nenhum perfil selecionado. Use a busca para visitar um perfil.');
    return;
  }

  const apiUser = await fetchUserByUsername(decodeURIComponent(usuario));
  if (!apiUser) {
    showNotFound('Perfil não encontrado.');
    return;
  }

  renderProfile(apiUser);

  const schoolTitle = document.getElementById('school-section-title');
  const schoolsList = document.getElementById('schools-list');
  renderSchoolSection(apiUser.role, schoolsList, schoolTitle, apiUser);
}

document.addEventListener('DOMContentLoaded', initPerfilPage);
