const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt'); // Librería para encriptar contraseñas
const cors = require('cors'); // Permite peticiones desde el frontend
const helmet = require('helmet'); // Seguridad: Protege cabeceras HTTP contra ataques comunes
const rateLimit = require('express-rate-limit'); // Seguridad: Evita ataques de fuerza bruta

const app = express();

// --- CAPA DE SEGURIDAD EXTRA ---
// Helmet ayuda a proteger la app configurando varias cabeceras HTTP.
app.use(helmet()); 

// Limitamos el tamaño del cuerpo de la petición para evitar ataques DoS (Denegación de Servicio).
app.use(express.json({ limit: '10kb' })); 
app.use(cors());

// Configuración del limitador: máximo 100 peticiones cada 15 minutos por IP.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." }
});
app.use('/api/', limiter);

const DATA_PATH = path.join(__dirname, 'data.json');

// Función para leer la "Base de Datos" (archivo JSON) de forma segura.
const getData = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            const initialData = { usuarios: [], notas: [] };
            fs.writeFileSync(DATA_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const contenido = fs.readFileSync(DATA_PATH, 'utf-8');
        const data = JSON.parse(contenido || '{"usuarios":[], "notas":[]}');
        return {
            usuarios: data.usuarios || [],
            notas: data.notas || []
        };
    } catch (error) {
        return { usuarios: [], notas: [] };
    }
};

// Función para guardar cambios en el archivo JSON.
const saveData = (data) => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

// --- RUTAS DE LA API ---

// Registro de usuarios con Hashing de contraseña.
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: "Datos inválidos" });
    }

    const db = getData();
    if (db.usuarios.find(u => u.email === email.toLowerCase())) {
        return res.status(400).json({ error: "El email ya existe" });
    }
    
    // Encriptamos la contraseña antes de guardarla (nunca se guarda en texto plano).
    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUser = { id: Date.now(), email: email.toLowerCase(), password: hashedPassword };
    
    db.usuarios.push(nuevoUser);
    saveData(db);
    res.status(201).json({ message: "Usuario creado", userId: nuevoUser.id });
});

// Login: Compara la contraseña introducida con el Hash guardado.
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const db = getData();
    const user = db.usuarios.find(u => u.email === email.toLowerCase());
    
    // bcrypt.compare verifica de forma segura si la contraseña es correcta.
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ userId: user.id, email: user.email });
    } else {
        res.status(401).json({ error: "Credenciales incorrectas" });
    }
});

// Obtener notas filtradas por el ID del usuario logueado.
app.get('/api/notas/:userId', (req, res) => {
    const db = getData();
    const misNotas = db.notas.filter(n => n.user_id == req.params.userId);
    res.json(misNotas.slice().reverse()); // Mostramos las más recientes primero
});

// Guardar una nota nueva con sanitización de datos.
app.post('/api/notas', (req, res) => {
    let { userId, titulo, contenido } = req.body;
    if (!userId || !titulo || !contenido) return res.status(400).json({ error: "Campos incompletos" });
    
    // Sanitización básica para evitar inyecciones de texto masivo.
    titulo = titulo.toString().trim().substring(0, 80);
    contenido = contenido.toString().trim().substring(0, 1000);

    const db = getData();
    const nuevaNota = { 
        id: Date.now(), 
        user_id: userId, 
        titulo, 
        contenido, 
        created_at: new Date() 
    };
    
    db.notas.push(nuevaNota);
    saveData(db);
    res.status(201).json(nuevaNota);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ API Blindada en http://localhost:${PORT}`));