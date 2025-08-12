package com.feedback.fb_analyzer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.feedback.fb_analyzer.model.FbAnalyzerModel;
import com.feedback.fb_analyzer.repository.FbAnalyzerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class FbAnalyzerService {

    private final ChatClient chatClient;
    private final ChatModel chatModel;
    private final FbAnalyzerRepository fbAnalyzerRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${company.name}")
    public String companyName;

    @Value("classpath:prompt/analyzer-prompt.st")
    public Resource prompt_template;

    public FbAnalyzerService(ChatClient.Builder chatClient, ChatModel chatModel, FbAnalyzerRepository fbAnalyzerRepository) {
        this.chatClient = chatClient.build();
        this.chatModel = chatModel;
        this.fbAnalyzerRepository = fbAnalyzerRepository;
    }

    public FbAnalyzerModel analyzeFeedback(MultipartFile file, String feedbackContent) throws JsonProcessingException {
        String summerizedImage = summerizeImage(file);
        String summerizedText = summerizeText(feedbackContent);
        log.info("Summarized Image: {}", summerizedImage);
        log.info("Summarized Text: {}", summerizedText);
        PromptTemplate promptTemplate = new PromptTemplate(prompt_template);
        Prompt prompt = promptTemplate.create(Map.of("COMPANY_NAME", companyName,
                "TEXT_SUMMARY", summerizedText,
                "IMAGE_SUMMARY", summerizedImage));

        String responseJson = chatClient
                .prompt(prompt)
                .call()
                .content();
        FbAnalyzerModel fbAnalyzerModel = objectMapper.readValue(responseJson, FbAnalyzerModel.class);
        fbAnalyzerRepository.save(fbAnalyzerModel);
        return fbAnalyzerModel;
    }

    public String summerizeText(String feedbackContent) {
        if (ObjectUtils.isEmpty(feedbackContent)) {
            return "NO_FEEDBACK_TEXT_PROVIDED";
        }
        String prompt = String.format("""
                You are an expert in analyzing feedback, and a product manager for this company %s.
                Analyze the following feedback text and provide a summary of the feedback.
                
                feedback text: %s
                
                only return the summary of the feedback.
                """, companyName, feedbackContent);
        return chatClient
                .prompt(prompt)
                .call()
                .content();
    }

    public String summerizeImage(MultipartFile file) {
        if (ObjectUtils.isEmpty(file)) {
            return "NO_FEEDBACK_IMAGE_PROVIDED";
        }
        String prompt = String.format("""
                You are an expert in analyzing feedback, and a product manager for this company %s.
                Analyze the image and provide a summary of the feedback.
                
                only return the summary of the feedback.
                """, companyName);
        return ChatClient
                .create(chatModel)
                .prompt().
                user(userSpec -> userSpec.text(prompt)
                        .media(MimeTypeUtils.IMAGE_JPEG, file.getResource()))
                .call().
                content();
    }

    public List<FbAnalyzerModel> getAllFeedbacks() {
        List<FbAnalyzerModel> fbAnalyzerModelList = fbAnalyzerRepository.findAll();
        return fbAnalyzerModelList;
    }

}
