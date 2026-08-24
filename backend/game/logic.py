import random
import os

# True Scribbage 13 Dice Configurations
SCRIBBAGE_DICE = [
    ['I', 'A', 'G', 'F', 'Q', 'L'],
    ['E', 'O', 'H', 'R', 'N', 'T'],
    ['D', 'E', 'A', 'W', 'T', 'V'],
    ['O', 'L', 'E', 'R', 'T', 'I'],
    ['V', 'K', 'O', 'N', 'U', 'C'],
    ['R', 'D', 'E', 'I', '_', 'S'],
    ['M', 'I', '_', 'E', 'P', 'G'],
    ['B', 'M', 'O', 'N', 'U', 'S'],
    ['A', 'S', 'B', 'X', 'E', 'Y'],
    ['Y', 'W', 'P', 'M', 'O', 'U'],
    ['D', 'J', 'E', 'A', 'N', 'R'],
    ['L', 'T', 'S', 'H', 'A', 'E'],
    ['E', 'A', 'F', 'I', 'C', 'Z']
]

# True Scribbage Letter Point Values
LETTER_VALUES = {
    'A': 1, 'B': 4, 'C': 4, 'D': 3, 'E': 1, 'F': 4, 'G': 4, 'H': 3, 'I': 2,
    'J': 6, 'K': 5, 'L': 2, 'M': 3, 'N': 2, 'O': 1, 'P': 4, 'Q': 8, 'R': 2,
    'S': 2, 'T': 2, 'U': 3, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10, '_': 0
}

def roll_dice(seed=None):
    if seed:
        random.seed(seed)
    # Pick one random face from each of the 13 specific dice
    return [random.choice(die) for die in SCRIBBAGE_DICE]

# Global dictionary set
VALID_WORDS = set()

def load_dictionary():
    global VALID_WORDS
    if VALID_WORDS:
        return
    
    dict_path = os.path.join(os.path.dirname(__file__), 'twl06.txt')
    if os.path.exists(dict_path):
        with open(dict_path, 'r') as f:
            VALID_WORDS = set(word.strip().upper() for word in f.readlines())
    else:
        # Fallback for testing if dictionary file doesn't exist
        VALID_WORDS = {"TEST", "WORD", "HELLO", "WORLD"}

def is_contiguous(board):
    """
    board: dict mapping (row, col) -> data
    Returns True if all tiles are connected.
    """
    if not board:
        return True
    
    start_node = next(iter(board.keys()))
    visited = set()
    stack = [start_node]
    
    while stack:
        r, c = stack.pop()
        if (r, c) not in visited:
            visited.add((r, c))
            
            # Check neighbors
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if (nr, nc) in board and (nr, nc) not in visited:
                    stack.append((nr, nc))
                    
    return len(visited) == len(board)

def extract_word_positions(board):
    """
    board: dict mapping (row, col) -> data
    Extracts all horizontal and vertical words (length >= 2)
    Returns a list of lists of (r, c) tuples.
    """
    words_positions = []
    
    if not board:
        return words_positions

    min_r = min(r for r, c in board.keys())
    max_r = max(r for r, c in board.keys())
    min_c = min(c for r, c in board.keys())
    max_c = max(c for r, c in board.keys())
    
    # Horizontal words
    for r in range(min_r, max_r + 1):
        current_word = []
        for c in range(min_c, max_c + 2): # +2 to ensure we hit an empty cell after the last col
            if (r, c) in board:
                current_word.append((r, c))
            else:
                if len(current_word) >= 2:
                    words_positions.append(current_word)
                current_word = []
                
    # Vertical words
    for c in range(min_c, max_c + 1):
        current_word = []
        for r in range(min_r, max_r + 2):
            if (r, c) in board:
                current_word.append((r, c))
            else:
                if len(current_word) >= 2:
                    words_positions.append(current_word)
                current_word = []
                
    return words_positions

def calculate_score(words_positions, board, used_tiles_count):
    score = 0
    for word_pos in words_positions:
        for r, c in word_pos:
            item = board[(r, c)]
            if not item.get('is_wildcard', False):
                score += LETTER_VALUES.get(item['letter'].upper(), 0)
            
    if used_tiles_count == 13:
        score += 50
        
    return score

def validate_submission(dice, board_list):
    """
    dice: list of 13 strings
    board_list: list of dicts [{'row': r, 'col': c, 'letter': l, 'is_wildcard': bool}, ...]
    Returns (is_valid, score, words, error_message)
    """
    if not board_list:
        return False, 0, [], "Board is empty."
        
    board = {(item['row'], item['col']): item for item in board_list}
    
    # 1. Validate placed letters against dice pool
    dice_copy = list(dice)
    for item in board_list:
        letter = item['letter'].upper()
        is_wildcard = item.get('is_wildcard', False)
        
        target_char = '_' if is_wildcard else letter
        
        if target_char in dice_copy:
            dice_copy.remove(target_char)
        else:
            if is_wildcard:
                return False, 0, [], "Invalid letter placed: no Joker (_) was available."
            else:
                return False, 0, [], f"Invalid letter placed: {letter} was not available."
            
    # 2. Verify grid connectivity
    if not is_contiguous(board):
        return False, 0, [], "All words must be connected."
        
    # 3. Extract words
    words_positions = extract_word_positions(board)
    if not words_positions:
        return False, 0, [], "No valid words formed."
        
    # Convert positions to strings for dictionary checking
    words = []
    for pos_list in words_positions:
        word_str = "".join([board[pos]['letter'].upper() for pos in pos_list])
        words.append(word_str)
        
    # 4. Validate against dictionary
    load_dictionary()
    invalid_words = [w for w in words if w not in VALID_WORDS]
    if invalid_words:
        return False, 0, [], f"Invalid words found: {', '.join(invalid_words)}"
        
    # 5. Calculate score
    score = calculate_score(words_positions, board, len(board_list))
    
    return True, score, words, None
