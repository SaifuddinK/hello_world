from django.urls import path
from . import views

urlpatterns = [
    path("", views.stock_list),
    path("refresh/", views.refresh_prices),
    path("<str:symbol>/", views.stock_detail),
]
