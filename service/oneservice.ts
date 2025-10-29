export async function getSymbols() {
  try {
    const response = await fetch("/api/symbols", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    })

    const data = await response.json();
    if (!response.ok) {
      return null;
    }
    return data;
  } catch (e) {
    console.error(e)
    return {status: "error", message: e};
  }
}