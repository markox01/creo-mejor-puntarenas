const getRedisConfig = () => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  return {
    url: url?.replace(/\/$/, "") || "",
    token: token || ""
  };
};

const redisRequest = async (path) => {
  const { url, token } = getRedisConfig();

  if (!url || !token) {
    throw new Error("KV/Redis no configurado.");
  }

  const response = await fetch(`${url}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok || data?.error) {
    throw new Error(data?.error || "Error en Redis.");
  }

  return data?.result;
};

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const current = await redisRequest("/get/site:visits");
      res.status(200).json({
        count: Number.parseInt(current || "0", 10) || 0
      });
      return;
    }

    if (req.method === "POST") {
      const updated = await redisRequest("/incr/site:visits");
      res.status(200).json({
        count: Number.parseInt(updated || "0", 10) || 0
      });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "No se pudo procesar el contador."
    });
  }
}
