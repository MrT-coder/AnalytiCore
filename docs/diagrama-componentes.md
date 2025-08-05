# Diagrama de Componentes - AnalytiCore

```mermaid
graph TB
    subgraph "Cliente"
        U[Usuario] 
    end
    
    subgraph "Capa de Presentación"
        F[Frontend React<br/>Puerto: 80<br/>Nginx + SPA]
    end
    
    subgraph "Capa de Servicios"
        P[Servicio de Submisión<br/>Python Flask<br/>Puerto: 5000<br/>API REST]
        J[Servicio de Análisis<br/>Java Spring Boot<br/>Puerto: 8080<br/>Worker Service]
    end
    
    subgraph "Capa de Datos"
        DB[(PostgreSQL<br/>Base de Datos<br/>Estado de Trabajos)]
    end
    
    subgraph "Infraestructura"
        D1[Docker Container<br/>Frontend]
        D2[Docker Container<br/>Python Service]
        D3[Docker Container<br/>Java Service]
        D4[Docker Container<br/>PostgreSQL]
    end
    
    U -->|HTTP/HTTPS| F
    F -->|API REST| P
    P -->|API REST Interna| J
    P -->|SQL| DB
    J -->|SQL| DB
    
    F -.->|Containerizado| D1
    P -.->|Containerizado| D2
    J -.->|Containerizado| D3
    DB -.->|Containerizado| D4
    
    classDef frontend fill:#e1f5fe
    classDef python fill:#fff3e0
    classDef java fill:#f3e5f5
    classDef database fill:#e8f5e8
    classDef infrastructure fill:#fafafa
    
    class F frontend
    class P python
    class J java
    class DB database
    class D1,D2,D3,D4 infrastructure
```

## Flujo de Datos

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend React
    participant P as Python Service
    participant J as Java Service
    participant DB as PostgreSQL
    
    U->>F: 1. Envía texto
    F->>P: 2. POST /api/submit {text}
    P->>DB: 3. INSERT job (PENDIENTE)
    P->>J: 4. POST /api/analyze {jobId, text}
    P->>F: 5. Respuesta {jobId}
    F->>U: 6. Muestra jobId
    
    J->>DB: 7. UPDATE status=PROCESANDO
    Note over J: 8. Análisis de sentimientos<br/>y palabras clave
    J->>DB: 9. UPDATE resultados, status=COMPLETADO
    
    loop Polling cada 2s
        F->>P: 10. GET /api/status/{jobId}
        P->>DB: 11. SELECT job status
        P->>F: 12. Respuesta {status, results}
    end
    
    F->>U: 13. Muestra resultados
```

## Tecnologías por Componente

| Componente | Tecnología Principal | Puerto | Responsabilidad |
|------------|---------------------|---------|-----------------|
| Frontend | React 18 + Nginx | 80 | Interfaz de usuario |
| Python Service | Flask + Gunicorn | 5000 | API Gateway, Orquestación |
| Java Service | Spring Boot 3 | 8080 | Procesamiento de análisis |
| Base de Datos | PostgreSQL 15 | 5432 | Persistencia de estado |
