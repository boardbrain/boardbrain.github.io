import type { Page } from '@playwright/test';
import {
  CATAN_COLOR_KEYS,
  GROUP_COLOR_KEYS,
  toGroupId,
  toPersonId,
  type Group,
  type Person,
} from '@/core/model';

const NOW = '2026-11-01T10:00:00.000Z';

/**
 * A table of the seeded data: its name and the names of its members, in seat order.
 */
export type SeedTable = {
  readonly name: string;
  readonly members: readonly string[];
};

function uuid(number: number): string {
  return `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
}

/**
 * Writes persons and global tables straight into the database of the app, as the starting
 * point of a test (Development Guidelines 8.3); creating them in the user interface is tested
 * by persons.spec.ts and groups.spec.ts. Members get the group and Catan colours in the order
 * the app gives them. The records are typed as in `core/model`, so a change of the data model
 * shows up here when type checking. Afterwards the page shows the start view.
 */
export async function seedDatabase(page: Page, tables: readonly SeedTable[]): Promise<void> {
  const names = [...new Set(tables.flatMap((table) => table.members))];
  const persons: Person[] = names.map((name, index) => ({
    id: toPersonId(uuid(index + 1)),
    name,
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const idOf = new Map(persons.map((person) => [person.name, person.id]));
  const groups: Group[] = tables.map((table, tableIndex) => ({
    id: toGroupId(uuid(101 + tableIndex)),
    name: table.name,
    archived: false,
    binding: { kind: 'global' },
    members: table.members.map((name, seat) => {
      const personId = idOf.get(name);
      const groupColor = GROUP_COLOR_KEYS[seat];
      const catanColor = CATAN_COLOR_KEYS[seat];
      if (personId === undefined || groupColor === undefined) {
        throw new Error(`no person or colour for ${name}`);
      }
      return catanColor === undefined
        ? { personId, groupColor }
        : { personId, groupColor, catanColor };
    }),
    createdAt: NOW,
    updatedAt: NOW,
  }));

  // The app creates the database with its schema on the first start.
  await page.goto('/#/');
  await page.getByRole('navigation', { name: 'Karten' }).waitFor();
  await page.evaluate(
    async (data) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('boardbrain');
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => {
          reject(new Error(String(request.error)));
        };
      });
      const transaction = db.transaction(['persons', 'groups'], 'readwrite');
      for (const person of data.persons) {
        transaction.objectStore('persons').put(person);
      }
      for (const group of data.groups) {
        transaction.objectStore('groups').put(group);
      }
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = () => {
          reject(new Error(String(transaction.error)));
        };
      });
      db.close();
    },
    { persons, groups },
  );
  // Read hooks that started before the write show the data after a reload.
  await page.reload();
  await page.getByRole('navigation', { name: 'Karten' }).waitFor();
}
