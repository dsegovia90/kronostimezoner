const socket = io.connect('http://localhost:8000/');

socket.on('newCount', (data) => {
  document.getElementById('translation-count').innerHTML = data.newCount;
});
