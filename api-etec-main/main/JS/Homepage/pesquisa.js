const API_URL = 'http://localhost:3000/api';

let searchInput = null;
let searchContainer = null;
let resultsContainer = null;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function createResultsContainer() {
  if (!searchContainer) {
    return null;
  }

  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results-container';
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(resultsContainer);
  }
  return resultsContainer;
}

async function searchProfiles(termo) {
  const container = createResultsContainer();
  if (!container) {
    return;
  }

  if (!termo.trim()) {
    container.style.display = 'none';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/search/${encodeURIComponent(termo)}`);

    if (!response.ok) {
      const text = await response.text();
      console.error('API returned error', response.status, text);
      container.innerHTML = `<div class="search-error-message">❌ Erro ao buscar: ${response.status} ${response.statusText}</div>`;
      container.style.display = 'block';
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.error('Erro ao parsear JSON da resposta:', parseError, text);
      container.innerHTML = '<div class="search-error-message">❌ Resposta inválida do servidor</div>';
      container.style.display = 'block';
      return;
    }

    displayResults(data);
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    container.innerHTML = '<div class="search-error-message">❌ Erro ao buscar (ver console)</div>';
    container.style.display = 'block';
  }
}

function displayResults(data) {
  const container = createResultsContainer();
  if (!container) {
    return;
  }

  if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && !data.voluntarios && !data.diretores)) {
    container.innerHTML = '<div class="search-no-results">Nenhum resultado encontrado</div>';
    container.style.display = 'block';
    return;
  }

  const voluntarios = Array.isArray(data.voluntarios) ? data.voluntarios : (Array.isArray(data) ? data : []);
  const diretores = Array.isArray(data.diretores) ? data.diretores : [];

  if (voluntarios.length === 0 && diretores.length === 0) {
    container.innerHTML = '<div class="search-no-results">Nenhum resultado encontrado</div>';
    container.style.display = 'block';
    return;
  }

  let html = '';

  if (voluntarios.length > 0) {
    html += '<div class="search-results-header">VOLUNTÁRIOS</div>';
    voluntarios.forEach(vol => {
      html += `
        <div class="search-result-item" data-usuario="${vol.usuario}" data-role="VOLUNTARIO">
          <div class="item-name">${vol.nome}</div>
          <div class="item-username">@${vol.usuario}</div>
          <div class="item-email">${vol.email}</div>
        </div>
      `;
    });
  }

  if (diretores.length > 0) {
    html += '<div class="search-results-header">DIRETORES</div>';
    diretores.forEach(dir => {
      html += `
        <div class="search-result-item" data-usuario="${dir.usuario}" data-role="DIRETORIA">
          <div class="item-name">${dir.nome}</div>
          <div class="item-username">@${dir.usuario}</div>
          <div class="item-email">${dir.email}</div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
  container.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  searchInput = document.getElementById('barra-de-pesquisa');
  searchContainer = document.getElementById('box-pesquisa');

  createResultsContainer();

  if (!searchInput || !searchContainer) {
    console.error('Search input or container not found in the DOM.');
    return;
  }

  searchInput.addEventListener('input', debounce((e) => {
    searchProfiles(e.target.value);
  }, 300));

  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target) && resultsContainer) {
      resultsContainer.style.display = 'none';
    }
  });

  if (resultsContainer) {
    resultsContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      const usuario = item.dataset.usuario;
      if (!usuario) return;
      window.location.href = '/main/Paginas/Homepage/perfil.html?usuario=' + encodeURIComponent(usuario);
    });
  }

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim() && resultsContainer) {
      resultsContainer.style.display = 'block';
    }
  });
});