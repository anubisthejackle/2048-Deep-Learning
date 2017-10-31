module.exports = (fn) => {
  let pendingPromise = undefined;

  return () => {
    if (!pendingPromise) {
      pendingPromise = new Promise((resolve) => {
        setTimeout(() => {
          pendingPromise = undefined;
          resolve(fn());
        });
      });
    }

    return pendingPromise;
  };
};
