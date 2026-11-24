// The views of a match, loaded together on first use (src/main.tsx).
export { ColorsView } from './ColorsView';
export { GameChoiceView } from './GameChoiceView';
export { MatchOverviewView } from './MatchOverviewView';
export { MatchView } from './MatchView';
export { OptionsView } from './OptionsView';
export { PreparationLayout } from './PreparationLayout';
export { TableChoiceView } from './TableChoiceView';
// The result form shares coins, dialogs and the table choice with the match (design I3-B).
export { MatchResultView, ResultEditView, ResultView } from '@/ui/views/result/ResultView';
export { ResultTableView } from '@/ui/views/result/ResultTableView';
// The score pad shares the result form and the table choice (design I3-C2).
export { NewScorePadView, ScorePadView } from '@/ui/views/scorepad/ScorePadView';
export { PadGameChoiceView } from '@/ui/views/scorepad/PadGameChoiceView';
export { PadResultView } from '@/ui/views/result/ResultView';
