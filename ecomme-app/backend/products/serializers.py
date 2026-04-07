from rest_framework import serializers
from .models import Product, Category, Banner, RecentlyViewed, ProductImage, Review
from .models import Cart, Wishlist, Order, OrderItem


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for product reviews"""
    username = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'username', 'user_full_name', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'username', 'user_full_name', 'created_at']

    def get_user_full_name(self, obj):
        first = getattr(obj.user, 'first_name', '') or ''
        last  = getattr(obj.user, 'last_name', '') or ''
        full  = f"{first} {last}".strip()
        return full if full else obj.user.username


class ProductSerializer(serializers.ModelSerializer):
    """Public product serializer — includes images + rating summary"""
    images         = ProductImageSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count   = serializers.IntegerField(read_only=True)
    category_name  = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = Product
        fields = '__all__'


class ProductAdminSerializer(serializers.ModelSerializer):
    """Admin product serializer — full edit access"""
    category_name  = serializers.CharField(source='category.name', read_only=True)
    image_url      = serializers.SerializerMethodField()
    images         = ProductImageSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count   = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Product
        fields = '__all__'

    def to_internal_value(self, data):
        """
        Handle both JSON (from mobile app) and multipart/form-data payloads.
        When the request is multipart, sizes/colors arrive as repeated form keys;
        when it's JSON they arrive as lists directly.
        """
        # data might be a QueryDict (multipart) or a plain dict (JSON)
        is_querydict = hasattr(data, 'getlist')

        new_data = data.copy() if is_querydict else dict(data)

        if is_querydict:
            # multipart: getlist returns ['S', 'M', 'L'] or ['S,M,L']
            if 'sizes' in data:
                raw = data.getlist('sizes')
                # flatten comma-separated strings if the app sent "S,M,L"
                sizes = []
                for item in raw:
                    sizes.extend([s.strip() for s in item.split(',') if s.strip()])
                new_data.setlist('sizes', sizes)

            if 'colors' in data:
                raw = data.getlist('colors')
                colors = []
                for item in raw:
                    colors.extend([c.strip() for c in item.split(',') if c.strip()])
                new_data.setlist('colors', colors)
        else:
            # JSON payload: sizes/colors may be comma-separated strings or lists
            for field in ('sizes', 'colors'):
                if field in new_data:
                    val = new_data[field]
                    if isinstance(val, str):
                        new_data[field] = [v.strip() for v in val.split(',') if v.strip()]
                    # else it's already a list — leave it

        return super().to_internal_value(new_data)

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = '__all__'


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Banner
        fields = '__all__'


class RecentlyViewedSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model  = RecentlyViewed
        fields = ['id', 'product', 'viewed_at']


class CartSerializer(serializers.ModelSerializer):
    product    = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal   = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = Cart
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal', 'added_at']

    def create(self, validated_data):
        product_id = validated_data.pop('product_id')
        product    = Product.objects.get(id=product_id)
        return Cart.objects.create(product=product, **validated_data)


class WishlistSerializer(serializers.ModelSerializer):
    product    = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model  = Wishlist
        fields = ['id', 'product', 'product_id', 'added_at']

    def create(self, validated_data):
        product_id = validated_data.pop('product_id')
        product    = Product.objects.get(id=product_id)
        return Wishlist.objects.create(product=product, **validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price', 'subtotal']

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product.image:
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


class OrderSerializer(serializers.ModelSerializer):
    items       = OrderItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'order_number', 'total_amount', 'status',
            'shipping_address', 'phone_number',
            'created_at', 'updated_at', 'items', 'total_items',
        ]

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())