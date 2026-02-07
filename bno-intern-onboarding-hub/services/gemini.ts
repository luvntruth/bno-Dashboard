
/**
 * 클라이언트 측에서 사용할 수 있는 프록시 엔드포인트를 호출합니다.
 * 서버 사이드(Express)로 요청을 전달하여 비밀 키를 보호합니다.
 */
export const getProgramFacilitationAdvice = async (programName: string): Promise<string> => {
  try {
    const payload = { programName };

    // 먼저 상대 경로로 요청 (프로덕션에서 동일 호스트에 배포된 경우 동작)
    // 개발 환경에서 Vite 포트와 다른 경우 로컬 서버를 시도합니다.
    const tryUrls = ['/api/gemini', 'http://localhost:5174/api/gemini'];

    let lastError: any = null;
    for (const url of tryUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          lastError = await res.text();
          continue;
        }

        const data = await res.json();
        if (data && data.text) return data.text;
        if (data && data.error) throw new Error(data.error || JSON.stringify(data));
        lastError = 'Invalid response from proxy';
      } catch (err) {
        lastError = err;
        // try next URL
      }
    }

    console.error('All proxy attempts failed:', lastError);
    return 'AI 튜터로 연결하는 데 실패했습니다. 서버가 실행 중인지 확인하세요.';
  } catch (err: any) {
    console.error('getProgramFacilitationAdvice error:', err);
    return 'AI 튜터 요청 중 오류가 발생했습니다.';
  }
};
