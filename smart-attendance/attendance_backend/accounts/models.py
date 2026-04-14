# AbstractBaseUser: build custom user model from scratch instead of Django's built-in User.
# BaseUserManager → Helps create users (manager logic)
# PermissionsMixin → Adds:
    # is_superuser
    # groups & permissions support
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

# generate unique IDs
import uuid 

# Table
class Department(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    # sorting → by name
    class Meta:
        ordering = ['name']

    # "Engineering" instead of <Department Object 1>
    # how your object appears as text
    def __str__(self):
        return self.name

# Custom user manager for creating users, provides functions 
class EmployeeManager(BaseUserManager):
    # normal employee
    def create_user(self, employee_id, email, password=None, **extra_fields):
        if not employee_id:
            raise ValueError('Employee ID is required')
        # converts ME@Email.com to me@email.com)
        email = self.normalize_email(email)
        # Creates user object (not saved yet)
        user = self.model(
            employee_id=employee_id, email=email, **extra_fields
        )
        # hashes the password.
        user.set_password(password)
        # Saves user to database
        user.save(using=self._db)
        return user

    # Creates admin user
    def create_superuser(self, employee_id, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('full_name', 'Admin')
        return self.create_user(employee_id, email, password, **extra_fields)

# Table
# custom User model
class Employee(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('employee', 'Employee'),
        ('hr', 'HR'),
        ('admin', 'Admin'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Username : employee_id
    employee_id = models.CharField(max_length=20, unique=True) 
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    department = models.ForeignKey(
        # on_delete=models.SET_NULL: If a Department is deleted, the employee doesn't get deleted; 
        # their department just becomes "Empty."
        Department, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='employees'
    )
    designation = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    # Uploads images to media/profiles/
    profile_photo = models.ImageField(
        upload_to='profiles/', null=True, blank=True
    )
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default='employee'
    )
    # Access to admin panel  
    is_active = models.BooleanField(default=True)
    # Access to admin panel
    is_staff = models.BooleanField(default=False)   
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Attach custom manager
    objects = EmployeeManager()

    # unique ID used for logging in.
    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['email', 'full_name']

    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['employee_id']

    def __str__(self):
        return f'{self.employee_id} — {self.full_name}'

    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.full_name.split()[0] if self.full_name else ''

# Table
class LeaveBalance(models.Model):
    # 1 Employee = 1 Leave Balance
    employee = models.OneToOneField(
        # If you delete the Employee, delete their Leave Balance too.
        Employee, on_delete=models.CASCADE,
        related_name='leave_balance'
    )
    casual_leave = models.DecimalField(
        # DecimalField : Allows for half-days 
        # max_digits : 999.99
        max_digits=5, decimal_places=1, default=100
    )
    sick_leave = models.DecimalField(
        max_digits=5, decimal_places=1, default=100
    )
    earned_leave = models.DecimalField(
        max_digits=5, decimal_places=1, default=100
    )
    work_from_home = models.DecimalField(
        max_digits=5, decimal_places=1, default=200
    )
    updated_at = models.DateTimeField(auto_now=True)

    #  Heading : Leave Balance — Mariya Kiran 
    #  it controls how the object looks in the Admin list.
    def __str__(self):
        return f'Leave Balance — {self.employee.full_name}'


# ── Auto-create LeaveBalance whenever a new Employee is saved ─────────────────
# This listens for a "Save" event on the Employee table.
@receiver(post_save, sender=Employee)
# instance → the employee object
# created → True if newly created
def create_leave_balance(sender, instance, created, **kwargs):
    if created:
        # This ensures it only happens the first time an employee is saved.
        LeaveBalance.objects.get_or_create(employee=instance)