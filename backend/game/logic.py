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
TRIE = {}

def load_dictionary():
    global VALID_WORDS, TRIE
    if VALID_WORDS:
        return
    dict_path = os.path.join(os.path.dirname(__file__), 'twl06.txt')
    words_to_load = []
    
    if os.path.exists(dict_path):
        with open(dict_path, 'r') as f:
            words_to_load = [word.strip().upper() for word in f.readlines()]
    else:
        words_to_load = ["TEST", "WORD", "APPLE"]
        
    VALID_WORDS = set(words_to_load)
    
    # Build Trie for fast board solving
    for word in words_to_load:
        if len(word) >= 3: # Only index valid length words
            node = TRIE
            for char in word:
                if char not in node:
                    node[char] = {}
                node = node[char]
            node['*'] = True # Mark end of valid word

def generate_board(seed=None):
    """Generates a 4x4 matrix of letters."""
    if seed:
        random.seed(seed)
    
    letters = [random.choice(die) for die in BOGGLE_DICE]
    random.shuffle(letters)
    return [letters[i:i+4] for i in range(0, 16, 4)]

def find_word_path(board, word):
    """Depth-First Search to verify if a word exists on the 4x4 grid."""
    word = word.upper()
    nrows, ncols = len(board), len(board[0])
    
    def dfs(r, c, index, visited):
        if index == len(word):
            return True
        if r < 0 or r >= nrows or c < 0 or c >= ncols or (r, c) in visited:
            return False
        if board[r][c] != word[index]:
            return False
            
        visited.add((r, c))
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0: continue
                if dfs(r + dr, c + dc, index + 1, visited):
                    return True
        visited.remove((r, c))
        return False

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

def solve_board(board):
    """Finds all possible valid words on the board using Trie-backed DFS."""
    load_dictionary()
    found_words = set()
    nrows, ncols = len(board), len(board[0])
    
    def dfs(r, c, node, prefix, visited):
        if '*' in node:
            found_words.add(prefix)
            
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < nrows and 0 <= nc < ncols and (nr, nc) not in visited:
                    char = board[nr][nc]
                    if char in node:
                        visited.add((nr, nc))
                        dfs(nr, nc, node[char], prefix + char, visited)
                        visited.remove((nr, nc))

    # Start DFS from every cell
    for r in range(nrows):
        for c in range(ncols):
            char = board[r][c]
            if char in TRIE:
                dfs(r, c, TRIE[char], char, {(r, c)})
                
    # Format and sort results (highest points first, then alphabetical)
    results = [{"word": w, "points": calculate_points(w)} for w in found_words]
    results.sort(key=lambda x: (-x['points'], x['word']))
    return results
