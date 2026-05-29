package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.BulkUploadInitResponse;
import com.example.demo.dto.DocumentResponse;
import com.example.demo.dto.UploadResponse;
import com.example.demo.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    /**
     * GET /api/documents — returns all documents ordered newest first.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getAllDocuments() {
        List<DocumentResponse> documents = documentService.getAllDocuments();
        return ResponseEntity.ok(
                ApiResponse.success("Documents retrieved successfully", documents)
        );
    }

    /**
     * POST /api/documents/upload — uploads a single file.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<UploadResponse>> uploadSingleFile(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("File is empty")
            );
        }

        UploadResponse response = documentService.uploadSingleFile(file);
        return ResponseEntity.ok(
                ApiResponse.success("File uploaded successfully", response)
        );
    }

    /**
     * POST /api/documents/upload/bulk — smart routing based on file count:
     *   0 files    → 400 Bad Request
     *   1-3 files  → process inline, return all results with 200
     *   4+ files   → async background processing, return 202 Accepted with batchId
     */
    @PostMapping("/upload/bulk")
    public ResponseEntity<ApiResponse<?>> uploadBulkFiles(
            @RequestParam("files") MultipartFile[] files) {

        // No files provided
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("No files provided")
            );
        }

        // Small batch (1-3 files): process inline
        if (files.length <= 3) {
            List<UploadResponse> results = new ArrayList<>();
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    results.add(documentService.uploadSingleFile(file));
                }
            }
            return ResponseEntity.ok(
                    ApiResponse.success(results.size() + " files uploaded successfully", results)
            );
        }

        // Large batch (4+ files): process asynchronously
        List<MultipartFile> cachedFiles = documentService.cacheFiles(files);
        BulkUploadInitResponse initResponse = documentService.initBulkUpload(files.length);
        documentService.processBulkFilesAsync(cachedFiles, initResponse.getBatchId());

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(
                ApiResponse.success(
                        "Bulk upload initiated. Processing " + files.length + " files in background.",
                        initResponse
                )
        );
    }

    /**
     * GET /api/documents/{id}/download — streams the file as an attachment.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        Resource resource = documentService.downloadDocument(id);
        String originalName = documentService.getOriginalName(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + originalName + "\"")
                .body(resource);
    }

    /**
     * DELETE /api/documents/{id} — deletes a document and its file from disk.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(
                ApiResponse.success("Document deleted successfully")
        );
    }
}
