from rest_framework import serializers
from .models import Stock


class StockSerializer(serializers.ModelSerializer):
    change_percent = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = ["id", "symbol", "name", "current_price", "previous_close", "change_percent", "last_updated", "added_at"]

    def get_change_percent(self, obj):
        if obj.current_price and obj.previous_close and obj.previous_close != 0:
            change = ((obj.current_price - obj.previous_close) / obj.previous_close) * 100
            return round(float(change), 2)
        return None


class StockAddSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=20)

    def validate_symbol(self, value):
        return value.upper().strip()
