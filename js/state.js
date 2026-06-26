export const state = {
  chess: new Chess(),
  gameHistory: [],
  currentMoveIdx: -1,
  parsedMetadata: {},
  reviewData: {
    accuracies: { white: 0, black: 0 },
    evals: [],
    classifications: {},
    comments: {},
    features: {}
  },
  isSelfAnalysis: false,
  selfAnalysisHistory: [],
  selfAnalysisMoveIdx: -1,
  analysisQueue: [],
  queueIdx: 0,
  isFlipped: false,

  reset() {
    this.chess.reset();
    this.gameHistory = [];
    this.currentMoveIdx = -1;
    this.parsedMetadata = {};
    this.reviewData = {
      accuracies: { white: 0, black: 0 },
      evals: [],
      classifications: {},
      comments: {},
      features: {}
    };
    this.isSelfAnalysis = false;
    this.selfAnalysisHistory = [];
    this.selfAnalysisMoveIdx = -1;
    this.analysisQueue = [];
    this.queueIdx = 0;
  }
};
