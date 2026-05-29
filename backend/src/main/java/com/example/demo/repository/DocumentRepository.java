package com.example.demo.repository;

import com.example.demo.model.Document;
import com.example.demo.model.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findAllByOrderByUploadedAtDesc();

    List<Document> findByStatus(DocumentStatus status);
}
