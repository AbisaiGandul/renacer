document.addEventListener('DOMContentLoaded', () => {
  const songsList = document.getElementById('songsList');
  const searchInput = document.getElementById('searchInput');
  
  // Cargar canciones al iniciar
  loadAndRenderSongs();

  function loadAndRenderSongs() {
    const songs = loadSongs();
    renderSongs(songs);
  }

  function loadSongs() {
    try {
      const savedSongs = JSON.parse(localStorage.getItem('savedSongs')) || [];
      return savedSongs
        .filter(song => song && song.title)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    } catch (error) {
      console.error('Error al cargar canciones:', error);
      return [];
    }
  }

  function renderSongs(songs) {
    songsList.innerHTML = '';
    
    if (songs.length === 0) {
      songsList.innerHTML = `
        <div class="no-songs">
          <img src="img/music-note.svg" alt="No hay canciones" width="80">
          <p>Aún no hay canciones guardadas</p>
          <small>Crea tu primera canción haciendo clic en el botón +</small>
        </div>
      `;
      return;
    }

    songs.forEach((song, index) => {
      const songElement = document.createElement('div');
      songElement.className = 'song-card';
      songElement.innerHTML = `
        <div class="song-info">
          <h3 class="song-title">${song.title}</h3>
          <p class="song-author">${song.author || 'Anónimo'}</p>
          <div class="song-meta">
            <span class="song-key">${song.metadata?.key || 'C'}${song.metadata?.tonality === 'minor' ? 'm' : ''}</span>
            <span class="song-time">${song.metadata?.timeSignature || '4/4'}</span>
          </div>
        </div>
        <div class="song-actions">
          <button class="view-btn" data-id="${index}" title="Ver">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
            </svg>
          </button>
          <button class="edit-btn" data-id="${index}" title="Editar">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
            </svg>
          </button>
          <button class="delete-btn" data-id="${index}" title="Eliminar">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19V4Z"/>
            </svg>
          </button>
        </div>
      `;
      songsList.appendChild(songElement);
    });

    // Eventos para los botones
    setupButtonEvents();
  }

  function setupButtonEvents() {
    // Botón Ver
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = this.getAttribute('data-id');
        viewSong(index);
      });
    });

    // Botón Editar (NUEVO)
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = this.getAttribute('data-id');
        editSong(index);
      });
    });

    // Botón Eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-id'));
        deleteSong(index);
      });
    });
  }

  // Función para editar canción (NUEVA)
  function editSong(index) {
    const songs = loadSongs();
    const song = songs[index];
    
    if (song) {
      // Guardar la canción para editar
      localStorage.setItem('currentSongTemplate', JSON.stringify(song));
      localStorage.setItem('editingSongIndex', index); // Guardamos el índice para actualizar después
      
      // Redirigir a mesa de trabajo
      window.location.href = 'mesa_trabajo.html';
    } else {
      showFeedback('No se pudo cargar la canción para editar', 'error');
    }
  }

  function viewSong(index) {
    const songs = loadSongs();
    const song = songs[index];
    
    if (song) {
      localStorage.setItem('currentSongTemplate', JSON.stringify(song));
      window.location.href = 'ver_cancion.html';
    } else {
      showFeedback('No se pudo cargar la canción seleccionada', 'error');
    }
  }

  function deleteSong(index) {
    const songs = loadSongs();
    if (songs[index]) {
      const confirmDelete = confirm(`¿Seguro que querés eliminar "${songs[index].title}"?`);
      if (!confirmDelete) return;

      songs.splice(index, 1);
      localStorage.setItem('savedSongs', JSON.stringify(songs));
      showFeedback('Canción eliminada correctamente');
      renderSongs(songs);
    } else {
      showFeedback('No se pudo eliminar la canción', 'error');
    }
  }

  // Búsqueda
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const songs = loadSongs();
    const filtered = songs.filter(song => 
      song.title.toLowerCase().includes(term) || 
      (song.author && song.author.toLowerCase().includes(term))
    );
    renderSongs(filtered);
  });

  // Feedback
  function showFeedback(message, type = 'success') {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.classList.add('fade-out');
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }

  // Verificar si hay una canción recién guardada
  const justSaved = localStorage.getItem('justSaved');
  if (justSaved) {
    showFeedback(`"${justSaved}" guardada correctamente`);
    localStorage.removeItem('justSaved');
  }
});