import random
import os

# 16 Standard Boggle Dice (New version)
BOGGLE_DICE = [
    "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
    "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
    "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
    "EIOSST", "ELRTTY", "HIMNQU", "HLNNRZ"
]

VALID_WORDS = []


def load_dictionary():
    global VALID_WORDS
    if VALID_WORDS:
        return

    dict_path = os.path.join(os.path.dirname(__file__), 'twl06.txt')

    if os.path.exists(dict_path):
        with open(dict_path, 'r') as dictionary_file:
            VALID_WORDS = [
                line.strip().upper()
                for line in dictionary_file
                if len(line.strip()) >= 3
            ]
    else:
        VALID_WORDS = ["TEST", "WORD", "APPLE"]


def generate_board(seed=None):
    """Generates a 4x4 matrix of letters."""
    if seed:
        random.seed(seed)

    letters = [random.choice(die) for die in BOGGLE_DICE]
    random.shuffle(letters)
    return [letters[i:i+4] for i in range(0, 16, 4)]


def can_make_word(board, word):
    """Check if the board tiles can spell the word in any order."""
    word = word.upper().strip()
    available_tiles = []

    for row in board:
        for letter in row:
            if letter == "Q":
                available_tiles.append("QU")
            else:
                available_tiles.append(letter)

    letter_index = 0
    while letter_index < len(word):
        if word.startswith("QU", letter_index) and "QU" in available_tiles:
            tile = "QU"
        else:
            tile = word[letter_index]

        if tile not in available_tiles:
            return False

        available_tiles.remove(tile)
        letter_index += len(tile)

    return True

def calculate_points(word):
    """Award one point for each letter in the word."""
    return len(word)

def validate_word(board, word):
    """Returns (is_valid, points, error_message)."""
    word = word.upper().strip()
    if len(word) < 3:
        return False, 0, "Word must be at least 3 letters."
    load_dictionary()
    if word not in VALID_WORDS:
        return False, 0, "Word not found in dictionary."
    if not can_make_word(board, word):
        return False, 0, "Word cannot be formed on this board."
    return True, calculate_points(word), None


def solve_board(board):
    """Return dictionary words that can be made from the board letters."""
    load_dictionary()

    results = []
    maximum_word_length = len(board) * len(board[0])
    for word in VALID_WORDS:
        if len(word) <= maximum_word_length and can_make_word(board, word):
            results.append({"word": word, "points": calculate_points(word)})

    # Highest scoring words come first; ties are alphabetical.
    results.sort(key=lambda result: (-result['points'], result['word']))
    return results
