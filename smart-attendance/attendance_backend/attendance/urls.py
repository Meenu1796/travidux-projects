from django.urls import path
from . import views

urlpatterns = [
    path('punch-in/', views.PunchInView.as_view(), name='punch_in'),
    path('punch-out/', views.PunchOutView.as_view(), name='punch_out'),
    path('today/', views.TodayAttendanceView.as_view(), name='today_attendance'),
    path('history/', views.AttendanceHistoryView.as_view(), name='attendance_history'),
    path('hr/list/', views.HRAttendanceListView.as_view(), name='hr_attendance_list'),
    path('hr/dashboard/', views.HRDashboardView.as_view(), name='hr_dashboard'),
]