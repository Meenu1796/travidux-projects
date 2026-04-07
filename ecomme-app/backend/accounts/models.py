from django.contrib.auth.models import AbstractUser     #user structure (username, password, email, etc.)
from django.db import models

#database models
# User → custom authentication (admin/customer)
# Product → items in your e-commerce app

class User(AbstractUser):
    # USER_TYPE_CHOICES = [
    #     ('customer', 'Customer'),
    #     ('admin', 'Admin'),
    # ]
    first_name = models.CharField(max_length=150, blank=False, null=False)
    last_name = models.CharField(max_length=150, blank=False, null=False)
    phone_number = models.CharField(max_length=30, unique=True, blank=False, null=False)
    user_type = models.CharField(max_length=10, default='customer')
    
    def save(self, *args, **kwargs):
            # If this is a superuser, ensure they are marked as 'admin' in our custom field
            if self.is_superuser or self.is_staff:
                self.user_type = 'admin'
            super().save(*args, **kwargs)
# | column    | type                 |
# | --------- | -------------------- |
# | id        | int                  |
# | username  | varchar              |
# | password  | hashed               |
# | email     | varchar              |
# | user_type | varchar              |
# | ...       | other default fields |


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    image = models.ImageField(upload_to='products/', blank=True)    #Uploads image to: media/products/
    
    stock = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

# | column      | type      |
# | ----------- | --------- |
# | id          | int       |
# | name        | varchar   |
# | price       | decimal   |
# | description | text      |
# | image       | file path |
# | stock       | int       |
# | created_at  | datetime  |
