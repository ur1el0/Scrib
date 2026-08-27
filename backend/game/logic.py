import random
import os

# 16 Standard Boggle Dice (New version)
BOGGLE_DICE = [
    "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
    "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
    "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
    "EIOSST", "ELRTTY", "HIMNQU", "HLNNRZ"
]

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
        VALID_WORDS = {"TEST", "WORD", "APPLE"}

def generate_board(seed=None):
    """Generates a 4x4 matrix of letters."""
    if seed:
        random.seed(seed)
    
    # Roll the 16 dice and shuffle their positions
    letters = [random.choice(die) for die in BOGGLE_DICE]
    random.shuffle(letters)
    
    # Return as a 2D array (4x4)
    return [letters[i:i+4] for i in range(0, 16, 4)]

def find_word_path(board, word):
    """Depth-First Search to verify if a word exists on the 4x4 grid."""
    word = word.upper()
    nrows, ncols = len(board), len(board[0])
    
    def dfs(r, c, index, visited):
        if index == len(word):
            return True
        
        # Out of bounds or already visited
        if r < 0 or r >= nrows or c < 0 or c >= ncols or (r, c) in visited:
            return False
            
        if board[r][c] != word[index]:
            return False
            
        visited.add((r, c))
        
        # Check all 8 adjacent directions
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0:
                    continue
                if dfs(r + dr, c + dc, index + 1, visited):
                    return True
                    
        visited.remove((r, c))
        return False

    # Start DFS from any cell matching the first letter
    for r in range(nrows):
        for c in range(ncols):
            if board[r][c] == word[0]:
                if dfs(r, c, 0, set()):
                    return True
    return False

def calculate_points(word):
    """Scoring rubric for MSEUF English Festival."""
    length = len(word)
    if length <= 2: return 0
    if length in (3, 4): return 1
    if length == 5: return 2
    if length == 6: return 3
    if length == 7: return 5
    return 11

def validate_word(board, word):
    """Returns (is_valid, points, error_message)."""
    word = word.upper().strip()
    
    if len(word) < 3:
        return False, 0, "Word must be at least 3 letters."
        
    load_dictionary()
    if word not in VALID_WORDS:
        return False, 0, "Word not found in dictionary."
        
    if not find_word_path(board, word):
        return False, 0, "Word cannot be formed on this board."
        
    return True, calculate_points(word), None
