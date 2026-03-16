export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { problem, previous_answers = {}, step } = req.body || {};

    if (!problem || !problem.trim()) {
      return res.status(400).json({ error: "문제가 입력되지 않았습니다." });
    }

    if (!step || !step.trim()) {
      return res.status(400).json({ error: "현재 step이 입력되지 않았습니다." });
    }

    const stepGuide = {
      imagination: "문제라고 생각한 상황의 가정과 전제를 흔들고, 다른 가능성을 상상하게 하는 질문",
      observation: "실제 현상, 반복 패턴, 시간, 행동, 맥락을 관찰하게 하는 질문",
      perspective: "사용자, 관리자, 공간, 시스템 등 서로 다른 관점 차이를 드러내는 질문",
      connection: "다른 상황이나 구조와의 유사성, 연결 가능성을 탐색하는 질문",
      transformation: "크기, 순서, 역할, 구조 변화가 문제 인식에 어떤 영향을 주는지 묻는 질문",
      constraint: "제약 조건이 문제의 본질을 어떻게 드러내는지 탐색하는 질문",
      question: "문제의 본질을 드러내기 위해 다시 물어야 할 핵심 질문",
      discovery: "처음 문제와 지금 보이는 문제의 차이를 정리하고 Problem dot 문장을 만들게 하는 질문"
    };

    const previousContext = Object.entries(previous_answers)
      .filter(([, value]) => value && String(value).trim())
      .map(([key, value]) => `- ${key}: ${String(value).trim()}`)
      .join("\n") || "이전 답변 없음";

    const prompt = `
사용자가 다음 문제를 입력했다.

문제:
${problem}

현재 단계(step):
${step}

현재 단계 설명:
${stepGuide[step] || "문제 발견을 돕는 질문 생성"}

이전 단계에서 사용자가 작성한 생각:
${previousContext}

너의 역할은 해결책을 제안하는 것이 아니라,
이 문제가 정말 진짜 문제인지 발견하도록 돕는 HANDOT Problem dot 질문 생성기다.

반드시 아래 규칙을 지켜라.

[핵심 목적]
- 문제 해결이 아니라 문제 발견
- 해결책 제안 금지
- 시스템 개선 방법 제안 금지
- 기술 도입 제안 금지
- 서비스 활용 방법 제안 금지
- 방안, 솔루션, 개선책 중심 질문 금지
- 원인, 패턴, 구조, 전제, 관점 차이를 탐색할 것

[질문 생성 규칙]
- 현재 step에 맞는 질문만 생성할 것
- 질문 개수는 3개에서 5개 사이로 생성할 것
- 매번 질문 개수가 달라질 수 있도록 자연스럽게 생성할 것
- 이전 사용자의 답변을 반영해 다음 질문을 만들 것
- 질문은 한국어로 작성할 것
- 질문은 짧지만 깊이 생각하게 만들 것
- 질문은 사용자가 자유롭게 서술할 수 있도록 열려 있어야 함
- 사용자가 "어떻게 해결하지?"보다 "진짜 문제가 뭘까?"를 생각하게 만들어야 함

반드시 아래 JSON 형식으로만 응답하라.
설명, 인사말, 코드블록, 마크다운 없이 JSON만 출력하라.

{
  "questions": ["질문1", "질문2", "질문3"]
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
            content:
              "You generate HANDOT problem-discovery questions in Korean. Return JSON only."
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

    if (
      !parsed ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length < 1
    ) {
      return res.status(500).json({
        error: "AI 응답 형식이 올바르지 않음",
        parsed
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
