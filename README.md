# Lab 5 - API REST Profesional: Gestión de Notas & Agentes DeepSeek IA

API REST modular y de producción construida con **Node.js** y **Express**, documentada con **OpenAPI 3.0 / Swagger** e integrada con **DeepSeek LLM** mediante el SDK oficial de OpenAI. Ofrece un **CRUD completo de Notas** y un conjunto de **servicios avanzados de Inteligencia Artificial** con validación en tiempo de ejecución con **Zod**, limitación de solicitudes (**Rate Limiting**) y control centralizado de errores.

---

## 🏛️ Arquitectura Modular

```text
backend/
├── src/
│   ├── config/          # OpenAPI 3.0 completa con esquemas para Notas e IA
│   │   └── swagger.js
│   ├── controllers/     # Controladores HTTP desacoplados
│   │   ├── notas.controller.js  # CRUD de Notas y Resúmenes IA
│   │   └── agent.controller.js  # Servicios de IA y Modelado
│   ├── routes/          # Definición de rutas modularizadas
│   │   ├── api.routes.js        # Rutas principales (/api/notas y /api/ia)
│   │   └── agent.routes.js      # Rutas complementarias de agentes
│   ├── services/        # Lógica de negocio e integración externa
│   │   ├── notas.service.js     # Almacenamiento y síntesis con IA
│   │   ├── agent.service.js     # Fábrica y agentes especializados
│   │   └── llm.service.js       # Cliente DeepSeek y métricas de tokens
│   ├── middlewares/     # Interceptores de validación, seguridad y errores
│   │   ├── validar.js           # Validación tipada con Zod (HTTP 400)
│   │   ├── rateLimiter.js       # Limitador de peticiones (HTTP 429)
│   │   └── errorHandler.js      # Captura segura sin fuga de credenciales
│   ├── utils/           # Clases operacionales (AppError)
│   │   └── errors.js
│   ├── app.js           # Inicialización y middlewares de Express
│   └── index.js         # Entrada y escucha HTTP
├── test/
│   └── api.test.js      # Suite de pruebas automatizadas con node:test
├── test-client.js       # Script de pruebas locales
├── .env.example         # Plantilla limpia de variables de entorno
├── .gitignore           # Archivos ignorados por Git
└── package.json         # Dependencias, scripts y configuración
```

---

## 📋 Catálogo Completo de Endpoints

### 1. 📝 Gestión de Notas (`[Notas]`)

| Método | Endpoint | Descripción | Códigos HTTP |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/notas` | Lista todas las notas registradas | `200`, `500` |
| `POST` | `/api/notas` | Crea una nota nueva (Zod: `titulo`, `contenido`) | `201`, `400`, `500` |
| `GET` | `/api/notas/{id}` | Obtiene una nota específica por su ID | `200`, `404`, `500` |
| `PUT` | `/api/notas/{id}` | Actualiza una nota existente por su ID | `200`, `400`, `404`, `500` |
| `DELETE` | `/api/notas/{id}` | Elimina una nota por su ID | `204`, `404`, `500` |
| `POST` | `/api/notas/{id}/resumen` | Genera un **resumen ejecutivo con IA** en viñetas de la nota | `200`, `404`, `429`, `500` |

### 2. 🤖 Inteligencia Artificial (`[Inteligencia Artificial]`)

| Método | Endpoint | Descripción | Códigos HTTP |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/ia/preguntar` | Consulta abierta al agente con soporte de historial | `200`, `400`, `429`, `500` |
| `POST` | `/api/ia/entidades` | Modela entidades de BD, PKs, FKs y normalización (hasta 3FN) | `200`, `400`, `429`, `500` |
| `POST` | `/api/ia/endpoints` | Diseña contratos y arquitectura de endpoints RESTful | `200`, `400`, `429`, `500` |

---

## 🚀 Instalación y Puesta en Marcha

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
Copia el archivo de plantilla `.env.example` a `.env`:
```env
PORT=3000
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=tu_api_key_de_deepseek_aqui
DEEPSEEK_MODEL=deepseek-chat
```

### 3. Iniciar el servidor
```bash
npm run dev
```

El servidor arrancará en `http://localhost:3000`.

---

## 📚 Documentación Interactiva (Swagger UI)

Accede a la interfaz visual completa de OpenAPI 3.0 en:

👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

La interfaz organiza los endpoints bajo los tags **`Notas`** e **`Inteligencia Artificial`**, mostrando los esquemas de entrada y salida, ejemplos interactivos y todos los códigos de respuesta.

---

## 🧪 Pruebas Automatizadas

Ejecutar la suite de pruebas nativa de Node.js:
```bash
npm test
```

Ejecutar el cliente de prueba interactivo:
```bash
node test-client.js
```
