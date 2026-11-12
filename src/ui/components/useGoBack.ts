import { useLocation, useNavigate } from 'react-router';

// React Router gives the first entry of a session this key; there is no page to go back to.
const FIRST_ENTRY = 'default';

/**
 * Returns a function that goes back to where the person came from, like the back key on
 * Android (design D-3). Without a previous page it replaces the address with `fallback`.
 */
export function useGoBack(fallback: string): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (location.key === FIRST_ENTRY) {
      void navigate(fallback, { replace: true });
      return;
    }
    void navigate(-1);
  };
}
