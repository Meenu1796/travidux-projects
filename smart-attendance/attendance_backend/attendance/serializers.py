from rest_framework import serializers
from django.utils import timezone
from .models import AttendanceRecord


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'date',
            'punch_in', 'punch_out', 'working_hours', 'status',
            'punch_in_location', 'punch_out_location', 'notes'
        ]
        read_only_fields = ['id', 'working_hours', 'employee']


class PunchInSerializer(serializers.Serializer):
    location = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        employee = self.context['request'].user
        today = timezone.localdate()
        if AttendanceRecord.objects.filter(employee=employee, date=today).exists():
            raise serializers.ValidationError("You have already punched in today.")
        return data


class PunchOutSerializer(serializers.Serializer):
    location = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        employee = self.context['request'].user
        today = timezone.localdate()
        record = AttendanceRecord.objects.filter(employee=employee, date=today).first()
        if not record:
            raise serializers.ValidationError("No punch-in found for today.")
        if record.punch_out:
            raise serializers.ValidationError("You have already punched out.")
        return data