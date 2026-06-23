export const state = {
  chess: new Chess(),
  gameHistory: [],
  currentMoveIdx: -1,
  parsedMetadata: {},
  reviewData: {
    accuracies: { white: 0, black: 0 },
    evals: [],
    classifications: {},
    comments: {}
  },
  isSelfAnalysis: false,
  selfAnalysisHistory: [],
  selfAnalysisMoveIdx: -1,
  analysisQueue: [],
  queueIdx: 0,

  reset() {
    this.chess.reset();
    this.gameHistory = [];
    this.currentMoveIdx = -1;
    this.parsedMetadata = {};
    this.reviewData = {
      accuracies: { white: 0, black: 0 },
      evals: [],
      classifications: {},
      comments: {}
    };
    this.isSelfAnalysis = false;
    this.selfAnalysisHistory = [];
    this.selfAnalysisMoveIdx = -1;
    this.analysisQueue = [];
    this.queueIdx = 0;
  }
};
