from django.db import models

class Score(models.Model):
    player_name = models.CharField(max_length=50)
    score = models.IntegerField(db_index=True)
    words = models.JSONField(default=list)  # Stores the list of valid words formed
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score']

    def __str__(self):
        return f"{self.player_name}: {self.score}"
