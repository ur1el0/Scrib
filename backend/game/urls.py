from django.urls import path
from . import views

urlpatterns = [
    path('room/create/', views.create_room, name='create_room'),
    path('room/join/', views.join_room, name='join_room'),
    path('health/', views.health_check, name='health_check'),
]
