export const PIECE_IMAGES = {
  'wP': 'assets/pieces/default/wP.svg',
  'wN': 'assets/pieces/default/wN.svg',
  'wB': 'assets/pieces/default/wB.svg',
  'wR': 'assets/pieces/default/wR.svg',
  'wQ': 'assets/pieces/default/wQ.svg',
  'wK': 'assets/pieces/default/wK.svg',
  'bP': 'assets/pieces/default/bP.svg',
  'bN': 'assets/pieces/default/bN.svg',
  'bB': 'assets/pieces/default/bB.svg',
  'bR': 'assets/pieces/default/bR.svg',
  'bQ': 'assets/pieces/default/bQ.svg',
  'bK': 'assets/pieces/default/bK.svg'
};

export const DEMO_GAMES = [
  {
    title: "Kasparov vs. Topalov (1999)",
    white: "Garry Kasparov",
    whiteRating: "2812",
    whiteFlag: "ru",
    black: "Veselin Topalov",
    blackRating: "2700",
    blackFlag: "bg",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
    accuracies: { white: 94.2, black: 88.6 },
    evals: [
      0.15, 0.12, 0.20, 0.18, 0.25, 0.22, 0.28, 0.20, 0.15, 0.10, 0.12, 0.05, 0.08, -0.05, -0.02, 0.02, 
      0.05, -0.08, -0.12, -0.05, -0.10, -0.20, -0.15, -0.22, -0.18, 0.10, 0.08, 0.45, 0.35, 1.20, 0.85, 
      1.55, 1.48, 1.50, 1.45, 1.62, 1.58, 2.50, 2.10, 2.22, 2.15, 2.80, 2.45, 3.40, 3.20, 4.10, 3.85, 
      4.25, 4.02, 4.50, 4.15, 4.30, 4.00, 4.25, 4.10, 4.80, 4.70, 5.20, 5.05, 5.80, 5.75, 6.20, 6.10, 
      6.40, 6.25, 6.80, 6.70, 7.20, 7.15, 7.80, 7.75, 8.20, 8.10, 8.50, 8.40, 9.10, 9.00, 9.99, 9.99, 
      9.99, 9.99, 9.99, 9.99, 9.99, 9.99, 9.99, 9.99, 9.99, 9.99
    ],
    classifications: {
      0: "book", 1: "book", 2: "book", 3: "book", 4: "book", 5: "book", 6: "book", 7: "book", 8: "book", 9: "book",
      22: "best", 23: "best", 24: "best", 25: "best",
      46: "brilliant", // 24. Rxd4!!
      47: "best",      // 24... cxd4
      48: "brilliant", // 25. Re7+!
      49: "best",      // 25... Kb6
      50: "excellent",
      51: "best",
      52: "great"
    },
    comments: {
      0: "Game begins with standard King's Pawn openings, transitioning into a Pirc Defense.",
      10: "Standard development. Both players are fighting for central control and king safety.",
      20: "Kasparov positions his pieces actively, preparing a storm on the queenside.",
      40: "Tension is building. Topalov's king is tucked away on the queenside, but Kasparov is preparing a breakthrough.",
      44: "Kasparov plays 22. Nd5. An active central post for the knight, asking Topalov how he wishes to proceed.",
      45: "Topalov responds with 22... Nbxd5. Capturing is natural and fights for control of the center.",
      46: "24. Rxd4!! - Kasparov plays one of the most famous rook sacrifices in chess history! He breaks open Black's defense by dragging the black king into a mating net in the center of the board.",
      47: "24... cxd4 - Topalov accepts the rook. There was no choice; declining the rook would leave White with a winning material advantage.",
      48: "25. Re7+! - A second consecutive brilliant sacrifice! Kasparov gives up another rook to pull the king further into the open.",
      49: "25... Kb6 - Topalov is forced to run. Taking the rook with the queen leads to immediate checkmate after Qxd4+.",
      50: "26. Qxd4+ - Kasparov's queen joins the attack, chasing the king down the board.",
      60: "The black king has traveled all the way to a4, completely exposed, yet tactical defenses keep it alive momentarily.",
      70: "Kasparov plays 36. Bf1. A calm and deep defensive move that prevents any counterplay and seals Topalov's fate.",
      87: "Topalov resigns! After 44. Qa7, there is no defense against checkmate or massive material loss. A masterpiece by Kasparov."
    }
  },
  {
    title: "DeepMate Blunder Demo",
    white: "DeepMate White",
    whiteRating: "1500",
    whiteFlag: "in",
    black: "DeepMate Black",
    blackRating: "1200",
    blackFlag: "us",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 f6 4. Nh4 g5 5. Qh5+ Ke7 6. Qf7+ Kd6 7. Nf5+ Kc5 8. Qd5+ Kb6 9. Qb5#`,
    accuracies: { white: 96.5, black: 41.2 },
    evals: [
      0.15, 0.18, 0.22, 0.20, 0.25, 0.21, -0.95, -0.10, 4.80, 4.60, 5.50, 5.40, 6.20, 6.10, 7.80, 7.60, 
      9.99
    ],
    classifications: {
      0: "book", 1: "book", 2: "book", 3: "book", 4: "book", 5: "book",
      6: "mistake",      // 3... f6
      7: "good",
      8: "blunder",      // 4... g5
      9: "best",         // 5. Qh5+
      10: "best",        // 5... Ke7
      11: "excellent",   // 6. Qf7+
      12: "best",        // 6... Kd6
      13: "best",        // 7. Nf5+
      14: "best",        // 7... Kc5
      15: "best",        // 8. Qd5+
      16: "best"         // 8... Kb6
    },
    comments: {
      0: "A classic open game start.",
      5: "Standard Italian Game opening setup.",
      6: "3... f6?! is a mistake! Moving the f-pawn exposes the king's diagonal, which is a common tactical weakness.",
      7: "White positions the knight actively at h4, ready to exploit the weakened diagonal.",
      8: "4... g5?? is a major blunder! Black completely opens up the king. White can now execute a devastating check.",
      9: "5. Qh5+! White immediately capitalizes on Black's mistake. The king is under severe threat.",
      10: "5... Ke7 is the only legal square, but the king is now stranded in the center.",
      11: "6. Qf7+ - White keeps pressuring, forcing the king to run.",
      13: "7. Nf5+ - The knight delivers check, driving the black king further up the board.",
      15: "8. Qd5+ - White coordinates the queen and bishop to corral the king.",
      16: "Checkmate! The queen lands on b5 delivering mate. Black is punished for critical opening blunders."
    }
  }
];
