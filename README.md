# Lab 5 - API REST Profesional: Notas & Agentes DeepSeek IA

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-v4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![DeepSeek](https://img.shields.io/badge/DeepSeek-API-0066FF?style=for-the-badge&logo=openai&logoColor=white)
![Streaming](https://img.shields.io/badge/SSE-Realtime_Stream-FF6600?style=for-the-badge)
![Swagger](https://img.shields.io/badge/OpenAPI-3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-10%20Passed-brightgreen?style=for-the-badge)

</div>

API REST modular y de producción construida con **Node.js** y **Express**, documentada exhaustivamente con **OpenAPI 3.0 / Swagger** e impulsada por **DeepSeek LLM** mediante el SDK oficial de OpenAI. Ofrece un **CRUD completo de Notas**, **Memoria multi-turno avanzada**, **Generación y modelado SQL/ERD** y **Streaming de respuestas en tiempo real (Server-Sent Events)** con validación en tiempo de ejecución con **Zod**, limitación de solicitudes (**Rate Limiting**) y control centralizado de errores.

Todos los endpoints son públicos y accesibles de inmediato desde la interfaz interactiva de Swagger UI con **un solo clic en "Try it out" sin necesidad de autenticación ni tokens**.

---

## 🏛️ Arquitectura Modular

```text
backend/
├── src/
│   ├── config/          # OpenAPI 3.0 con schemas completos
│   │   └── swagger.js
│   ├── controllers/     # Controladores HTTP desacoplados
│   │   ├── notas.controller.js  # CRUD de Notas y Resúmenes IA
│   │   └── agent.controller.js  # Servicios de IA y Streaming SSE
│   ├── routes/          # Definición de rutas modularizadas con OpenAPI JSDoc
│   │   ├── api.routes.js        # Rutas principales (/api/notas y /api/ia)
│   │   └── agent.routes.js      # Rutas complementarias de agentes (/api/agent)
│   ├── services/        # Lógica de negocio e integración externa
│   │   ├── notas.service.js     # Almacenamiento y síntesis con IA
│   │   ├── agent.service.js     # Fábrica de agentes especializados con historial
│   │   └── llm.service.js       # Cliente DeepSeek, streaming y métricas de tokens
│   ├── middlewares/     # Interceptores de validación y control
│   │   ├── validar.js           # Validación tipada con Zod (HTTP 400)
│   │   ├── rateLimiter.js       # Limitador de peticiones (HTTP 429)
│   │   └── errorHandler.js      # Captura segura sin fuga de credenciales
│   ├── utils/           # Clases operacionales (AppError)
│   │   └── errors.js
│   ├── app.js           # Express con Helmet, CORS, Swagger UI y rutas
│   └── index.js         # Entrada y escucha HTTP
├── test/
│   └── api.test.js      # Pruebas automatizadas con node:test (100% pass)
├── test-client.js       # Script de pruebas locales directas
├── .env.example         # Plantilla limpia de variables de entorno
├── Dockerfile           # Imagen Docker de producción
└── docker-compose.yml   # Orquestación de contenedores
```

---

## 🌟 Capacidades Destacadas

### 🧠 1. Memoria de Conversación Multi-Turno Avanzada
- En [`agent.service.js`](file:///c:/Users/LENOV/OneDrive/Documents/BACKEND/clase%2017%2011-11-2026/backend/src/services/agent.service.js), el arreglo `historial` se inyecta de forma limpia y ordenada:
  `[System Prompt] ➡️ [Historial Multi-Turno ({role, content})] ➡️ [Mensaje Actual]`.
- Esquema Zod estricto que restringe roles a `'user' | 'assistant' | 'system'`, valida longitud y limita la profundidad a 50 turnos para evitar payloads malformados.

### ⚡ 2. Streaming en Tiempo Real (Server-Sent Events - SSE)
- **Endpoints:** `POST /api/agent/stream` y `POST /api/ia/stream`.
- **Protocolo:** Configura cabeceras SSE estándar (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`).
- **DeepSeek Stream:** Activa `stream: true` en el SDK de OpenAI para emitir fragmentos (`data: {"chunk":"..."}\n\n`) token por token a medida que el LLM genera la respuesta, finalizando con `data: [DONE]\n\n`.

### 🛡️ 3. Validación con Zod y Rate Limiting
- Validación estricta de esquemas antes de tocar los controladores.
- Rate limiting por IP en endpoints de IA para proteger cuotas de DeepSeek.
- Manejador centralizado de errores con sanitización automática de claves de API.

---

## 📋 Catálogo de Operaciones en Swagger

| Módulo / Tag | Método | Ruta | Acceso | Descripción |
| :--- | :---: | :--- | :---: | :--- |
| **`[Notas]`** | `GET` | `/api/notas` | Directo | Lista notas con filtros de búsqueda y paginación. |
| **`[Notas]`** | `POST` | `/api/notas` | Directo | Crea una nueva nota validada con Zod. |
| **`[Notas]`** | `GET` | `/api/notas/{id}` | Directo | Obtiene una nota específica por su ID. |
| **`[Notas]`** | `PUT` | `/api/notas/{id}` | Directo | Actualiza título, contenido o categoría de una nota. |
| **`[Notas]`** | `DELETE`| `/api/notas/{id}` | Directo | Elimina una nota por ID. |
| **`[Notas]`** | `POST` | `/api/notas/{id}/resumen` | Directo | Genera resumen ejecutivo con DeepSeek. |
| **`[IA]`** | `POST` | `/api/ia/preguntar` | Directo | Consulta libre al modelo con historial multi-turno. |
| **`[IA]`** | `POST` | `/api/ia/entidades` | Directo | Modela entidades y relaciones de base de datos normalizadas. |
| **`[IA]`** | `POST` | `/api/ia/endpoints` | Directo | Diseña contratos y arquitectura RESTful. |
| **`[IA]`** | `POST` | `/api/ia/stream` | Directo | Streaming en tiempo real con Server-Sent Events (SSE). |
| **`[IA]`** | `POST` | `/api/agent/entidades` | Directo | Endpoint especializado de diseño de entidades de BD. |
| **`[IA]`** | `POST` | `/api/agent/endpoints` | Directo | Endpoint especializado de diseño de endpoints REST. |
| **`[IA]`** | `POST` | `/api/agent/sql` | Directo | Genera scripts SQL y migraciones DDL optimizadas. |
| **`[IA]`** | `POST` | `/api/agent/stream`| Directo | Endpoint streaming dedicado del agente DeepSeek. |
| **`[IA]`** | `POST` | `/api/agent/preguntar`| Directo | Consulta general al agente asistencial. |

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

1. Despliega cualquier endpoint (ej. `GET /api/notas`, `POST /api/ia/preguntar` o `POST /api/agent/entidades`).
2. Pulsa directamente en **`Try it out`** y luego en **`Execute`**.
3. ¡Listo! Obtendrás la respuesta inmediatamente sin requerir pasos previos de login ni autenticación.

---

## 🧪 Pruebas Automatizadas

```bash
cd backend
npm test
```
*Pruebas unitarias y de integración pasando al 100% con el runner nativo `node:test`.*
