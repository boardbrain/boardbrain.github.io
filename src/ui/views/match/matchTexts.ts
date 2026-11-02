import type { StoredSession } from '@/app/ports';
import { stepsDiscardedBy } from '@/core/generation';
import type { PersonId } from '@/core/model';
import {
  CATAN_GENERATION,
  type CatanEdition,
  type CatanPersonDraw,
  type CatanResource,
  type CatanStep,
} from '@/games/catan';
import { t, type TextKey } from '@/i18n/t';
import { enabledDraws, type MatchPreparation } from './preparation';

/**
 * Names of the draws of a person (US-LS-02).
 */
export const DRAW_NAMES: Readonly<Record<CatanPersonDraw, TextKey>> = {
  landscapes: 'partie.landschaftsfelder',
  harbors: 'partie.haefen',
  numbers: 'partie.zahlenchips',
};

/**
 * Names of the resources (US-SR-01 AK-5).
 */
export const RESOURCE_NAMES: Readonly<Record<CatanResource, TextKey>> = {
  lumber: 'partie.rohstoff.lumber',
  brick: 'partie.rohstoff.brick',
  wool: 'partie.rohstoff.wool',
  grain: 'partie.rohstoff.grain',
  ore: 'partie.rohstoff.ore',
};

/**
 * Name of an edition (US-SP-04 AK-1).
 */
export function editionName(edition: CatanEdition): string {
  return edition === 'base' ? t('partie.basisspiel') : t('partie.staedteUndRitter');
}

/**
 * Name of a piece in a band or title: settlement, city or road.
 */
export function pieceName(step: CatanStep): string {
  if (step.kind === 'road') {
    return t('partie.strasse');
  }
  return step.kind === 'building' && step.type === 'city'
    ? t('partie.stadt')
    : t('partie.siedlung');
}

/**
 * Title of a step, e.g. in the warning before repeating it ("Stadt von Clara").
 */
export function stepTitle(step: CatanStep, nameOf: (personId: PersonId) => string): string {
  switch (step.kind) {
    case 'person-draw':
      return t(DRAW_NAMES[step.draw]);
    case 'order-spin':
      return t('partie.platzVon', { platz: step.position + 1 });
    case 'building':
      return t('partie.gebaeudeVon', { stueck: pieceName(step), name: nameOf(step.personId) });
    case 'road':
      return t('partie.strasseVon', { name: nameOf(step.personId) });
    case 'starting-resources':
      return t('partie.rohstoffeVon', { name: nameOf(step.personId) });
  }
}

function roadCount(count: number): string {
  return count === 1 ? t('partie.eineStrasse') : t('partie.strassen', { anzahl: count });
}

/**
 * What repeating step `index` discards, as keywords for the warning (US-AB-03 AK-1, AK-2,
 * Specification 3.1); without dependent steps, only the step itself is drawn again.
 */
export function repeatLines(session: StoredSession, index: number): string[] {
  const { setup, generation } = session;
  const step = generation.steps[index]?.step;
  if (step === undefined) {
    return [];
  }
  const discarded = stepsDiscardedBy(CATAN_GENERATION, setup, generation, index).flatMap(
    (other) => {
      const record = generation.steps[other];
      return record === undefined ? [] : [record.step];
    },
  );
  const buildings = discarded.filter((other) => other.kind === 'building').length;
  const roads = discarded.filter((other) => other.kind === 'road');
  if (step.kind === 'order-spin') {
    const lines = [t('partie.ganzeReihenfolge')];
    if (buildings > 0) {
      lines.push(
        t('partie.platzierungVerworfen', {
          gebaeude: buildings,
          strassen: roadCount(roads.length),
        }),
      );
    }
    if (generation.gameState.placementSkipped) {
      lines.push(t('partie.platzierungBeginntWieder'));
    }
    return lines;
  }
  if (step.kind === 'building' && (buildings > 0 || roads.length > 0)) {
    const lines = [t('partie.verworfenUndNeu')];
    if (roads.length === 1) {
      lines.push(t('partie.strasseAnGebaeude'));
    } else if (roads.length > 1) {
      lines.push(t('partie.strassenAuchAnGebaeude', { strassen: roadCount(roads.length) }));
    }
    if (buildings === 1) {
      lines.push(t('partie.spaeteresGebaeude'));
    } else if (buildings > 1) {
      lines.push(t('partie.spaetereGebaeude', { anzahl: buildings }));
    }
    return lines;
  }
  return [];
}

/**
 * Summary of the options on the colours page: edition · draws · order · starting resources.
 */
export function recapLine(preparation: MatchPreparation): string {
  const draws = enabledDraws(preparation).length;
  const drawText =
    draws === 0
      ? t('partie.ohneLosschritte')
      : draws === 1
        ? t('partie.einLosschritt')
        : t('partie.losschritte', { anzahl: draws });
  const orderText = preparation.isOrderDrawn
    ? t('partie.reihenfolgeGelost')
    : preparation.orderAlternative === 'manual'
      ? t('partie.reihenfolgeSelbst')
      : t('partie.ohnePlatzierungKurz');
  const resourcesText = !preparation.hasStartingResources
    ? t('partie.ohneStartrohstoffe')
    : preparation.replacement === 'with'
      ? t('partie.rohstoffeMit', { anzahl: preparation.resourceCount })
      : t('partie.rohstoffeOhne', { anzahl: preparation.resourceCount });
  return [editionName(preparation.edition), drawText, orderText, resourcesText].join(
    t('partie.trenner'),
  );
}
