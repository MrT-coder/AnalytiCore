import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://analyticore-python-service-we7h.onrender.com';

function App() {
  // Estados para el formulario de envío
  const [text, setText] = useState('');
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para la lista de trabajos
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' o 'jobs'
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Cargar lista de trabajos cuando se cambia a la pestaña de trabajos
  useEffect(() => {
    if (activeTab === 'jobs') {
      loadJobs();
    }
  }, [activeTab]);

  // Cargar trabajos desde el servidor
  const loadJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs`);
      setJobs(response.data.jobs || []);
    } catch (err) {
      console.error('Error cargando trabajos:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  // Ver detalles de un trabajo específico
  const viewJobDetails = async (jobId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/status/${jobId}`);
      setSelectedJob(response.data);
      setShowModal(true);
    } catch (err) {
      setError('Error al cargar detalles del trabajo: ' + (err.response?.data?.error || err.message));
    }
  };

  // Eliminar un trabajo específico
  const deleteJob = async (jobId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este análisis?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/jobs/${jobId}`);
      setJobs(jobs.filter(job => job.jobId !== jobId));
      
      // Si el trabajo eliminado es el que está en el modal, cerrarlo
      if (selectedJob && selectedJob.jobId === jobId) {
        setShowModal(false);
        setSelectedJob(null);
      }
      
      setError('');
    } catch (err) {
      setError('Error al eliminar el análisis: ' + (err.response?.data?.error || err.message));
    }
  };

  // Eliminar todos los trabajos (borrar historial completo)
  const deleteAllJobs = async () => {
    if (!window.confirm('¿Estás seguro de que quieres borrar TODO el historial? Esta acción no se puede deshacer.')) {
      return;
    }

    if (!window.confirm('Esta acción eliminará TODOS los análisis. ¿Confirmas que quieres continuar?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/jobs`);
      setJobs([]);
      setShowModal(false);
      setSelectedJob(null);
      setError('');
      
      // Mostrar mensaje de confirmación
      alert(`Historial borrado exitosamente. Se eliminaron ${response.data.deletedCount} análisis.`);
    } catch (err) {
      setError('Error al borrar el historial: ' + (err.response?.data?.error || err.message));
    }
  };

  const submitText = async () => {
    if (!text.trim()) {
      setError('Por favor, ingresa un texto para analizar');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/submit`, {
        text: text
      });
      
      const newJobId = response.data.jobId;
      setJobId(newJobId);
      setStatus('PENDIENTE');
      
      // Comenzar a consultar el estado
      pollJobStatus(newJobId);
      
      // Actualizar lista de trabajos si estamos en esa pestaña
      if (activeTab === 'jobs') {
        loadJobs();
      }
    } catch (err) {
      setError('Error al enviar el texto: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const pollJobStatus = async (jobIdToCheck) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/status/${jobIdToCheck}`);
      const jobStatus = response.data.status;
      setStatus(jobStatus);

      if (jobStatus === 'COMPLETADO') {
        setResults(response.data.results);
        setLoading(false);
      } else if (jobStatus === 'ERROR') {
        setError('Error en el procesamiento del texto');
        setLoading(false);
      } else {
        // Continuar consultando cada 2 segundos
        setTimeout(() => pollJobStatus(jobIdToCheck), 2000);
      }
    } catch (err) {
      setError('Error al consultar el estado: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const resetForm = () => {
    setText('');
    setJobId(null);
    setStatus('');
    setResults(null);
    setLoading(false);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETADO': return '#4CAF50';
      case 'PROCESANDO': return '#FF9800';
      case 'PENDIENTE': return '#2196F3';
      case 'ERROR': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AnalytiCore</h1>
        <p>Plataforma de Análisis de Sentimientos y Palabras Clave</p>
        
        {/* Navegación por pestañas */}
        <div className="tab-navigation">
          <button 
            className={`tab ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveTab('submit')}
          >
            Nuevo Análisis
          </button>
          <button 
            className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            Mis Análisis
          </button>
        </div>
      </header>

      <main className="App-main">
        {/* Pestaña de envío de textos */}
        {activeTab === 'submit' && (
          <div className="submit-tab">
            <div className="input-section">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ingresa el texto que deseas analizar..."
                rows={6}
                cols={50}
                disabled={loading}
              />
              <div className="button-section">
                <button 
                  onClick={submitText} 
                  disabled={loading || !text.trim()}
                  className="submit-btn"
                >
                  {loading ? 'Analizando...' : 'Analizar Texto'}
                </button>
                <button 
                  onClick={resetForm} 
                  className="reset-btn"
                  disabled={loading}
                >
                  Nuevo Análisis
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {jobId && (
              <div className="status-section">
                <p><strong>ID del Trabajo:</strong> {jobId}</p>
                <p><strong>Estado:</strong> <span className={`status ${status.toLowerCase()}`}>{status}</span></p>
              </div>
            )}

            {results && (
              <div className="results-section">
                <h2>Resultados del Análisis</h2>
                <div className="results-grid">
                  <div className="sentiment-result">
                    <h3>Análisis de Sentimientos</h3>
                    <div className={`sentiment ${results.sentiment.toLowerCase()}`}>
                      {results.sentiment}
                    </div>
                    <p>Confianza: {(results.confidence * 100).toFixed(1)}%</p>
                  </div>
                  
                  <div className="keywords-result">
                    <h3>Palabras Clave</h3>
                    <div className="keywords-list">
                      {results.keywords && results.keywords.map((keyword, index) => (
                        <span key={index} className="keyword-tag">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña de lista de trabajos */}
        {activeTab === 'jobs' && (
          <div className="jobs-tab">
            <div className="jobs-header">
              <h2>Mis Análisis</h2>
              <div className="jobs-actions">
                <button onClick={loadJobs} className="refresh-btn" disabled={jobsLoading}>
                  {jobsLoading ? 'Cargando...' : 'Actualizar'}
                </button>
                {jobs.length > 0 && (
                  <button onClick={deleteAllJobs} className="delete-all-btn">
                    🗑️ Borrar Historial
                  </button>
                )}
              </div>
            </div>

            {jobsLoading ? (
              <div className="loading-message">
                <p>Cargando trabajos...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="empty-message">
                <p>No hay análisis realizados aún.</p>
                <button onClick={() => setActiveTab('submit')} className="submit-btn">
                  Crear Primer Análisis
                </button>
              </div>
            ) : (
              <div className="jobs-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Estado</th>
                      <th>Fecha Creación</th>
                      <th>Última Actualización</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.jobId}>
                        <td className="job-id">{job.jobId.substring(0, 8)}...</td>
                        <td>
                          <span 
                            className="status-badge" 
                            style={{ backgroundColor: getStatusColor(job.status) }}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td>{formatDate(job.createdAt)}</td>
                        <td>{formatDate(job.updatedAt)}</td>
                        <td>
                          <div className="job-actions">
                            <button 
                              onClick={() => viewJobDetails(job.jobId)}
                              className="view-btn"
                              title="Ver detalles del análisis"
                            >
                              👁️ Ver
                            </button>
                            <button 
                              onClick={() => deleteJob(job.jobId)}
                              className="delete-btn"
                              title="Eliminar este análisis"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal para ver detalles del trabajo */}
        {showModal && selectedJob && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detalles del Análisis</h2>
                <div className="modal-header-actions">
                  <button 
                    onClick={() => deleteJob(selectedJob.jobId)} 
                    className="delete-btn modal-delete-btn"
                    title="Eliminar este análisis"
                  >
                    🗑️ Eliminar
                  </button>
                  <button onClick={closeModal} className="close-btn">&times;</button>
                </div>
              </div>
              
              <div className="modal-body">
                <div className="job-info">
                  <p><strong>ID:</strong> {selectedJob.jobId}</p>
                  <p><strong>Estado:</strong> 
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(selectedJob.status) }}
                    >
                      {selectedJob.status}
                    </span>
                  </p>
                  <p><strong>Fecha de Creación:</strong> {formatDate(selectedJob.createdAt)}</p>
                  <p><strong>Última Actualización:</strong> {formatDate(selectedJob.updatedAt)}</p>
                </div>

                {selectedJob.text && (
                  <div className="text-section">
                    <h3>Texto Analizado</h3>
                    <div className="text-content">
                      {selectedJob.text}
                    </div>
                  </div>
                )}

                {selectedJob.results && (
                  <div className="results-section">
                    <h3>Resultados del Análisis</h3>
                    <div className="results-grid">
                      <div className="sentiment-result">
                        <h4>Sentimiento</h4>
                        <div className={`sentiment ${selectedJob.results.sentiment.toLowerCase()}`}>
                          {selectedJob.results.sentiment}
                        </div>
                        <p>Confianza: {(selectedJob.results.confidence * 100).toFixed(1)}%</p>
                      </div>
                      
                      <div className="keywords-result">
                        <h4>Palabras Clave</h4>
                        <div className="keywords-list">
                          {selectedJob.results.keywords && selectedJob.results.keywords.map((keyword, index) => (
                            <span key={index} className="keyword-tag">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedJob.status === 'PENDIENTE' && (
                  <div className="pending-message">
                    <p>El análisis está siendo procesado. Por favor, espera unos momentos.</p>
                  </div>
                )}

                {selectedJob.status === 'ERROR' && (
                  <div className="error-message">
                    <p>Ocurrió un error durante el procesamiento del texto.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
