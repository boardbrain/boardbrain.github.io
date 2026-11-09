import { useEffect, useState, type Ref, type RefObject } from 'react';
import { t } from '@/i18n/t';
import { cx } from '@/ui/components/classNames';
import { AgainIcon, ChevronIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import shared from './Match.module.css';
import styles from './MatchView.module.css';

type Rect = {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
};

// The drawn area of an SVG that keeps its aspect ratio (the board, xMidYMid meet).
function drawnArea(svg: SVGSVGElement): Rect {
  const box = svg.getBoundingClientRect();
  const view = svg.viewBox.baseVal;
  if (view.width === 0 || view.height === 0) {
    return box;
  }
  const scale = Math.min(box.width / view.width, box.height / view.height);
  const width = view.width * scale;
  const height = view.height * scale;
  return {
    top: box.top + (box.height - height) / 2,
    bottom: box.top + (box.height + height) / 2,
    left: box.left + (box.width - width) / 2,
    right: box.left + (box.width + width) / 2,
  };
}

/**
 * Whether the note "Rückblick" may float over the free room below the progress (design I2-C,
 * R1): `false` once it would cover a part of the step, then it takes its own room and the cards
 * are laid out again in the smaller table (decision of the product owner 09.11.2026). Measured
 * per page (`pageKey`), so it does not flip back and forth.
 */
export function useLookBackFits(
  noteRef: RefObject<HTMLElement | null>,
  bodyRef: RefObject<HTMLElement | null>,
  pageKey: string,
): boolean {
  const [inFlowFor, setInFlowFor] = useState<string | null>(null);
  const isInFlow = inFlowFor === pageKey;
  useEffect(() => {
    const body = bodyRef.current;
    if (isInFlow || body === null) {
      return undefined;
    }
    const measure = (): void => {
      const note = noteRef.current?.getBoundingClientRect();
      if (note === undefined) {
        return;
      }
      const parts = [
        ...body.querySelectorAll<HTMLElement | SVGSVGElement>('[data-solid], [data-board] svg'),
      ].map((element) =>
        element instanceof SVGSVGElement ? drawnArea(element) : element.getBoundingClientRect(),
      );
      const isCovered = parts.some(
        (part) =>
          part.bottom > part.top &&
          part.top < note.bottom + 4 &&
          part.bottom > note.top &&
          part.left < note.right &&
          part.right > note.left,
      );
      if (isCovered) {
        setInFlowFor(pageKey);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => {
      observer.disconnect();
    };
  }, [noteRef, bodyRef, pageKey, isInFlow]);
  return !isInFlow;
}

type LookBackNoteProps = {
  readonly ref?: Ref<HTMLDivElement>;
  /** The note takes its own room instead of floating. */
  readonly isInFlow: boolean;
  readonly onCurrent: () => void;
};

/**
 * The note "Rückblick" on an earlier step (US-AB-04 AK-3, design I2-C R1): it floats over the
 * free room below the progress and leads back to the current step.
 */
export function LookBackNote({ ref, isInFlow, onCurrent }: LookBackNoteProps): React.JSX.Element {
  return (
    <div ref={ref} className={cx(styles.lookBack, isInFlow && styles.lookBackInFlow)}>
      <AgainIcon size={14} />
      <strong>{t('partie.rueckblick')}</strong>
      <PressableButton
        type="button"
        className={cx(shared.pill, styles.lookBackPill)}
        onClick={onCurrent}
      >
        {t('partie.zumAktuellenSchritt')}
        <ChevronIcon size={14} />
      </PressableButton>
    </div>
  );
}
