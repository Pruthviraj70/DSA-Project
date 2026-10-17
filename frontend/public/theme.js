// Blocking, same-origin bootstrap applies the palette before React and follows OS changes.
(() => {
  const key = "dsalab.theme";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  function read() {
    try {
      const value = localStorage.getItem(key);
      return value === "light" || value === "dark" ? value : "system";
    } catch {
      return "system";
    }
  }
  let selection = read();
  function apply() {
    const theme =
      selection === "system" ? (system.matches ? "dark" : "light") : selection;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#111d24" : "#f6f8f5");
    window.dispatchEvent(new Event("dsalab-theme-applied"));
  }
  window.dsaSetTheme = (value) => {
    selection = value;
    try {
      if (value === "system") localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
    apply();
  };
  system.addEventListener("change", apply);
  window.addEventListener("storage", (e) => {
    if (e.key === key || e.key === null) {
      selection = read();
      apply();
    }
  });
  apply();
})();
