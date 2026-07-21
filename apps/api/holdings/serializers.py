from rest_framework import serializers
from .models import Holding

EXCHANGE_SUFFIX = {"NSE": ".NS", "BSE": ".BO", "US": ""}


class HoldingSerializer(serializers.ModelSerializer):
    yahoo_symbol = serializers.SerializerMethodField()
    market_value = serializers.SerializerMethodField()
    pnl = serializers.SerializerMethodField()
    pnl_percent = serializers.SerializerMethodField()
    day_change_percent = serializers.SerializerMethodField()

    class Meta:
        model = Holding
        fields = [
            "id", "symbol", "exchange", "yahoo_symbol", "name",
            "quantity", "buy_price",
            "current_price", "previous_close",
            "market_value", "pnl", "pnl_percent", "day_change_percent",
            "last_updated", "added_at",
        ]

    def get_yahoo_symbol(self, obj):
        return obj.yahoo_symbol()

    def get_market_value(self, obj):
        if obj.current_price and obj.quantity:
            return round(float(obj.current_price) * float(obj.quantity), 2)
        return None

    def get_pnl(self, obj):
        if obj.current_price and obj.quantity and obj.buy_price:
            return round((float(obj.current_price) - float(obj.buy_price)) * float(obj.quantity), 2)
        return None

    def get_pnl_percent(self, obj):
        if obj.current_price and obj.buy_price and float(obj.buy_price) != 0:
            return round(((float(obj.current_price) - float(obj.buy_price)) / float(obj.buy_price)) * 100, 2)
        return None

    def get_day_change_percent(self, obj):
        if obj.current_price and obj.previous_close and float(obj.previous_close) != 0:
            return round(((float(obj.current_price) - float(obj.previous_close)) / float(obj.previous_close)) * 100, 2)
        return None


class HoldingAddSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=20)
    exchange = serializers.ChoiceField(choices=["US", "NSE", "BSE"])
    quantity = serializers.DecimalField(max_digits=14, decimal_places=4, min_value=0.0001)
    buy_price = serializers.DecimalField(max_digits=12, decimal_places=4, min_value=0.0001)

    def validate_symbol(self, value):
        return value.upper().strip()


class HoldingUpdateSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=14, decimal_places=4, min_value=0.0001, required=False)
    buy_price = serializers.DecimalField(max_digits=12, decimal_places=4, min_value=0.0001, required=False)
