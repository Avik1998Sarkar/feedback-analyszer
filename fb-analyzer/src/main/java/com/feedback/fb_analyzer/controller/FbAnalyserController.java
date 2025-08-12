package com.feedback.fb_analyzer.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.feedback.fb_analyzer.model.FbAnalyzerModel;
import com.feedback.fb_analyzer.service.FbAnalyzerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fb-analyser")
@CrossOrigin(origins = "http://localhost:5173/")
@Slf4j
public class FbAnalyserController {

    private final FbAnalyzerService fbAnalyzerService;

    @PostMapping
    public FbAnalyzerModel getFeedback(@RequestPart(value = "feedbackContent") String feedbackContent, @RequestPart(value = "file", required = false) MultipartFile file) throws JsonProcessingException {
        return fbAnalyzerService.analyzeFeedback(file, feedbackContent);
    }

    @GetMapping
    public List<FbAnalyzerModel> getAllFeedback(){
        return fbAnalyzerService.getAllFeedbacks();
    }

}
