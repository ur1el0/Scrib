from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Score
from .serializers import ScoreSerializer, GameSubmitSerializer
from .logic import roll_dice, validate_submission

@api_view(['GET'])
def roll_view(request):
    seed = request.query_params.get('seed', None)
    dice = roll_dice(seed)
    return Response({'dice': dice})

@api_view(['POST'])
def submit_view(request):
    serializer = GameSubmitSerializer(data=request.data)
    if serializer.is_valid():
        player_name = serializer.validated_data['player_name']
        dice = serializer.validated_data['dice']
        board_list = serializer.validated_data['board']
        
        is_valid, score, words, error = validate_submission(dice, board_list)
        
        if is_valid:
            # Save score
            score_obj = Score.objects.create(
                player_name=player_name,
                score=score,
                words=words
            )
            return Response({
                'valid': True,
                'score': score,
                'words': words,
                'error': None
            })
        else:
            return Response({
                'valid': False,
                'score': 0,
                'words': [],
                'error': error
            })
            
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def leaderboard_view(request):
    scores = Score.objects.order_by('-score')[:10]
    serializer = ScoreSerializer(scores, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok"})
