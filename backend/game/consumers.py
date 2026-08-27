import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Player, FoundWord
from .logic import generate_board, validate_word

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'game_{self.room_code}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'START_GAME':
            # Generate board and broadcast
            board = generate_board()
            await self.set_room_playing(self.room_code, board)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_start',
                    'board': board
                }
            )
            
            # Start timer in background (simplified for this prototype)
            asyncio.create_task(self.run_timer())
            
        elif action == 'SUBMIT_WORD':
            word = data.get('word')
            player_name = data.get('player_name')
            
            room = await self.get_room(self.room_code)
            if not room or room.state != 'PLAYING':
                return
                
            is_valid, points, err = validate_word(room.grid_state, word)
            if is_valid:
                # Save to DB
                player, total_score = await self.save_found_word(self.room_code, player_name, word, points)
                if player:
                    # Broadcast score update
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'score_update',
                            'player_name': player_name,
                            'total_score': total_score,
                            'word': word,
                            'points': points
                        }
                    )

    async def run_timer(self):
        # 3 minutes = 180 seconds
        for i in range(180, -1, -1):
            await asyncio.sleep(1)
            if i % 5 == 0 or i <= 10: # Broadcast every 5s, or every second for last 10s
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'timer_tick',
                        'time_left': i
                    }
                )
        
        await self.set_room_finished(self.room_code)
        missed_words = await self.get_missed_words(self.room_code)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_over',
                'missed_words': missed_words
            }
        )

    @database_sync_to_async
    def get_missed_words(self, room_code):
        from .logic import solve_board
        room = Room.objects.get(code=room_code)
        all_possible = solve_board(room.grid_state)
        found = set(FoundWord.objects.filter(player__room=room).values_list('word', flat=True))
        return [w for w in all_possible if w['word'] not in found]

    # Handlers
    async def game_start(self, event):
        await self.send(text_data=json.dumps({
            'action': 'GAME_START',
            'board': event['board']
        }))
        
    async def score_update(self, event):
        await self.send(text_data=json.dumps({
            'action': 'SCORE_UPDATE',
            'player_name': event['player_name'],
            'total_score': event['total_score'],
            'word': event['word'],
            'points': event['points']
        }))
        
    async def timer_tick(self, event):
        await self.send(text_data=json.dumps({
            'action': 'TIMER_TICK',
            'time_left': event['time_left']
        }))
        
    async def game_over(self, event):
        await self.send(text_data=json.dumps({
            'action': 'GAME_OVER',
            'missed_words': event.get('missed_words', [])
        }))

    # DB Helpers
    @database_sync_to_async
    def get_room(self, code):
        try:
            return Room.objects.get(code=code)
        except Room.DoesNotExist:
            return None
            
    @database_sync_to_async
    def set_room_playing(self, code, board):
        room = Room.objects.get(code=code)
        room.state = 'PLAYING'
        room.grid_state = board
        room.save()
        
    @database_sync_to_async
    def set_room_finished(self, code):
        room = Room.objects.get(code=code)
        room.state = 'FINISHED'
        room.save()
        
    @database_sync_to_async
    def save_found_word(self, code, player_name, word, points):
        room = Room.objects.get(code=code)
        player = Player.objects.filter(room=room, name=player_name).first()
        if not player:
            return None, 0
            
        # Don't allow duplicates
        if FoundWord.objects.filter(player=player, word=word).exists():
            return None, 0
            
        FoundWord.objects.create(player=player, word=word, points=points)
        player.score += points
        player.save()
        return player, player.score
