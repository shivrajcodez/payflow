package com.payflow.service;

import com.payflow.entity.User;
import com.payflow.enums.AuditAction;

public interface AuditService {
    void log(User user, AuditAction action, String entityType, String entityId,
             String description, Object oldValues, Object newValues, String ipAddress);
}
