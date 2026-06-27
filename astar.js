document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => {
        cell.classList.add('black');
    });
});
