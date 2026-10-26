import { Route, Routes } from 'react-router';
import { GamesView } from '@/ui/views/management/GamesView';
import { GameView } from '@/ui/views/management/GameView';
import { GroupView } from '@/ui/views/management/GroupView';
import { PersonView } from '@/ui/views/management/PersonView';

/**
 * The person, table and game pages with their addresses as in `src/main.tsx`, so tests can jump
 * between them (US-VW-05, US-VW-02, US-VW-07).
 */
export function OverviewRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/verwaltung/personen/:personId" element={<PersonView />} />
      <Route path="/verwaltung/gruppen/:groupId" element={<GroupView />} />
      <Route path="/verwaltung/gruppen/:groupId/bearbeiten" element={<GroupView isEditing />} />
      <Route path="/verwaltung/spiele" element={<GamesView />} />
      <Route path="/verwaltung/spiele/:gameId" element={<GameView />} />
    </Routes>
  );
}
