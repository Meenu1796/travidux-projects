from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CartViewSet, WishlistViewSet, OrderViewSet,
    ProductViewSet,
    CategoryViewSet,
    BannerViewSet,
    ReviewViewSet,
    add_product_images,
    delete_product_image,
    add_recently_viewed,
    get_recently_viewed,
    get_best_sellers,
)

router = DefaultRouter()
router.register(r'products',   ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'banners',    BannerViewSet)
router.register(r'cart',       CartViewSet,    basename='cart')
router.register(r'wishlist',   WishlistViewSet, basename='wishlist')
router.register(r'orders',     OrderViewSet,   basename='orders')
router.register(r'reviews',    ReviewViewSet,  basename='reviews')

urlpatterns = [
    path('', include(router.urls)),
    # Image management  (resolves to: /api/products/add-images/<id>/)
    path('add-images/<int:product_id>/',  add_product_images,   name='add_product_images'),
    path('delete-image/<int:image_id>/', delete_product_image, name='delete_product_image'),
    # Recently viewed
    path('recently-viewed/add/<int:product_id>/', add_recently_viewed, name='add_recently_viewed'),
    path('recently-viewed/',                      get_recently_viewed, name='get_recently_viewed'),
    # Best sellers
    path('best-sellers-list/',                    get_best_sellers,    name='get_best_sellers'),
]