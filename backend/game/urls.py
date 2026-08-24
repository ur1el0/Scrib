from django.urls import path
from . import views

urlpatterns = [
    path('game/roll/', views.roll_view, name='game_roll'),
    path('game/submit/', views.submit_view, name='game_submit'),
    path('leaderboard/', views.leaderboard_view, name='leaderboard'),
]
