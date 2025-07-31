    let canciones = [];

    const searchInput = document.getElementById("searchInput");
    const songsList = document.getElementById("songsList");

    function renderSongs(filter = "") {
      songsList.innerHTML = ""; // limpio la lista

      const filteredSongs = canciones.filter((cancion) =>
        cancion.toLowerCase().includes(filter.toLowerCase())
      );

      if (filteredSongs.length === 0) {
        songsList.innerHTML = '<p class="no-songs-msg">No hay canciones</p>';
        return;
      }

      // Creo lista de canciones
      const ul = document.createElement("ul");
      filteredSongs.forEach((cancion) => {
        const li = document.createElement("li");
        li.textContent = cancion;
        ul.appendChild(li);
      });

      songsList.appendChild(ul);
    }

    // Evento input para buscar en tiempo real
    searchInput.addEventListener("input", (e) => {
      renderSongs(e.target.value);
    });

    // Render inicial
    renderSongs();