from django.urls import path
from . import views

urlpatterns = [
    path('apply/', views.ApplyLeaveView.as_view(), name='apply_leave'),
    path('my-leaves/', views.LeaveListView.as_view(), name='my_leaves'),
    path('my-leaves/<uuid:pk>/', views.LeaveDetailView.as_view(), name='leave_detail'),
    path('cancel/<uuid:pk>/', views.CancelLeaveView.as_view(), name='cancel_leave'),
    path('hr/all/', views.HRLeaveListView.as_view(), name='hr_all_leaves'),
    path('hr/approve/<uuid:pk>/', views.HRLeaveApprovalView.as_view(), name='hr_approve_leave'),
]