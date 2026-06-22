package com.payflow.repository;

import com.payflow.entity.FraudFlag;
import com.payflow.entity.Payment;
import com.payflow.enums.FraudRiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FraudFlagRepository extends JpaRepository<FraudFlag, UUID> {
    Optional<FraudFlag> findByPayment(Payment payment);
    Page<FraudFlag> findByReviewedOrderByCreatedAtDesc(boolean reviewed, Pageable pageable);
    Page<FraudFlag> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COUNT(f) FROM FraudFlag f WHERE f.riskLevel = :level AND f.createdAt >= :since")
    long countByRiskLevelAndCreatedAtAfter(@Param("level") FraudRiskLevel level, @Param("since") Instant since);

    @Query("SELECT COUNT(f) FROM FraudFlag f WHERE f.reviewed = false")
    long countUnreviewed();

    @Query("SELECT f FROM FraudFlag f WHERE f.user.id = :userId ORDER BY f.createdAt DESC")
    List<FraudFlag> findByUserId(@Param("userId") UUID userId);
}
