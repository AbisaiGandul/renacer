/**
 * SISTEMA DE AUTENTICACIÓN
 * - Maneja login y registro en el mismo modal
 * - Usa localStorage para persistencia simple
 */

// Base de datos de usuarios
let usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];

// Elementos del DOM
const authElements = {
  modal: document.getElementById('loginModal'),
  loginBtn: document.querySelector('.login-btn'),
  closeBtn: document.getElementById('closeModal'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  showRegister: document.getElementById('showRegister'),
  showLogin: document.getElementById('showLogin')
};

// Guardar usuarios
function saveUsers() {
  localStorage.setItem('usersDB', JSON.stringify(usersDB));
}

// Actualizar la UI según el estado de sesión
const updateAuthUI = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const btn = authElements.loginBtn;

  if (isLoggedIn) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    btn.innerHTML = `
      <span class="logout-container">
        <span class="logged-indicator" title="${user?.name || 'Usuario'}"></span>
        <span class="logout-icon">×</span>
      </span>
    `;
    btn.onclick = (e) => {
      if (e.target.classList.contains('logout-icon')) handleLogout();
    };
  } else {
    btn.innerHTML = 'Inicia Sesión';
    btn.onclick = (e) => {
      e.preventDefault();
      authElements.loginForm.style.display = 'block';
      authElements.registerForm.style.display = 'none';
      authElements.modal.style.display = 'flex';
    };
  }
};

// Cerrar sesión
const handleLogout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('currentUser');
  updateAuthUI();
};

// Validaciones
const validate = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  password: (pass) => pass.length >= 6,
  name: (name) => name.length >= 3
};

// Login
authElements.loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('emailLogin').value.trim();
  const pass = document.getElementById('passwordLogin').value.trim();

  const user = usersDB.find(u => u.email === email && u.pass === pass);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    authElements.modal.style.display = 'none';
    updateAuthUI();
  } else {
    alert('Credenciales incorrectas');
  }
});

// Registro
authElements.registerForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const userData = {
    name: document.getElementById('nameRegister').value.trim(),
    email: document.getElementById('emailRegister').value.trim(),
    pass: document.getElementById('passwordRegister').value.trim()
  };

  if (!validate.name(userData.name) || !validate.email(userData.email) || !validate.password(userData.pass)) {
    alert('Datos inválidos. Asegúrate de que todos los campos estén correctamente llenos.');
    return;
  }

  // Evitar duplicados
  if (usersDB.some(u => u.email === userData.email)) {
    alert('Ya existe un usuario con ese correo.');
    return;
  }

  usersDB.push({ id: Date.now(), ...userData });
  saveUsers();
  localStorage.setItem('currentUser', JSON.stringify(userData));
  localStorage.setItem('isLoggedIn', 'true');
  authElements.modal.style.display = 'none';
  updateAuthUI();
});

// Inicialización y eventos
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  authElements.closeBtn?.addEventListener('click', () => {
    authElements.modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === authElements.modal) {
      authElements.modal.style.display = 'none';
    }
  });

  // Alternar entre login y registro
  authElements.showRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    authElements.loginForm.style.display = 'none';
    authElements.registerForm.style.display = 'block';
  });

  authElements.showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    authElements.registerForm.style.display = 'none';
    authElements.loginForm.style.display = 'block';
  });
});
// FUNCIONALIDAD BOTÓN "+"
document.addEventListener('DOMContentLoaded', () => {
  const addNoteBtn = document.getElementById('addNoteBtn');
  const notesContainer = document.getElementById('notesContainer');

  addNoteBtn?.addEventListener('click', () => {
    const noteDiv = document.createElement('div');
    noteDiv.classList.add('note-block');

    noteDiv.innerHTML = `
      <select class="note">
        <option value="C">C</option>
        <option value="D">D</option>
        <option value="E">E</option>
        <option value="F">F</option>
        <option value="G">G</option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>

      <select class="alteration">
        <option value="">—</option>
        <option value="#">♯</option>
        <option value="b">♭</option>
        <option value="m">m</option>
      </select>
    `;

    notesContainer.appendChild(noteDiv);
  });
});
