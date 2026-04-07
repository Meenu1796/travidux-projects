from rest_framework.views import APIView #Base class for creating API views in DRF
from rest_framework.response import Response #Used to send JSON responses
from rest_framework import status #HTTP status codes (200, 400, etc.)
from django.contrib.auth import authenticate, login #Checks username & password, Logs the user into the session
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer #Handle validation and data conversion
from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(APIView): #creates an API endpoint for login.
    def post(self, request): #Handles incoming login requests.
        serializer = LoginSerializer(data=request.data)

        # Takes data from request (username + password)
        # Validates it using Log inSerializer

        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            requested_type = request.data.get('user_type', 'customer') 
            user = authenticate(username=username, password=password)
            
            # Checks if credentials are correct
            # Returns a user object if valid, otherwise None
            if user:    #Logs the user into Django session system
                #login(request, user)
                # NEW LOGIC: Check if the user's REAL type matches what they picked
                if user.user_type != requested_type:
                    return Response({
                        'success': False,
                        'error': f'This account is registered as an {user.user_type}, not a {requested_type}.'
                    }, status=status.HTTP_403_FORBIDDEN)
                refresh = RefreshToken.for_user(user)
                return Response({
                    'success': True,
                    'user': UserSerializer(user).data,
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh)
                }, status=status.HTTP_200_OK)
                # Returns:
                # success = True
                # user data (serialized)
                # token (currently fake/demo) REPLACE
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED) #If authentication fails
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  #If validation fails

class RegisterView(APIView):
    def post(self, request):
        # Take the user's input
        data = request.data.copy()
        
        # FORCE everyone registering via this public endpoint to be a 'customer'
        data['user_type'] = 'customer'
        # Ensure they aren't granted staff status automatically
        data['is_staff'] = False

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()    #Creates a new user in the database
            return Response({
                'success': True,
                'user': UserSerializer(user).data,
                'message': 'Account created successfully!'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)