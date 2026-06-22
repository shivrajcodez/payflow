package com.payflow.repository;

import com.payflow.entity.Transaction;
import com.payflow.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Page<Transaction> findByUser(User user, Pageable pageable);
    Optional<Transaction> findByTransactionReference(String reference);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = 'PAYMENT'")
    Optional<BigDecimal> sumPaymentsByUser(@Param("user") User user);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.createdAt >= :since")
    long countTransactionsSince(@Param("since") Instant since);
}
