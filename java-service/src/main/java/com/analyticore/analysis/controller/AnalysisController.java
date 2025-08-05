package com.analyticore.analysis.controller;

import com.analyticore.analysis.service.TextAnalysisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AnalysisController {
    
    private static final Logger logger = LoggerFactory.getLogger(AnalysisController.class);
    
    @Autowired
    private TextAnalysisService textAnalysisService;
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "java-analysis-service"
        ));
    }
    
    @PostMapping("/analyze")
    public ResponseEntity<Map<String, String>> analyzeText(@RequestBody Map<String, String> request) {
        try {
            String jobIdStr = request.get("jobId");
            String text = request.get("text");
            
            if (jobIdStr == null || text == null) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "jobId and text are required")
                );
            }
            
            UUID jobId = UUID.fromString(jobIdStr);
            
            logger.info("Received analysis request for job: {}", jobId);
            
            // Procesar de forma asíncrona
            CompletableFuture.runAsync(() -> {
                textAnalysisService.analyzeText(jobId, text);
            });
            
            return ResponseEntity.ok(Map.of(
                "message", "Analysis started",
                "jobId", jobIdStr
            ));
            
        } catch (IllegalArgumentException e) {
            logger.error("Invalid UUID format: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                Map.of("error", "Invalid jobId format")
            );
        } catch (Exception e) {
            logger.error("Error processing analysis request: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Internal server error")
            );
        }
    }
}
