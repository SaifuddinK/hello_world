from django.conf import settings
from django.db import models


class Stock(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stocks")
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=200, blank=True)
    current_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    previous_close = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    last_updated = models.DateTimeField(null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "symbol")
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.user.email} — {self.symbol}"
