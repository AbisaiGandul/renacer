/**
 * FLT_BUTTON_C.JS
 * Control del botón flotante y creación de plantillas musicales
 * - Gestiona visibilidad según autenticación
 * - Maneja el formulario de creación
 * - Redirige a mesa de trabajo con los datos
 */

class FloatingButtonManager {
  constructor() {
    this.elements = {
      button: document.getElementById('addSongBtn'),
      modal: document.getElementById('songModal'),
      closeBtn: document.getElementById('closeSongModal'),
      form: document.getElementById('songForm'),
      titleInput: document.getElementById('songTitle'),
      authorInput: document.getElementById('songAuthor'),
      timeSignatureSelect: document.getElementById('songTimeSignature'),
      keySelect: document.getElementById('songKey'),
      tonalitySelect: document.getElementById('songTonality'),
      accidentalSelect: document.getElementById('songAccidental')
    };

    this.init();
  }

  init() {
    if (!this.elements.button) return;

    this.setupEventListeners();
    this.checkAuthState();
    this.setupStorageListener();
  }

  setupEventListeners() {
    // Botón flotante
    this.elements.button.addEventListener('click', () => {
      this.elements.modal.style.display = 'flex';
    });

    // Cerrar modal
    this.elements.closeBtn.addEventListener('click', () => {
      this.elements.modal.style.display = 'none';
    });

    // Clic fuera del modal
    window.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) {
        this.elements.modal.style.display = 'none';
      }
    });

    // Envío de formulario
    this.elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'isLoggedIn') {
        this.checkAuthState();
      }
    });
  }

  handleFormSubmit() {
    const templateData = this.collectFormData();
    
    if (this.validateForm(templateData)) {
      this.saveTemplate(templateData);
      this.redirectToWorkbench();
    }
  }

  collectFormData() {
    return {
      title: this.elements.titleInput.value.trim(),
      author: this.elements.authorInput.value.trim(),
      timeSignature: this.elements.timeSignatureSelect.value,
      key: this.elements.keySelect.value,
      tonality: this.elements.tonalitySelect.value,
      accidental: this.elements.accidentalSelect.value,
      createdAt: new Date().toISOString()
    };
  }

  validateForm(data) {
    if (!data.title) {
      alert('Por favor ingresa un título');
      return false;
    }
    return true;
  }

  saveTemplate(data) {
    localStorage.setItem('currentSongTemplate', JSON.stringify(data));
    this.elements.form.reset();
  }

  redirectToWorkbench() {
    window.location.href = 'mesa_trabajo.html';
  }

  checkAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.elements.button.style.display = isLoggedIn ? 'block' : 'none';
    
    // Opcional: Resetear modal al cambiar estado
    if (!isLoggedIn && this.elements.modal.style.display === 'flex') {
      this.elements.modal.style.display = 'none';
    }
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new FloatingButtonManager();
});