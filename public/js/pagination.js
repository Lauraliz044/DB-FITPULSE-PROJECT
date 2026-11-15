export function createPager({ pageSize, previous, next, label, render }) {
  let items = [];
  let page = 0;
  const pageCount = () => Math.max(1, Math.ceil(items.length / pageSize));
  const show = () => {
    render(items.slice(page * pageSize, (page + 1) * pageSize));
    previous.disabled = page === 0;
    next.disabled = page >= pageCount() - 1;
    label.textContent = `Página ${page + 1} de ${pageCount()}`;
  };
  previous.addEventListener("click", () => {
    page -= 1;
    show();
  });
  next.addEventListener("click", () => {
    page += 1;
    show();
  });
  return {
    setItems(values) {
      items = values;
      page = Math.min(page, pageCount() - 1);
      show();
    },
  };
}
