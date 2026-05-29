package com.example.demo.service;

import com.example.demo.dto.BulkUploadInitResponse;
import com.example.demo.dto.DocumentResponse;
import com.example.demo.dto.UploadResponse;
import com.example.demo.model.Document;
import com.example.demo.model.DocumentStatus;
import com.example.demo.model.NotificationType;
import com.example.demo.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Uploads a single file: creates a Document record with UPLOADING status,
     * stores the file on disk, then updates status to COMPLETE or FAILED.
     */
    public UploadResponse uploadSingleFile(MultipartFile file) {
        if (file.isEmpty()) {
            return UploadResponse.builder()
                    .originalName(file.getOriginalFilename())
                    .storedName("")
                    .fileSize(0L)
                    .fileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .status(DocumentStatus.FAILED.name())
                    .message("Upload failed: File is empty")
                    .build();
        }

        // Create document record with UPLOADING status
        Document document = Document.builder()
                .originalName(file.getOriginalFilename())
                .storedName("") // placeholder until stored
                .filePath("")
                .fileSize(file.getSize())
                .fileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .status(DocumentStatus.UPLOADING)
                .build();
        document = documentRepository.save(document);

        try {
            // Store file on disk
            String storedName = fileStorageService.storeFile(file);
            String filePath = fileStorageService.getUploadPath().resolve(storedName).toString();

            // Update document record to COMPLETE
            document.setStoredName(storedName);
            document.setFilePath(filePath);
            document.setStatus(DocumentStatus.COMPLETE);
            document = documentRepository.save(document);

            // Send success notification
            notificationService.createNotification(
                    "File '" + file.getOriginalFilename() + "' uploaded successfully",
                    NotificationType.SUCCESS
            );

            return UploadResponse.builder()
                    .id(document.getId())
                    .originalName(document.getOriginalName())
                    .storedName(document.getStoredName())
                    .fileSize(document.getFileSize())
                    .fileType(document.getFileType())
                    .status(document.getStatus().name())
                    .message("File uploaded successfully")
                    .build();

        } catch (Exception e) {
            // Update document record to FAILED
            document.setStatus(DocumentStatus.FAILED);
            documentRepository.save(document);

            // Send error notification
            notificationService.createNotification(
                    "Failed to upload file '" + file.getOriginalFilename() + "': " + e.getMessage(),
                    NotificationType.ERROR
            );

            return UploadResponse.builder()
                    .id(document.getId())
                    .originalName(document.getOriginalName())
                    .storedName("")
                    .fileSize(document.getFileSize())
                    .fileType(document.getFileType())
                    .status(DocumentStatus.FAILED.name())
                    .message("Upload failed: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Initializes a bulk upload: creates an INFO notification and returns a batchId.
     */
    public BulkUploadInitResponse initBulkUpload(int fileCount) {
        String batchId = UUID.randomUUID().toString();

        notificationService.createNotification(
                "Upload in progress — processing " + fileCount + " files in background",
                NotificationType.INFO,
                batchId
        );

        return BulkUploadInitResponse.builder()
                .batchId(batchId)
                .fileCount(fileCount)
                .message("Bulk upload initiated. Processing " + fileCount + " files in background.")
                .build();
    }

    /**
     * Processes bulk files asynchronously. Each file is stored one-by-one,
     * and a final summary notification is sent with the batchId.
     */
    @Async("fileProcessingExecutor")
    public void processBulkFilesAsync(MultipartFile[] files, String batchId) {
        int successCount = 0;
        int failCount = 0;

        for (MultipartFile file : files) {
            Document document = Document.builder()
                    .originalName(file.getOriginalFilename())
                    .storedName("")
                    .filePath("")
                    .fileSize(file.getSize())
                    .fileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .status(DocumentStatus.UPLOADING)
                    .build();
            document = documentRepository.save(document);

            try {
                String storedName = fileStorageService.storeFile(file);
                String filePath = fileStorageService.getUploadPath().resolve(storedName).toString();

                document.setStoredName(storedName);
                document.setFilePath(filePath);
                document.setStatus(DocumentStatus.COMPLETE);
                documentRepository.save(document);
                successCount++;

            } catch (Exception e) {
                log.error("Failed to process file '{}' in batch {}: {}", file.getOriginalFilename(), batchId, e.getMessage());
                document.setStatus(DocumentStatus.FAILED);
                documentRepository.save(document);
                failCount++;
            }
        }

        // Send final summary notification
        String message;
        NotificationType type;

        if (failCount == 0) {
            message = successCount + " files uploaded successfully";
            type = NotificationType.SUCCESS;
        } else if (successCount == 0) {
            message = "All " + failCount + " files failed to upload";
            type = NotificationType.ERROR;
        } else {
            message = successCount + " files uploaded successfully, " + failCount + " failed";
            type = NotificationType.WARNING;
        }

        notificationService.createNotification(message, type, batchId);
    }

    /**
     * Returns all documents ordered newest first.
     */
    public List<DocumentResponse> getAllDocuments() {
        return documentRepository.findAllByOrderByUploadedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a single document by ID.
     */
    public DocumentResponse getDocumentById(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
        return toResponse(document);
    }

    /**
     * Loads a document's file as a Resource for download.
     */
    public Resource downloadDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
        return fileStorageService.loadFile(document.getStoredName());
    }

    /**
     * Returns the original filename for a document (used in Content-Disposition header).
     */
    public String getOriginalName(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
        return document.getOriginalName();
    }

    /**
     * Deletes a document record and its file from disk.
     */
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

        // Delete file from disk
        if (document.getStoredName() != null && !document.getStoredName().isEmpty()) {
            fileStorageService.deleteFile(document.getStoredName());
        }

        // Delete database record
        documentRepository.deleteById(id);

        // Send notification
        notificationService.createNotification(
                "Document '" + document.getOriginalName() + "' deleted",
                NotificationType.INFO
        );
    }

    /**
     * Converts a Document entity to a DocumentResponse DTO.
     */
    private DocumentResponse toResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .originalName(document.getOriginalName())
                .storedName(document.getStoredName())
                .filePath(document.getFilePath())
                .fileSize(document.getFileSize())
                .fileType(document.getFileType())
                .status(document.getStatus().name())
                .uploadedAt(document.getUploadedAt().format(FORMATTER))
                .build();
    }
}
