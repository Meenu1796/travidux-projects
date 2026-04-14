from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class LeaveRequest(models.Model):
    LEAVE_TYPE_CHOICES = [
        ('CL', 'Casual Leave'),
        ('SL', 'Sick Leave'),
        ('EL', 'Earned Leave'),
        ('WFH', 'Work From Home'),
        ('PL', 'Permission Leave'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leave_requests'
    )
    leave_type = models.CharField(max_length=5, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    reason = models.TextField()
    attachment = models.FileField(upload_to='leave_attachments/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_leaves'
    )
    rejection_reason = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def calculate_days(self):
        delta = (self.end_date - self.start_date).days + 1
        self.total_days = delta
        return delta

    def save(self, *args, **kwargs):
        if not self.total_days:
            self.calculate_days()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.full_name} - {self.get_leave_type_display()} ({self.start_date})"