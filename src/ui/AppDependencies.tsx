import { createContext, use, type ReactNode } from 'react';
import type { MasterDataService } from '@/app/services/masterDataService';
import type { BoardBrainDb } from '@/infra/db/database';

/**
 * What the views need: the database for the read hooks and the application services for
 * writing (Architecture 4.2, 13.2). Composed in `src/main.tsx`.
 */
export type AppDependencies = {
  readonly db: BoardBrainDb;
  readonly masterData: MasterDataService;
};

const AppDependenciesContext = createContext<AppDependencies | null>(null);

type AppDependenciesProviderProps = {
  readonly dependencies: AppDependencies;
  readonly children: ReactNode;
};

/**
 * Provides the composed dependencies to all views.
 */
export function AppDependenciesProvider({
  dependencies,
  children,
}: AppDependenciesProviderProps): React.JSX.Element {
  return <AppDependenciesContext value={dependencies}>{children}</AppDependenciesContext>;
}

/**
 * Returns the composed dependencies.
 * @throws {Error} if a view is rendered outside `AppDependenciesProvider`.
 */
export function useAppDependencies(): AppDependencies {
  const dependencies = use(AppDependenciesContext);
  if (dependencies === null) {
    throw new Error('AppDependenciesProvider is missing; views are rendered from src/main.tsx');
  }
  return dependencies;
}
