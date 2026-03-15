export default async function handler(req, res) {

  const { problem } = req.body;

  const prompt = `
사용자가 다음 문제를 입력했다.

문제:
${problem}

다음 8단계 사고 질문을 생성하라.

1 point of imagination
2 point of observation
3 point of perspective
4 point of connection
5 point of transformation
6 point of constraint
7 point of question
8 problem discovery point

각 단계마다 3개의 질문을 만들어라.
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
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await response.json();

  res.status(200).json(data);

}
