# AnalytiCore - Plataforma de Análisis de Sentimientos

Una plataforma de análisis de datos basada en arquitectura orientada a servicios que permite a los usuarios enviar textos para análisis de sentimientos y extracción de palabras clave.

## 🏗️ Arquitectura

La plataforma está compuesta por tres servicios principales:

- **Frontend (React)**: Interfaz de usuario para envío de textos y visualización de resultados
- **Servicio de Submisión (Python)**: API REST para recibir solicitudes y gestionar trabajos
- **Servicio de Análisis (Java)**: Procesador de análisis de texto para sentimientos y palabras clave

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Python 3.11+ (para desarrollo local)
- Java 17+ (para desarrollo local)

### Ejecución con Docker Compose

```bash
# Clonar el repositorio
git clone <repository-url>
cd AnalytiCore

# Ejecutar todos los servicios
docker-compose up --build

# La aplicación estará disponible en:
# - Frontend: http://localhost:3000
# - API Python: http://localhost:5000
# - API Java: http://localhost:8080
# - PostgreSQL: localhost:5432
```

### Desarrollo Local

#### Frontend (React)
```bash
cd frontend
npm install
npm start
# Disponible en http://localhost:3000
```

#### Servicio Python
```bash
cd python-service
pip install -r requirements.txt
python app.py
# Disponible en http://localhost:5000
```

#### Servicio Java
```bash
cd java-service
mvn spring-boot:run
# Disponible en http://localhost:8080
```

## 📋 API Endpoints

### Servicio de Submisión (Python - Puerto 5000)

- `POST /api/submit` - Enviar texto para análisis
- `GET /api/status/{jobId}` - Consultar estado del trabajo
- `GET /api/jobs` - Listar trabajos (debugging)
- `GET /health` - Estado del servicio

### Servicio de Análisis (Java - Puerto 8080)

- `POST /api/analyze` - Procesar análisis de texto
- `GET /api/health` - Estado del servicio

## 🔄 Flujo de Datos

1. **Usuario** → **Frontend**: Introduce texto y lo envía
2. **Frontend** → **API Python**: Envía texto via REST
3. **API Python** → **Base de Datos**: Crea registro con estado "PENDIENTE"
4. **API Python** → **API Java**: Notifica nuevo trabajo
5. **API Java** → **Base de Datos**: Actualiza estado a "PROCESANDO"
6. **API Java**: Realiza análisis y guarda resultados
7. **Frontend**: Consulta periódicamente el estado hasta completarse

## 🗄️ Base de Datos

PostgreSQL con tabla principal `jobs`:

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    sentiment VARCHAR(20),
    confidence FLOAT,
    keywords TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, Axios, CSS3
- **Backend Python**: Flask, psycopg2, Gunicorn
- **Backend Java**: Spring Boot 3, JPA, PostgreSQL Driver
- **Base de Datos**: PostgreSQL 15
- **Contenedores**: Docker, Docker Compose
- **Servidor Web**: Nginx (para el frontend)

## 🌐 Despliegue en Render

Cada servicio puede desplegarse independientemente en Render:

### Frontend
- Tipo: Static Site
- Build Command: `npm run build`
- Publish Directory: `build`

### Servicio Python
- Tipo: Web Service
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app`

### Servicio Java
- Tipo: Web Service
- Build Command: `mvn clean package -DskipTests`
- Start Command: `java -jar target/analysis-service-1.0.0.jar`

### Base de Datos
- Tipo: PostgreSQL Database

## 📊 Características del Análisis

### Análisis de Sentimientos
- **Positivo**: Detecta palabras positivas en español e inglés
- **Negativo**: Detecta palabras negativas en español e inglés
- **Neutral**: Cuando no hay predominancia clara
- **Confianza**: Porcentaje de certeza del análisis

### Extracción de Palabras Clave
- Elimina palabras de parada (stop words)
- Cuenta frecuencia de términos
- Retorna las 5 palabras más relevantes

## 🔧 Configuración

### Variables de Entorno

#### Servicio Python
- `DATABASE_URL`: URL de conexión PostgreSQL
- `JAVA_SERVICE_URL`: URL del servicio Java
- `PORT`: Puerto del servidor (default: 5000)

#### Servicio Java
- `DATABASE_URL`: URL de conexión PostgreSQL
- `DATABASE_USERNAME`: Usuario de base de datos
- `DATABASE_PASSWORD`: Contraseña de base de datos

#### Frontend
- `REACT_APP_API_URL`: URL del servicio Python

## 🏛️ Patrones de Arquitectura

- **Servicios sin Estado (Stateless)**: Ningún servicio mantiene estado en memoria
- **API REST**: Comunicación exclusiva via HTTP/REST
- **Contenedorización**: Cada componente en su propio Docker container
- **Separación de Responsabilidades**: Frontend, API Gateway, Worker
- **Persistencia Externalizada**: Todo el estado en PostgreSQL

## 🧪 Testing

```bash
# Test del frontend
cd frontend && npm test

# Test de APIs con curl
curl -X POST http://localhost:5000/api/submit \
  -H "Content-Type: application/json" \
  -d '{"text":"Este es un texto de prueba muy bueno"}'

curl http://localhost:5000/api/status/{jobId}
```

## 📝 Licencia

Este proyecto es un prototipo académico desarrollado para demostrar arquitecturas orientadas a servicios en la nube.
