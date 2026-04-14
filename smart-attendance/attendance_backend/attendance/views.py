from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from .models import AttendanceRecord
from .serializers import AttendanceSerializer, PunchInSerializer, PunchOutSerializer
from notifications.utils import send_notification_to_user


class IsHROrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['hr', 'admin']


class AttendanceFilter(filters.FilterSet):
    date_from = filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='date', lookup_expr='lte')
    month = filters.NumberFilter(field_name='date__month')
    year = filters.NumberFilter(field_name='date__year')
    status = filters.ChoiceFilter(choices=AttendanceRecord.STATUS_CHOICES)

    class Meta:
        model = AttendanceRecord
        fields = ['date_from', 'date_to', 'month', 'year', 'status']


class PunchInView(APIView):
    def post(self, request):
        serializer = PunchInSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        record = AttendanceRecord.objects.create(
            employee=request.user,
            date=timezone.localdate(),
            punch_in=timezone.now(),
            punch_in_location=serializer.validated_data.get('location', ''),
            status='present'
        )
        return Response(AttendanceSerializer(record).data, status=status.HTTP_201_CREATED)


class PunchOutView(APIView):
    def post(self, request):
        serializer = PunchOutSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        today = timezone.localdate()
        record = AttendanceRecord.objects.get(employee=request.user, date=today)
        record.punch_out = timezone.now()
        record.punch_out_location = serializer.validated_data.get('location', '')
        record.save()
        record.calculate_working_hours()
        # Check if half day
        if record.working_hours and float(record.working_hours) < 4.5:
            record.status = 'half_day'
            record.save(update_fields=['status'])
        return Response(AttendanceSerializer(record).data)


class TodayAttendanceView(APIView):
    def get(self, request):
        today = timezone.localdate()
        record = AttendanceRecord.objects.filter(employee=request.user, date=today).first()
        if not record:
            return Response({'punched_in': False, 'punched_out': False, 'record': None})
        data = AttendanceSerializer(record).data
        return Response({
            'punched_in': record.punch_in is not None,
            'punched_out': record.punch_out is not None,
            'record': data
        })


class AttendanceHistoryView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    filterset_class = AttendanceFilter

    def get_queryset(self):
        return AttendanceRecord.objects.filter(employee=self.request.user).select_related('employee')


class HRAttendanceListView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsHROrAdmin]
    filterset_class = AttendanceFilter
    search_fields = ['employee__full_name', 'employee__employee_id']

    def get_queryset(self):
        return AttendanceRecord.objects.all().select_related('employee')


class HRDashboardView(APIView):
    permission_classes = [IsHROrAdmin]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from leaves.models import LeaveRequest
        Employee = get_user_model()
        today = timezone.localdate()
        total_employees = Employee.objects.filter(is_active=True, role='employee').count()
        today_records = AttendanceRecord.objects.filter(date=today)
        present_count = today_records.filter(status='present').count()
        pending_leaves = LeaveRequest.objects.filter(status='pending').count()
        return Response({
            'total_employees': total_employees,
            'today_present': present_count,
            'today_absent': total_employees - present_count,
            'pending_leave_requests': pending_leaves,
        })