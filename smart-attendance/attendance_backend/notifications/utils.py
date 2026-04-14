from fcm_django.models import FCMDevice


def send_notification_to_user(user, title, body, data=None):
    """Send push notification to a specific user's devices."""
    try:
        devices = FCMDevice.objects.filter(user=user, active=True)
        if devices.exists():
            devices.send_message(
                title=title,
                body=body,
                data=data or {},
                sound='default',
            )
    except Exception as e:
        print(f"Notification error for user {user.id}: {e}")


def send_notification_to_all_employees(title, body, data=None):
    """Broadcast notification to all employees."""
    from django.contrib.auth import get_user_model
    Employee = get_user_model()
    employees = Employee.objects.filter(role='employee', is_active=True)
    for employee in employees:
        send_notification_to_user(employee, title, body, data)