from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Stock
from .price_fetcher import fetch_price
from .serializers import StockAddSerializer, StockSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def stock_list(request):
    if request.method == "GET":
        stocks = Stock.objects.filter(user=request.user)
        return Response(StockSerializer(stocks, many=True).data)

    serializer = StockAddSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    symbol = serializer.validated_data["symbol"]

    if Stock.objects.filter(user=request.user, symbol=symbol).exists():
        return Response({"detail": "Stock already in your watchlist."}, status=status.HTTP_400_BAD_REQUEST)

    data = fetch_price(symbol)
    if data is None:
        return Response({"detail": f"Symbol '{symbol}' not found or unavailable."}, status=status.HTTP_400_BAD_REQUEST)

    stock = Stock.objects.create(
        user=request.user,
        symbol=symbol,
        name=data["name"],
        current_price=data["current_price"],
        previous_close=data["previous_close"],
        last_updated=timezone.now(),
    )
    return Response(StockSerializer(stock).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def stock_detail(request, symbol):
    symbol = symbol.upper()
    try:
        stock = Stock.objects.get(user=request.user, symbol=symbol)
    except Stock.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    stock.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def refresh_prices(request):
    stocks = Stock.objects.filter(user=request.user)
    updated = []
    for stock in stocks:
        data = fetch_price(stock.symbol)
        if data:
            stock.name = data["name"]
            stock.current_price = data["current_price"]
            stock.previous_close = data["previous_close"]
            stock.last_updated = timezone.now()
            updated.append(stock)
    if updated:
        Stock.objects.bulk_update(updated, ["name", "current_price", "previous_close", "last_updated"])
    return Response(StockSerializer(Stock.objects.filter(user=request.user), many=True).data)
