from django.contrib import admin

from .models import Category, Product, ProductImage, Banner, RecentlyViewed,Order, OrderItem

admin.site.register(Product)
admin.site.register(Category)
admin.site.register(ProductImage)
admin.site.register(RecentlyViewed)
admin.site.register(Banner)
admin.site.register(Order)
admin.site.register(OrderItem)
