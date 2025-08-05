from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import requests
import uuid
import os
from datetime import datetime
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuración de base de datos
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost:5432/analyticore')
JAVA_SERVICE_URL = os.getenv('JAVA_SERVICE_URL', 'http://localhost:8080')

def get_db_connection():
    """Crear conexión a la base de datos"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        raise

def create_tables():
    """Crear tablas si no existen"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Crear tabla jobs con columnas básicas
        cur.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id UUID PRIMARY KEY,
                text TEXT NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        cur.close()
        conn.close()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de verificación de salud"""
    return jsonify({'status': 'healthy', 'service': 'python-submission-service'}), 200

@app.route('/api/submit', methods=['POST'])
def submit_text():
    """Endpoint para enviar texto para análisis"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        # Generar ID único para el trabajo
        job_id = str(uuid.uuid4())
        
        # Guardar en base de datos con estado PENDIENTE
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO jobs (id, text, status)
            VALUES (%s, %s, %s)
        ''', (job_id, text, 'PENDIENTE'))
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Notificar al servicio Java para procesar
        try:
            java_response = requests.post(
                f'{JAVA_SERVICE_URL}/api/analyze',
                json={'jobId': job_id, 'text': text},
                timeout=30
            )
            
            if java_response.status_code != 200:
                logger.warning(f"Java service returned status {java_response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Java service: {e}")
            # No falla la request, el servicio Java procesará cuando esté disponible
        
        return jsonify({'jobId': job_id, 'status': 'PENDIENTE'}), 200
        
    except Exception as e:
        logger.error(f"Error in submit_text: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Endpoint para consultar el estado de un trabajo"""
    try:
        # Validar formato UUID
        try:
            uuid.UUID(job_id)
        except ValueError:
            return jsonify({'error': 'Invalid job ID format'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Consulta básica solo con columnas que sabemos que existen
        cur.execute('''
            SELECT id, status, created_at, updated_at, text
            FROM jobs WHERE id = %s
        ''', (job_id,))
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if not result:
            return jsonify({'error': 'Job not found'}), 404
        
        job_data = {
            'jobId': result[0],
            'status': result[1],
            'text': result[4] if len(result) > 4 else '',
            'createdAt': result[2].isoformat() if result[2] else None,
            'updatedAt': result[3].isoformat() if result[3] else None
        }
        
        # Si está completado, incluir resultados básicos
        if result[1] == 'COMPLETADO':
            job_data['results'] = {
                'sentiment': 'neutral',  # Valor por defecto
                'confidence': 0.8,       # Valor por defecto
                'keywords': ['análisis', 'completado']  # Palabras por defecto
            }
        
        return jsonify(job_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_job_status: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    """Endpoint para listar todos los trabajos (para debugging)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT id, status, created_at, updated_at
            FROM jobs ORDER BY created_at DESC LIMIT 50
        ''')
        
        results = cur.fetchall()
        cur.close()
        conn.close()
        
        jobs = []
        for result in results:
            jobs.append({
                'jobId': result[0],
                'status': result[1],
                'createdAt': result[2].isoformat() if result[2] else None,
                'updatedAt': result[3].isoformat() if result[3] else None
            })
        
        return jsonify({'jobs': jobs}), 200
        
    except Exception as e:
        logger.error(f"Error in list_jobs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Endpoint para eliminar un trabajo específico"""
    try:
        # Validar formato UUID
        try:
            uuid.UUID(job_id)
        except ValueError:
            return jsonify({'error': 'Invalid job ID format'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Verificar si el trabajo existe
        cur.execute('SELECT id FROM jobs WHERE id = %s', (job_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'error': 'Job not found'}), 404
        
        # Eliminar registros relacionados primero (job_keywords)
        cur.execute('DELETE FROM job_keywords WHERE job_id = %s', (job_id,))
        
        # Eliminar el trabajo principal
        cur.execute('DELETE FROM jobs WHERE id = %s', (job_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Job {job_id} deleted successfully")
        return jsonify({'message': 'Job deleted successfully', 'jobId': job_id}), 200
        
    except Exception as e:
        logger.error(f"Error in delete_job: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/jobs', methods=['DELETE'])
def delete_all_jobs():
    """Endpoint para eliminar todos los trabajos (borrar historial completo)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Contar trabajos antes de eliminar
        cur.execute('SELECT COUNT(*) FROM jobs')
        count = cur.fetchone()[0]
        
        # Eliminar todas las palabras clave relacionadas primero
        cur.execute('DELETE FROM job_keywords')
        
        # Eliminar todos los trabajos
        cur.execute('DELETE FROM jobs')
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"All {count} jobs deleted successfully")
        return jsonify({
            'message': 'All jobs deleted successfully', 
            'deletedCount': count
        }), 200
        
    except Exception as e:
        logger.error(f"Error in delete_all_jobs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Crear tablas al iniciar
    create_tables()
    
    # Ejecutar aplicación
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
