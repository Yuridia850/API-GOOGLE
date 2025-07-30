document.getElementById('cerrarSesion').addEventListener('click', function () {
  document.getElementById('popup-confirm').classList.remove('hidden');
});

document.getElementById('confirm-yes').addEventListener('click', function () {
  window.location.href = 'index.html';
});

document.getElementById('confirm-no').addEventListener('click', function () {
  document.getElementById('popup-confirm').classList.add('hidden');
});
