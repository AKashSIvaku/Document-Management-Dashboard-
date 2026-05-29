package com.docmanagement;

import com.example.demo.dto.BulkUploadInitResponse;
import com.example.demo.dto.DocumentResponse;
import com.example.demo.dto.UploadResponse;
import com.example.demo.model.Document;
import com.example.demo.model.DocumentStatus;
import com.example.demo.model.NotificationType;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.service.DocumentService;
import com.example.demo.service.FileStorageService;
import com.example.demo.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private DocumentService documentService;

    @Test
    public void testUploadSingleFile_Success() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "Hello".getBytes());

        Document initialDoc = Document.builder()
                .id(1L)
                .originalName("test.txt")
                .storedName("")
                .filePath("")
                .fileSize(5L)
                .fileType("text/plain")
                .status(DocumentStatus.UPLOADING)
                .build();

        Document completedDoc = Document.builder()
                .id(1L)
                .originalName("test.txt")
                .storedName("stored-test.txt")
                .filePath("uploads/stored-test.txt")
                .fileSize(5L)
                .fileType("text/plain")
                .status(DocumentStatus.COMPLETE)
                .build();

        when(documentRepository.save(any(Document.class)))
                .thenReturn(initialDoc)
                .thenReturn(completedDoc);

        when(fileStorageService.storeFile(file)).thenReturn("stored-test.txt");
        Path uploadPath = Paths.get("uploads");
        when(fileStorageService.getUploadPath()).thenReturn(uploadPath);

        // Act
        UploadResponse response = documentService.uploadSingleFile(file);

        // Assert
        assertNotNull(response);
        assertEquals("COMPLETE", response.getStatus());
        assertEquals("test.txt", response.getOriginalName());
        assertEquals("stored-test.txt", response.getStoredName());
        verify(fileStorageService).storeFile(file);
        verify(notificationService).createNotification(contains("uploaded successfully"), eq(NotificationType.SUCCESS));
    }

    @Test
    public void testUploadSingleFile_EmptyFile_NeverCallsStorage() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", new byte[0]);

        // Act
        UploadResponse response = documentService.uploadSingleFile(file);

        // Assert
        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertTrue(response.getMessage().contains("File is empty"));
        verifyNoInteractions(fileStorageService);
        verifyNoInteractions(documentRepository);
    }

    @Test
    public void testUploadSingleFile_StorageThrowsException_MarksFailed() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "Hello".getBytes());

        Document initialDoc = Document.builder()
                .id(1L)
                .originalName("test.txt")
                .storedName("")
                .filePath("")
                .fileSize(5L)
                .fileType("text/plain")
                .status(DocumentStatus.UPLOADING)
                .build();

        when(documentRepository.save(any(Document.class))).thenReturn(initialDoc);
        when(fileStorageService.storeFile(file)).thenThrow(new RuntimeException("Disk error"));

        // Act
        UploadResponse response = documentService.uploadSingleFile(file);

        // Assert
        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertTrue(response.getMessage().contains("Disk error"));

        // Verify it updated database to FAILED status
        ArgumentCaptor<Document> docCaptor = ArgumentCaptor.forClass(Document.class);
        verify(documentRepository, times(2)).save(docCaptor.capture());
        assertEquals(DocumentStatus.FAILED, docCaptor.getAllValues().get(1).getStatus());

        // Verify notification
        verify(notificationService).createNotification(contains("Failed to upload"), eq(NotificationType.ERROR));
    }

    @Test
    public void testInitBulkUpload_CreatesNotificationAndReturnsBatchId() {
        // Act
        BulkUploadInitResponse response = documentService.initBulkUpload(5);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getBatchId());
        assertEquals(5, response.getFileCount());
        verify(notificationService).createNotification(
                contains("processing 5 files"),
                eq(NotificationType.INFO),
                eq(response.getBatchId())
        );
    }

    @Test
    public void testGetAllDocuments_ReturnsMappedDtoList() {
        // Arrange
        Document doc1 = Document.builder()
                .id(1L)
                .originalName("doc1.txt")
                .storedName("stored-doc1.txt")
                .filePath("uploads/stored-doc1.txt")
                .fileSize(100L)
                .fileType("text/plain")
                .status(DocumentStatus.COMPLETE)
                .uploadedAt(LocalDateTime.of(2026, 5, 29, 12, 0, 0))
                .build();

        when(documentRepository.findAllByOrderByUploadedAtDesc())
                .thenReturn(Collections.singletonList(doc1));

        // Act
        List<DocumentResponse> response = documentService.getAllDocuments();

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("doc1.txt", response.get(0).getOriginalName());
        assertEquals("2026-05-29 12:00:00", response.get(0).getUploadedAt());
    }

    @Test
    public void testGetDocumentById_ThrowsWhenNotFound() {
        // Arrange
        when(documentRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> documentService.getDocumentById(999L));
    }

    @Test
    public void testDeleteDocument_CallsStorageAndDeleteById() {
        // Arrange
        Long docId = 1L;
        Document doc = Document.builder()
                .id(docId)
                .originalName("test.txt")
                .storedName("stored-test.txt")
                .filePath("uploads/stored-test.txt")
                .fileSize(100L)
                .fileType("text/plain")
                .status(DocumentStatus.COMPLETE)
                .build();

        when(documentRepository.findById(docId)).thenReturn(Optional.of(doc));

        // Act
        documentService.deleteDocument(docId);

        // Assert
        verify(fileStorageService).deleteFile("stored-test.txt");
        verify(documentRepository).deleteById(docId);
        verify(notificationService).createNotification(contains("deleted"), eq(NotificationType.INFO));
    }
}
