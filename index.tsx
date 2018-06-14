(async () => {
  await navigator.serviceWorker.register('./worker.js');

  console.log('registered');

  const {
    default: Solver
  } = await import('./app/solvers');

  ReactDOM.render(
    <Solver />,
    document.getElementById('root')
  );
})();
