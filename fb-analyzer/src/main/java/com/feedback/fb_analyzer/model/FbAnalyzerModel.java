package com.feedback.fb_analyzer.model;

import lombok.Data;
import lombok.ToString;

@Data
public class FbAnalyzerModel {
    String summary;
    String sentiment_type;
    String score;
    String based_on;
}
