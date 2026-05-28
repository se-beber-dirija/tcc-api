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
});
