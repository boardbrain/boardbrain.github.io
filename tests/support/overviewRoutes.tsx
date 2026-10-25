import { Route, Routes } from 'react-router';
import { GroupView } from '@/ui/views/management/GroupView';
import { PersonView } from '@/ui/views/management/PersonView';

/**
 * The person and table pages with their addresses as in `src/main.tsx`, so tests can jump
 * between them (US-VW-05).
 */
export function OverviewRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/verwaltung/personen/:personId" element={<PersonView />} />
      <Route path="/verwaltung/gruppen/:groupId" element={<GroupView />} />
    </Routes>
  );
}
