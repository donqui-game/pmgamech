// JSON 데이터 로더: GitHub Pages에서 상대 경로로 읽습니다.
window.GameData = {};
(async function loadGameData(){
  const names = ["ranks","events","skills","weapons","quests"];
  try {
    const entries = await Promise.all(names.map(async name => {
      const response = await fetch(`data/${name}.json`);
      if(!response.ok) throw new Error(`${name}.json 로드 실패`);
      return [name, await response.json()];
    }));
    window.GameData = Object.fromEntries(entries);
    window.dispatchEvent(new Event("gamedata-ready"));
  } catch(error) {
    console.error(error);
    document.body.insertAdjacentHTML("beforeend", `<p style="color:#ffaaaa;padding:20px">데이터 파일을 불러오지 못했습니다. GitHub 저장소의 data 폴더와 파일 경로를 확인해 주세요.</p>`);
  }
})();