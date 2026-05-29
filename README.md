# DocVault: Document Management Dashboard

A full-stack, real-time Document Management Dashboard built with **React** and **Spring Boot**, featuring smart bulk file uploads, real-time WebSocket notifications, and comprehensive unit and integration testing suites.

---

## 1. Project Overview

DocVault is designed to manage files efficiently with the following key features:
*   **File Uploads & Storage**: Secure single file uploads with progress tracking and persistent disk storage.
*   **Smart Bulk Uploads**: Intelligently routes bulk uploads based on batch size:
    *   **Small Batches (≤ 3 files)**: Processed synchronously inline.
    *   **Large Batches (> 3 files)**: Processed asynchronously in the background.
*   **WebSocket Notification Center**: Real-time push notifications delivered via a WebSocket connection. Features an interactive Notification Center dropdown in the header displaying styled alerts based on notification types:
    *   `SUCCESS` (Green)
    *   `ERROR` (Red)
    *   `WARNING` (Orange)
    *   `INFO` (Blue)
*   **Toast Notifications**: Animated sliding toast alerts in the bottom-right corner for immediate feedback.
*   **Robust Test Suites**: Comprehensive test coverage spanning the backend controllers/services and frontend components.

---

## 2. Tech Stack

### Backend
*   **Framework**: Spring Boot 3.1.6
*   **Language**: Java 17 / 23
*   **Database**: MySQL 8.x (Production) & H2 (In-Memory for Tests)
*   **Persistence**: Spring Data JPA & Hibernate
*   **Real-time Communication**: Native WebSocket & Spring STOMP messaging
*   **Testing**: JUnit 5, Mockito

### Frontend
*   **Framework**: React 18 (Vite-powered)
*   **Logic & Styling**: Vanilla CSS & Custom React Context Hooks
*   **HTTP Client**: Axios
*   **Upload Utilities**: `react-dropzone`
*   **Testing**: Jest, React Testing Library (RTL), `@babel` compiler presets

---

## 3. Prerequisites

Before setting up the project, make sure you have the following installed:
*   **Java**: JDK 17 or higher (fully compatible up to JDK 23)
*   **Node.js**: v18.x or higher
*   **MySQL**: 8.x or higher
*   **Maven**: 3.8+ (or use the provided Maven wrapper `mvnw`)

---

## 4. Backend Setup

### Step 1: Initialize the MySQL Database
Log into your MySQL CLI or workbench and create the database:
```sql
CREATE DATABASE doc_management;
```

### Step 2: Configure Database Credentials
Open `backend/src/main/resources/application.properties` and verify your MySQL connection settings:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/doc_management?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### Step 3: Run the Application
Navigate to the `backend` folder and run Spring Boot:
```bash
cd backend
# On Windows
.\mvnw.cmd spring-boot:run

# On Linux/macOS
./mvnw spring-boot:run
```
The server starts on `http://localhost:8080`.

---

## 5. Frontend Setup

### Step 1: Install Dependencies
Navigate to the `frontend` folder and install all package dependencies:
```bash
cd frontend
npm install
```

### Step 2: Start the Development Server
Run Vite's dev server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. How to Run Tests

### Backend Unit & Integration Tests (JUnit 5 + Mockito)
Backend tests run against an **H2 in-memory database** using the configurations defined in `src/test/resources/application-test.properties`.

Run the test suite:
```bash
cd backend
.\mvnw.cmd test
```

#### Backend Test Coverage
1.  **`DocumentControllerTest`**:
    *   Verifies `getAllDocuments` returns 200 OK with a list (or an empty list if no docs).
    *   Verifies `uploadSingleFile` returns 200 OK for valid files and 400 Bad Request if the file is empty.
    *   Verifies routing logic of `uploadBulk`: returns 200 for ≤3 files (processed inline) and 202 Accepted for >3 files (async background processing). Returns 400 for 0 files.
    *   Verifies `deleteDocument` return status (200 OK).
