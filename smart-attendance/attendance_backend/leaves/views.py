from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django_filters import rest_framework as filters
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer, LeaveApprovalSerializer
from notifications.utils import send_notification_to_user


class IsHROrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['hr', 'admin']


class LeaveFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=LeaveRequest.STATUS_CHOICES)
    leave_type = filters.ChoiceFilter(choices=LeaveRequest.LEAVE_TYPE_CHOICES)
    month = filters.NumberFilter(field_name='start_date__month')
    year = filters.NumberFilter(field_name='start_date__year')

    class Meta:
        model = LeaveRequest
        fields = ['status', 'leave_type', 'month', 'year']


class ApplyLeaveView(generics.CreateAPIView):
    serializer_class = LeaveRequestSerializer

    def perform_create(self, serializer):
        leave = serializer.save(employee=self.request.user)
        # Notify HR
        from django.contrib.auth import get_user_model
        Employee = get_user_model()
        hr_users = Employee.objects.filter(role__in=['hr', 'admin'], is_active=True)
        for hr in hr_users:
            send_notification_to_user(
                user=hr,
                title="New Leave Request",
                body=f"{self.request.user.full_name} applied for {leave.get_leave_type_display()}",
                data={'type': 'leave_request', 'leave_id': str(leave.id)}
            )


class LeaveListView(generics.ListAPIView):
    serializer_class = LeaveRequestSerializer
    filterset_class = LeaveFilter

    def get_queryset(self):
        return LeaveRequest.objects.filter(employee=self.request.user).select_related('employee', 'reviewed_by')


class LeaveDetailView(generics.RetrieveAPIView):
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        return LeaveRequest.objects.filter(employee=self.request.user)


class CancelLeaveView(APIView):
    def post(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk, employee=request.user)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Leave request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if leave.status != 'pending':
            return Response({'detail': 'Only pending leaves can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        if leave.start_date <= timezone.localdate():
            return Response({'detail': 'Cannot cancel a leave that has already started.'}, status=status.HTTP_400_BAD_REQUEST)

        leave.status = 'cancelled'
        leave.save(update_fields=['status'])
        return Response({'detail': 'Leave cancelled successfully.'})


class HRLeaveListView(generics.ListAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsHROrAdmin]
    filterset_class = LeaveFilter
    search_fields = ['employee__full_name', 'employee__employee_id']

    def get_queryset(self):
        return LeaveRequest.objects.all().select_related('employee', 'reviewed_by')


class HRLeaveApprovalView(APIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk, status='pending')
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Pending leave request not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LeaveApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()

        if action == 'approve':
            leave.status = 'approved'
            # Deduct leave balance
            self._deduct_balance(leave)
            notification_title = "Leave Approved"
            notification_body = f"Your {leave.get_leave_type_display()} from {leave.start_date} to {leave.end_date} has been approved."
        else:
            leave.status = 'rejected'
            leave.rejection_reason = serializer.validated_data['rejection_reason']
            notification_title = "Leave Rejected"
            notification_body = f"Your {leave.get_leave_type_display()} request has been rejected. Reason: {leave.rejection_reason}"

        leave.save()
        send_notification_to_user(
            user=leave.employee,
            title=notification_title,
            body=notification_body,
            data={'type': 'leave_update', 'leave_id': str(leave.id), 'status': leave.status}
        )
        return Response(LeaveRequestSerializer(leave).data)

    def _deduct_balance(self, leave):
        try:
            balance = leave.employee.leave_balance
            days = float(leave.total_days)
            if leave.leave_type == 'CL':
                balance.casual_leave = max(0, float(balance.casual_leave) - days)
            elif leave.leave_type == 'SL':
                balance.sick_leave = max(0, float(balance.sick_leave) - days)
            elif leave.leave_type == 'EL':
                balance.earned_leave = max(0, float(balance.earned_leave) - days)
            elif leave.leave_type == 'WFH':
                balance.work_from_home = max(0, float(balance.work_from_home) - days)
            balance.save()
        except Exception:
            pass