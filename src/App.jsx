// 🗾 日本地図を背面に浮かせる（位置を上に調整）
  mapBackground: {
    position: "absolute",
    top: "-20px", // ここを思い切り上に！カードからひょっこり出す
    width: "110%", // 少し大きくしてはみ出させる
    maxWidth: "400px",
    height: "auto",
    opacity: 0.5,
    zIndex: 0,
    filter: "drop-shadow(0 0 15px rgba(148, 210, 189, 0.4)) invert(1)",
    pointerEvents: "none",
  },
  card: {
    width: "100%", maxWidth: "360px", 
    background: "rgba(0, 18, 25, 0.7)", // 少し透明度を上げて地図を透けさせる
    backdropFilter: "blur(10px)", 
    borderRadius: "30px", padding: "30px 25px",
    border: "1px solid rgba(148, 210, 189, 0.2)", 
    marginBottom: "20px",
    textAlign: "center", 
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    marginTop: "60px", // カード自体の位置も微調整
    zIndex: 1,
  },
