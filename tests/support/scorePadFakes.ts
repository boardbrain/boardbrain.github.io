import type { ScorePadRepositories, ScorePadStore, StoredSession } from '@/app/ports';
import type { CustomGame, Group } from '@/core/model';
import type { ScorePad } from '@/core/scorepad';

/**
 * Storage stand-in for tests of the score pad service (Architecture 14.1). A transaction works on
 * a copy and only takes it over if `work` completes, like a database transaction; transactions
 * run one after the other. Stored score pads are deep copies.
 */
export class InMemoryScorePadStore implements ScorePadStore {
  scorePad: ScorePad | undefined = undefined;
  session: StoredSession | undefined = undefined;
  groups: readonly Group[];
  customGames: readonly CustomGame[];
  private queue: Promise<unknown> = Promise.resolve();

  constructor(groups: readonly Group[] = [], customGames: readonly CustomGame[] = []) {
    this.groups = groups;
    this.customGames = customGames;
  }

  transaction<T>(work: (repositories: ScorePadRepositories) => Promise<T>): Promise<T> {
    const run = this.queue.then(() => this.run(work));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async run<T>(work: (repositories: ScorePadRepositories) => Promise<T>): Promise<T> {
    let pad = this.scorePad;
    const result = await work({
      scorePad: {
        get: () => Promise.resolve(pad === undefined ? undefined : structuredClone(pad)),
        put: (stored) => {
          pad = structuredClone(stored);
          return Promise.resolve();
        },
        delete: () => {
          pad = undefined;
          return Promise.resolve();
        },
      },
      session: { get: () => Promise.resolve(this.session) },
      groups: { listAll: () => Promise.resolve([...this.groups]) },
      customGames: { listAll: () => Promise.resolve([...this.customGames]) },
    });
    this.scorePad = pad;
    return result;
  }
}
