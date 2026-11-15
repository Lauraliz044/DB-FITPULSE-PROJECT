import { request, listAll } from "./api.js";
import { errorMessage } from "./messages.js";
import { element, status } from "./ui.js";
import { money, scheduleFormatter } from "./format.js";
import { createPager } from "./pagination.js";
import { initializePage } from "./shell.js";

const pageSize = 8;
let schedule;

function transactionCount(count) {
  return `${count} ${count === 1 ? "transacción" : "transacciones"}`;
}

function bestSeller(report, packages) {
  if (!report.packages.length) return "Sin ventas hoy";
  const top = report.packages.reduce((best, item) =>
    item.purchaseCount > best.purchaseCount ? item : best,
  );
  const name =
    packages.find((item) => item.id === top.packageId)?.name || "Paquete";
  return `${name} (${top.purchaseCount})`;
}

function renderSummary(report, packages) {
  document.querySelector("#sales-total").textContent = money(report.totalPaid);
  document.querySelector("#sales-count").textContent = transactionCount(
    report.purchaseCount,
  );
  document.querySelector("#best-seller").textContent = bestSeller(
    report,
    packages,
  );
}

function purchaseRow(purchase) {
  const row = element("tr");
  row.append(
    element("td", "", schedule.shortDate(purchase.purchased_at)),
    element("td", "", purchase.buyer_name),
    element("td", "", purchase.buyer_email),
    element("td", "", purchase.package_name),
    element("td", "number-cell", money(purchase.paid_price)),
  );
  return row;
}

const pager = createPager({
  pageSize,
  previous: document.querySelector("#previous-page"),
  next: document.querySelector("#next-page"),
  label: document.querySelector("#page-label"),
  render(purchases) {
    document
      .querySelector("#purchase-rows")
      .replaceChildren(...purchases.map(purchaseRow));
  },
});

async function loadSales() {
  status("loading", "Cargando las ventas…");
  try {
    schedule ??= await scheduleFormatter();
    const [report, packages, purchases] = await Promise.all([
      request("/reports/sales"),
      listAll("/packages"),
      listAll("/purchases"),
    ]);
    renderSummary(report, packages);
    pager.setItems(purchases);
    document.querySelector("#purchase-empty").hidden = purchases.length > 0;
    status("", "");
  } catch (error) {
    status("error", errorMessage(error));
  }
}

initializePage(loadSales);
