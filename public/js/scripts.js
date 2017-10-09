const socket = io.connect('/');

socket.on('newCount', (data) => {
  document.getElementById('translation-count').innerHTML = data.newCount;
});
