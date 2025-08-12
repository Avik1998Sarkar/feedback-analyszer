# Feedback Analysis Backend

This is the backend service for the Feedback Analysis project. It is built using **Spring Boot** and uses **H2 in-memory database** to store feedback data. The backend exposes REST APIs for submitting feedback (text and optional file) and retrieving stored feedbacks.

---

## Tech Stack

- Java Spring Boot
- H2 In-Memory Database
- Lombok
- Jackson (for JSON processing)
- IntelliJ IDEA (IDE)
- Postman (for API testing)

---

## Features

- Accept feedback as text and optional file upload
- Analyze feedback content using AI service
- Store feedback results in H2 database
- Retrieve all stored feedbacks via API

---

## API Endpoints

### POST `/api/fb-analyser`

Submit feedback for analysis.

- Request: multipart form-data with fields:
  - `feedbackContent` (String) — the feedback text
  - `file` (optional MultipartFile) — an optional file attachment
- Response: JSON object representing analyzed feedback

### GET `/api/fb-analyser`

Fetch all stored feedback entries.

- Response: JSON array of feedback objects

---

## Setup & Run

1. Clone the repository  
2. Open the backend project in **IntelliJ IDEA**  
3. Build and run the Spring Boot application  
4. The app runs on `http://localhost:8080` by default  
5. Use **Postman** to test the API endpoints  
   - Postman collection is available in the root directory of the repo

---

## Notes

- CORS is enabled for frontend running on `http://localhost:5173`  
- Feedback data is stored temporarily in H2 in-memory database (data resets on app restart)  
- The backend expects feedback content as a multipart request to support file upload  

---

## Running Commands

Run the backend with:

```bash
./mvnw spring-boot:run
