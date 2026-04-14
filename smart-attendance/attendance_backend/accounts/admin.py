# admin: The core tool for building the dashboard, register models and customize admin UI
from django.contrib import admin

# UserAdmin: A specialized "Super-Tool." Since your Employee is actually a User who logs in, we use this 
# to keep built-in security features like password reset forms.
from django.contrib.auth.admin import UserAdmin

# easy to switch the dashboard to another language later
# _ (gettext_lazy): A "Translator." It marks text for translation so your dashboard can be 
# in English, Malayalam, or Spanish later without changing code.
from django.utils.translation import gettext_lazy as _

from .models import Employee, LeaveBalance, Department

# Admin Panel 

# Creates an inline form
# Shows LeaveBalance inside Employee admin page
class LeaveBalanceInline(admin.StackedInline):
    model = LeaveBalance
    can_delete = False
    verbose_name_plural = 'Leave Balance'
    fields = ('casual_leave', 'sick_leave', 'earned_leave', 'work_from_home')


@admin.register(Employee)
class EmployeeAdmin(UserAdmin):
    inlines = [LeaveBalanceInline]

    # What you see in the list view
    list_display = (
        'employee_id', 'full_name', 'email',
        'department', 'designation', 'role', 'is_active'
    )
    # Adds filter sidebar
    list_filter = ('role', 'is_active', 'department')
    # Adds filter sidebar
    search_fields = ('employee_id', 'full_name', 'email')
    # Enables search bar
    ordering = ('employee_id',)

    # Fieldsets for the EDIT page (includes Change Password link)
    fieldsets = (
        (_('Login Info'), {
            'fields': ('employee_id', 'password')
        }),
        (_('Personal Info'), {
            'fields': (
                'full_name', 'email', 'phone_number',
                'profile_photo', 'date_of_joining'
            )
        }),
        (_('Work Info'), {
            'fields': ('department', 'designation', 'role')
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser',
                       'groups', 'user_permissions')
        }),
        (_('Important dates'), {
            'fields': ('last_login',)
        }),
    )

    # Fieldsets for the ADD (create new employee) page
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'employee_id', 'full_name', 'email',
                'department', 'designation', 'role',
                'phone_number', 'date_of_joining',
                'password1', 'password2',
            ),
        }),
    )

    # This tells Django the username field is employee_id
    USERNAME_FIELD = 'employee_id'

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Auto-create LeaveBalance when a new employee is created
        LeaveBalance.objects.get_or_create(employee=obj)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

# tell the EmployeeAdmin to include LeaveBalance inline
@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'casual_leave', 'sick_leave',
        'earned_leave', 'work_from_home'
    )
    # Search Bar at the top : Go to the Employee table and search the full_name column there
    search_fields = ('employee__full_name', 'employee__employee_id')
    autocomplete_fields = ['employee']


# from django.contrib import admin
# from .models import Department, EmployeeManager, Employee, LeaveBalance

# admin.site.register(Department)
# admin.site.register(Employee)
# admin.site.register(LeaveBalance)
