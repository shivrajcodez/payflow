package com.payflow.repository;

import com.payflow.entity.Payment;
import com.payflow.entity.Refund;
import com.payflow.enums.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {
    Optional<Refund> findByRefundReference(String reference);
    List<Refund> findByPayment(Payment payment);
    Page<Refund> findByPayment(Payment payment, Pageable pageable);

    @Query("SELECT SUM(r.amount) FROM Refund r WHERE r.payment = :payment AND r.status IN ('COMPLETED', 'PROCESSING', 'PENDING')")
    Optional<BigDecimal> sumRefundedAmountByPayment(@Param("payment") Payment payment);

    @Query("SELECT COUNT(r) FROM Refund r WHERE r.status = :status")
    long countByStatus(@Param("status") RefundStatus status);
}
