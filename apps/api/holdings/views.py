from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from stocks.price_fetcher import fetch_price
from .models import Holding
from .serializers import HoldingAddSerializer, HoldingSerializer, HoldingUpdateSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def holding_list(request):
    if request.method == "GET":
        holdings = Holding.objects.filter(user=request.user)
        return Response(HoldingSerializer(holdings, many=True).data)

    serializer = HoldingAddSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    symbol = serializer.validated_data["symbol"]
    exchange = serializer.validated_data["exchange"]

    if Holding.objects.filter(user=request.user, symbol=symbol, exchange=exchange).exists():
        return Response({"detail": "Holding already exists for this symbol and exchange."}, status=status.HTTP_400_BAD_REQUEST)

    suffix = {"NSE": ".NS", "BSE": ".BO", "US": ""}
    yahoo_sym = f"{symbol}{suffix[exchange]}"
    data = fetch_price(yahoo_sym)
    if data is None:
        return Response({"detail": f"Symbol '{yahoo_sym}' not found or unavailable."}, status=status.HTTP_400_BAD_REQUEST)

    holding = Holding.objects.create(
        user=request.user,
        symbol=symbol,
        exchange=exchange,
        name=data["name"],
        quantity=serializer.validated_data["quantity"],
        buy_price=serializer.validated_data["buy_price"],
        current_price=data["current_price"],
        previous_close=data["previous_close"],
        last_updated=timezone.now(),
    )
    return Response(HoldingSerializer(holding).data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def holding_detail(request, pk):
    try:
        holding = Holding.objects.get(pk=pk, user=request.user)
    except Holding.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        holding.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = HoldingUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if "quantity" in serializer.validated_data:
        holding.quantity = serializer.validated_data["quantity"]
    if "buy_price" in serializer.validated_data:
        holding.buy_price = serializer.validated_data["buy_price"]
    holding.save(update_fields=["quantity", "buy_price"])
    return Response(HoldingSerializer(holding).data)
