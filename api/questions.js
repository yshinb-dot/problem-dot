export default async function handler(req, res) {
  const { problem } = req.body;

  const prompt = `
사용자가 다음 문제를 입력했다.

문제:
${problem}

다음 형식의 JSON만 반환하라.
설명 없이 JSON만 반환하라.

{
  "imagination": ["질문1", "질문2", "질문3"],
  "observation": ["질문1", "질문2", "질문3"],
  "perspective": ["질문1", "질문2", "질문3"],
  "connection": ["질문1", "질문2", "질문3"],
  "transformation": ["질문1", "질문2", "질문3"],
  "constraint": ["질문1", "질문2", "질문3"],
  "question": ["질문1", "질문2", "질문3"],
  "discovery": ["질문1", "질문2", "질문3"]
}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You generate structured thinking questions in JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
