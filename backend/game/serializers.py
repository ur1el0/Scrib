from rest_framework import serializers
from .models import Score

class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ['id', 'player_name', 'score', 'words', 'created_at']

class BoardItemSerializer(serializers.Serializer):
    row = serializers.IntegerField()
    col = serializers.IntegerField()
    letter = serializers.CharField(max_length=1)
    is_wildcard = serializers.BooleanField(default=False)

class GameSubmitSerializer(serializers.Serializer):
    player_name = serializers.CharField(max_length=100)
    dice = serializers.ListField(child=serializers.CharField(max_length=1))
    board = BoardItemSerializer(many=True)
