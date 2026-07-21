from django.urls import path
from . import views

urlpatterns = [
    path("", views.holding_list),
    path("<int:pk>/", views.holding_detail),
]
