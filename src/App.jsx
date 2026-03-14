import { useState, useEffect } from "react";

// --- じょもねぇの理想を形にするデザイン ---
const styles = {
  container: {
    margin: 0, padding: "20px", minHeight: "100vh",
    background: "linear-gradient(180deg, #001219 0%, #005f73 100%)",
    color: "#e9d8a6", display: "flex", flexDirection: "column", alignItems: "center",
    fontFamily: "'Sawarabi Mincho', serif",
  },
  card: {
    width: "100%", maxWidth: "360px", background: "rgba(0, 18, 25, 0.75)",
    backdropFilter: "blur(12px)", borderRadius: "30px", padding: "25px",
    border: "1px solid rgba(148, 210, 189, 0.2)", marginBottom: "20px",
    textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },
  // 市松模様対策：マスク機能でシルエットだけを抽出して色を塗る
  inoAvatar: {
    width: "160px", height: "160px", margin: "0 auto",
    backgroundColor: "#ee9b00", // ここでシルエットの色を決める（オレンジ）
    WebkitMaskImage: "url(https://raw.githubusercontent.com/jomo-nee/ino-walk/main/public/image_a879fe.png)", // GitHub上の画像パスに合わせてね
    WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center",
    filter: "drop-shadow(0 0 12px rgba(238, 155, 0, 0.5))",
  },
  stationName: { fontSize: "2.6rem", color: "#ee9b00", margin: "10px 0", fontWeight: "bold", letterSpacing: "0.05em" },
  label: { fontSize: "0.8rem", color: "#94d2bd", letterSpacing: "0.15em", textTransform: "uppercase" },
  value: { fontSize: "1.6rem", color: "#ffffff", marginTop: "5px", fontWeight: "500" },
  input: { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #94d2bd", background: "rgba(255,255,255,0.05)", color: "white", marginTop: "10px", boxSizing: "border-box" },
  button: { marginTop: "20px", padding: "12px 40px", borderRadius: "25px", background: "#ae2012", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }
};

export default function App() {
  const [config, setConfig] = useState({ gasUrl: "", sheetId: "" });
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ino_pref_v4");
    if (saved) {
      const p = JSON.parse(saved);
      setConfig(p);
      setIsReady(true);
      load(p);
    }
  }, []);

  const load = async (c) => {
    try {
      const res = await fetch(`${c.gasUrl}?id=${c.sheetId}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("データ取得に失敗したよ", e);
    }
  };

  const save = () => {
    localStorage.setItem("ino_pref_v4", JSON.stringify(config));
    setIsReady(true);
    load(config);
  };

  if (!isReady) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{color: "#ee9b00", marginBottom: "20px"}}>令和の伊能忠敬<br/>測量設定</h2>
          <div style={{textAlign: "left", marginBottom: "15px"}}>
            <p style={styles.label}>1. GASウェブアプリURL</p>
            <input style={styles.input} placeholder="https://script.google.com/..." onChange={e => setConfig({...config, gasUrl: e.target.value})} />
          </div>
          <div style={{textAlign: "left"}}>
            <p style={styles.label}>2. スプレッドシートID</p>
            <input style={styles.input} placeholder="スプレッドシートURLの英数字部分" onChange={e => setConfig({...config, sheetId: e.target.value})} />
          </div>
          <button style={styles.button} onClick={save}>旅をはじめる</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* メインビジュアルカード */}
      <div style={styles.card}>
        <div style={styles.inoAvatar}></div>
        <p style={{...styles.label, marginTop: "20px"}}>現在の宿場</p>
        <div style={styles.stationName}>{data?.nowStation || "測量中..."}</div>
        <div style={{color: "#94d2bd", fontSize: "1rem", borderTop: "1px solid rgba(148,210,189,0.2)", paddingTop: "10px", marginTop: "10px"}}>
          次は {data?.nextStation || "---"}
        </div>
      </div>

      {/* 統計グリッド */}
      <div style={{...styles.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", padding: "20px"}}>
        <div style={{borderRight: "1px solid rgba(148,210,189,0.2)"}}>
          <div style={styles.label}>累計歩数</div>
          <div style={styles.value}>{data?.stepCount ? data.stepCount.toLocaleString() : "--"}</div>
        </div>
        <div>
          <div style={styles.label}>累計距離</div>
          <div style={styles.value}>{data?.totalDist || "--"} <span style={{fontSize: "0.8rem"}}>km</span></div>
        </div>
      </div>

      {/* 誤差表示 */}
      <div style={{...styles.card, background: "rgba(174, 32, 18, 0.2)"}}>
        <div style={styles.label}>測量誤差 (GPS実測との差)</div>
        <div style={{...styles.value, color: "#e9d8a6", fontSize: "2rem"}}>
          ＋{data?.drift || 0} <span style={{fontSize: "1rem"}}>km</span>
        </div>
        <p style={{fontSize: "0.7rem", color: "#94d2bd", marginTop: "5px"}}>※寄り道や険しい道のりの証です</p>
      </div>
      
      <button onClick={() => setIsReady(false)} style={{background: "none", border: "none", color: "#94d2bd", cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline"}}>
        設定をやり直す
      </button>
    </div>
  );
}
