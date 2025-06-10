window.onclick = function(event) {
    const modal = document.getElementById('blogModal');
    if (event.target == modal) modal.style.display = "none";
};

document.getElementById('closeModal').addEventListener('click', function(event) {
    const modal = document.getElementById('blogModal');
    modal.style.display = "none";
})