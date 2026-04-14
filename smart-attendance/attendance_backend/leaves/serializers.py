from rest_framework import serializers
from django.utils import timezone
from .models import LeaveRequest
from accounts.serializers import EmployeeProfileSerializer


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    department = serializers.CharField(source='employee.department.name', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_display', 'department',
            'leave_type', 'leave_type_display', 'start_date', 'end_date',
            'total_days', 'reason', 'attachment', 'status', 'status_display',
            'rejection_reason', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'employee', 'total_days', 'status', 'reviewed_by',
            'rejection_reason', 'reviewed_at'
        ]

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError({'end_date': 'End date must be after start date.'})
        if data['start_date'] < timezone.localdate():
            raise serializers.ValidationError({'start_date': 'Cannot apply leave for past dates.'})
        return data


class LeaveApprovalSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['action'] == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError({'rejection_reason': 'Rejection reason is required.'})
        return data