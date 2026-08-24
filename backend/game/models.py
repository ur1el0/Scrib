from django.db import models

class Score(models.Model):
    player_name = models.CharField(max_length=100)
    score = models.IntegerField()
    words = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score']

    def __str__(self):
        return f"{self.player_name}: {self.score}"
