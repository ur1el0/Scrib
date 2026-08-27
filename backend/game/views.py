from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Room, Player
from .serializers import RoomSerializer

@api_view(['POST'])
def create_room(request):
    room = Room.objects.create()
    return Response(RoomSerializer(room).data)

@api_view(['POST'])
def join_room(request):
    code = request.data.get('code', '').upper()
    name = request.data.get('name', '').strip()
    if not code or not name:
        return Response({'error': 'Missing code or name'}, status=400)
        
    try:
        room = Room.objects.get(code=code)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=404)
        
    player, created = Player.objects.get_or_create(room=room, name=name)
    
    # First player to join is game master
    if created and room.players.count() == 1:
        player.is_game_master = True
        player.save()
        
    return Response({'room': room.code, 'name': player.name, 'is_gm': player.is_game_master})

@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok"})
