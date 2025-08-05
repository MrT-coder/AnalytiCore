# Diagramas de Capas por Componente

## 1. Frontend React - Arquitectura por Capas

```mermaid
graph TB
    subgraph "Capa de Presentación"
        UI[Componentes UI<br/>- App.js<br/>- Formularios<br/>- Visualización de resultados]
        CSS[Estilos<br/>- App.css<br/>- Responsive Design<br/>- Animaciones]
    end
    
    subgraph "Capa de Lógica de Negocio"
        STATE[Gestión de Estado<br/>- useState hooks<br/>- Estado local<br/>- Polling logic]
        VALID[Validaciones<br/>- Texto no vacío<br/>- Formato de entrada]
    end
    
    subgraph "Capa de Servicios"
        HTTP[Cliente HTTP<br/>- Axios<br/>- API calls<br/>- Error handling]
        API[Integración API<br/>- /api/submit<br/>- /api/status<br/>- Polling automático]
    end
    
    subgraph "Capa de Infraestructura"
        BUILD[Build System<br/>- React Scripts<br/>- Webpack<br/>- Optimización]
        NGINX[Servidor Web<br/>- Nginx<br/>- Archivos estáticos<br/>- SPA routing]
    end
    
    UI --> STATE
    CSS --> UI
    STATE --> VALID
    STATE --> HTTP
    HTTP --> API
    BUILD --> NGINX
    
    classDef presentation fill:#e3f2fd
    classDef business fill:#fff3e0
    classDef service fill:#f3e5f5
    classDef infrastructure fill:#e8f5e8
    
    class UI,CSS presentation
    class STATE,VALID business
    class HTTP,API service
    class BUILD,NGINX infrastructure
```

## 2. Python Service - Arquitectura por Capas

```mermaid
graph TB
    subgraph "Capa de Presentación (API)"
        REST[Endpoints REST<br/>- /api/submit<br/>- /api/status<br/>- /health]
        CORS[Configuración CORS<br/>- Cross-origin requests<br/>- Headers de seguridad]
    end
    
    subgraph "Capa de Lógica de Negocio"
        VALID[Validaciones<br/>- Texto requerido<br/>- Formato UUID<br/>- Longitud mínima]
        ORCH[Orquestación<br/>- Crear trabajo<br/>- Notificar Java service<br/>- Gestión de estados]
    end
    
    subgraph "Capa de Servicios"
        HTTP_CLIENT[Cliente HTTP<br/>- Requests library<br/>- Llamadas a Java service<br/>- Timeout handling]
        DB_SERVICE[Servicio de BD<br/>- Conexiones PostgreSQL<br/>- Operaciones CRUD<br/>- Transacciones]
    end
    
    subgraph "Capa de Datos"
        PSYCOPG[PostgreSQL Driver<br/>- psycopg2<br/>- Connection pooling<br/>- SQL queries]
        MODEL[Modelo de Datos<br/>- Tabla jobs<br/>- UUID management<br/>- Timestamps]
    end
    
    subgraph "Capa de Infraestructura"
        FLASK[Flask Framework<br/>- WSGI server<br/>- Routing<br/>- Middleware]
        GUNICORN[Gunicorn Server<br/>- Production server<br/>- Workers<br/>- Process management]
    end
    
    REST --> VALID
    CORS --> REST
    VALID --> ORCH
    ORCH --> HTTP_CLIENT
    ORCH --> DB_SERVICE
    DB_SERVICE --> PSYCOPG
    PSYCOPG --> MODEL
    FLASK --> GUNICORN
    
    classDef presentation fill:#e3f2fd
    classDef business fill:#fff3e0
    classDef service fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef infrastructure fill:#fafafa
    
    class REST,CORS presentation
    class VALID,ORCH business
    class HTTP_CLIENT,DB_SERVICE service
    class PSYCOPG,MODEL data
    class FLASK,GUNICORN infrastructure
```

## 3. Java Service - Arquitectura por Capas

```mermaid
graph TB
    subgraph "Capa de Presentación (Controllers)"
        CTRL[Analysis Controller<br/>- @RestController<br/>- /api/analyze<br/>- /api/health]
        VALID_REQ[Validación de Requests<br/>- @RequestBody<br/>- UUID validation<br/>- Error handling]
    end
    
    subgraph "Capa de Lógica de Negocio (Services)"
        ANALYSIS[Text Analysis Service<br/>- Análisis de sentimientos<br/>- Extracción de keywords<br/>- Algoritmos de procesamiento]
        ASYNC[Procesamiento Asíncrono<br/>- CompletableFuture<br/>- Thread management<br/>- Background processing]
    end
    
    subgraph "Capa de Servicios"
        NLP[Procesamiento NLP<br/>- Limpieza de texto<br/>- Tokenización<br/>- Stop words removal]
        SENTIMENT[Motor de Sentimientos<br/>- Diccionarios positivos/negativos<br/>- Scoring algorithm<br/>- Confidence calculation]
    end
    
    subgraph "Capa de Datos (Repository)"
        JPA[JPA Repository<br/>- @Repository<br/>- CRUD operations<br/>- Query methods]
        ENTITY[Job Entity<br/>- @Entity mapping<br/>- UUID primary key<br/>- Relationship management]
    end
    
    subgraph "Capa de Infraestructura"
        SPRING[Spring Boot<br/>- Auto-configuration<br/>- Dependency injection<br/>- Application context]
        HIBERNATE[Hibernate ORM<br/>- Entity management<br/>- Database abstraction<br/>- Connection pooling]
        POSTGRES[PostgreSQL Driver<br/>- JDBC driver<br/>- Connection management<br/>- SQL execution]
    end
    
    CTRL --> VALID_REQ
    VALID_REQ --> ANALYSIS
    ANALYSIS --> ASYNC
    ASYNC --> NLP
    ASYNC --> SENTIMENT
    ANALYSIS --> JPA
    JPA --> ENTITY
    SPRING --> HIBERNATE
    HIBERNATE --> POSTGRES
    
    classDef presentation fill:#e3f2fd
    classDef business fill:#fff3e0
    classDef service fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef infrastructure fill:#fafafa
    
    class CTRL,VALID_REQ presentation
    class ANALYSIS,ASYNC business
    class NLP,SENTIMENT service
    class JPA,ENTITY data
    class SPRING,HIBERNATE,POSTGRES infrastructure
```

## Separación de Responsabilidades

### Frontend React
- **Presentación**: Renderizado de UI y manejo de eventos
- **Estado**: Gestión de estado local y comunicación con APIs
- **Validación**: Validaciones del lado cliente
- **Infraestructura**: Optimización y servido de archivos estáticos

### Python Service (API Gateway)
- **Orquestación**: Coordinación entre frontend y servicios backend
- **Validación**: Validaciones de negocio y formato
- **Persistencia**: Gestión de estado de trabajos
- **Comunicación**: Interface con servicios externos

### Java Service (Worker)
- **Procesamiento**: Análisis intensivo de texto
- **Algoritmos**: Implementación de lógica de NLP
- **Persistencia**: Actualización de resultados
- **Concurrencia**: Manejo de múltiples trabajos simultáneos

Esta arquitectura en capas asegura:
- **Bajo acoplamiento** entre componentes
- **Alta cohesión** dentro de cada capa  
- **Testabilidad** independiente de cada capa
- **Mantenibilidad** y evolución controlada
- **Escalabilidad** horizontal por servicio
