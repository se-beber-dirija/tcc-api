document.addEventListener('DOMContentLoaded', () => {
    const dropdownButtons = document.querySelectorAll('.recentes[data-dropdown]');

    dropdownButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();

            const dropdownType = button.dataset.dropdown;
            const dropdownId = `dropdown-${dropdownType}`;
            const dropdownItems = document.getElementById(dropdownId);
            const arrow = button.querySelector('.seta-baixo');

            document.querySelectorAll('.dropdown-items').forEach(dropdown => {
                if (dropdown.id !== dropdownId && dropdown.style.display !== 'none') {
                    dropdown.style.display = 'none';
                    const otherButton = document.querySelector(`[data-dropdown="${dropdown.id.replace('dropdown-', '')}"]`);
                    if (otherButton) {
                        const otherArrow = otherButton.querySelector('.seta-baixo');
                        otherArrow.style.transform = 'rotate(0deg)';
                    }
                }
            });

            if (dropdownItems.style.display === 'none') {
                dropdownItems.style.display = 'flex';
                arrow.style.transform = 'rotate(180deg)';
            } else {
                dropdownItems.style.display = 'none';
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    });

    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemName = item.querySelector('span').textContent;
            console.log('Selected:', itemName);
        });
    });

    //Tag content (Elementos no dropdown em escolas.html) ---
    const tagOptions = {
        'Cidade': ['Indaiatuba', 'Campinas', 'Hortolândia', 'Americana', 'Sumaré'],
        'Problema': ['Falta de Material', 'Infraestrutura', 'Encanamento', 'Elétrico'],
        'Dias Disponiveis': ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
        'Ferramentas Disponiveis?': ['Sim', 'Não', 'Parcialmente']
    };

    let activeTagDropdown = null;

    function closeTagDropdown() {
        if (activeTagDropdown) {
            activeTagDropdown.remove();
            activeTagDropdown = null;
        }
    }

    document.addEventListener('click', () => {
        closeTagDropdown();
    });

    const tagButtons = document.querySelectorAll('.tags');
    tagButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTagDropdown();

            const labelEl = btn.querySelector('.tag-label');
            const key = (labelEl && labelEl.textContent) ? labelEl.textContent.trim() : btn.textContent.trim();
            const options = tagOptions[key] || [];

            const container = document.createElement('div');
            container.className = 'tag-dropdown';

            options.forEach(opt => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'tag-dropdown-item';
                item.textContent = opt;
                item.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (labelEl) labelEl.textContent = opt;
                    console.log('Tag selected:', key, opt);
                    closeTagDropdown();
                });
                container.appendChild(item);
            });

            const tagsParent = btn.closest('#box-tags') || btn.parentElement || document.body;
            if (tagsParent && window.getComputedStyle(tagsParent).position === 'static') {
                tagsParent.style.position = 'relative';
            }

            tagsParent.appendChild(container);

            const parentRect = tagsParent.getBoundingClientRect();
            const rect = btn.getBoundingClientRect();
            container.style.position = 'absolute';
            container.style.zIndex = '9999';
            container.style.left = `${rect.left - parentRect.left + window.scrollX}px`;
            container.style.top = `${rect.bottom - parentRect.top + window.scrollY + 6}px`;

            activeTagDropdown = container;
        });
    });
});
