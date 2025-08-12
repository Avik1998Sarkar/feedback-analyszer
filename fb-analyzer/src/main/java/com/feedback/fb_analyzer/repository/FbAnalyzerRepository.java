package com.feedback.fb_analyzer.repository;

import com.feedback.fb_analyzer.model.FbAnalyzerModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FbAnalyzerRepository extends JpaRepository<FbAnalyzerModel, Long> {
}