2.  **`NotificationControllerTest`**:
    *   Verifies notification counts and list fetches.
    *   Verifies that `markAsRead` and `deleteNotification` return 200 OK on success and 404 Not Found if the item doesn't exist.
3.  **`DocumentServiceTest`**:
    *   Verifies service-layer rules: checking empty files (never calling storage), handling file write errors (marks document status as `FAILED`), creating INFO notifications on bulk init, mapping entities to DTO responses, and performing file delete cleanups.

---

### Frontend Component Tests (React Testing Library + Jest)
Frontend tests are written using React Testing Library and run with Jest.

Run the test suite:
```bash
cd frontend
npm test
```

#### Frontend Test Coverage
1.  **`UploadZone.test.jsx`**:
    *   Verifies that the drag-and-drop zone renders with the correct helper instructions.
    *   Checks that dropped files are correctly parsed and listed with per-file status badges/percentage metrics.
    *   Verifies progress bars fill dynamically during active uploads.
    *   Checks that bulk upload banners are triggered for >3 files.
    *   Verifies the callback `onUploadComplete` is called once all uploads finalize.
2.  **`NotificationPanel.test.jsx`**:
    *   Verifies the Bell Icon renders correctly with the red numeric badge.
    *   Confirms the badge disappears when the unread count is `0`.
    *   Confirms clicking the Bell button toggles the absolute-positioned `NotificationPanel` open/closed.
    *   Asserts notification items map type-specific emojis, message text, relative time, and trigger `markAsRead` upon click.
    *   Confirms empty state is displayed when the list is empty.

---

## 7. API Reference

All requests must be directed to `http://localhost:8080/api`.

| Method | Endpoint | Description | Response Codes |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/documents` | Retrieves all documents ordered by uploaded time (newest first). | `200 OK` |
| **POST** | `/api/documents/upload` | Uploads a single file (multipart form data). | `200 OK`, `400 Bad Request` |
| **POST** | `/api/documents/upload/bulk` | Intelligent bulk file uploader. | `200 OK` (≤3 files), `202 Accepted` (>3 files), `400 Bad Request` |
| **GET** | `/api/documents/{id}/download` | Streams the original document file as an attachment. | `200 OK`, `404 Not Found` |
| **DELETE** | `/api/documents/{id}` | Deletes the document record and removes the file from disk. | `200 OK`, `404 Not Found` |
| **GET** | `/api/notifications` | Retrieves all notifications ordered by creation time (newest first). | `200 OK` |
| **GET** | `/api/notifications/unread-count` | Returns the total count of unread notifications. | `200 OK` |
| **PUT** | `/api/notifications/{id}/read` | Marks a single notification as read. | `200 OK`, `404 Not Found` |
| **PUT** | `/api/notifications/read-all` | Marks all unread notifications as read. | `200 OK` |
| **DELETE** | `/api/notifications/{id}` | Removes a notification permanently. | `200 OK`, `404 Not Found` |

---

## 8. WebSocket Events

DocVault broadcasts real-time notifications over raw WebSockets mapped to the `/ws` gateway.

*   **Destination Topic**: `/topic/notifications`
*   **Payload Shape (JSON)**:
```json
{
  "id": 14,
  "message": "File 'q1_report.pdf' uploaded successfully",
  "type": "SUCCESS",
  "read": false,
  "createdAt": "2026-05-29 17:28:45",
  "relatedBatchId": "d04b3db1-096e-450c-b26a-cb1b899a19c5",
  "action": "NEW"
}
```

---

## 9. Project Folder Structure

```
.
├── backend
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java/com/example/demo
│       │   │   ├── DemoApplication.java
│       │   │   ├── HelloController.java
│       │   │   ├── config
│       │   │   │   ├── AsyncConfig.java
│       │   │   │   ├── CorsConfig.java
│       │   │   │   └── WebSocketConfig.java
│       │   │   ├── controller
│       │   │   │   ├── DocumentController.java
│       │   │   │   ├── GlobalExceptionHandler.java
│       │   │   │   └── NotificationController.java
│       │   │   ├── dto
│       │   │   │   ├── ApiResponse.java
│       │   │   │   ├── BulkUploadInitResponse.java
│       │   │   │   ├── DocumentResponse.java
│       │   │   │   ├── NotificationResponse.java
│       │   │   │   ├── UploadResponse.java
│       │   │   │   └── WebSocketNotification.java
│       │   │   ├── model
│       │   │   │   ├── Document.java
│       │   │   │   ├── DocumentStatus.java
│       │   │   │   ├── Notification.java
│       │   │   │   └── NotificationType.java
│       │   │   ├── repository
│       │   │   │   ├── DocumentRepository.java
│       │   │   │   └── NotificationRepository.java
│       │   │   └── service
│       │   │       ├── DocumentService.java
│       │   │       ├── FileStorageService.java
│       │   │       └── NotificationService.java
│       │   └── resources
│       │       └── application.properties
│       └── src/test
│           ├── java/com/docmanagement
│           │   ├── DocumentControllerTest.java
│           │   ├── DocumentServiceTest.java
│           │   └── NotificationControllerTest.java
│           └── resources
│               └── application-test.properties
└── frontend
    ├── index.html
    ├── package.json
    ├── babel.config.js
    ├── jest.config.js
    ├── jest.setup.js
    ├── vite.config.js
    └── src
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── components
        │   ├── layout
        │   │   ├── Header.jsx
        │   │   └── Header.css
        │   ├── upload
        │   │   ├── UploadZone.jsx
        │   │   ├── UploadZone.css
        │   │   └── UploadZone.test.jsx
        │   └── notifications
        │       ├── NotificationBell.jsx
        │       ├── NotificationBell.css
        │       ├── NotificationPanel.jsx
        │       ├── NotificationPanel.css
        │       ├── NotificationPanel.test.jsx
        │       ├── ToastContainer.jsx
        │       └── ToastContainer.css
        ├── context
        │   └── NotificationContext.jsx
        ├── hooks
        │   └── useWebSocket.js
        └── services
            └── api.js
