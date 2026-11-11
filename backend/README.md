# Lab 5 - API REST Profesional: Notas, Autenticación JWT & Agentes DeepSeek IA

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-v4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth_Bearer-black?style=for-the-badge&logo=jsonwebtokens)
![DeepSeek](https://img.shields.io/badge/DeepSeek-API-0066FF?style=for-the-badge&logo=openai&logoColor=white)
![Streaming](https://img.shields.io/badge/SSE-Realtime_Stream-FF6600?style=for-the-badge)
![Swagger](https://img.shields.io/badge/OpenAPI-3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-15%20Passed-brightgreen?style=for-the-badge)

</div>

API REST modular y de producción construida con **Node.js** y **Express**, documentada con **OpenAPI 3.0 / Swagger** e integrada con **DeepSeek LLM** mediante el SDK oficial de OpenAI. Ofrece un **CRUD completo de Notas**, **Autenticación con Bearer Token (JWT)**, **Memoria multi-turno avanzada** y **Streaming de respuestas en tiempo real (Server-Sent Events)** con validación en tiempo de ejecución con **Zod**, limitación de solicitudes (**Rate Limiting**) y control centralizado de errores.

---

## 🏛️ Arquitectura Modular

```text
backend/
├── src/
│   ├── config/          # OpenAPI 3.0 con securitySchemes (bearerAuth) y schemas
│   │   └── swagger.js
│   ├── controllers/     # Controladores HTTP desacoplados
│   │   ├── auth.controller.js   # Autenticación y emisión de JWT
│   │   ├── notas.controller.js  # CRUD de Notas y Resúmenes IA
│   │   └── agent.controller.js  # Servicios de IA y Streaming SSE
│   ├── routes/          # Definición de rutas modularizadas
│   │   ├── auth.routes.js       # Rutas de autenticación (/api/auth)
│   │   ├── api.routes.js        # Rutas principales (/api/notas y /api/ia)
│   │   └── agent.routes.js      # Rutas complementarias de agentes y streaming
│   ├── services/        # Lógica de negocio e integración externa
│   │   ├── auth.service.js      # Validación de credenciales y firma de JWT
│   │   ├── notas.service.js     # Almacenamiento y síntesis con IA
│   │   ├── agent.service.js     # Fábrica de agentes con inyección de historial
│   │   └── llm.service.js       # Cliente DeepSeek, streaming y métricas de tokens
│   ├── middlewares/     # Interceptores de validación, seguridad y errores
│   │   ├── auth.js              # Validación de Bearer Token JWT y roles (401/403)
│   │   ├── validar.js           # Validación tipada con Zod (HTTP 400)
│   │   ├── rateLimiter.js       # Limitador de peticiones (HTTP 429)
│   │   └── errorHandler.js      # Captura segura sin fuga de credenciales
│   ├── utils/           # Clases operacionales (AppError)
│   │   └── errors.js
│   ├── app.js           # Express con Helmet, CORS, Swagger UI y rutas
│   └── index.js         # Entrada y escucha HTTP
├── test/
│   └── api.test.js      # 15 Pruebas automatizadas con node:test (100% pass)
├── test-client.js       # Script de pruebas locales
├── .env.example         # Plantilla limpia de variables de entorno
├── Dockerfile           # Imagen Docker de producción
└── docker-compose.yml   # Orquestación de contenedores
```

---

## 🏆 Los 3 Retos Extra Implementados

### 🧠 Reto 1: Memoria de Conversación Multi-Turno Avanzada
- En [`agent.service.js`](file:///c:/Users/LENOV/OneDrive/Documents/BACKEND/clase%2017%2011-11-2026/backend/src/services/agent.service.js), el arreglo `historial` se inyecta de forma limpia y ordenada:
  `[System Prompt] ➡️ [Historial Multi-Turno ({role, content})] ➡️ [Mensaje Actual]`.
- Esquema Zod estricto que restringe roles a `'user' | 'assistant' | 'system'`, valida longitud y limita la profundidad a 50 turnos para evitar ataques de denegación de servicio por tamaño de payload.

### 🔐 Reto 2: Autenticación por Bearer Token (JWT) y Seguridad en Swagger
- **Endpoint:** `POST /api/auth/login` con credenciales de desarrollador:
  - **Admin:** `admin@lab5.com` / `admin123`
  - **Dev:** `dev@lab5.com` / `dev123`
- **Middleware [`auth.js`](file:///c:/Users/LENOV/OneDrive/Documents/BACKEND/clase%2017%2011-11-2026/backend/src/middlewares/auth.js):** Valida cabecera `Authorization: Bearer <token>`, maneja expiraciones y tokens alterados con respuestas `401 Unauthorized` e inyecta `req.user`.
- **Botón "Authorize" en Swagger UI:** Registrado en [`swagger.js`](file:///c:/Users/LENOV/OneDrive/Documents/BACKEND/clase%2017%2011-11-2026/backend/src/config/swagger.js) bajo `components.securitySchemes.bearerAuth`. Permite ingresar el token una vez y autorizar todas las peticiones interactivas.

### ⚡ Reto 3: Streaming en Tiempo Real (Server-Sent Events - SSE)
- **Endpoints:** `POST /api/agent/stream` y `POST /api/ia/stream`.
- **Protocolo:** Configura cabeceras SSE (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`).
- **DeepSeek Stream:** Activa `stream: true` en el SDK de OpenAI para enviar fragmentos (`data: {"chunk":"..."}\n\n`) token por token a medida que el LLM genera la respuesta, finalizando con `data: [DONE]\n\n`.

---

## 📋 Catálogo de Operaciones en Swagger (17 Operaciones)

| Módulo / Tag | Método | Ruta | Seguridad | Descripción |
| :--- | :---: | :--- | :---: | :--- |
| **`[Autenticación]`** | `POST` | `/api/auth/login` | Pública | Inicia sesión y genera el Bearer Token JWT. |
| **`[Autenticación]`** | `GET` | `/api/auth/perfil` | Bearer JWT | Obtiene datos del token verificado. |
| **`[Notas]`** | `GET` | `/api/notas` | Pública | Lista notas con filtros y paginación. |
| **`[Notas]`** | `POST` | `/api/notas` | Bearer JWT | Crea una nota validada con Zod. |
| **`[Notas]`** | `GET` | `/api/notas/{id}` | Pública | Obtiene nota por ID. |
| **`[Notas]`** | `PUT` | `/api/notas/{id}` | Bearer JWT | Actualiza una nota existente. |
| **`[Notas]`** | `DELETE`| `/api/notas/{id}` | Bearer JWT | Elimina una nota por ID. |
| **`[Notas]`** | `POST` | `/api/notas/{id}/resumen` | Bearer JWT | Genera resumen ejecutivo con DeepSeek. |
| **`[IA]`** | `POST` | `/api/ia/preguntar` | Bearer JWT | Consulta libre con historial multi-turno. |
| **`[IA]`** | `POST` | `/api/ia/entidades` | Bearer JWT | Modela entidades y relaciones de BD. |
| **`[IA]`** | `POST` | `/api/ia/endpoints` | Bearer JWT | Diseña contratos y arquitectura RESTful. |
| **`[IA]`** | `POST` | `/api/ia/stream` | Bearer JWT | Streaming en tiempo real con SSE. |
| **`[IA]`** | `POST` | `/api/agent/stream`| Bearer JWT | Endpoint streaming dedicado del agente. |
| **`[IA]`** | `POST` | `/api/agent/sql` | Bearer JWT | Genera código SQL y migraciones DDL. |

---

## 🚀 Instalación y Puesta en Marcha

### 1. Iniciar servidor
```bash
cd backend
npm install
npm run dev
```

### 2. Abrir Swagger UI
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

1. Despliega **`POST /api/auth/login`**, pulsa **`Try it out`** y **`Execute`** con las credenciales por defecto (`admin@lab5.com` / `admin123`).
2. Copia el token retornado en la respuesta.
3. Haz clic en el botón verde superior **`Authorize`** en Swagger UI, escribe `Bearer <TU_TOKEN>` y pulsa **Authorize**.
4. ¡Listo! Todos los endpoints protegidos ejecutarán llamadas autorizadas.

---

## 🧪 Pruebas Automatizadas

```bash
cd backend
npm test
```
*15 pruebas unitarias y de integración pasando al 100% con el runner nativo `node:test`.*
