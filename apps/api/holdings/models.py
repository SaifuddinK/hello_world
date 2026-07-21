from django.conf import settings
from django.db import models


class Holding(models.Model):
    EXCHANGE_CHOICES = [
        ("US", "US (NYSE/NASDAQ)"),
        ("NSE", "NSE (India)"),
        ("BSE", "BSE (India)"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="holdings")
    symbol = models.CharField(max_length=20)        # user-facing symbol, e.g. RELIANCE
    exchange = models.CharField(max_length=5, choices=EXCHANGE_CHOICES, default="US")
    name = models.CharField(max_length=200, blank=True)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    buy_price = models.DecimalField(max_digits=12, decimal_places=4)
    current_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    previous_close = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    last_updated = models.DateTimeField(null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "symbol", "exchange")
        ordering = ["-added_at"]

    def yahoo_symbol(self):
        suffix = {"NSE": ".NS", "BSE": ".BO", "US": ""}
        return f"{self.symbol}{suffix.get(self.exchange, '')}"

    def __str__(self):
        return f"{self.user.email} — {self.yahoo_symbol()}"
