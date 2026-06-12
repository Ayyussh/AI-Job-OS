const API_URL = "http://localhost:5000";

export async function getJobs() {
  const res = await fetch(`${API_URL}/jobs`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return res.json();
}

export async function getSources() {
  const res = await fetch(`${API_URL}/jobs/sources`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch sources");
  }

  return res.json();
}