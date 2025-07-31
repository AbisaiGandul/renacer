document.addEventListener('DOMContentLoaded', () => {
  // Estado completo de la aplicación
  const state = {
    currentNote: null,
    currentAccidentals: [],
    currentBarline: null,
    darkMode: false,
    selectedBarline: null,
    currentElement: null,
    currentMeasure: null,
    lastAction: null,
    deleteMode: false,
    lastSavedSong: null,
    isEditing: false,
    editingSongId: null
  };

  // Todos los elementos del DOM
  const elements = {
    linesContainer: document.getElementById('linesContainer'),
    sheetTitle: document.getElementById('sheetTitle'),
    sheetAuthor: document.getElementById('sheetAuthor'),
    newLineBtn: document.getElementById('new-line-btn'),
    saveBtn: document.getElementById('save-btn'),
    finishBtn: document.getElementById('finish-btn'),
    backBtn: document.getElementById('back-btn'),
    darkModeBtn: document.getElementById('dark-mode-btn'),
    deleteBtn: document.getElementById('delete-btn'),
    menuSections: document.querySelectorAll('.menu-section'),
    noteBtns: document.querySelectorAll('.note-btn'),
    accidentalBtns: document.querySelectorAll('.accidental-btn'),
    barlineBtns: document.querySelectorAll('.barline-btn')
  };

  // ======================
  // FUNCIONES DE INICIALIZACIÓN
  // ======================

  function init() {
    checkEditMode();
    loadSavedData();
    setupEventListeners();
    
    // Solo crear primera medida si NO estamos editando y no hay contenido
    if (!state.isEditing && elements.linesContainer.children.length === 0) {
      createFirstMeasure();
    }
    
    checkDarkModePreference();
  }

  function checkEditMode() {
    const editingSongId = localStorage.getItem('editingSongId');
    if (editingSongId) {
      state.isEditing = true;
      state.editingSongId = editingSongId;
    }
  }

  // ======================
  // CONFIGURACIÓN DE EVENTOS
  // ======================

  function setupEventListeners() {
    // Menús desplegables
    elements.menuSections.forEach(section => {
      const title = section.querySelector('.menu-title');
      title.addEventListener('click', (e) => {
        e.stopPropagation();
        const options = section.querySelector('.menu-options');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
      });
    });

    // Botones de notas
    elements.noteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.currentNote = btn.dataset.note;
        state.currentAccidentals = [];
        state.currentBarline = null;
        state.deleteMode = false;
        clearSelection();
        updateActiveButtons();
        closeAllMenus();
      });
    });

    // Botones de alteraciones
    elements.accidentalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const accidental = btn.dataset.accidental;
        const index = state.currentAccidentals.indexOf(accidental);
        
        if (index > -1) {
          state.currentAccidentals.splice(index, 1);
        } else {
          if (accidental === '#' || accidental === 'b') {
            state.currentAccidentals = state.currentAccidentals.filter(a => a !== '#' && a !== 'b');
          }
          state.currentAccidentals.push(accidental);
        }
        
        state.currentBarline = null;
        state.deleteMode = false;
        clearSelection();
        updateActiveButtons();
        closeAllMenus();
      });
    });

    // Botones de compás
    elements.barlineBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.currentBarline = btn.dataset.type;
        state.currentNote = null;
        state.currentAccidentals = [];
        state.deleteMode = false;
        
        if (state.currentElement && state.currentElement.classList.contains('barline')) {
          updateSelectedBarline(state.currentElement);
        }
        
        updateActiveButtons();
        closeAllMenus();
      });
    });

    // Botón de borrado
    elements.deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDeleteMode();
      updateActiveButtons();
      closeAllMenus();
    });

    // Botones de acciones
    elements.newLineBtn.addEventListener('click', createNewMeasure);
    elements.saveBtn.addEventListener('click', saveSong);
    elements.finishBtn.addEventListener('click', finishAndSave);
    elements.backBtn.addEventListener('click', goBackToSongs);
    elements.darkModeBtn.addEventListener('click', toggleDarkMode);

    // Eventos de teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.deleteMode) {
        toggleDeleteMode(false);
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && state.currentElement && !state.deleteMode) {
        deleteCurrentElement();
      }
    });

    // Clicks generales
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-section')) {
        closeAllMenus();
      }
      if (!e.target.closest('.barline') && !e.target.closest('.musical-note') && !state.deleteMode) {
        clearSelection();
      }
    });

    // Eventos en el área de trabajo
    elements.linesContainer.addEventListener('click', (e) => {
      if (state.deleteMode) {
        handleDeleteModeClick(e);
        return;
      }

      const barline = e.target.closest('.barline');
      const note = e.target.closest('.musical-note');
      const measure = e.target.closest('.measure-line');
      
      document.querySelectorAll('.selected-element, .selected').forEach(el => {
        el.classList.remove('selected-element', 'selected');
      });
      
      if (barline) {
        e.stopPropagation();
        selectBarline(barline);
        if (state.currentBarline) {
          updateSelectedBarline(barline);
        }
      } 
      else if (note) {
        e.stopPropagation();
        handleNoteClick(note);
      }
      else if (measure) {
        addElementToMeasure(measure);
      }
    });
  }

  // ======================
  // FUNCIONES DE INTERFAZ
  // ======================

  function createFirstMeasure() {
    createNewMeasure(true);
  }

  function createNewMeasure(isFirstMeasure = false) {
    const measureContainer = document.createElement('div');
    measureContainer.className = 'measure-container';
    
    const measureHeader = document.createElement('div');
    measureHeader.className = 'measure-header';
    
    const subtitle = document.createElement('div');
    subtitle.className = 'line-subtitle';
    subtitle.contentEditable = true;
    subtitle.textContent = isFirstMeasure ? 'Introducción' : 'Nueva sección';
    subtitle.addEventListener('focus', handleSubtitleFocus);
    subtitle.addEventListener('blur', handleSubtitleBlur);
    
    measureHeader.appendChild(subtitle);
    measureContainer.appendChild(measureHeader);
    
    const measure = document.createElement('div');
    measure.className = 'measure-line';
    
    const centerWrapper = document.createElement('div');
    centerWrapper.className = 'measure-center';
    
    const initialBarline = document.createElement('div');
    initialBarline.className = 'barline barline-single';
    centerWrapper.appendChild(initialBarline);
    
    measure.appendChild(centerWrapper);
    measureContainer.appendChild(measure);
    elements.linesContainer.appendChild(measureContainer);
    
    if (!isFirstMeasure) {
      setTimeout(() => {
        subtitle.focus();
        placeCaretAtEnd(subtitle);
      }, 50);
    }
  }

  function handleSubtitleFocus(e) {
    const subtitle = e.target;
    if (subtitle.textContent === 'Introducción' || subtitle.textContent === 'Nueva sección') {
      subtitle.textContent = '';
    }
  }

  function handleSubtitleBlur(e) {
    const subtitle = e.target;
    if (subtitle.textContent.trim() === '') {
      subtitle.textContent = 'Sección sin título';
    }
  }

  function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ======================
  // FUNCIONES MUSICALES
  // ======================

  function handleNoteClick(noteElement) {
    state.currentElement = noteElement;
    state.currentMeasure = noteElement.closest('.measure-line');
    noteElement.classList.add('selected-element');
    
    if (state.currentAccidentals.length > 0) {
      applyAccidentals(noteElement);
    }
  }

  function applyAccidentals(noteElement) {
    const content = noteElement.textContent;
    const note = content[0];
    let newContent = note;
    
    state.currentAccidentals.forEach(accidental => {
      if (accidental === '#' || accidental === 'b') {
        newContent += accidental;
      } else if (accidental === 'm') {
        newContent += 'm';
      }
    });
    
    noteElement.textContent = newContent;
  }

  // ======================
  // FUNCIONES DE BORRADO
  // ======================

  function toggleDeleteMode(enable = !state.deleteMode) {
    state.deleteMode = enable;
    elements.deleteBtn.classList.toggle('active', state.deleteMode);
    elements.linesContainer.classList.toggle('delete-mode', state.deleteMode);
  }

  function handleDeleteModeClick(e) {
    const element = e.target.closest('.barline, .musical-note');
    if (!element) return;
    e.stopPropagation();
    
    const measure = element.closest('.measure-line');
    const centerWrapper = measure.querySelector('.measure-center');
    state.lastAction = {
      type: 'delete',
      element: element.cloneNode(true),
      position: Array.from(centerWrapper.children).indexOf(element),
      measure: measure
    };
    element.remove();
    
    if (measure && centerWrapper.children.length === 0) {
      const initialBarline = document.createElement('div');
      initialBarline.className = 'barline barline-single';
      centerWrapper.appendChild(initialBarline);
    }
  }

  // ======================
  // FUNCIONES DE SELECCIÓN
  // ======================

  function clearSelection() {
    if (state.currentElement) {
      state.currentElement.classList.remove('selected-element');
      state.currentElement = null;
    }
    if (state.selectedBarline) {
      state.selectedBarline.classList.remove('selected');
      state.selectedBarline = null;
    }
  }

  function deleteCurrentElement() {
    if (!state.currentElement) return;
    
    const element = state.currentElement;
    const measure = element.closest('.measure-line');
    const centerWrapper = measure.querySelector('.measure-center');
    
    state.lastAction = {
      type: 'delete',
      element: element.cloneNode(true),
      position: Array.from(centerWrapper.children).indexOf(element),
      measure: measure
    };
    
    element.remove();
    clearSelection();
    
    if (measure && centerWrapper.children.length === 0) {
      const initialBarline = document.createElement('div');
      initialBarline.className = 'barline barline-single';
      centerWrapper.appendChild(initialBarline);
    }
  }

  // ======================
  // FUNCIONES DE INTERFAZ
  // ======================

  function closeAllMenus() {
    document.querySelectorAll('.menu-options').forEach(menu => {
      menu.style.display = 'none';
    });
  }

  function addElementToMeasure(measure) {
    const centerWrapper = measure.querySelector('.measure-center');
    
    if (state.currentNote) {
      const noteElement = document.createElement('span');
      noteElement.className = 'musical-note';
      noteElement.textContent = state.currentNote;
      
      state.currentAccidentals.forEach(accidental => {
        if (accidental === '#' || accidental === 'b') {
          noteElement.textContent += accidental;
        } else if (accidental === 'm') {
          noteElement.textContent += 'm';
        }
      });
      
      centerWrapper.appendChild(noteElement);
    } else if (state.currentBarline) {
      const barline = document.createElement('span');
      barline.className = `barline barline-${state.currentBarline}`;
      centerWrapper.appendChild(barline);
    }
  }

  function selectBarline(barlineElement) {
    clearSelection();
    barlineElement.classList.add('selected');
    state.selectedBarline = barlineElement;
    state.currentElement = barlineElement;
    state.currentMeasure = barlineElement.closest('.measure-line');
  }

  function updateSelectedBarline(barlineElement) {
    barlineElement.className = `barline barline-${state.currentBarline}`;
    barlineElement.classList.remove('selected');
    state.selectedBarline = null;
  }

  // ======================
  // MODO OSCURO
  // ======================

  function checkDarkModePreference() {
    const darkModePref = localStorage.getItem('darkMode') === 'true';
    if (darkModePref) {
      document.body.classList.add('dark-mode');
      state.darkMode = true;
    }
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    closeAllMenus();
  }

  // ======================
  // BOTONES ACTIVOS
  // ======================

  function updateActiveButtons() {
    document.querySelectorAll('button.active').forEach(btn => {
      btn.classList.remove('active');
    });

    if (state.currentNote) {
      document.querySelector(`.note-btn[data-note="${state.currentNote}"]`).classList.add('active');
    }

    state.currentAccidentals.forEach(accidental => {
      const btn = document.querySelector(`.accidental-btn[data-accidental="${accidental}"]`);
      if (btn) btn.classList.add('active');
    });

    if (state.currentBarline) {
      document.querySelector(`.barline-btn[data-type="${state.currentBarline}"]`).classList.add('active');
    }

    if (state.deleteMode) {
      elements.deleteBtn.classList.add('active');
    }
  }

  // ======================
  // CARGA Y GUARDADO
  // ======================

  function loadSavedData() {
    const template = JSON.parse(localStorage.getItem('currentSongTemplate'));
    if (!template) return;

    elements.sheetTitle.textContent = template.title;
    elements.sheetAuthor.textContent = template.author || 'Anónimo';

    // Solo cargar contenido si existe, sin crear medidas automáticas
    if (template.content && template.content.length > 0) {
      elements.linesContainer.innerHTML = '';
      
      template.content.forEach(measureData => {
        const measureContainer = document.createElement('div');
        measureContainer.className = 'measure-container';
        
        const measureHeader = document.createElement('div');
        measureHeader.className = 'measure-header';
        
        const subtitle = document.createElement('div');
        subtitle.className = 'line-subtitle';
        subtitle.contentEditable = true;
        subtitle.textContent = measureData.subtitle || 'Sección sin título';
        subtitle.addEventListener('focus', handleSubtitleFocus);
        subtitle.addEventListener('blur', handleSubtitleBlur);
        
        measureHeader.appendChild(subtitle);
        measureContainer.appendChild(measureHeader);
        
        const measure = document.createElement('div');
        measure.className = 'measure-line';
        
        const centerWrapper = document.createElement('div');
        centerWrapper.className = 'measure-center';
        
        if (measureData.initialBarline) {
          const initialBarline = document.createElement('div');
          initialBarline.className = measureData.initialBarline;
          centerWrapper.appendChild(initialBarline);
        }
        
        measureData.notes.forEach(noteData => {
          const noteElement = document.createElement('span');
          noteElement.className = 'musical-note';
          noteElement.textContent = noteData.content;
          centerWrapper.appendChild(noteElement);
          
          if (noteData.barlineAfter) {
            const barline = document.createElement('span');
            barline.className = `barline ${noteData.barlineAfter}`;
            centerWrapper.appendChild(barline);
          }
        });
        
        measure.appendChild(centerWrapper);
        measureContainer.appendChild(measure);
        elements.linesContainer.appendChild(measureContainer);
      });
    }
  }

  function saveSong() {
    const originalTemplate = JSON.parse(localStorage.getItem('currentSongTemplate')) || {};
    
    const songData = {
      id: state.isEditing ? state.editingSongId : Date.now().toString(),
      title: elements.sheetTitle.textContent || 'Sin título',
      author: elements.sheetAuthor.textContent || 'Anónimo',
      metadata: originalTemplate.metadata || { // Mantener metadatos originales
        key: 'C',
        timeSignature: '4/4',
        tonality: 'major',
        accidental: 'natural'
      },
      content: [],
      createdAt: state.isEditing ? (originalTemplate.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    document.querySelectorAll('.measure-container').forEach(container => {
      const subtitle = container.querySelector('.line-subtitle').textContent;
      const measure = container.querySelector('.measure-line');
      const centerWrapper = measure.querySelector('.measure-center');
      
      const measureData = {
        subtitle: subtitle,
        initialBarline: centerWrapper.querySelector('.barline')?.className.split(' ')[1],
        notes: []
      };

      centerWrapper.querySelectorAll('.musical-note').forEach(note => {
        measureData.notes.push({
          content: note.textContent,
          barlineAfter: note.nextElementSibling?.className.includes('barline') ? 
                       note.nextElementSibling.className.split(' ')[1] : null
        });
      });

      songData.content.push(measureData);
    });

    let savedSongs = JSON.parse(localStorage.getItem('savedSongs')) || [];
    
    if (state.isEditing) {
      // Buscar y reemplazar la misma canción manteniendo todos los datos originales
      const index = savedSongs.findIndex(song => song.id === state.editingSongId);
      if (index !== -1) {
        savedSongs[index] = {
          ...savedSongs[index], // Mantener todos los datos originales
          title: songData.title,
          author: songData.author,
          content: songData.content,
          updatedAt: songData.updatedAt
        };
      }
    } else {
      savedSongs.push(songData);
    }

    localStorage.setItem('savedSongs', JSON.stringify(savedSongs));
    localStorage.setItem('currentSongTemplate', JSON.stringify(songData));
    state.lastSavedSong = songData.title;

    showFeedback(`"${songData.title}" ${state.isEditing ? 'actualizada' : 'guardada'} correctamente`, 'success');
  }

  function finishAndSave() {
    saveSong();
    
    if (state.isEditing) {
      localStorage.removeItem('editingSongId');
      state.isEditing = false;
      state.editingSongId = null;
    }

    setTimeout(() => {
      localStorage.setItem('lastAction', 'save');
      localStorage.setItem('lastSavedSong', state.lastSavedSong);
      window.location.href = 'canciones.html';
    }, 800);
  }

  function goBackToSongs() {
    if (confirm('¿Salir sin guardar los cambios?')) {
      if (state.isEditing) {
        localStorage.removeItem('editingSongId');
      }
      window.location.href = 'canciones.html';
    }
  }

  // ======================
  // FEEDBACK Y UTILIDADES
  // ======================

  function showFeedback(message, type = 'success') {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#0f9d58' : '#f44336'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: feedbackIn 0.3s ease-out;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.animation = 'feedbackOut 0.3s ease-in';
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }

  // Inicializar la aplicación
  init();
});