from django.urls import path
from . import views

urlpatterns = [
    path('announce/', views.SendAnnouncementView.as_view(), name='send_announcement'),
]