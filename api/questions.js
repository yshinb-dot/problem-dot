export default async function handler(req, res) {
  try {
    const { problem } = req.body || {};

    if (!problem || !problem.trim()) {
      return res.status(400).json({
        error: "문제가 입력되지 않았습니다."
      });
    }

    const prompt = `
사용자가 다음 문제를 입력했다.

문제:
${problem}

너의 역할은 해결책을 제안하는 것이 아니라,
이 문제가 정말 진짜 문제인지 발견하도록 돕는 HANDOT Problem dot 질문 생성기다.

다음 규칙을 반드시 지켜라.

[핵심 목적]
- 문제 해결이 아니라 문제 발견
- 해결책 제안 금지
- 시스템 개선안 제안 금지
- 기술 도입 제안 금지
- 서비스 활용 방법 제안 금지
- 원인, 패턴, 구조, 전제, 관점 차이를 탐색할 것

[질문 생성 원칙]
- 각 단계마다 질문은 3개에서 5개 사이로 생성
- 질문은 모두 "문제 발견"에 도움이 되어야 함
- 질문은 구체적이고 자연스러워야 함
- 질문은 한국어로 작성
- 질문은 짧지만 생각을 확장하게 만들어야 함
- 해결 중심 표현(예: 개선, 도입, 활용, 방안, 솔루션)은 피할 것

[단계 설명]
1. imagination: 문제라고 여긴 상황에 대한 가정과 전제를 흔드는 질문
2. observation: 실제 현상, 반복 패턴, 행동, 시간, 맥락을 보는 질문
3. perspective: 사용자, 관리자, 공간, 시스템 등 입장 차이를 드러내는 질문
4. connection: 다른 상황과의 구조적 유사성이나 연결 가능성을 묻는 질문
5. transformation: 크기, 순서, 구조, 역할 변화가 문제 인식에 미치는 영향을 묻는 질문
6. constraint: 제약 조건이 문제의 본질을 어떻게 드러내는지 묻는 질문
7. question: 진짜 문제를 드러내기 위해 다시 물어야 할 본질 질문
8. discovery: 처음 문제와 지금 보이는 문제의 차이를 정리하게 하는 질문

반드시 아래 JSON 형식으로만 응답하라.
설명, 인사말, 코드블록, 마크다운 없이 JSON만 출력하라.

{
  "imagination": ["질문", "질문", "질문"],
  "observation": ["질문", "질문", "질문"],
  "perspective": ["질문", "질문", "질문"],
  "connection": ["질문", "질문", "질문"],
  "transformation": ["질문", "질문", "질문"],
  "constraint": ["질문", "질문", "질문"],
  "question": ["질문", "질문", "질문"],
  "discovery": ["질문", "질문", "질문"]
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
        temperature: 0.9,
        messages: [
          {
            role: "system",
            content: "You generate structured HANDOT problem-discovery questions in Korean, and you must return JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        error: "OpenAI API 호출 실패",
        detail: data
      });
    }

    let text = data.choices?.[0]?.message?.content?.trim() || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", text);
      return res.status(500).json({
        error: "AI 응답을 JSON으로 변환하지 못함",
        raw: text
      });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "서버 오류",
      detail: String(error)
    });
  }
}
