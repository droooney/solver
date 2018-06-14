(async () => {
  await navigator.serviceWorker.register('./worker.js');

  console.log('registered');

  const {
    default: Solver
  } = await import('./app/solvers/index.js');

  ReactDOM.render(
    <Solver />,
    document.getElementById('root')
  );
})();
