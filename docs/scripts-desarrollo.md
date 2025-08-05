# Scripts de Utilidad para AnalytiCore

## Comandos Docker

### Construcción y Ejecución
```bash
# Construir y ejecutar todos los servicios
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f python-service
docker-compose logs -f java-service
docker-compose logs -f frontend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Construcción Individual
```bash
# Frontend
docker build -t analyticore-frontend ./frontend

# Python Service
docker build -t analyticore-python ./python-service

# Java Service
docker build -t analyticore-java ./java-service
```

## Desarrollo Local

### Frontend
```bash
cd frontend
npm install
npm start
# http://localhost:3000
```

### Python Service
```bash
cd python-service
pip install -r requirements.txt
export DATABASE_URL="postgresql://analyticore:analyticore123@localhost:5432/analyticore"
export JAVA_SERVICE_URL="http://localhost:8080"
python app.py
# http://localhost:5000
```

### Java Service
```bash
cd java-service
mvn clean install
mvn spring-boot:run
# http://localhost:8080
```

## Testing

### Verificar Servicios
```bash
# Health checks
curl http://localhost:5000/health
curl http://localhost:8080/api/health

# Enviar texto para análisis
curl -X POST http://localhost:5000/api/submit \
  -H "Content-Type: application/json" \
  -d '{"text":"Este es un texto de prueba muy bueno y fantástico"}'

# Consultar estado (reemplazar JOB_ID)
curl http://localhost:5000/api/status/JOB_ID
```

### Base de Datos
```bash
# Conectar a PostgreSQL
docker exec -it analyticore_postgres_1 psql -U analyticore -d analyticore

# Consultas útiles
SELECT * FROM jobs ORDER BY created_at DESC LIMIT 10;
SELECT status, COUNT(*) FROM jobs GROUP BY status;
```

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**
   ```bash
   # Verificar que PostgreSQL esté corriendo
   docker-compose ps postgres
   
   # Reiniciar servicios que dependen de BD
   docker-compose restart python-service java-service
   ```

2. **Frontend no puede conectar con API**
   ```bash
   # Verificar variable de entorno
   echo $REACT_APP_API_URL
   
   # Reconstruir frontend con nueva URL
   docker-compose build frontend
   ```

3. **Java service no inicia**
   ```bash
   # Ver logs detallados
   docker-compose logs java-service
   
   # Verificar memoria disponible
   docker stats
   ```

## Limpieza

```bash
# Limpiar contenedores parados
docker container prune

# Limpiar imágenes no utilizadas
docker image prune

# Limpiar todo (cuidado!)
docker system prune -a --volumes
```
