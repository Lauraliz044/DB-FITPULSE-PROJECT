const sessionKey = "fitpulse.session";
let configuration;

export function getSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(sessionKey));
    return value?.accessToken && Number.isInteger(value.user?.id)
      ? value
      : null;
  } catch {
    return null;
  }
}

export function setSession(value) {
  if (value) {
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify({ accessToken: value.accessToken, user: value.user }),
    );
  } else {
    sessionStorage.removeItem(sessionKey);
  }
  window.dispatchEvent(
    new CustomEvent("sessionchange", { detail: getSession() }),
  );
}

export async function getConfiguration() {
  if (!configuration) {
    configuration = fetch("/app-config.json")
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            "No se pudo cargar la configuración. Recarga la página.",
          );
        return response.json();
      })
      .catch((error) => {
        configuration = undefined;
        throw error;
      });
  }
  return configuration;
}

export async function request(route, options = {}) {
  const { apiPrefix } = await getConfiguration();
  const headers = { Accept: "application/json" };
  const session = getSession();
  if (session && !options.public)
    headers.Authorization = `Bearer ${session.accessToken}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(`${apiPrefix}${route}`, {
      method: options.method || "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "No pudimos conectar con el servidor. Revisa la conexión e inténtalo de nuevo.",
    );
  }
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || "No se pudo completar la operación.",
    );
    error.status = response.status;
    if (
      !options.public &&
      (response.status === 401 ||
        (response.status === 403 && error.message === "Account is inactive"))
    )
      setSession(null);
    throw error;
  }
  return payload?.data;
}

export async function listAll(route, signal) {
  const values = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const page = await request(
      `${route}${route.includes("?") ? "&" : "?"}limit=${limit}&offset=${offset}`,
      { signal },
    );
    values.push(...page);
    if (page.length < limit) return values;
  }
}
