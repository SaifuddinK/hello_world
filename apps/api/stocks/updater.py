import threading
import time
import logging

logger = logging.getLogger(__name__)

REFRESH_INTERVAL = 60  # seconds


def _update_loop():
    # Wait for Django ORM to be fully ready before first run
    time.sleep(10)
    while True:
        try:
            _refresh_all()
        except Exception as e:
            logger.error("Price updater error: %s", e)
        time.sleep(REFRESH_INTERVAL)


def _refresh_all():
    from django.utils import timezone
    from .models import Stock
    from .price_fetcher import fetch_price

    # --- Refresh watchlist stocks ---
    stock_symbols = list(Stock.objects.values_list("symbol", flat=True).distinct())
    for symbol in stock_symbols:
        data = fetch_price(symbol)
        if data is None:
            continue
        Stock.objects.filter(symbol=symbol).update(
            name=data["name"],
            current_price=data["current_price"],
            previous_close=data["previous_close"],
            last_updated=timezone.now(),
        )

    # --- Refresh holdings ---
    try:
        from holdings.models import Holding
        suffix_map = {"NSE": ".NS", "BSE": ".BO", "US": ""}
        # Get distinct (symbol, exchange) pairs
        pairs = list(Holding.objects.values_list("symbol", "exchange").distinct())
        for symbol, exchange in pairs:
            yahoo_sym = f"{symbol}{suffix_map.get(exchange, '')}"
            data = fetch_price(yahoo_sym)
            if data is None:
                continue
            Holding.objects.filter(symbol=symbol, exchange=exchange).update(
                name=data["name"],
                current_price=data["current_price"],
                previous_close=data["previous_close"],
                last_updated=timezone.now(),
            )
    except Exception as e:
        logger.error("Holdings price update error: %s", e)

    total = len(stock_symbols)
    logger.info("Refreshed prices for %d watchlist symbol(s)", total)


def start_price_updater():
    t = threading.Thread(target=_update_loop, daemon=True, name="stock-price-updater")
    t.start()
