# this is your Django REST Framework (DRF) serializer layer, which sits between:
# React Native (frontend) ⇄ Django Models (database)

# Converter between JSON (frontend) and Python objects (backend)”

# | Direction          | Meaning                |
# | ------------------ | ---------------------- |
# | JSON → Python → DB | (Signup/Login request) |
# | DB → Python → JSON | (Response to app)      |

from rest_framework import serializers  #DRF tool to validate & convert data
from django.contrib.auth import authenticate
from .models import User

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

# {
#   "username": "john",
#   "password": "123456"
# }
# This is NOT linked to database directly
# It just:
# validates input
# passes data to view

# React Native sends login request
# Serializer checks:
# username exists?
# password provided?
# View calls:

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number']

    #     Defines:
    # which model → User
    # which fields allowed

    def validate_phone_number(self, value):
        """Validate phone number format"""
        import re
        phone_regex = r'^\+?1?\d{9,15}$'
        if not re.match(phone_regex, value):
            raise serializers.ValidationError('Phone number must be between 9-15 digits and can include + prefix')
        return value
    
    def create(self, validated_data):
        # Use .get() to avoid the KeyError. 
        # If 'user_type' isn't sent from the app, it defaults to 'customer'.
        user_type = validated_data.get('user_type', 'customer')

        user = User.objects.create_user(    #hashes password
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number'],
            user_type='customer',
        )
        return user

# This IS linked to database (User model)
# write_only=True means:
# can SEND password
# cannot RETURN password

# Serializer validates data
# create() runs
# User saved to DB
# Password stored as hash

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'user_type']

    #Used to SEND user data back to frontend

# | Serializer         | Type            | Use              |
# | ------------------ | --------------- | ---------------- |
# | LoginSerializer    | Basic           | Input validation |
# | RegisterSerializer | ModelSerializer | Create user      |
# | UserSerializer     | ModelSerializer | Output user      |

