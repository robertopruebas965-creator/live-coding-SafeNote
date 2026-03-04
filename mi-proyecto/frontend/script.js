const API = 'http://localhost:3000/api';
let currentUserId = null; // Almacena el ID del usuario logueado en la sesión actual

/**
 * Gestión de Errores: Muestra un mensaje visual y limpia el campo password por seguridad.
 */
function manejarError(mensaje) {
    const msg = document.getElementById('msg');
    msg.style.color = "#ff4d4d"; 
    msg.textContent = "❌ " + mensaje;
    
    document.getElementById('password').value = "";
    document.getElementById('password').focus();
}

/**
 * Navegación interna: Oculta el login y muestra la sección de notas.
 */
function entrarALaApp(userId, email) {
    currentUserId = userId;
    document.getElementById('user-email').textContent = email;
    
    // Switch visual de secciones
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('notes-section').style.display = 'block';
    
    // Mostrar menú de navegación del usuario
    const navUser = document.getElementById('nav-user');
    if (navUser) navUser.style.display = 'flex';
    
    cargarNotas();
}

// --- LÓGICA DE LOGIN ---
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });

        const data = await res.json();
        if (res.ok) {
            entrarALaApp(data.userId, data.email);
        } else {
            manejarError(data.error || "Credenciales incorrectas");
        }
    } catch (err) {
        manejarError("Servidor no disponible (¿Docker encendido?)");
    }
};

// --- LÓGICA DE REGISTRO ---
async function registrarUsuario(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validación previa en cliente (UX): Ahorra peticiones innecesarias al servidor
    if (!email.includes('@') || email.length < 5) {
        manejarError("Introduce un correo válido");
        return;
    }
    if (password.length < 8) {
        manejarError("Contraseña muy corta (mínimo 8 caracteres)");
        return;
    }

    try {
        const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });

        const data = await res.json();
        if (res.ok) {
            alert("✅ Registro exitoso");
            entrarALaApp(data.userId, email);
        } else {
            manejarError(data.error);
        }
    } catch (err) {
        manejarError("Error de conexión con la API");
    }
}

// --- GESTIÓN DE NOTAS ---

// Crear Nota: Envía los datos a la API
document.getElementById('note-form').onsubmit = async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('note-title').value;
    const contenido = document.getElementById('note-content').value;

    const res = await fetch(`${API}/notas`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId: currentUserId, titulo, contenido})
    });

    if (res.ok) {
        document.getElementById('note-form').reset(); // Limpia el formulario tras guardar
        cargarNotas(); // Refresca la lista de notas
    }
};

/**
 * Listar Notas: Recupera las notas del usuario y genera el HTML dinámicamente.
 */
async function cargarNotas() {
    const res = await fetch(`${API}/notas/${currentUserId}`);
    const notas = await res.json();
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    
    notas.forEach(n => {
        const art = document.createElement('article');
        art.className = "glass-panel note-item"; 
        
        const h4 = document.createElement('h4');
        h4.textContent = n.titulo; // Uso de textContent para evitar inyección XSS
        
        const p = document.createElement('p');
        p.textContent = n.contenido;

        // Formateo de fecha para mejorar la visualización
        const small = document.createElement('small');
        const fecha = new Date(n.created_at).toLocaleString(); 
        small.textContent = `Guardado el: ${fecha}`;
        small.style.opacity = "0.5";

        art.append(h4, p, small);
        list.append(art);
    });
}

// --- UTILIDADES ---

function cerrarSesion() {
    currentUserId = null;
    location.reload(); // Reinicia el estado de la app
}

// Limpieza de mensajes de error mientras el usuario corrige sus datos
document.getElementById('email').addEventListener('input', () => {
    document.getElementById('msg').textContent = "";
});
document.getElementById('password').addEventListener('input', () => {
    document.getElementById('msg').textContent = "";
});