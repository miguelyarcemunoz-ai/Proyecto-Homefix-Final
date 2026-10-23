# HomeFix — Plataforma Web Profesional para Servicios del Hogar

**HomeFix** es una solución web integral desarrollada sobre **Next.js 15 (App Router, React 19) y MySQL**, diseñada para conectar propietarios, familias y arrendadores con profesionales técnicos calificados en carpintería, plomería y reparación de electrodomésticos en Colombia.

---

## 📋 Tabla de Contenidos
1. [Características Principales](#-características-principales)
2. [Arquitectura y Tecnologías](#-arquitectura-y-tecnologías)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Requisitos del Sistema](#-requisitos-del-sistema)
5. [Instalación y Configuración](#-instalación-y-configuración)
6. [Credenciales de Demostración](#-credenciales-de-demostración)
7. [Matriz de Roles y Permisos (RBAC)](#-matriz-de-roles-y-permisos-rbac)
8. [Módulo de Hojas de Vida (CV) y Seguridad](#-módulo-de-hojas-de-vida-cv-y-seguridad)
9. [Lista de Mejoras Realizadas](#-lista-de-mejoras-realizadas)
10. [Lista de Errores Corregidos](#-lista-de-errores-corregidos)
11. [Resultados de las Pruebas](#-resultados-de-las-pruebas)

---

## 🚀 Características Principales

- **Landing Page Profesional:** Hero de alto impacto, buscador rápido, métricas en tiempo real, catálogo interactivo de especialidades, sección de ventajas, testimonios, FAQ y footer corporativo de 4 columnas.
- **Autenticación y Seguridad:** Cifrado de contraseñas con función de derivación de clave `scrypt`, cookies de sesión HTTP-only firmadas con HMAC SHA-256, tokens de recuperación de un solo uso con expiración y protección estricta contra inyección SQL mediante consultas preparadas con `mysql2`.
- **Control de Acceso Basado en Roles (RBAC):** Middleware nativo en el servidor para proteger rutas privadas e impedir accesos no autorizados o escalada de privilegios.
- **Panel de Administración (`/admin`):** Métricas reales de base de datos (usuarios, solicitudes, postulaciones, técnicos), gestión de usuarios (activación/desactivación, cambio de rol), gestión y asignación de órdenes de servicio, y evaluación formal de postulaciones.
- **Portal Técnico (`/panel-trabajador`):** Panel para técnicos con historial de postulaciones, descarga de su CV y visualización de solicitudes asignadas.
- **Portal de Cliente y Arrendador (`/panel-cliente`):** Monitoreo en tiempo real del estado de servicios solicitados (Pendiente, En proceso, Completada) para hogares y propiedades arrendadas.
- **Registro y Evaluación de Hojas de Vida:** Formulario multipart con validación de tamaño (máx. 5 MB) y validación de Magic Bytes (`%PDF-`), almacenamiento seguro en directorio privado y visor autorizado para postulante y administrador.

---

## 🛠️ Arquitectura y Tecnologías

- **Frontend & Backend:** [Next.js 15.5](https://nextjs.org/) con App Router y Server Actions / Route Handlers.
- **Librería UI:** [React 19](https://react.dev/).
- **Base de Datos:** MySQL 8.0+ / MariaDB 10.4+ (compatible con XAMPP).
- **Driver de BD:** `mysql2/promise` con pool de conexiones optimizado.
- **Seguridad Criptográfica:** Módulo nativo `node:crypto` (`scrypt`, HMAC SHA-256, `timingSafeEqual`).
- **Correos:** `nodemailer` con soporte SMTP y modo desarrollo con previsualización segura de enlaces.
- **Estilos:** CSS3 moderno nativo con variables CSS, diseño adaptable a dispositivos móviles, animaciones sutiles y modo accesible.

---

## 📁 Estructura del Proyecto

```text
HomeFix-NextJS-Mejorado/
├── app/                             # Capa de Presentación y Rutas (App Router)
│   ├── admin/page.js                # Panel maestro de administración y auditoría
│   ├── api/                         # Capa de Controladores Backend (REST API Endpoints)
│   │   ├── admin/                   # Endpoints administrativos (usuarios, stats, auditoría)
│   │   ├── auth/                    # Endpoints de autenticación (login, registro, recuperación)
│   │   ├── perfil/                  # Consulta y edición de datos del usuario
│   │   ├── postulaciones/           # Carga y evaluación de Hojas de Vida (CV en PDF)
│   │   ├── solicitudes/             # Ciclo de vida de órdenes de servicio técnico
│   │   └── trabajadores/            # Catálogo público de técnicos certificados
│   ├── globals.css                  # Sistema de diseño, fuentes y estilos corporativos
│   ├── layout.js                    # Layout raíz HTML con metadatos y tipografía
│   ├── login/page.js                # Formulario de inicio de sesión seguro
│   ├── mis-postulaciones/page.js    # Seguimiento de hojas de vida para técnicos
│   ├── not-found.js                 # Página 404 personalizada
│   ├── page.js                      # Landing Page profesional con catálogo y servicios
│   ├── panel-cliente/page.js        # Portal de usuario para clientes y arrendadores
│   ├── panel-trabajador/page.js     # Portal técnico (aceptación y gestión de órdenes)
│   ├── perfil/page.js               # Actualización de datos personales y teléfono
│   ├── postularme/page.js           # Formulario formal de postulación y carga de CV
│   ├── recuperar/page.js            # Solicitud de token para restablecer contraseña
│   ├── restablecer/page.js          # Cambio de contraseña con validación de token
│   └── servicios/[slug]/            # Páginas dinámicas de servicios (Carpintería, etc.)
├── components/                      # Componentes reutilizables de UI
│   ├── AuthForm.js                  # Componente base para login y registro
│   ├── Footer.js                    # Pie de página institucional con enlaces legales
│   ├── Header.js                    # Barra de navegación adaptable según sesión y rol
│   └── Logo.js                      # Isotipo vectorial de la marca HomeFix
├── database/                        # Scripts SQL y migraciones versionadas
│   ├── schema.sql                   # Esquema base original
│   ├── migration_002_complete...sql # Migración RBAC, Hojas de Vida y Auditoría
│   └── migration_003_accept...sql   # Soporte para aceptación de servicios y timestamps
├── lib/                             # Núcleo de Lógica de Negocio y Seguridad
│   ├── auth.js                      # Cifrado scrypt, cookies HMAC y validación de sesiones
│   └── db.js                        # Pool de conexiones optimizado de MySQL
├── middleware.js                    # Guardián de seguridad perimetral (RBAC per-request)
├── private-storage/                 # Almacenamiento seguro fuera del acceso web público
└── scripts/                         # Automatización, migraciones y suite de pruebas
```

---

## ⚙️ Requisitos del Sistema

- **Node.js:** Versión 20.x o superior (verificado con Node v24).
- **Servidor Web / BD:** XAMPP (Apache y MySQL activos) o servidor MySQL 8.0+.
- **Navegador:** Cualquier navegador moderno (Chrome, Edge, Firefox, Safari).

---

## 💻 Instalación y Configuración

### 1. Clonar o copiar el proyecto
Asegúrate de que la carpeta del proyecto se encuentre en tu servidor local (ej. `c:\xampp\htdocs\HomeFix-NextJS-Mejorado`).

### 2. Instalar dependencias
Abre una terminal en el directorio del proyecto y ejecuta:
```bash
npm install
```

### 3. Configurar variables de entorno
Verifica o edita el archivo `.env.local`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=homefix
APP_URL=http://localhost:3000
SESSION_SECRET=homefix_super_secret_key_production_ready_2026_xyz
DEV_SHOW_RESET_LINK=true
```

### 4. Configurar la Base de Datos
Tienes dos opciones para inicializar la base de datos:

**Opción A (Recomendada con script automático):**
Ejecuta el script de migración que aplica los cambios sin borrar datos existentes:
```bash
npm run migrate
```

**Opción B (Mediante cliente MySQL o phpMyAdmin):**
Importa el archivo `database/schema.sql` en tu servidor MySQL.

### 5. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre tu navegador en: **`http://localhost:3000`**

### 6. Ejecutar compilación de producción (Opcional)
```bash
npm run build
npm run start
```

---

## 🔑 Credenciales de Demostración

El sistema incluye cuentas y roles para pruebas inmediatas:

| Rol | Correo Electrónico | Contraseña | Destino tras Login |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@homefix.local` | `Admin12345*` | `/admin` |
| **Cliente / Hogar** | `cliente.demo@homefix.local` *(o crear vía `/registro`)* | *(la elegida)* | `/panel-cliente` |
| **Arrendador** | `arrendador.demo@homefix.local` *(o crear vía `/registro`)* | *(la elegida)* | `/panel-cliente` |
| **Técnico / Profesional** | `carlos.carpinteria@homefix.local` *(o vía `/postularme`)* | *(la elegida)* | `/panel-trabajador` |

---

## 🛡️ Matriz de Roles y Permisos (RBAC)

El servidor valida los permisos tanto en el archivo `middleware.js` como en cada endpoint de API:

| Módulo / Ruta | Público | Cliente | Arrendador | Trabajador | Administrador |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Landing Page (`/`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Catálogo de Servicios (`/servicios/[slug]`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inicio de Sesión (`/login`) y Registro (`/registro`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Perfil de Usuario (`/perfil`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Panel de Cliente / Arrendador (`/panel-cliente`) | ❌ | ✅ | ✅ | ❌ | ✅ |
| Postulación y Hoja de Vida (`/postularme`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mis Postulaciones (`/mis-postulaciones`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Panel Técnico (`/panel-trabajador`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Panel Administrativo (`/admin`) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Descarga de CV de otros usuarios | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 📄 Módulo de Hojas de Vida (CV) y Seguridad

1. **Almacenamiento Aislado:** Los archivos PDF se almacenan en `private-storage/postulaciones/`, completamente fuera de la carpeta pública `public/`.
2. **Nombres Criptográficos:** Cada archivo se guarda con un identificador UUIDv4 (ej. `a8b2c4d1-...pdf`) para evitar sobreescrituras y predecibilidad.
3. **Validación de Magic Bytes:** La API no confía en la extensión del archivo; lee los primeros 5 bytes en memoria (`%PDF-`) para garantizar que sea un documento PDF genuino y bloquear posibles scripts maliciosos.
4. **Descarga Restringida:** El endpoint `/api/postulaciones/[id]/documento` exige sesión activa y comprueba que quien descarga sea el titular del documento o un administrador.
5. **Transición a Catálogo:** Al aprobar una postulación en `/admin`, el sistema promueve automáticamente al usuario a rol de Trabajador y publica su ficha verificada en el catálogo público de la especialidad correspondiente.

---

## ✨ Lista de Mejoras Realizadas

1. **Diseño de Landing Page de Grado Profesional:**
   - Barra de navegación adhesiva (*sticky*) con efecto de desenfoque (*backdrop-blur*).
   - Menú móvil desplegable responsive (*hamburger menu*).
   - Menú de perfil de usuario dinámico con avatar y rol activo.
   - Hero interactivo con insignia animada y testimonios de métricas.
   - Franja de estadísticas en tiempo real (satisfacción, tiempos de respuesta).
   - Sección paso a paso ("¿Cómo funciona HomeFix?").
   - Catálogo interactivo con tarjetas de servicio e insignias.
   - Sección de beneficios diferenciados para hogares y arrendadores.
   - Sección de reclutamiento técnico ("Trabaja con Nosotros").
   - Testimonios reales y acordeón de preguntas frecuentes (FAQ).
   - Pie de página completo de 4 columnas con enlaces y avisos de cumplimiento legal (Ley 1581 de 2012 y Ley 1480 de 2011).

2. **Panel de Administración Integral (`/admin`):**
   - Tarjetas KPI con datos reales de la base de datos (cero valores simulados).
   - Gestión de usuarios con buscador en vivo, filtrado por rol y botones de activación/desactivación.
   - Gestión de órdenes de servicio con selector de estado en tiempo real.
   - Bandeja de postulaciones de técnicos con visor de competencias y descarga de CV PDF.
   - Modal de evaluación para aprobar (con asignación de oficio en catálogo), pedir correcciones o rechazar con observaciones.
   - Visor de registros de auditoría del sistema.

3. **Paneles Especializados para Trabajadores y Clientes:**
   - `/panel-trabajador`: Resumen de estado técnico, historial de postulaciones y solicitudes asignadas.
   - `/panel-cliente`: Resumen de reparaciones solicitadas, estados de servicio y acceso rápido para agendar.

4. **Robustecimiento del Registro y Login:**
   - Selector visual de tipo de cuenta (Hogar/Cliente, Arrendador, Técnico).
   - Medidor de seguridad de contraseña y validación de coincidencia.
   - Prevención de inyección y escalada de privilegios a nivel de API.
   - Redirección automática al panel correspondiente según el rol del usuario autenticado.

---

## 🐛 Lista de Errores Corregidos

1. **Error Fatal de Sintaxis en `app/servicios/[slug]/page.js`:**
   - *Causa:* El archivo original se encontraba truncado en la línea 24 dentro de un bloque `try/catch`.
   - *Solución:* Se reescribió el componente completo con manejo de sesión, catálogo de trabajadores verificados y formulario de agendamiento.
2. **Error de Prerenderizado en `/restablecer`:**
   - *Causa:* `useSearchParams()` en Next.js App Router requiere estar contenido dentro de un límite de `<Suspense>`.
   - *Solución:* Se encapsuló el formulario en `<Suspense fallback={...}>`, permitiendo una compilación estática limpia.
3. **Desincronización de Esquema de Base de Datos (`Unknown column 'rol'`):**
   - *Causa:* La tabla `usuarios` en MySQL carecía de los campos `rol`, `telefono`, `ciudad`, `foto_perfil` y `activo`.
   - *Solución:* Se creó y ejecutó la migración `migration_002_complete_system.sql` y el script `scripts/migrate.js`, añadiendo las columnas sin afectar los registros existentes.
4. **Ausencia de `estado_verificacion` en `trabajadores`:**
   - *Causa:* Las consultas de trabajadores filtraban por `estado_verificacion='aprobado'`, pero la columna no existía en la base de datos.
   - *Solución:* Se añadió la columna mediante migración y se sembraron 4 trabajadores verificados iniciales.
5. **Lectura de Sesión Incompatible en Server Components:**
   - *Causa:* `readSession()` solo admitía objetos `Request`, provocando fallos al llamarse en componentes de servidor con el almacén `cookies()`.
   - *Solución:* Se adaptó `lib/auth.js` para admitir tanto `Request` como `ReadonlyRequestCookies`.

---

## 🧪 Resultados de las Pruebas

Se implementó una suite de pruebas automatizadas en `scripts/test_suite.js`. Para ejecutarla:
```bash
npm run test:suite
```

### Resultados de la Ejecución:
```text
======================================================
🧪 SUITE DE PRUEBAS AUTOMATIZADAS - HOMEFIX NEXT.JS
======================================================

--- 1. Pruebas de Integridad de Base de Datos ---
  ✅ PASS: Conexión a MySQL exitosa
  ✅ PASS: Tabla usuarios tiene columnas rol, activo, telefono
  ✅ PASS: Tabla trabajadores tiene estado_verificacion
  ✅ PASS: Tabla solicitudes tiene usuario_id

--- 2. Pruebas de Cifrado y Hash de Contraseñas ---
  ✅ PASS: El hash utiliza el algoritmo scrypt
  ✅ PASS: Verificación de contraseña correcta con scrypt
  ✅ PASS: Rechazo de contraseña incorrecta con scrypt

--- 3. Pruebas de Sesiones Seguras con HMAC ---
  ✅ PASS: La sesión contiene payload y firma criptográfica
  ✅ PASS: Lectura y validación de firma de sesión válida
  ✅ PASS: Detección y rechazo de sesión manipulada/falsificada

--- 4. Pruebas de Registro y Duplicidad en BD ---
  ✅ PASS: Registro de usuario exitoso con datos válidos
  ✅ PASS: Restricción de unicidad detecta correo duplicado (ER_DUP_ENTRY)

--- 5. Pruebas de Registro y Actualización de Solicitudes ---
  ✅ PASS: Creación de solicitud de servicio en base de datos
  ✅ PASS: Actualización de estado de solicitud a "En proceso"

--- 6. Pruebas de Validación de Documentos PDF ---
  ✅ PASS: Aprobación de archivo con encabezado genuino %PDF-
  ✅ PASS: Bloqueo estricto de archivo binario no PDF (evita ejecución de malware)

--- 7. Verificación de Cuenta de Administrador ---
  ✅ PASS: Cuenta de Superadministrador activa (admin@homefix.local)

--- 8. Verificación de Técnicos en Catálogo Público ---
  ✅ PASS: Existen 4 técnicos verificados y listados para el público

======================================================
📊 RESULTADOS: 18 pasadas, 0 fallidas
======================================================
```

Compilación de producción verificada (`npm run build`): **0 errores, 28 páginas y rutas generadas correctamente**.
