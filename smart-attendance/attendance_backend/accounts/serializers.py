# Base module for creating serializers
from rest_framework import serializers

# Default serializer used for JWT login
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Employee, LeaveBalance, Department

# Custom Login Serializer by extending the default JWT login serializer
# Purpose: customize the login response
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    # Use employee_id instead of username for login
    username_field = 'employee_id'

    # This method runs when login request is made
    # attrs = incoming data (employee_id, password)
    def validate(self, attrs):
        # Calls default JWT validation:
        #     checks credentials
        #     generates tokens
        data = super().validate(attrs)
        # Adds extra user info to response
        # self.user = logged-in user
        data['employee_id'] = self.user.employee_id
        data['full_name'] = self.user.full_name
        data['role'] = self.user.role
        data['email'] = self.user.email
        return data

# Converts LeaveBalance model → JSON
class LeaveBalanceSerializer(serializers.ModelSerializer):
    # configuration
    class Meta:
        # Which model to use
        model = LeaveBalance
        # fields that will be returned
        fields = ['casual_leave', 'sick_leave', 'earned_leave', 'work_from_home']

# Serializer for showing full employee profile
class EmployeeProfileSerializer(serializers.ModelSerializer):
    # Nested Serializer : Includes leave balance inside employee response
    # When you package an Employee, look up their LeaveBalance table and put those numbers inside this same box.
    leave_balance = LeaveBalanceSerializer(read_only=True)

    # The Employee model only stores the Department ID (like 5). 
    # source='department.name' tells the serializer to go to the Department table and grab 
    # the actual name (like "Engineering") instead.
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'email', 'full_name', 'department',
            'department_name', 'designation', 'phone_number',
            'date_of_joining', 'profile_photo', 'role', 'leave_balance'
        ]
        # Cannot be modified via API
        read_only_fields = ['id', 'employee_id', 'email', 'role', 'department', 'date_of_joining']

# Only these fields can be updated
class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['phone_number', 'profile_photo']

# Not linked to a model
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        return data