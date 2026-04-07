from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import transaction

from .models import Category, Product, ProductImage, Banner, RecentlyViewed, Review
from .models import Cart, Wishlist, Order, OrderItem
from .serializers import (
    CategorySerializer, ProductSerializer, ProductImageSerializer,
    ProductAdminSerializer, BannerSerializer, RecentlyViewedSerializer,
    CartSerializer, WishlistSerializer, OrderSerializer, ReviewSerializer,
)


# ─── CATEGORY ─────────────────────────────────────────────────────────────────
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


# ─── PRODUCT ───────────────────────────────────────────────────────────────────
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    # Accept JSON, multipart, and form-data
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at']
    
    @action(detail=True, methods=['post'])
    def add_images(self, request, pk=None):
        return Response({'status': 'images added'})


    def detail_fields(self, category_name):
        base = ['name', 'description', 'price', 'stock', 'image', 'is_featured']
        mappings = {
            'clothing':    base + ['sizes', 'colors', 'gender'],
            'shoes':       base + ['sizes', 'colors', 'gender'],
            'pets':        base + ['pet_breed', 'pet_age'],
            'electronics': base + ['warranty'],
            'accessories': base,
        }
        return mappings.get(category_name.lower(), base)

    def retrieve(self, request, *args, **kwargs):
        product = self.get_object()
        category_name = product.category.name.lower()
        serializer = self.get_serializer(product)
        allowed_fields = self.detail_fields(category_name)
        return Response({
            'product': serializer.data,
            'editSchema': {
                'category':      category_name,
                'allowedFields': allowed_fields,
            }
        })

    def get_serializer_class(self):
        user = self.request.user
        if user.is_authenticated and getattr(user, 'user_type', None) == 'admin':
            return ProductAdminSerializer
        return ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured', 'best_sellers']:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        queryset  = Product.objects.all().order_by('-created_at')
        category  = self.request.query_params.get('category')
        gender    = self.request.query_params.get('gender')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if category:  queryset = queryset.filter(category__id=category)
        if gender:    queryset = queryset.filter(gender=gender)
        if min_price: queryset = queryset.filter(price__gte=min_price)
        if max_price: queryset = queryset.filter(price__lte=max_price)
        return queryset

    def create(self, request, *args, **kwargs):
        """
        POST /api/products/products/
        Accepts JSON body from the React Native app.
        sizes and colors arrive as comma-separated strings and are split here
        before passing to the serializer.
        """
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        # Normalise sizes / colors from comma-string → list
        for field in ('sizes', 'colors'):
            val = data.get(field, '')
            if isinstance(val, str) and val:
                data[field] = [v.strip() for v in val.split(',') if v.strip()]
            elif not val:
                data[field] = []

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/products/products/{id}/
        Same normalisation as create.
        """
        instance = self.get_object()
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        for field in ('sizes', 'colors'):
            if field in data:
                val = data[field]
                if isinstance(val, str) and val:
                    data[field] = [v.strip() for v in val.split(',') if v.strip()]
                elif not val:
                    data[field] = []

        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        products = Product.objects.filter(is_featured=True)[:5]
        return Response(ProductSerializer(products, many=True).data)

    @action(detail=False, methods=['get'])
    def best_sellers(self, request):
        products = Product.objects.filter(is_featured=True)[:10]
        return Response(ProductSerializer(products, many=True).data)


# ─── REVIEW ────────────────────────────────────────────────────────────────────
class ReviewViewSet(viewsets.ModelViewSet):
    """
    GET    /api/products/reviews/?product=<id>   — list reviews for a product
    POST   /api/products/reviews/                — submit a review (auth required)
    PATCH  /api/products/reviews/<id>/           — edit own review
    DELETE /api/products/reviews/<id>/           — delete own review
    """
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset   = Review.objects.select_related('user', 'product')
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        product_id = self.request.data.get('product_id')
        product    = get_object_or_404(Product, id=product_id)
        # update_or_create so re-submitting a review updates it
        review, _ = Review.objects.update_or_create(
            user=self.request.user,
            product=product,
            defaults={
                'rating':  serializer.validated_data.get('rating'),
                'title':   serializer.validated_data.get('title', ''),
                'comment': serializer.validated_data.get('comment', ''),
            }
        )
        # return the saved instance via serializer
        serializer._validated_data = serializer.to_representation(review)

    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        product    = get_object_or_404(Product, id=product_id)

        # Build or update the review
        review, created = Review.objects.update_or_create(
            user=request.user,
            product=product,
            defaults={
                'rating':  request.data.get('rating'),
                'title':   request.data.get('title', ''),
                'comment': request.data.get('comment', ''),
            }
        )
        serializer = self.get_serializer(review)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def get_object(self):
        obj = super().get_object()
        # Allow owners or admins to edit/delete
        if self.action in ['update', 'partial_update', 'destroy']:
            user = self.request.user
            if obj.user != user and not user.is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only edit your own reviews.")
        return obj


# ─── BANNER ────────────────────────────────────────────────────────────────────
class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset           = Banner.objects.filter(is_active=True)
    serializer_class   = BannerSerializer
    permission_classes = [AllowAny]


# ─── CART ──────────────────────────────────────────────────────────────────────
class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        items = Cart.objects.filter(user=request.user).select_related('product')
        return Response(CartSerializer(items, many=True).data)

    def create(self, request):
        product_id = request.data.get('product_id')
        quantity   = int(request.data.get('quantity', 1))
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = Cart.objects.get_or_create(
            user=request.user, product=product, defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response(CartSerializer(cart_item).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            item = Cart.objects.get(id=pk, user=request.user)
            item.delete()
            return Response({'success': True})
        except Cart.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    def partial_update(self, request, pk=None):
        try:
            item     = Cart.objects.get(id=pk, user=request.user)
            quantity = int(request.data.get('quantity', 1))
            if quantity <= 0:
                item.delete()
                return Response({'success': True, 'message': 'Item removed'})
            item.quantity = quantity
            item.save()
            return Response(CartSerializer(item).data)
        except Cart.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── WISHLIST ──────────────────────────────────────────────────────────────────
class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        items = Wishlist.objects.filter(user=request.user).select_related('product')
        return Response(WishlistSerializer(items, many=True).data)

    def create(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        item, created = Wishlist.objects.get_or_create(user=request.user, product=product)
        if not created:
            return Response({'message': 'Already in wishlist'}, status=status.HTTP_200_OK)
        return Response(WishlistSerializer(item).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            item = Wishlist.objects.get(id=pk, user=request.user)
            item.delete()
            return Response({'success': True})
        except Wishlist.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        product_id = request.data.get('product_id')
        try:
            item = Wishlist.objects.get(user=request.user, product_id=product_id)
            item.delete()
            return Response({'success': True})
        except Wishlist.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── ORDER ─────────────────────────────────────────────────────────────────────
class OrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        if getattr(user, 'user_type', None) == 'admin':
            orders = Order.objects.all().order_by('-created_at')
        else:
            orders = Order.objects.filter(user=user).order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)

    def create(self, request):
        try:
            with transaction.atomic():
                cart_items = Cart.objects.filter(user=request.user).select_related('product')
                if not cart_items.exists():
                    return Response({'error': 'Your cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

                total_amount = sum(item.product.price * item.quantity for item in cart_items)
                order = Order.objects.create(
                    user=request.user,
                    total_amount=total_amount,
                    shipping_address=request.data.get('shipping_address', 'Default Address'),
                    phone_number=request.data.get(
                        'phone_number', getattr(request.user, 'phone_number', '')
                    ),
                )
                for cart_item in cart_items:
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        price=cart_item.product.price,
                    )
                cart_items.delete()
                return Response(
                    {'success': True, 'order': OrderSerializer(order).data},
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        try:
            order = Order.objects.get(id=pk, user=request.user)
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    def partial_update(self, request, pk=None):
        try:
            order      = Order.objects.get(id=pk)
            new_status = request.data.get('status')
            if new_status:
                order.status = new_status
                order.save()
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── STANDALONE ENDPOINTS ──────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_product_images(request, product_id):
    """POST /api/add-images/<product_id>/ — upload multiple product images"""
    product = get_object_or_404(Product, id=product_id)
    images  = request.FILES.getlist('images')
    if not images:
        return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

    created = []
    for img in images:
        pi = ProductImage.objects.create(product=product, image=img)
        created.append(pi)

    return Response(
        {
            'success': True,
            'count':   len(created),
            'images':  ProductImageSerializer(created, many=True, context={'request': request}).data,
        },
        status=status.HTTP_201_CREATED
    )

@api_view(['POST'])
def add_images(request, pk):
    print(request.FILES)
    return Response({'message': 'Images uploaded'})

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_product_image(request, image_id):
    image = get_object_or_404(ProductImage, id=image_id)
    image.delete()
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_recently_viewed(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        RecentlyViewed.objects.update_or_create(user=request.user, product=product)
        return Response({'status': 'ok'})
    except Product.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recently_viewed(request):
    items = RecentlyViewed.objects.filter(user=request.user).select_related('product')[:10]
    return Response(RecentlyViewedSerializer(items, many=True).data)


@api_view(['GET'])
def get_best_sellers(request):
    products   = Product.objects.filter(is_featured=True)[:10]
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)