package com.payflow.repository;

import com.payflow.entity.Payment;
import com.payflow.entity.User;
import com.payflow.enums.Currency;
import com.payflow.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByPaymentReference(String reference);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    boolean existsByIdempotencyKey(String idempotencyKey);

    Page<Payment> findByUser(User user, Pageable pageable);
    Page<Payment> findByUserAndStatus(User user, PaymentStatus status, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.user = :user AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:currency IS NULL OR p.currency = :currency) AND " +
           "(:from IS NULL OR p.createdAt >= :from) AND " +
           "(:to IS NULL OR p.createdAt <= :to) AND " +
           "(:minAmount IS NULL OR p.amount >= :minAmount) AND " +
           "(:maxAmount IS NULL OR p.amount <= :maxAmount) AND " +
           "(:query IS NULL OR LOWER(p.paymentReference) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           "LOWER(p.customerEmail) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%',:query,'%')))")
    Page<Payment> findWithFilters(
        @Param("user") User user,
        @Param("status") PaymentStatus status,
        @Param("currency") Currency currency,
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("minAmount") BigDecimal minAmount,
        @Param("maxAmount") BigDecimal maxAmount,
        @Param("query") String query,
        Pageable pageable
    );

    @Query("SELECT p FROM Payment p WHERE p.user.ipAddress = :ip AND p.createdAt >= :since")
    List<Payment> findByIpAddressAndCreatedAtAfter(@Param("ip") String ip, @Param("since") Instant since);

    @Query("SELECT p FROM Payment p WHERE p.user = :user AND p.createdAt >= :since")
    List<Payment> findByUserAndCreatedAtAfter(@Param("user") User user, @Param("since") Instant since);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.user = :user AND p.status = 'COMPLETED'")
    Optional<BigDecimal> sumCompletedAmountByUser(@Param("user") User user);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED' AND p.createdAt >= :since")
    Optional<BigDecimal> sumCompletedAmountSince(@Param("since") Instant since);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status AND p.createdAt >= :since")
    long countByStatusAndCreatedAtAfter(@Param("status") PaymentStatus status, @Param("since") Instant since);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.user = :user AND p.ipAddress = :ip AND p.createdAt >= :since")
    long countByUserAndIpAndCreatedAtAfter(@Param("user") User user, @Param("ip") String ip, @Param("since") Instant since);

    @Query("SELECT p.status, COUNT(p) FROM Payment p GROUP BY p.status")
    List<Object[]> countGroupedByStatus();

    @Query("SELECT DATE(p.createdAt), SUM(p.amount), COUNT(p) FROM Payment p " +
           "WHERE p.status = 'COMPLETED' AND p.createdAt >= :since GROUP BY DATE(p.createdAt) ORDER BY DATE(p.createdAt)")
    List<Object[]> getDailyRevenueSince(@Param("since") Instant since);

    @Query("SELECT p FROM Payment p WHERE p.status = 'PENDING' AND p.expiresAt < :now")
    List<Payment> findExpiredPendingPayments(@Param("now") Instant now);

    @Query(value = "SELECT p FROM Payment p ORDER BY p.createdAt DESC")
    Page<Payment> findAllOrderByCreatedAtDesc(Pageable pageable);
}
