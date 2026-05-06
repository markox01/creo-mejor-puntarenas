export default async function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({ ok: true, message: "Chat endpoint activo." });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.BASE_URL || "https://api.deepseek.com/v1").replace(/\/$/, "");
  const modelName = process.env.MODEL_NAME || "deepseek-chat";

  if (!apiKey) {
    res.status(500).json({
      error: "OPENAI_API_KEY no está configurada en el hosting."
    });
    return;
  }

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    res.status(400).json({ error: "El mensaje es requerido." });
    return;
  }

  const systemPrompt = [
    "Eres el asistente virtual oficial de la campaña Yo Creo Una Mejor Puntarenas.",
    "Responde en español claro, breve y profesional.",
    "Tu función es orientar sobre misión, visión, propuestas, transparencia, voluntariado, contacto y redes sociales.",
    "Si no sabes algo con seguridad, dilo con honestidad y redirige a Facebook o WhatsApp.",
    "No inventes datos biográficos, cifras ni promesas no confirmadas.",
    "Mantén un tono institucional, cercano y útil."
  ].join(" ");

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({
        error: data?.error?.message || "No se pudo obtener respuesta del modelo."
      });
      return;
    }

    const outputText = data?.choices?.[0]?.message?.content || "";

    res.status(200).json({
      reply: outputText || "No pude generar una respuesta en este momento."
    });
  } catch (error) {
    res.status(500).json({
      error: "Ocurrió un error al comunicarse con el servicio de IA."
    });
  }
}
