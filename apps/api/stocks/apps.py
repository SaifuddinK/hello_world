from django.apps import AppConfig


class StocksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "stocks"

    def ready(self):
        from .updater import start_price_updater
        start_price_updater()
