"""
URL configuration for ecommerce project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin #Django admin panel
from django.urls import path, include    #define URL routes
from django.conf import settings    #access project settings
from django.conf.urls.static import static  #serve media files in development
from accounts import views  #your custom login/register views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('admin/', admin.site.urls),    # Opens Django admin dashboard
    # path('api/auth/login/', views.LoginView.as_view(), name='login'),   # connects views.LoginView.as_view()
    # path('api/auth/register/', views.RegisterView.as_view(), name='register'),  # This connects to your RegisterView
    path('api/products/', include('products.urls')),
    path('api/auth/', include('accounts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# runs only in development
# Runs only when DEBUG = True
# Allows serving uploaded files (images, etc.)

# /admin/ → admin panel
# /api/auth/login/ → login API
# /api/auth/register/ → register API