```

---

## 10. Key Design Decisions

### Smart Bulk Upload Routing: Synchronous vs. Asynchronous
*   **Why ≤ 3 files are processed inline**: For very small batches, files can be written to disk and database transactions committed within standard HTTP request times (milliseconds). Returning the immediate result to the user creates a quick, responsive, and seamless interactive feel.
*   **Why > 3 files are processed async**: Processing large batches synchronously blocks the web server's Tomcat request threads and holds the user's browser connection open for too long, risking client timeout errors. Instead, we offload large batches to a dedicated background `ThreadPoolTaskExecutor`. The controller immediately returns `202 Accepted` with a `batchId`, leaving the browser interface free, and process completion is notified in real time.

### WebSocket Notifications vs. HTTP Polling
*   HTTP polling (repeated `/unread-count` calls) consumes significant server CPU cycles and database read queries, even when no new documents have finished uploading.
*   By leveraging **WebSockets**, the Spring Boot application establishes a single bidirectional persistent TCP channel. When background workers finish storing files, they push a JSON update containing the batch's progress directly to the client. This results in **immediate user feedback**, minimal network overhead, and drastically lower database load.

### Contextual Job Stitching via `batchId`
*   When a bulk upload begins, the backend generates a random `batchId` (UUID) and creates an initial notification:
    `"Upload in progress — processing 5 files in background"` (Type: `INFO`, associated with `batchId`).
*   As the worker thread finishes writing files to disk, it aggregates success/failure tallies.
*   When complete, the worker pushes a final notification:
    `"5 files uploaded successfully"` (Type: `SUCCESS`, associated with the *same* `batchId`).
*   By linking these alerts through the `batchId`, the frontend can identify that the background job has completed, and link related messages together in the notification dropdown timeline.
