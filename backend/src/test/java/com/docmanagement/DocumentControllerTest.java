package com.docmanagement;

import com.example.demo.controller.DocumentController;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.BulkUploadInitResponse;
import com.example.demo.dto.DocumentResponse;
import com.example.demo.dto.UploadResponse;
import com.example.demo.service.DocumentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentControllerTest {

    @Mock
    private DocumentService documentService;

    @InjectMocks
    private DocumentController documentController;

    @Test
    public void testGetAllDocuments_ReturnsList() {
        // Arrange
        List<DocumentResponse> mockList = new ArrayList<>();
        mockList.add(DocumentResponse.builder().id(1L).originalName("doc1.txt").status("COMPLETE").build());
        mockList.add(DocumentResponse.builder().id(2L).originalName("doc2.pdf").status("UPLOADING").build());
        when(documentService.getAllDocuments()).thenReturn(mockList);

        // Act
        ResponseEntity<ApiResponse<List<DocumentResponse>>> response = documentController.getAllDocuments();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(2, response.getBody().getData().size());
        assertEquals("doc1.txt", response.getBody().getData().get(0).getOriginalName());
    }

    @Test
    public void testGetAllDocuments_ReturnsEmptyList() {
        // Arrange
        when(documentService.getAllDocuments()).thenReturn(Collections.emptyList());

        // Act
        ResponseEntity<ApiResponse<List<DocumentResponse>>> response = documentController.getAllDocuments();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertTrue(response.getBody().getData().isEmpty());
    }

    @Test
    public void testUploadSingleFile_Success() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "Hello World".getBytes());
        UploadResponse uploadResponse = UploadResponse.builder()
                .id(1L)
                .originalName("test.txt")
                .status("COMPLETE")
                .message("File uploaded successfully")
                .build();
        when(documentService.uploadSingleFile(file)).thenReturn(uploadResponse);

        // Act
        ResponseEntity<ApiResponse<UploadResponse>> response = documentController.uploadSingleFile(file);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1L, response.getBody().getData().getId());
        assertEquals("COMPLETE", response.getBody().getData().getStatus());
    }

    @Test
    public void testUploadSingleFile_EmptyFile() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", new byte[0]);

        // Act
        ResponseEntity<ApiResponse<UploadResponse>> response = documentController.uploadSingleFile(file);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("File is empty", response.getBody().getMessage());
        verifyNoInteractions(documentService);
    }

    @Test
    public void testUploadBulk_LessThanOrEqualThreeFiles() {
        // Arrange
        MockMultipartFile file1 = new MockMultipartFile("files", "test1.txt", "text/plain", "Hello 1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "test2.txt", "text/plain", "Hello 2".getBytes());
        MultipartFile[] files = new MultipartFile[]{file1, file2};

        UploadResponse r1 = UploadResponse.builder().id(1L).originalName("test1.txt").status("COMPLETE").build();
        UploadResponse r2 = UploadResponse.builder().id(2L).originalName("test2.txt").status("COMPLETE").build();

        when(documentService.uploadSingleFile(file1)).thenReturn(r1);
        when(documentService.uploadSingleFile(file2)).thenReturn(r2);

        // Act
        ResponseEntity<ApiResponse<?>> response = documentController.uploadBulkFiles(files);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        List<?> results = (List<?>) response.getBody().getData();
        assertEquals(2, results.size());
        verify(documentService, times(2)).uploadSingleFile(any(MultipartFile.class));
    }

    @Test
    public void testUploadBulk_MoreThanThreeFiles() {
        // Arrange
        MockMultipartFile file1 = new MockMultipartFile("files", "test1.txt", "text/plain", "Hello 1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "test2.txt", "text/plain", "Hello 2".getBytes());
        MockMultipartFile file3 = new MockMultipartFile("files", "test3.txt", "text/plain", "Hello 3".getBytes());
        MockMultipartFile file4 = new MockMultipartFile("files", "test4.txt", "text/plain", "Hello 4".getBytes());
        MultipartFile[] files = new MultipartFile[]{file1, file2, file3, file4};

        BulkUploadInitResponse initResponse = BulkUploadInitResponse.builder()
                .batchId("batch-123")
                .fileCount(4)
                .message("Processing 4 files in background.")
                .build();

        when(documentService.initBulkUpload(4)).thenReturn(initResponse);

        // Act
        ResponseEntity<ApiResponse<?>> response = documentController.uploadBulkFiles(files);

        // Assert
        assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        BulkUploadInitResponse data = (BulkUploadInitResponse) response.getBody().getData();
        assertEquals("batch-123", data.getBatchId());
        verify(documentService).initBulkUpload(4);
        verify(documentService).processBulkFilesAsync(eq(files), eq("batch-123"));
        verify(documentService, never()).uploadSingleFile(any());
    }

    @Test
    public void testUploadBulk_ZeroFiles() {
        // Arrange
        MultipartFile[] files = new MultipartFile[0];

        // Act
        ResponseEntity<ApiResponse<?>> response = documentController.uploadBulkFiles(files);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentService);
    }

    @Test
    public void testUploadBulk_NullFiles() {
        // Act
        ResponseEntity<ApiResponse<?>> response = documentController.uploadBulkFiles(null);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        verifyNoInteractions(documentService);
    }

    @Test
    public void testDeleteDocument_Success() {
        // Arrange
        Long docId = 123L;
        doNothing().when(documentService).deleteDocument(docId);

        // Act
        ResponseEntity<ApiResponse<Void>> response = documentController.deleteDocument(docId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        verify(documentService).deleteDocument(docId);
    }
}
