from django.db import models
from django.utils import timezone
import string
import random

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class Room(models.Model):
    ROOM_STATES = [
        ('WAITING', 'Waiting for Game Master'),
        ('PLAYING', 'Game in Progress'),
        ('FINISHED', 'Round Finished')
    ]
    code = models.CharField(max_length=10, unique=True, default=generate_room_code)
    state = models.CharField(max_length=20, choices=ROOM_STATES, default='WAITING')
    grid_state = models.JSONField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room {self.code} - {self.state}"

class Player(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='players')
    name = models.CharField(max_length=50)
    score = models.IntegerField(default=0)
    is_game_master = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'name')

    def __str__(self):
        return f"{self.name} ({self.room.code})"

class FoundWord(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='found_words')
    word = models.CharField(max_length=20)
    points = models.IntegerField(default=0)
    found_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('player', 'word')

    def __str__(self):
        return f"{self.word} - {self.player.name}"
