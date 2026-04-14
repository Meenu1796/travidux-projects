from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .utils import send_notification_to_all_employees


class IsHROrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['hr', 'admin']


class SendAnnouncementView(APIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request):
        title = request.data.get('title')
        message = request.data.get('message')
        if not title or not message:
            return Response({'detail': 'Title and message are required.'}, status=400)
        send_notification_to_all_employees(
            title=title, body=message, data={'type': 'announcement'}
        )
        return Response({'detail': 'Announcement sent successfully.'})