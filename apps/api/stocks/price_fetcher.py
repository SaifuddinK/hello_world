import certifi
import requests

_SESSION = requests.Session()
_SESSION.verify = certifi.where()
_SESSION.headers.update({"User-Agent": "Mozilla/5.0 StockTicker/1.0"})

_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=5d"
_QUOTE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d"


def fetch_price(symbol: str) -> dict | None:
    try:
        r = _SESSION.get(_QUOTE_URL.format(symbol=symbol), timeout=10)
        if r.status_code != 200:
            return None
        data = r.json()
        result = data.get("chart", {}).get("result")
        if not result:
            return None
        meta = result[0].get("meta", {})
        price = meta.get("regularMarketPrice") or meta.get("currentPrice")
        prev_close = meta.get("previousClose") or meta.get("chartPreviousClose")
        long_name = meta.get("longName") or meta.get("shortName") or symbol
        if price is None:
            return None
        return {
            "name": long_name,
            "current_price": float(price),
            "previous_close": float(prev_close) if prev_close else None,
        }
    except Exception:
        return None
