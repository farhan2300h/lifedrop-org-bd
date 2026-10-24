useEffect(() => {
  let isMounted = true;

  const checkRecovery = () => {
    const hash = window.location.hash;
    const search = window.location.search;
    const hasRecoveryCallback =
      hash.includes('reset-password') ||
      hash.includes('type=recovery') ||
      hash.includes('access_token=') ||
      search.includes('type=recovery') ||
      search.includes('code=') ||
      search.includes('access_token=');

    if (hasRecoveryCallback && isMounted) {
      setAuthView('reset_confirm');
      setRecoveryMessage(null);
      setAuthError('');
      setAuthSuccess('');
    }
  };

  checkRecovery();
  window.addEventListener('hashchange', checkRecovery);
  window.addEventListener('popstate', checkRecovery);

  const { data: authListener } = supabase
    ? supabase.auth.onAuthStateChange((event) => {
        if (!isMounted) return;
        if (event === 'PASSWORD_RECOVERY') {
          setAuthView('reset_confirm');
          setRecoveryMessage(null);
          setAuthError('');
          setAuthSuccess('');
        }
      })
    : { data: { subscription: { unsubscribe: () => {} } } };

  return () => {
    isMounted = false;
    window.removeEventListener('hashchange', checkRecovery);
    window.removeEventListener('popstate', checkRecovery);
    authListener.subscription.unsubscribe();
  };
}, []);
