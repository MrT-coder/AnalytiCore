package com.analyticore.analysis.service;

import com.analyticore.analysis.model.Job;
import com.analyticore.analysis.repository.JobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class TextAnalysisService {
    
    private static final Logger logger = LoggerFactory.getLogger(TextAnalysisService.class);
    
    @Autowired
    private JobRepository jobRepository;
    
    // Palabras positivas simples
    private static final Set<String> POSITIVE_WORDS = Set.of(
        "bueno", "excelente", "fantástico", "genial", "increíble", "maravilloso",
        "perfecto", "extraordinario", "magnífico", "espectacular", "feliz",
        "contento", "alegre", "satisfecho", "encantado", "positivo", "optimista",
        "good", "excellent", "fantastic", "great", "incredible", "wonderful",
        "perfect", "amazing", "magnificent", "spectacular", "happy", "glad",
        "pleased", "satisfied", "delighted", "positive", "optimistic"
    );
    
    // Palabras negativas simples
    private static final Set<String> NEGATIVE_WORDS = Set.of(
        "malo", "terrible", "horrible", "pésimo", "desastroso", "deplorable",
        "triste", "enojado", "furioso", "molesto", "disgustado", "negativo",
        "pesimista", "decepcionado", "frustrado", "infeliz",
        "bad", "awful", "disastrous", "sad", "angry", "furious", 
        "upset", "disgusted", "negative", "pessimistic", "disappointed", 
        "frustrated", "unhappy"
    );
    
    // Palabras de parada que no son relevantes como palabras clave
    private static final Set<String> STOP_WORDS = Set.of(
        "el", "la", "de", "que", "y", "a", "en", "un", "es", "se", "no", "te", "lo",
        "le", "da", "su", "por", "son", "con", "para", "como", "las", "del", "los",
        "una", "sus", "me", "ha", "ya", "muy", "mi", "si", "mas", "pero", "ese",
        "the", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
        "with", "by", "is", "are", "was", "were", "be", "been", "have", "has", "had",
        "do", "does", "did", "will", "would", "could", "should", "may", "might"
    );
    
    public void analyzeText(UUID jobId, String text) {
        logger.info("Starting analysis for job: {}", jobId);
        
        try {
            Optional<Job> jobOpt = jobRepository.findById(jobId);
            if (jobOpt.isEmpty()) {
                logger.error("Job not found: {}", jobId);
                return;
            }
            
            Job job = jobOpt.get();
            job.setStatus("PROCESANDO");
            jobRepository.save(job);
            
            // Simular tiempo de procesamiento
            Thread.sleep(2000);
            
            // Realizar análisis de sentimientos
            SentimentResult sentiment = analyzeSentiment(text);
            
            // Extraer palabras clave
            List<String> keywords = extractKeywords(text);
            
            // Actualizar job con resultados
            job.setSentiment(sentiment.getSentiment());
            job.setConfidence(sentiment.getConfidence());
            job.setKeywords(keywords);
            job.setStatus("COMPLETADO");
            
            jobRepository.save(job);
            
            logger.info("Analysis completed for job: {}", jobId);
            
        } catch (Exception e) {
            logger.error("Error analyzing text for job {}: {}", jobId, e.getMessage());
            
            // Marcar como error
            try {
                Optional<Job> jobOpt = jobRepository.findById(jobId);
                if (jobOpt.isPresent()) {
                    Job job = jobOpt.get();
                    job.setStatus("ERROR");
                    jobRepository.save(job);
                }
            } catch (Exception saveError) {
                logger.error("Error saving error status: {}", saveError.getMessage());
            }
        }
    }
    
    private SentimentResult analyzeSentiment(String text) {
        String cleanText = text.toLowerCase().replaceAll("[^a-záéíóúñ\\s]", " ");
        String[] words = cleanText.split("\\s+");
        
        int positiveCount = 0;
        int negativeCount = 0;
        
        for (String word : words) {
            word = word.trim();
            if (POSITIVE_WORDS.contains(word)) {
                positiveCount++;
            } else if (NEGATIVE_WORDS.contains(word)) {
                negativeCount++;
            }
        }
        
        String sentiment;
        double confidence;
        
        if (positiveCount > negativeCount) {
            sentiment = "POSITIVO";
            confidence = Math.min(0.95, 0.6 + (double)(positiveCount - negativeCount) / words.length * 2);
        } else if (negativeCount > positiveCount) {
            sentiment = "NEGATIVO";
            confidence = Math.min(0.95, 0.6 + (double)(negativeCount - positiveCount) / words.length * 2);
        } else {
            sentiment = "NEUTRAL";
            confidence = 0.5 + Math.random() * 0.2; // Confianza aleatoria entre 0.5 y 0.7
        }
        
        return new SentimentResult(sentiment, confidence);
    }
    
    private List<String> extractKeywords(String text) {
        // Limpiar texto y dividir en palabras
        String cleanText = text.toLowerCase()
            .replaceAll("[^a-záéíóúñ\\s]", " ")
            .replaceAll("\\s+", " ");
        
        String[] words = cleanText.trim().split(" ");
        
        // Contar frecuencia de palabras (excluyendo stop words)
        Map<String, Integer> wordCount = new HashMap<>();
        
        for (String word : words) {
            word = word.trim();
            if (word.length() > 2 && !STOP_WORDS.contains(word)) {
                wordCount.put(word, wordCount.getOrDefault(word, 0) + 1);
            }
        }
        
        // Ordenar por frecuencia y tomar las top 5
        return wordCount.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(5)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
    
    private static class SentimentResult {
        private final String sentiment;
        private final double confidence;
        
        public SentimentResult(String sentiment, double confidence) {
            this.sentiment = sentiment;
            this.confidence = confidence;
        }
        
        public String getSentiment() {
            return sentiment;
        }
        
        public double getConfidence() {
            return confidence;
        }
    }
}
