from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('on_leave', 'On Leave'),
        ('work_from_home', 'Work From Home'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records'
    )
    date = models.DateField(default=timezone.localdate)
    punch_in = models.DateTimeField(null=True, blank=True)
    punch_out = models.DateTimeField(null=True, blank=True)
    working_hours = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    punch_in_location = models.CharField(max_length=255, blank=True)
    punch_out_location = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']

    def calculate_working_hours(self):
        if self.punch_in and self.punch_out:
            delta = self.punch_out - self.punch_in
            hours = delta.total_seconds() / 3600
            self.working_hours = round(hours, 2)
            self.save(update_fields=['working_hours'])
        return self.working_hours

    def __str__(self):
        return f"{self.employee.full_name} - {self.date}"