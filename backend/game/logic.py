import random
import os

# Standard Scrabble letter distribution and values
LETTER_DISTRIBUTION = {
    'A': 9, 'B': 2, 'C': 2, 'D': 4, 'E': 12, 'F': 2, 'G': 3, 'H': 2, 'I': 9,
    'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2, 'Q': 1, 'R': 6,
    'S': 4, 'T': 6, 'U': 4, 'V': 2, 'W': 2, 'X': 1, 'Y': 2, 'Z': 1
}

LETTER_VALUES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
    'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
    'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
}

# Create a pool of letters based on distribution
LETTER_POOL = []
for letter, count in LETTER_DISTRIBUTION.items():
    LETTER_POOL.extend([letter] * count)

def roll_dice(seed=None):
    if seed:
        random.seed(seed)
    return random.sample(LETTER_POOL, 13)

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
    board: dict mapping (row, col) -> letter
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

def extract_words(board):
    """
    board: dict mapping (row, col) -> letter
    Extracts all horizontal and vertical words (length >= 2)
    Returns a list of words.
    """
    words = []
    
    if not board:
        return words

    min_r = min(r for r, c in board.keys())
    max_r = max(r for r, c in board.keys())
    min_c = min(c for r, c in board.keys())
    max_c = max(c for r, c in board.keys())
    
    # Horizontal words
    for r in range(min_r, max_r + 1):
        current_word = []
        for c in range(min_c, max_c + 2): # +2 to ensure we hit an empty cell after the last col
            if (r, c) in board:
                current_word.append(board[(r, c)])
            else:
                if len(current_word) >= 2:
                    words.append("".join(current_word))
                current_word = []
                
    # Vertical words
    for c in range(min_c, max_c + 1):
        current_word = []
        for r in range(min_r, max_r + 2):
            if (r, c) in board:
                current_word.append(board[(r, c)])
            else:
                if len(current_word) >= 2:
                    words.append("".join(current_word))
                current_word = []
                
    return words

def calculate_score(words, used_tiles_count):
    score = 0
    for word in words:
        for letter in word:
            score += LETTER_VALUES.get(letter.upper(), 0)
            
    if used_tiles_count == 13:
        score += 50
        
    return score

def validate_submission(dice, board_list):
    """
    dice: list of 13 strings
    board_list: list of dicts [{'row': r, 'col': c, 'letter': l}, ...]
    Returns (is_valid, score, words, error_message)
    """
    if not board_list:
        return False, 0, [], "Board is empty."
        
    board = {(item['row'], item['col']): item['letter'].upper() for item in board_list}
    
    # 1. Validate placed letters against dice pool
    placed_letters = [item['letter'].upper() for item in board_list]
    dice_copy = list(dice)
    for letter in placed_letters:
        if letter in dice_copy:
            dice_copy.remove(letter)
        else:
            return False, 0, [], f"Invalid letter placed: {letter} was not available."
            
    # 2. Verify grid connectivity
    if not is_contiguous(board):
        return False, 0, [], "All words must be connected."
        
    # 3. Extract words
    words = extract_words(board)
    if not words:
        return False, 0, [], "No valid words formed."
        
    # 4. Validate against dictionary
    load_dictionary()
    invalid_words = [w for w in words if w not in VALID_WORDS]
    if invalid_words:
        return False, 0, [], f"Invalid words found: {', '.join(invalid_words)}"
        
    # 5. Calculate score
    score = calculate_score(words, len(placed_letters))
    
    return True, score, words, None
