import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ManagementView } from '@/ui/views/management/ManagementView';
import { StartView } from './StartView';

describe('Architecture 13.1 start and management overview', () => {
  it('the start view leads to persons and games', () => {
    render(
      <MemoryRouter>
        <StartView />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Start' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Personen verwalten' })).toHaveAttribute(
      'href',
      '/verwaltung/personen',
    );
    expect(screen.getByRole('link', { name: 'Spiele verwalten' })).toHaveAttribute(
      'href',
      '/verwaltung/spiele',
    );
  });

  it('the management overview leads to persons and games', () => {
    render(
      <MemoryRouter>
        <ManagementView />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Verwaltung' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Personen' })).toHaveAttribute(
      'href',
      '/verwaltung/personen',
    );
    expect(screen.getByRole('link', { name: 'Spiele' })).toHaveAttribute(
      'href',
      '/verwaltung/spiele',
    );
  });
});
