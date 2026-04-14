# generics → ready-made API views (CRUD operations)
# status → HTTP status codes (200, 400, etc.)
# permissions → control access (who can use API)
from rest_framework import generics, status, permissions

# Used to send API responses (JSON)
from rest_framework.response import Response
from rest_framework.views import APIView

# TokenObtainPairView / RefreshToken: These handle JWT (JSON Web Tokens). 
# Returns: access token and refresh token
# This is how the app stays logged in without asking for a password every 5 seconds.
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

# Gets your custom Employee model
from django.contrib.auth import get_user_model

# serializers (data validation + formatting)
from .serializers import (
    CustomTokenObtainPairSerializer, EmployeeProfileSerializer,
    UpdateProfileSerializer, ChangePasswordSerializer
)

Employee = get_user_model()

# Authenticates the user
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    # Anyone can access (no login required)
    permission_classes = [permissions.AllowAny]

# It takes the user's current "Session Token" and puts it on a Blacklist.
# Why? JWT doesn’t have “logout” by default. In JWT, Once a ticket is blacklisted, even if it hasn't "expired" yet, 
# the server will refuse to accept it, effectively logging the user out.
class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

# show profile and updating it : GET, PUT/PATCH
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = EmployeeProfileSerializer

    # Only find the details of person who is currently logged in
    def get_object(self):
        return self.request.user

    # f you are just looking (GET), it uses a serializer that shows everything (name, dept, leaves).
    # If you are editing (PUT/PATCH), it uses a restricted serializer so you don't 
    # accidentally let the user change their own Role or Employee ID!
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateProfileSerializer
        return EmployeeProfileSerializer

# | Request | Serializer Used           |
# | ------- | ------------------------- |
# | GET     | EmployeeProfileSerializer |
# | PUT     | UpdateProfileSerializer   |

# Validates the old password before allowing a new one.
class ChangePasswordView(APIView):
    def post(self, request):
        # Load input data
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Get logged-in user
        user = request.user
        # check_password: it hashes the "old_password" and compares it to the scrambled one in the database.
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'detail': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST) 
        # set_password: This scrambles the new password before saving it.
        user.set_password(serializer.validated_data['new_password'])
        # Save updated password
        user.save()
        return Response({'detail': 'Password changed successfully'})

# REGISTER FCM TOKEN (Push Notifications)
# It links a specific phone to a specific employee.
class RegisterFCMTokenView(APIView):
    def post(self, request):
        from fcm_django.models import FCMDevice
        token = request.data.get('token')
        device_type = request.data.get('type', 'android')  # android or ios
        if not token:
            return Response({'detail': 'Token required'}, status=status.HTTP_400_BAD_REQUEST)
        FCMDevice.objects.update_or_create(
            user=request.user,
            defaults={'registration_id': token, 'type': device_type, 'active': True}
        )
        return Response({'detail': 'Device registered'})