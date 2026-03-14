import { useState, useEffect, useCallback, useMemo } from "react";

// --- 定数 ---
const STORAGE_KEY = "ino-v3";
const TEMPLATE_URL = "https://docs.google.com/spreadsheets/d/16IY_wB0FB5YYJu7PzBbnHQWi6kMLpi4UfHjNvu8X16c/copy";
const MS_PER_DAY = 86_400_000;
const STEPS_UNIT = 10_000; // 「万歩」単位の基数
const DEFAULT_STRIDE_CM = 62; // 歩幅デフォルト値 (cm)
const GAS_URL_PREFIX = "https://script.google.com/";

// --- 共通データ資産 ---
// station keys: prefIndex, name, km (スタートからの距離), address, geminiNote, chatgptNote, claudeNote
// prefecture keys: name, km (その県の区間距離)
const ROUTE_DATA = {
  stations: [
    { prefIndex: 0, name: "品川",     km: 56.7,    address: "東京都品川区",        geminiNote: "深川めし、佃煮、江戸前寿司",                  chatgptNote: "深川めし／佃煮",               claudeNote: "スタート地点🎌江戸の玄関口・品川宿から令和の旅が始まる！" },
    { prefIndex: 0, name: "深川",     km: 37.8,    address: "東京都江東区",        geminiNote: "佃煮、浜離宮の潮入の池",                       chatgptNote: "佃煮／浜離宮の潮入の池",       claudeNote: "江戸前の海の幸が待ってる💪佃煮の香りを想像しながら歩こう" },
    { prefIndex: 0, name: "佃島",     km: 18.9,    address: "東京都中央区佃島",    geminiNote: "佃煮発祥 de の地、住吉神社",                  chatgptNote: "佃煮発祥の地／住吉神社",       claudeNote: "佃煮発祥の地を通過👟" },
    { prefIndex: 1, name: "館山",     km: 550.58,  address: "千葉県館山市",        geminiNote: "館山のびわ・海産物、洲崎灯台",                 chatgptNote: "館山のびわ・海産物",           claudeNote: "房総の先端・館山へ🌊" },
    { prefIndex: 1, name: "九十九里", km: 367.05,  address: "千葉県山武市",        geminiNote: "九十九里のハマグリ・イワシ",                   chatgptNote: "九十九里のハマグリ",           claudeNote: "九十九里の砂浜を想像して👣" },
    { prefIndex: 1, name: "銚子",     km: 183.53,  address: "千葉県銚子市",        geminiNote: "銚子の醤油・イワシ、犬吠埼灯台",               chatgptNote: "銚子の醤油・イワシ",           claudeNote: "本州最東端に近い銚子🎣" },
    { prefIndex: 2, name: "大洗",     km: 181.53,  address: "茨城県大洗町",        geminiNote: "大洗のアンコウ鍋、大洗磯前神社",               chatgptNote: "大洗のアンコウ鍋",             claudeNote: "大洗のアンコウ鍋🦑" },
    { prefIndex: 2, name: "那珂湊",   km: 121.02,  address: "茨城県ひたちなか市",  geminiNote: "那珂湊のカツオ・マグロ",                       chatgptNote: "那珂湊のカツオ・マグロ",       claudeNote: "おさかな市場でカツオ🐟" },
    { prefIndex: 2, name: "平潟",     km: 60.51,   address: "茨城県北茨城市",      geminiNote: "平潟のどんこ汁・メヒカリ",                     chatgptNote: "平潟のどんこ汁",               claudeNote: "メヒカリが待ってる👀" },
    { prefIndex: 3, name: "いわき",   km: 178.06,  address: "福島県いわき市",      geminiNote: "いわきのメヒカリ・カツオ",                     chatgptNote: "いわきのメヒカリ",             claudeNote: "スパリゾートハワイアンズ🌺" },
    { prefIndex: 3, name: "勿来",     km: 118.71,  address: "福島県いわき市勿来",  geminiNote: "勿来の関（奥州三関）",                         chatgptNote: "勿来の関",                     claudeNote: "勿来の関を越えた！⛩️" },
    { prefIndex: 3, name: "相馬",     km: 59.35,   address: "福島県相馬市",        geminiNote: "相馬の野馬追",                                 chatgptNote: "相馬の野馬追",                 claudeNote: "野馬追の蹄の音🐴" },
    { prefIndex: 4, name: "亘理",     km: 552.68,  address: "宮城県亘理町",        geminiNote: "亘理のはらこ飯",                               chatgptNote: "亘理のはらこ飯",               claudeNote: "はらこ飯🍱" },
    { prefIndex: 4, name: "塩竈",     km: 368.45,  address: "宮城県塩竈市",        geminiNote: "塩竈の寿司、鹽竈神社",                         chatgptNote: "塩竈の寿司",                   claudeNote: "鮨の街・塩竈🍣" },
    { prefIndex: 4, name: "気仙沼",   km: 184.23,  address: "宮城県気仙沼市",      geminiNote: "気仙沼のフカヒレ",                             chatgptNote: "気仙沼のフカヒレ",             claudeNote: "フカヒレスープ🦈" },
    { prefIndex: 5, name: "陸前高田", km: 649.22,  address: "岩手県陸前高田市",    geminiNote: "陸前高田の奇跡の一本松、三陸海岸の海産物",     chatgptNote: "陸前高田の奇跡の一本松／三陸海岸", claudeNote: "奇跡の一本松のように、強く、まっすぐに🌲何があっても前に進む足を持つ君は強い" },
    { prefIndex: 5, name: "大船渡",   km: 432.81,  address: "岩手県大船渡市",      geminiNote: "大船渡のサンマ・カキ、碁石海岸",               chatgptNote: "大船渡のサンマ・カキ／碁石海岸", claudeNote: "碁石海岸の波音に背中を押されて🌊三陸のサンマは秋の星、その輝きを目指せ！" },
    { prefIndex: 5, name: "宮古",     km: 216.41,  address: "岩手県宮古市",        geminiNote: "宮古のウニ・アワビ、浄土ヶ浜",                 chatgptNote: "宮古のウニ・アワビ／浄土ヶ浜", claudeNote: "浄土ヶ浜の青い海が待ってる🏖️ウニとアワビは歩いた先にある絶景とともに" },
    { prefIndex: 6, name: "八戸",     km: 743.93,  address: "青森県八戸市",        geminiNote: "八戸のせんべい汁",                             chatgptNote: "八戸のせんべい汁",             claudeNote: "八戸三社大祭🥁" },
    { prefIndex: 6, name: "大間",     km: 619.94,  address: "青森県大間町",        geminiNote: "大間のマグロ",                                 chatgptNote: "大間のマグロ",                 claudeNote: "本州最北端🐟" },
    { prefIndex: 6, name: "青森",     km: 495.95,  address: "青森県青森市",        geminiNote: "ねぶた祭り・リンゴ",                           chatgptNote: "青森ねぶた祭",                 claudeNote: "ラッセーラー🎆" },
    { prefIndex: 6, name: "鰺ヶ沢",   km: 371.96,  address: "青森県鰺ヶ沢町",      geminiNote: "鰺ヶ沢のヒラメ",                               chatgptNote: "鰺ヶ沢ヒラメ丼",               claudeNote: "わさお🐕" },
    { prefIndex: 6, name: "深浦",     km: 247.98,  address: "青森県深浦町",        geminiNote: "不老ふ死温泉",                                 chatgptNote: "深浦マグロステーキ丼",         claudeNote: "不老ふ死温泉♨️" },
    { prefIndex: 6, name: "三厩",     km: 123.99,  address: "青森県外ヶ浜町",      geminiNote: "階段国道・龍飛岬",                             chatgptNote: "階段国道",                     claudeNote: "龍飛岬🌊" },
    { prefIndex: 7, name: "箱館",     km: 2747.7,  address: "北海道函館市",        geminiNote: "イカ・塩ラーメン、五稜郭",                     chatgptNote: "函館イカ",                     claudeNote: "五稜郭⭐" },
    { prefIndex: 7, name: "山越",     km: 2610.31, address: "北海道八雲町",        geminiNote: "ホタテ",                                       chatgptNote: "ホタテ",                       claudeNote: "北海道🌾" },
    { prefIndex: 7, name: "虻田",     km: 2472.93, address: "北海道洞爺湖町",      geminiNote: "洞爺湖",                                       chatgptNote: "わかさいも",                   claudeNote: "洞爺湖🌋" },
    { prefIndex: 7, name: "白老",     km: 2335.55, address: "北海道白老町",        geminiNote: "白老牛、ウポポイ",                             chatgptNote: "白老牛",                       claudeNote: "ウポポイ🎶" },
    { prefIndex: 7, name: "襟裳",     km: 2198.16, address: "北海道えりも町",      geminiNote: "襟裳岬",                                       chatgptNote: "昆布",                         claudeNote: "襟裳岬🌬️" },
    { prefIndex: 7, name: "広尾",     km: 2060.77, address: "北海道広尾町",        geminiNote: "ししゃも",                                     chatgptNote: "ししゃも",                     claudeNote: "黄金道路💪" },
    { prefIndex: 7, name: "大津",     km: 1923.39, address: "北海道浦幌町",        geminiNote: "鮭",                                           chatgptNote: "鮭",                           claudeNote: "ジュエリーアイス💎" },
    { prefIndex: 7, name: "釧路",     km: 1786.0,  address: "北海道釧路市",        geminiNote: "勝手丼・炉端焼き",                             chatgptNote: "釧路勝手丼",                   claudeNote: "炉端焼き🔥" },
    { prefIndex: 7, name: "厚岸",     km: 1648.62, address: "北海道厚岸町",        geminiNote: "厚岸のカキ",                                   chatgptNote: "厚岸カキ",                     claudeNote: "カキとウイスキー🥃" },
    { prefIndex: 7, name: "西別",     km: 1511.23, address: "北海道別海町",        geminiNote: "野付半島",                                     chatgptNote: "鮭",                           claudeNote: "トドワラ🌿" },
    { prefIndex: 7, name: "根室",     km: 1373.85, address: "北海道根室市",        geminiNote: "花咲ガニ、納沙布岬",                           chatgptNote: "花咲ガニ",                     claudeNote: "日本最東端🌅" },
    { prefIndex: 7, name: "斜里",     km: 1236.46, address: "北海道斜里町",        geminiNote: "知床半島",                                     chatgptNote: "鮭いくら",                     claudeNote: "知床🐻" },
    { prefIndex: 7, name: "紋別",     km: 1099.08, address: "北海道紋別市",        geminiNote: "カニ・流氷",                                   chatgptNote: "カニ",                         claudeNote: "流氷🧊" },
    { prefIndex: 7, name: "宗谷",     km: 961.69,  address: "北海道稚内市",        geminiNote: "宗谷岬",                                       chatgptNote: "ホタテ",                       claudeNote: "日本最北端🎯" },
    { prefIndex: 7, name: "天塩",     km: 824.31,  address: "北海道天塩町",        geminiNote: "しじみ",                                       chatgptNote: "しじみ",                       claudeNote: "しじみ汁🐚" },
    { prefIndex: 7, name: "増毛",     km: 686.93,  address: "北海道増毛町",        geminiNote: "甘エビ",                                       chatgptNote: "甘エビ",                       claudeNote: "甘エビと日本酒🍶" },
    { prefIndex: 7, name: "小樽",     km: 549.54,  address: "北海道小樽市",        geminiNote: "寿司、小樽運河",                               chatgptNote: "寿司",                         claudeNote: "小樽運河🕯️" },
    { prefIndex: 7, name: "松前",     km: 412.15,  address: "北海道松前町",        geminiNote: "本マグロ",                                     chatgptNote: "本マグロ",                     claudeNote: "松前城🌸" },
    { prefIndex: 7, name: "知内",     km: 274.77,  address: "北海道知内町",        geminiNote: "カキ",                                         chatgptNote: "カキ",                         claudeNote: "カキ🌿" },
    { prefIndex: 7, name: "吉岡",     km: 137.39,  address: "北海道福島町",        geminiNote: "蝦夷地上陸地点",                               chatgptNote: "蝦夷上陸地",                   claudeNote: "歴史的地点🗺️" },
    { prefIndex: 8, name: "能代",     km: 265.75,  address: "秋田県能代市",        geminiNote: "白神山地",                                     chatgptNote: "白神山地",                     claudeNote: "白神山地🌲" },
    { prefIndex: 8, name: "男鹿",     km: 177.17,  address: "秋田県男鹿市",        geminiNote: "ナマハゲ",                                     chatgptNote: "ナマハゲ",                     claudeNote: "ナマハゲ👹" },
    { prefIndex: 8, name: "象潟",     km: 88.58,   address: "秋田県にかほ市",      geminiNote: "岩牡蠣",                                       chatgptNote: "岩牡蠣",                       claudeNote: "象潟🎐" },
    { prefIndex: 9, name: "酒田",     km: 97.63,   address: "山形県酒田市",        geminiNote: "山居倉庫",                                     chatgptNote: "山居倉庫",                     claudeNote: "ケヤキ並木🌳" },
    { prefIndex: 9, name: "由良",     km: 65.09,   address: "山形県鶴岡市",        geminiNote: "由良海岸",                                     chatgptNote: "由良海岸",                     claudeNote: "スイカ🍉" },
    { prefIndex: 9, name: "温海",     km: 32.54,   address: "山形県鶴岡市",        geminiNote: "あつみ温泉",                                   chatgptNote: "あつみ温泉",                   claudeNote: "温泉♨️" },
    { prefIndex: 10, name: "村上",    km: 300.56,  address: "新潟県村上市",        geminiNote: "塩引き鮭",                                     chatgptNote: "塩引き鮭",                     claudeNote: "塩引き鮭🐟" },
    { prefIndex: 10, name: "寺泊",    km: 200.37,  address: "新潟県長岡市",        geminiNote: "魚のアメ横",                                   chatgptNote: "魚のアメ横",                   claudeNote: "海の幸🦐" },
    { prefIndex: 10, name: "直江津",  km: 100.19,  address: "新潟県上越市",        geminiNote: "ブリ",                                         chatgptNote: "ブリ",                         claudeNote: "直江津🏯" },
    { prefIndex: 11, name: "魚津",    km: 114.79,  address: "富山県魚津市",        geminiNote: "蜃気楼",                                       chatgptNote: "蜃気楼",                       claudeNote: "蜃気楼🌊" },
    { prefIndex: 11, name: "滑川",    km: 76.53,   address: "富山県滑川市",        geminiNote: "ホタルイカ",                                   chatgptNote: "ホタルイカ",                   claudeNote: "ホタルイカ✨" },
    { prefIndex: 11, name: "氷見",    km: 38.26,   address: "富山県氷見市",        geminiNote: "氷見のブリ",                                   chatgptNote: "氷見ブリ",                     claudeNote: "寒ブリ🎣" },
    { prefIndex: 12, name: "輪島",    km: 493.61,  address: "石川県輪島市",        geminiNote: "輪島塗",                                       chatgptNote: "輪島塗",                       claudeNote: "輪島塗🎨" },
    { prefIndex: 12, name: "七尾",    km: 329.07,  address: "石川県七尾市",        geminiNote: "能登食祭市場",                                 chatgptNote: "能登食祭市場",                 claudeNote: "海の幸🦀" },
    { prefIndex: 12, name: "金沢",    km: 164.54,  address: "石川県金沢市",        geminiNote: "兼六園",                                       chatgptNote: "兼六園",                       claudeNote: "兼六園🌨️" },
    { prefIndex: 13, name: "越前海岸", km: 403.09, address: "福井県越前市",        geminiNote: "越前がに",                                     chatgptNote: "越前がに",                     claudeNote: "越前がに🦀" },
    { prefIndex: 13, name: "小浜",    km: 268.73,  address: "福井県小浜市",        geminiNote: "へしこ",                                       chatgptNote: "へしこ",                       claudeNote: "へしこ✨" },
    { prefIndex: 13, name: "敦賀",    km: 134.36,  address: "福井県敦賀市",        geminiNote: "気比神宮",                                     chatgptNote: "気比神宮",                     claudeNote: "気比神宮⛩️" },
    { prefIndex: 14, name: "伊根",    km: 302.29,  address: "京都府伊根町",        geminiNote: "舟屋",                                         chatgptNote: "舟屋",                         claudeNote: "舟屋🏠" },
    { prefIndex: 14, name: "宮津",    km: 201.53,  address: "京都府宮津市",        geminiNote: "天橋立",                                       chatgptNote: "天橋立",                       claudeNote: "天橋立🌉" },
    { prefIndex: 14, name: "舞鶴",    km: 100.76,  address: "京都府舞鶴市",        geminiNote: "赤れんが倉庫",                                 chatgptNote: "赤れんが倉庫",                 claudeNote: "赤れんが🏭" },
    { prefIndex: 15, name: "香住",    km: 110.33,  address: "兵庫県香美町",        geminiNote: "香住ガニ",                                     chatgptNote: "香住ガニ",                     claudeNote: "香住ガニ🦀" },
    { prefIndex: 15, name: "城崎",    km: 73.55,   address: "兵庫県豊岡市",        geminiNote: "城崎温泉",                                     chatgptNote: "城崎温泉",                     claudeNote: "城崎温泉♨️" },
    { prefIndex: 15, name: "浜坂",    km: 36.78,   address: "兵庫県新温泉町",      geminiNote: "浜坂のカニ",                                   chatgptNote: "浜坂のカニ",                   claudeNote: "カニ🦀" },
    { prefIndex: 16, name: "鳥取",    km: 149.64,  address: "鳥取県鳥取市",        geminiNote: "鳥取砂丘",                                     chatgptNote: "鳥取砂丘",                     claudeNote: "砂丘🏜️" },
    { prefIndex: 16, name: "米子",    km: 99.76,   address: "鳥取県米子市",        geminiNote: "大山鶏",                                       chatgptNote: "大山鶏",                       claudeNote: "大山🏔️" },
    { prefIndex: 16, name: "境港",    km: 49.88,   address: "鳥取県境港市",        geminiNote: "カニ・ゲゲゲの鬼太郎",                         chatgptNote: "境港カニ",                     claudeNote: "鬼太郎👻" },
    { prefIndex: 17, name: "出雲",    km: 422.19,  address: "島根県出雲市",        geminiNote: "出雲大社",                                     chatgptNote: "出雲大社",                     claudeNote: "出雲大社🎌" },
    { prefIndex: 17, name: "大田",    km: 281.46,  address: "島根県大田市",        geminiNote: "石見銀山",                                     chatgptNote: "石見銀山",                     claudeNote: "石見銀山⛏️" },
    { prefIndex: 17, name: "浜田",    km: 140.73,  address: "島根県浜田市",        geminiNote: "のどぐろ",                                     chatgptNote: "のどぐろ",                     claudeNote: "のどぐろ🐟" },
    { prefIndex: 18, name: "下関",    km: 762.01,  address: "山口県下関市",        geminiNote: "ふぐ",                                         chatgptNote: "ふぐ",                         claudeNote: "ふぐ🐡" },
    { prefIndex: 18, name: "萩",      km: 571.51,  address: "山口県萩市",          geminiNote: "萩焼",                                         chatgptNote: "萩焼",                         claudeNote: "萩🏯" },
    { prefIndex: 18, name: "長門",    km: 381.0,   address: "山口県長門市",        geminiNote: "元乃隅神社",                                   chatgptNote: "元乃隅神社",                   claudeNote: "鳥居⛩️" },
    { prefIndex: 18, name: "周防大島", km: 190.5,  address: "山口県周防大島町",    geminiNote: "みかん",                                       chatgptNote: "みかん鍋",                     claudeNote: "瀬戸内🌴" },
    { prefIndex: 19, name: "北九州",  km: 461.4,   address: "福岡県北九州市",      geminiNote: "焼きカレー",                                   chatgptNote: "門司焼きカレー",               claudeNote: "門司港🍛" },
    { prefIndex: 19, name: "博多",    km: 307.6,   address: "福岡県福岡市",        geminiNote: "博多ラーメン",                                 chatgptNote: "博多ラーメン",                 claudeNote: "屋台🍜" },
    { prefIndex: 19, name: "大牟田",  km: 153.8,   address: "福岡県大牟田市",      geminiNote: "三池炭鉱",                                     chatgptNote: "三池炭鉱",                     claudeNote: "世界遺産💦" },
    { prefIndex: 20, name: "鹿島",    km: 175.7,   address: "佐賀県鹿島市",        geminiNote: "祐徳稲荷神社",                                 chatgptNote: "祐徳稲荷神社",                 claudeNote: "稲荷⛩️" },
    { prefIndex: 20, name: "唐津",    km: 87.85,   address: "佐賀県唐津市",        geminiNote: "唐津くんち",                                   chatgptNote: "唐津くんち",                   claudeNote: "唐津くんち🎭" },
    { prefIndex: 21, name: "長崎",    km: 1047.51, address: "長崎県長崎市",        geminiNote: "ちゃんぽん",                                   chatgptNote: "ちゃんぽん",                   claudeNote: "ちゃんぽん🍜" },
    { prefIndex: 21, name: "島原",    km: 698.34,  address: "長崎県島原市",        geminiNote: "島原そうめん",                                 chatgptNote: "島原そうめん",                 claudeNote: "島原城🏯" },
    { prefIndex: 21, name: "五島",    km: 349.17,  address: "長崎県五島市",        geminiNote: "五島うどん",                                   chatgptNote: "五島うどん",                   claudeNote: "教会群⛪" },
    { prefIndex: 22, name: "武雄",    km: 117.14,  address: "佐賀県武雄市",        geminiNote: "武雄温泉",                                     chatgptNote: "武雄温泉",                     claudeNote: "武雄温泉♨️" },
    { prefIndex: 23, name: "柳川",    km: 41.95,   address: "福岡県柳川市",        geminiNote: "川下り",                                       chatgptNote: "柳川川下り",                   claudeNote: "川下り🚣" },
    { prefIndex: 23, name: "大牟田2", km: 20.98,   address: "福岡県大牟田市",      geminiNote: "三池港",                                       chatgptNote: "三池港",                       claudeNote: "産業遺産🏭" },
    { prefIndex: 24, name: "八代",    km: 276.01,  address: "熊本県八代市",        geminiNote: "い草",                                         chatgptNote: "い草",                         claudeNote: "い草🌾" },
    { prefIndex: 24, name: "天草",    km: 184.01,  address: "熊本県天草市",        geminiNote: "崎津集落",                                     chatgptNote: "崎津集落",                     claudeNote: "天草💙" },
    { prefIndex: 24, name: "水俣",    km: 92.0,    address: "熊本県水俣市",        geminiNote: "晩白柚",                                       chatgptNote: "晩白柚",                       claudeNote: "晩白柚🍋" },
    { prefIndex: 25, name: "鹿児島",  km: 796.7,   address: "鹿児島県鹿児島市",    geminiNote: "桜島",                                         chatgptNote: "桜島大根",                     claudeNote: "桜島🌋" },
    { prefIndex: 25, name: "枕崎",    km: 597.53,  address: "鹿児島県枕崎市",      geminiNote: "かつお節",                                     chatgptNote: "かつお節",                     claudeNote: "かつお節🐟" },
    { prefIndex: 25, name: "指宿",    km: 398.35,  address: "鹿児島県指宿市",      geminiNote: "砂むし温泉",                                   chatgptNote: "砂むし温泉",                   claudeNote: "砂むし♨️" },
    { prefIndex: 25, name: "種子島",  km: 199.17,  address: "鹿児島県西之表市",    geminiNote: "宇宙センター",                                 chatgptNote: "宇宙センター",                 claudeNote: "ロケット🚀" },
    { prefIndex: 26, name: "延岡",    km: 379.81,  address: "宮崎県延岡市",        geminiNote: "チキン南蛮",                                   chatgptNote: "チキン南蛮",                   claudeNote: "チキン南蛮🍗" },
    { prefIndex: 26, name: "細島",    km: 253.21,  address: "宮崎県日向市",        geminiNote: "へべす",                                       chatgptNote: "へべす",                       claudeNote: "へべす🍋" },
    { prefIndex: 26, name: "油津",    km: 126.6,   address: "宮崎県日南市",        geminiNote: "飫肥城",                                       chatgptNote: "飫肥城",                       claudeNote: "飫肥城🏯" },
    { prefIndex: 27, name: "中津",    km: 603.62,  address: "大分県中津市",        geminiNote: "唐揚げ",                                       chatgptNote: "中津唐揚げ",                   claudeNote: "唐揚げ🍗" },
    { prefIndex: 27, name: "別府",    km: 452.72,  address: "大分県別府市",        geminiNote: "地獄めぐり",                                   chatgptNote: "地獄めぐり",                   claudeNote: "地獄めぐり🔥" },
    { prefIndex: 27, name: "臼杵",    km: 301.81,  address: "大分県臼杵市",        geminiNote: "石仏",                                         chatgptNote: "臼杵石仏",                     claudeNote: "石仏🗿" },
    { prefIndex: 27, name: "佐伯",    km: 150.9,   address: "大分県佐伯市",        geminiNote: "寿司",                                         chatgptNote: "関サバ寿司",                   claudeNote: "寿司🍣" },
    { prefIndex: 28, name: "呉",      km: 326.27,  address: "広島県呉市",          geminiNote: "大和ミュージアム",                             chatgptNote: "大和ミュージアム",             claudeNote: "戦艦大和🚢" },
    { prefIndex: 28, name: "鞆の浦",  km: 217.51,  address: "広島県福山市",        geminiNote: "保命酒",                                       chatgptNote: "保命酒",                       claudeNote: "鞆の浦🍶" },
    { prefIndex: 28, name: "尾道",    km: 108.76,  address: "広島県尾道市",        geminiNote: "尾道ラーメン",                                 chatgptNote: "尾道ラーメン",                 claudeNote: "尾道ラーメン🐈‍⬛" },
    { prefIndex: 29, name: "宇和島",  km: 932.77,  address: "愛媛県宇和島市",      geminiNote: "鯛めし",                                       chatgptNote: "鯛めし",                       claudeNote: "鯛めし🐟" },
    { prefIndex: 29, name: "松山",    km: 621.85,  address: "愛媛県松山市",        geminiNote: "道後温泉",                                     chatgptNote: "道後温泉",                     claudeNote: "道後温泉♨️" },
    { prefIndex: 29, name: "今治",    km: 310.92,  address: "愛媛県今治市",        geminiNote: "今治タオル",                                   chatgptNote: "今治タオル",                   claudeNote: "今治タオル🤍" },
    { prefIndex: 30, name: "宿毛",    km: 647.14,  address: "高知県宿毛市",        geminiNote: "だるま夕日",                                   chatgptNote: "だるま夕日",                   claudeNote: "だるま夕日🌅" },
    { prefIndex: 30, name: "土佐清水", km: 485.36, address: "高知県土佐清水市",    geminiNote: "足摺岬",                                       chatgptNote: "足摺岬",                       claudeNote: "足摺岬🌊" },
    { prefIndex: 30, name: "高知",    km: 323.57,  address: "高知県高知市",        geminiNote: "よさこい祭り",                                 chatgptNote: "よさこい祭り",                 claudeNote: "よさこい🎉" },
    { prefIndex: 30, name: "室戸",    km: 161.78,  address: "高知県室戸市",        geminiNote: "室戸岬",                                       chatgptNote: "室戸岬",                       claudeNote: "室戸岬✨" },
    { prefIndex: 31, name: "宍喰",    km: 246.24,  address: "徳島県海陽町",        geminiNote: "サンゴ",                                       chatgptNote: "サンゴ礁",                     claudeNote: "サンゴ💎" },
    { prefIndex: 31, name: "牟岐",    km: 164.16,  address: "徳島県牟岐町",        geminiNote: "磯料理",                                       chatgptNote: "磯料理",                       claudeNote: "磯料理🐚" },
    { prefIndex: 31, name: "阿南",    km: 82.08,   address: "徳島県阿南市",        geminiNote: "ハモ",                                         chatgptNote: "ハモ",                         claudeNote: "ハモ🐟" },
    { prefIndex: 32, name: "観音寺",  km: 301.03,  address: "香川県観音寺市",      geminiNote: "銭形砂絵",                                     chatgptNote: "銭形砂絵",                     claudeNote: "銭形砂絵🪙" },
    { prefIndex: 32, name: "坂出",    km: 200.69,  address: "香川県坂出市",        geminiNote: "瀬戸大橋",                                     chatgptNote: "瀬戸大橋",                     claudeNote: "瀬戸大橋🌉" },
    { prefIndex: 32, name: "高松",    km: 100.34,  address: "香川県高松市",        geminiNote: "栗林公園",                                     chatgptNote: "栗林公園",                     claudeNote: "栗林公園🌲" },
    { prefIndex: 33, name: "笠岡",    km: 304.76,  address: "岡山県笠岡市",        geminiNote: "カブトガニ",                                   chatgptNote: "カブトガニ",                   claudeNote: "カブトガニ🦀" },
    { prefIndex: 33, name: "倉敷",    km: 203.17,  address: "岡山県倉敷市",        geminiNote: "美観地区",                                     chatgptNote: "倉敷美観地区",                 claudeNote: "美観地区🏘️" },
    { prefIndex: 33, name: "玉野",    km: 101.59,  address: "岡山県玉野市",        geminiNote: "宇野港",                                       chatgptNote: "宇野港",                       claudeNote: "宇野港🎨" },
    { prefIndex: 34, name: "赤穂",    km: 308.95,  address: "兵庫県赤穂市",        geminiNote: "赤穂の塩",                                     chatgptNote: "赤穂の塩",                     claudeNote: "赤穂浪士⚔️" },
    { prefIndex: 34, name: "姫路",    km: 231.71,  address: "兵庫県姫路市",        geminiNote: "姫路城",                                       chatgptNote: "姫路城",                       claudeNote: "姫路城🏯" },
    { prefIndex: 34, name: "明石",    km: 154.47,  address: "兵庫県明石市",        geminiNote: "明石焼き",                                     chatgptNote: "明石焼き",                     claudeNote: "明石焼き🐙" },
    { prefIndex: 34, name: "神戸",    km: 77.24,   address: "兵庫県神戸市",        geminiNote: "神戸港",                                       chatgptNote: "神戸港",                       claudeNote: "神戸港⚓" },
    { prefIndex: 35, name: "堺",      km: 160.26,  address: "大阪府堺市",          geminiNote: "仁徳天皇陵",                                   chatgptNote: "仁徳天皇陵",                   claudeNote: "仁徳天皇陵🏛️" },
    { prefIndex: 35, name: "岸和田",  km: 106.84,  address: "大阪府岸和田市",      geminiNote: "だんじり祭り",                                 chatgptNote: "だんじり祭",                   claudeNote: "だんじり🏃" },
    { prefIndex: 35, name: "泉佐野",  km: 53.42,   address: "大阪府泉佐野市",      geminiNote: "関西空港",                                     chatgptNote: "関西空港",                     claudeNote: "関西空港✈️" },
    { prefIndex: 36, name: "和歌山",  km: 506.17,  address: "和歌山県和歌山市",    geminiNote: "和歌山城",                                     chatgptNote: "和歌山ラーメン",               claudeNote: "和歌山城🏯" },
    { prefIndex: 36, name: "白浜",    km: 379.63,  address: "和歌山県白浜町",      geminiNote: "三段壁",                                       chatgptNote: "白浜温泉",                     claudeNote: "三段壁🌊" },
    { prefIndex: 36, name: "串本",    km: 253.09,  address: "和歌山県串本町",      geminiNote: "橋杭岩",                                       chatgptNote: "橋杭岩",                       claudeNote: "橋杭岩💪" },
    { prefIndex: 36, name: "新宮",    km: 126.54,  address: "和歌山県新宮市",      geminiNote: "熊野速玉大社",                                 chatgptNote: "熊野速玉大社",                 claudeNote: "熊野速玉大社⛩️" },
    { prefIndex: 37, name: "熊野",    km: 948.05,  address: "三重県熊野市",        geminiNote: "鬼ヶ城",                                       chatgptNote: "鬼ヶ城",                       claudeNote: "鬼ヶ城👹" },
    { prefIndex: 37, name: "尾鷲",    km: 711.04,  address: "三重県尾鷲市",        geminiNote: "めはり寿司",                                   chatgptNote: "めはり寿司",                   claudeNote: "めはり寿司🍙" },
    { prefIndex: 37, name: "志摩",    km: 474.02,  address: "三重県志摩市",        geminiNote: "英虞湾",                                       chatgptNote: "英虞湾",                       claudeNote: "英虞湾の真珠💎" },
    { prefIndex: 37, name: "鳥羽",    km: 237.01,  address: "三重県鳥羽市",        geminiNote: "真珠",                                         chatgptNote: "真珠養殖",                     claudeNote: "海女さん🌊" },
    { prefIndex: 38, name: "名古屋",  km: 508.82,  address: "愛知県名古屋市",      geminiNote: "ひつまぶし",                                   chatgptNote: "ひつまぶし",                   claudeNote: "ひつまぶし🐟" },
    { prefIndex: 38, name: "知多",    km: 381.62,  address: "愛知県知多市",        geminiNote: "知多半島",                                     chatgptNote: "知多牛",                       claudeNote: "知多半島🍶" },
    { prefIndex: 38, name: "蒲郡",    km: 254.41,  address: "愛知県蒲郡市",        geminiNote: "竹島",                                         chatgptNote: "蒲郡みかん",                   claudeNote: "竹島🏝️" },
    { prefIndex: 38, name: "豊橋",    km: 127.2,   address: "愛知県豊橋市",        geminiNote: "ちくわ",                                       chatgptNote: "豊橋ちくわ",                   claudeNote: "ちくわ🎨" },
    { prefIndex: 39, name: "浜松",    km: 524.19,  address: "静岡県浜松市",        geminiNote: "うなぎ",                                       chatgptNote: "浜名湖うなぎ",                 claudeNote: "うなぎ🐍" },
    { prefIndex: 39, name: "焼津",    km: 393.14,  address: "静岡県焼津市",        geminiNote: "マグロ",                                       chatgptNote: "焼津マグロ",                   claudeNote: "マグロ🔴" },
    { prefIndex: 39, name: "清水",    km: 262.1,   address: "静岡県静岡市",        geminiNote: "三保の松原",                                   chatgptNote: "三保の松原",                   claudeNote: "富士山🗻" },
    { prefIndex: 39, name: "沼津",    km: 131.05,  address: "静岡県沼津市",        geminiNote: "沼津港",                                       chatgptNote: "沼津港寿司",                   claudeNote: "深海魚🐡" },
    { prefIndex: 40, name: "小田原",  km: 347.4,   address: "神奈川県小田原市",    geminiNote: "小田原城",                                     chatgptNote: "小田原かまぼこ",               claudeNote: "小田原城🏯" },
    { prefIndex: 40, name: "鎌倉",    km: 231.6,   address: "神奈川県鎌倉市",      geminiNote: "大仏",                                         chatgptNote: "鎌倉大仏",                     claudeNote: "大仏様🙏" },
    { prefIndex: 40, name: "横浜",    km: 115.8,   address: "神奈川県横浜市",      geminiNote: "中華街",                                       chatgptNote: "横浜中華街",                   claudeNote: "ゴール🎊横浜中華街！" },
  ],
  prefectures: [
    { name: "東京",  km: 56.7 },   { name: "千葉",  km: 550.58 }, { name: "茨城",  km: 181.53 },
    { name: "福島",  km: 178.06 }, { name: "宮城",  km: 552.68 }, { name: "岩手",  km: 649.22 },
    { name: "青森",  km: 743.93 }, { name: "北海道", km: 2747.7 }, { name: "秋田",  km: 265.75 },
    { name: "山形",  km: 97.63 },  { name: "新潟",  km: 300.56 }, { name: "富山",  km: 114.79 },
    { name: "石川",  km: 493.61 }, { name: "福井",  km: 403.09 }, { name: "京都",  km: 302.29 },
    { name: "兵庫1", km: 110.33 }, { name: "鳥取",  km: 149.64 }, { name: "島根",  km: 422.19 },
    { name: "山口",  km: 762.01 }, { name: "福岡1", km: 461.4 },  { name: "佐賀1", km: 175.7 },
    { name: "長崎",  km: 1047.51 },{ name: "佐賀2", km: 117.14 }, { name: "福岡2", km: 41.95 },
    { name: "熊本",  km: 276.01 }, { name: "鹿児島", km: 796.7 }, { name: "宮崎",  km: 379.81 },
    { name: "大分",  km: 603.62 }, { name: "広島",  km: 326.27 }, { name: "愛媛",  km: 932.77 },
    { name: "高知",  km: 647.14 }, { name: "徳島",  km: 246.24 }, { name: "香川",  km: 301.03 },
    { name: "岡山",  km: 304.76 }, { name: "兵庫2", km: 308.95 }, { name: "大阪",  km: 160.26 },
    { name: "和歌山", km: 506.17 },{ name: "三重",  km: 948.05 }, { name: "愛知",  km: 508.82 },
    { name: "静岡",  km: 524.19 }, { name: "神奈川", km: 347.4 },
  ],
};

const TOTAL_DISTANCE_KM = ROUTE_DATA.prefectures.reduce((sum, pref) => sum + pref.km, 0);

// --- ユーティリティ ---
function findNearbyStations(prefName, remaining) {
  const prefIndex = ROUTE_DATA.prefectures.findIndex(p => p.name === prefName);
  if (prefIndex < 0) return { prev: null, next: null };

  const stationsInPref = ROUTE_DATA.stations.filter(s => s.prefIndex === prefIndex);
  let prev = null;
  let next = null;

  for (const station of stationsInPref) {
    if (station.km >= remaining) prev = station;
    else if (!next) next = station;
  }
  return { prev, next };
}

function isValidGasUrl(url) {
  return typeof url === "string" && url.startsWith(GAS_URL_PREFIX);
}

function formatDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatNumber(n) {
  return n.toLocaleString();
}

// --- カスタムフック：歩行統計 ---
function useWalkingStats(walkState) {
  return useMemo(() => {
    if (!walkState) return null;

    const elapsedDays = Math.max(
      1,
      Math.round((Date.now() - new Date(walkState.startDate).getTime()) / MS_PER_DAY)
    );

    const dailyDistanceKm = walkState.totalDist / elapsedDays;
    const dailySteps = Math.round((walkState.totalSteps * STEPS_UNIT) / elapsedDays);

    // 歩幅 (cm)。totalSteps が 0 のときはデフォルト値を使用
    const strideCm =
      walkState.totalSteps > 0
        ? (walkState.totalDist / (walkState.totalSteps * STEPS_UNIT)) * 100_000
        : DEFAULT_STRIDE_CM;

    const remainingTotalKm = TOTAL_DISTANCE_KM - walkState.totalDist;
    const daysToFinish = Math.round(remainingTotalKm / dailyDistanceKm);
    const estimatedFinishDate = new Date(Date.now() + daysToFinish * MS_PER_DAY);

    const daysToNextPref = Math.round(walkState.remaining / dailyDistanceKm);
    const nextPrefDate = new Date(Date.now() + daysToNextPref * MS_PER_DAY);

    // 次の県境までの残り歩数（歩幅が 0 の場合は Infinity 回避）
    const stepsToNextPref =
      strideCm > 0
        ? Math.round((walkState.remaining * 100_000) / strideCm)
        : null;

    const { prev, next } = findNearbyStations(walkState.prefName, walkState.remaining);

    return {
      elapsedDays,
      dailyDistanceKm,
      dailySteps,
      strideCm,
      remainingTotalKm,
      daysToFinish,
      estimatedFinishDate,
      daysToNextPref,
      nextPrefDate,
      stepsToNextPref,
      nearestStation: prev,
      nextStation: next,
    };
  }, [walkState]);
}

// --- メインアプリ ---
export default function App() {
  const [tab, setTab] = useState("home");
  const [walkState, setWalkState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result?.value) setWalkState(JSON.parse(result.value));
      } catch (e) {
        console.error("データ読み込み失敗:", e);
      }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (newState) => {
    setWalkState(newState);
    setSyncing(true);
    setSaveError(null);

    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error("ストレージ保存失敗:", e);
      setSaveError("データの保存に失敗しました。もう一度お試しください。");
      setSyncing(false);
      return;
    }

    if (newState.gasUrl) {
      if (!isValidGasUrl(newState.gasUrl)) {
        setSaveError("GAS URL は https://script.google.com/ から始まる必要があります。");
        setSyncing(false);
        return;
      }
      try {
        await fetch(newState.gasUrl, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify({
            totalDist:        newState.totalDist,
            totalSteps:       newState.totalSteps,
            isStepsEstimated: newState.isStepsEstimated ?? false,
          }),
        });
      } catch (e) {
        console.warn("GAS 同期失敗 (ネットワーク):", e);
        setSaveError("クラウド同期に失敗しました。ローカル保存は完了しています。");
      }
    }

    setSyncing(false);
  }, []);

  // 累計距離から概算歩数を計算（途中スタート・記録なし期間の歩数は実測ではない）
  const estimateStepsFromDist = (distKm) =>
    distKm > 0 ? (distKm * 100_000) / DEFAULT_STRIDE_CM / STEPS_UNIT : 0;

  const handleInit = (mode, data) => {
    const base = {
      startDate: new Date().toISOString().split("T")[0],
      totalSteps: 0,
      totalDist: 0,
      prefName: "東京",
      remaining: 56.7,
      gasUrl: "",
      isStepsEstimated: false,
    };
    if (mode === "new") {
      save(base);
    } else if (mode === "continue") {
      save({ ...base, startDate: data.startDate, prefName: data.prefName, remaining: data.remaining });
    } else if (mode === "legacy") {
      const totalDist = parseFloat(data.totalDist) || 0;
      save({
        ...base,
        ...data,
        totalDist,
        totalSteps: estimateStepsFromDist(totalDist),
        isStepsEstimated: true,
      });
    }
  };

  const stats = useWalkingStats(walkState);

  if (!loaded) return <div style={styles.loading}>🗾 読み込み中...</div>;
  if (!walkState) return <Wizard onInit={handleInit} />;

  const NAV_ITEMS = [
    { id: "home",     icon: "🏠", label: "ホーム" },
    { id: "progress", icon: "📊", label: "進捗" },
    { id: "stations", icon: "🏯", label: "宿場" },
    { id: "settings", icon: "⚙️", label: "設定" },
  ];

  return (
    <div style={styles.shell}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#E8E2D8;font-family:"Zen Maru Gothic",sans-serif}`}</style>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {tab === "home"     && <Home     stats={stats} walkState={walkState} onSave={save} />}
        {tab === "progress" && <Progress walkState={walkState} />}
        {tab === "stations" && <Stations walkState={walkState} />}
        {tab === "settings" && <Settings walkState={walkState} onSave={save} syncing={syncing} saveError={saveError} template={TEMPLATE_URL} />}
      </div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{ ...styles.navBtn, opacity: tab === item.id ? 1 : 0.4 }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 9, color: "#fff" }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// --- ウィザード ---
function Wizard({ onInit }) {
  const [mode, setMode] = useState("select");
  const [data, setData] = useState({
    prefName: "岩手",
    remaining: 500,
    totalSteps: 100,
    totalDist: 500,
    startDate: new Date().toISOString().split("T")[0],
  });

  const buttonStyle = {
    width: "100%", padding: 16, borderRadius: 12, border: "1px solid #D5CFC7",
    background: "#fff", color: "#2B3A52", fontSize: 15, fontWeight: 700,
    marginBottom: 10, cursor: "pointer", textAlign: "left",
  };

  return (
    <div style={{ padding: 24, background: "#F7F4EF", minHeight: "100vh" }}>
      <h2 style={{ fontSize: 20, color: "#2B3A52", marginBottom: 20 }}>🧭 令和の伊能忠敬へようこそ</h2>
      {mode === "select" && (
        <>
          <button style={buttonStyle} onClick={() => onInit("new")}>🎌 品川からスタート (0から)</button>
          <button style={buttonStyle} onClick={() => setMode("continue")}>🚶 途中から合流 (現在地を入力)</button>
          <button style={buttonStyle} onClick={() => setMode("legacy")}>📝 記録を持ち込む (累計を入力)</button>
        </>
      )}
      {mode === "continue" && (
        <div style={styles.card}>
          <p style={styles.label}>歩き始めた日</p>
          <input type="date" value={data.startDate} onChange={e => setData({ ...data, startDate: e.target.value })} style={styles.input} />
          <p style={styles.label}>現在の都道府県</p>
          <select value={data.prefName} onChange={e => setData({ ...data, prefName: e.target.value })} style={styles.input}>
            {ROUTE_DATA.prefectures.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <p style={styles.label}>次の県境まで (km)</p>
          <input type="number" value={data.remaining} onChange={e => setData({ ...data, remaining: parseFloat(e.target.value) })} style={styles.input} />
          <button onClick={() => onInit("continue", data)} style={{ ...styles.button, marginTop: 20 }}>旅を再開する</button>
        </div>
      )}
      {mode === "legacy" && (
        <div style={styles.card}>
          <p style={styles.label}>歩き始めた日</p>
          <input type="date" value={data.startDate} onChange={e => setData({ ...data, startDate: e.target.value })} style={styles.input} />
          <p style={styles.label}>累計距離 (km)</p>
          <input type="number" value={data.totalDist} onChange={e => setData({ ...data, totalDist: parseFloat(e.target.value) })} style={styles.input} />
          <p style={styles.label}>現在の都道府県</p>
          <select value={data.prefName} onChange={e => setData({ ...data, prefName: e.target.value })} style={styles.input}>
            {ROUTE_DATA.prefectures.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <p style={styles.label}>次の県境まで (km)</p>
          <input type="number" value={data.remaining} onChange={e => setData({ ...data, remaining: parseFloat(e.target.value) })} style={styles.input} />
          <button onClick={() => onInit("legacy", data)} style={{ ...styles.button, marginTop: 20 }}>データを反映して開始</button>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義 ---
const styles = {
  shell:   { maxWidth: 430, margin: "0 auto", background: "#F7F4EF", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: 18, color: "#5B4A3F" },
  nav:     { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#2B3A52", display: "flex", justifyContent: "space-around", padding: "10px 0 25px", zIndex: 100 },
  navBtn:  { background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" },
  card:    { background: "#fff", borderRadius: 12, border: "1px solid #E5DFD6", padding: 14, margin: "0 14px 10px" },
  label:   { fontSize: 11, color: "#8B7E74", fontWeight: 700, marginBottom: 4 },
  value:   { fontWeight: 700, color: "#2B3A52" },
  input:   { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #D5CFC7", fontSize: 14, fontWeight: 700, background: "#FAFCFF", marginBottom: 10, fontFamily: '"Zen Maru Gothic"' },
  button:  { width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#2B3A52", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  errorMsg:{ color: "#C0392B", fontSize: 12, marginBottom: 8, padding: "8px 10px", background: "#FDECEA", borderRadius: 6 },
};

// --- 共通コンポーネント ---
function StatCard({ label, value, unit, estimated = false }) {
  return (
    <div style={{ ...styles.card, margin: 0, padding: "10px 8px", textAlign: "center" }}>
      <div style={styles.label}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 3 }}>
        <span style={{ ...styles.value, fontSize: 22 }}>{value}</span>
        <span style={{ ...styles.label, fontSize: 10 }}>{unit}</span>
      </div>
      {estimated && <div style={{ fontSize: 9, color: "#B0A090", marginTop: 2 }}>※概算</div>}
    </div>
  );
}

// AI 情報パネルのキーと表示名
const AI_PANELS = [
  { key: "geminiNote",  name: "Gemini",  color: "#4285F4", background: "#EDF2FC" },
  { key: "chatgptNote", name: "ChatGPT", color: "#10A37F", background: "#E9F7F2" },
  { key: "claudeNote",  name: "Claude",  color: "#D97706", background: "#FDF6E8" },
];

function StationCard({ station }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 12, color: "#8B7E74", marginBottom: 4 }}>{station.address}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#2B3A52", marginBottom: 10 }}>{station.name}</div>
      {AI_PANELS.map(panel => (
        <div key={panel.key} style={{ background: panel.background, borderRadius: 8, padding: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: panel.color }}>{panel.name}</div>
          <div style={{ fontSize: 12, color: "#333" }}>{station[panel.key]}</div>
        </div>
      ))}
    </div>
  );
}

// --- 画面コンポーネント ---
function Home({ stats, walkState, onSave }) {
  if (!stats) return null;
  return (
    <div style={{ padding: "10px 0" }}>
      <QuickRecord walkState={walkState} onSave={onSave} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 14px 10px" }}>
        <StatCard label="1日平均距離" value={stats.dailyDistanceKm.toFixed(1)} unit="km/日" />
        <StatCard label="1日平均歩数" value={formatNumber(stats.dailySteps)} unit="歩/日" estimated={walkState.isStepsEstimated} />
        <StatCard label="歩幅" value={stats.strideCm.toFixed(1)} unit="cm" estimated={walkState.isStepsEstimated} />
        <StatCard label="完歩まであと" value={formatNumber(stats.daysToFinish)} unit="日" />
      </div>
      <div style={{ ...styles.card, background: "#FCCBB0", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#7A3B1E" }}>🎌 完歩予測日</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#4A2010" }}>{formatDate(stats.estimatedFinishDate)}</div>
        <div style={{ fontSize: 12, color: "#7A5030" }}>{(stats.daysToFinish / 365.25).toFixed(1)} 年後</div>
      </div>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #EEE", paddingBottom: 5, marginBottom: 5 }}>
          <span style={styles.label}>現在地</span>
          <span style={{ ...styles.value, color: "#27AE60" }}>{walkState.prefName}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={styles.label}>次まで</span>
          <span style={styles.value}>{formatNumber(walkState.remaining)} km</span>
        </div>
      </div>
      {stats.nearestStation && <StationCard station={stats.nearestStation} />}
    </div>
  );
}

function QuickRecord({ walkState, onSave }) {
  const [addSteps,   setAddSteps]   = useState("");
  const [routeDist,  setRouteDist]  = useState("");
  const [crossed,    setCrossed]    = useState(false);
  const [prefName,   setPrefName]   = useState(walkState.prefName);
  const [remaining,  setRemaining]  = useState("");
  const [saved,      setSaved]      = useState(false);

  const canSave = addSteps !== "" || routeDist !== "";

  const handleSave = () => {
    if (!canSave) return;
    const stepsToAdd = parseFloat(addSteps) || 0;
    const routeDistToAdd = parseFloat(routeDist) || 0;
    const newState = {
      ...walkState,
      // 歩数：歩幅・平均ペース計算用
      totalSteps: walkState.totalSteps + stepsToAdd / STEPS_UNIT,
      // ルート距離：残り距離カウントダウン＆累計用
      totalDist:  walkState.totalDist  + routeDistToAdd,
      remaining:  Math.max(0, walkState.remaining - routeDistToAdd),
      // 実測歩数が入力されたら概算フラグを解除
      ...(stepsToAdd > 0 && { isStepsEstimated: false }),
      ...(crossed && {
        prefName,
        remaining: parseFloat(remaining) || walkState.remaining,
      }),
    };
    onSave(newState);
    setAddSteps("");
    setRouteDist("");
    setCrossed(false);
    setRemaining("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ ...styles.card, background: "#F0F7F0", marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#2B3A52", marginBottom: 10 }}>📝 記録する</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div>
          <p style={styles.label}>今日の歩数 (歩)</p>
          <input
            type="number"
            placeholder="例: 8432"
            value={addSteps}
            onChange={e => setAddSteps(e.target.value)}
            style={{ ...styles.input, marginBottom: 0 }}
          />
        </div>
        <div>
          <p style={styles.label}>今日のルート距離 (km)</p>
          <input
            type="number"
            placeholder="例: 8.5"
            value={routeDist}
            onChange={e => setRouteDist(e.target.value)}
            style={{ ...styles.input, marginBottom: 0 }}
          />
        </div>
      </div>
      <p style={{ fontSize: 10, color: "#8B7E74", marginBottom: 10 }}>
        歩数は歩幅・ペース計算用　／　ルート距離は県境カウントダウン用
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: crossed ? 10 : 0, cursor: "pointer", fontSize: 13, color: "#2B3A52" }}>
        <input
          type="checkbox"
          checked={crossed}
          onChange={e => setCrossed(e.target.checked)}
        />
        県をまたいだ
      </label>

      {crossed && (
        <div style={{ marginTop: 8 }}>
          <p style={styles.label}>新しい都道府県</p>
          <select
            value={prefName}
            onChange={e => setPrefName(e.target.value)}
            style={styles.input}
          >
            {ROUTE_DATA.prefectures.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          <p style={styles.label}>次の県境まで (km)</p>
          <input
            type="number"
            placeholder="例: 150"
            value={remaining}
            onChange={e => setRemaining(e.target.value)}
            style={{ ...styles.input, marginBottom: 0 }}
          />
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{
          ...styles.button,
          marginTop: 12,
          background: saved ? "#27AE60" : canSave ? "#2B3A52" : "#B0B0B0",
          transition: "background 0.3s",
        }}
      >
        {saved ? "✅ 記録しました！" : "💾 記録して同期"}
      </button>
    </div>
  );
}

function Progress({ walkState }) {
  const currentPrefIndex = ROUTE_DATA.prefectures.findIndex(p => p.name === walkState.prefName);

  return (
    <div style={{ padding: 14 }}>
      <h3 style={{ marginBottom: 10 }}>🗾 都道府県進捗</h3>
      {ROUTE_DATA.prefectures.map((pref, index) => {
        const isDone    = index < currentPrefIndex;
        const isCurrent = index === currentPrefIndex;
        return (
          <div
            key={index}
            style={{
              ...styles.card,
              margin: "0 0 6px",
              opacity: !isDone && !isCurrent ? 0.5 : 1,
              borderLeft: `4px solid ${isDone ? "#27AE60" : isCurrent ? "#FF8C00" : "#DDD"}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{pref.name}</span>
              <span>{pref.km} km</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stations({ walkState }) {
  const currentPrefIndex = ROUTE_DATA.prefectures.findIndex(p => p.name === walkState.prefName);

  return (
    <div style={{ padding: 14 }}>
      <h3>🏯 宿場一覧</h3>
      {ROUTE_DATA.stations.map((station, index) => {
        const passed =
          station.prefIndex < currentPrefIndex ||
          (station.prefIndex === currentPrefIndex && station.km >= walkState.remaining);
        return (
          <div key={index} style={{ ...styles.card, margin: "0 0 6px", opacity: passed ? 1 : 0.5 }}>
            {passed ? "✅" : "⬜"} {station.name} ({ROUTE_DATA.prefectures[station.prefIndex]?.name})
          </div>
        );
      })}
    </div>
  );
}

function Settings({ walkState, onSave, syncing, saveError, template }) {
  const [localState, setLocalState] = useState({ ...walkState });

  return (
    <div style={{ padding: 14 }}>
      <h3>⚙️ 設定</h3>
      <div style={styles.card}>
        {saveError && <div style={styles.errorMsg}>{saveError}</div>}
        <p style={styles.label}>開始日</p>
        <input type="date" value={localState.startDate} onChange={e => setLocalState({ ...localState, startDate: e.target.value })} style={styles.input} />
        <p style={styles.label}>累計距離 (km)</p>
        <input type="number" value={localState.totalDist} onChange={e => setLocalState({ ...localState, totalDist: parseFloat(e.target.value) })} style={styles.input} />
        <p style={styles.label}>現在の都道府県</p>
        <select value={localState.prefName} onChange={e => setLocalState({ ...localState, prefName: e.target.value })} style={styles.input}>
          {ROUTE_DATA.prefectures.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <p style={styles.label}>次の県境まで (km)</p>
        <input type="number" value={localState.remaining} onChange={e => setLocalState({ ...localState, remaining: parseFloat(e.target.value) })} style={styles.input} />
        <p style={styles.label}>自分専用 GAS URL (同期用)</p>
        <input value={localState.gasUrl} onChange={e => setLocalState({ ...localState, gasUrl: e.target.value })} placeholder="https://script.google.com/..." style={styles.input} />
        <button onClick={() => onSave(localState)} style={styles.button}>
          {syncing ? "🛰️ 同期中..." : "💾 保存して同期"}
        </button>
      </div>
      <div style={{ ...styles.card, background: "#F0F7FF" }}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>🎁 配布セット</p>
        <a href={template} target="_blank" style={{ fontSize: 11, color: "#4285F4" }}>
          1. スプレッドシートのコピーを作成
        </a>
      </div>
    </div>
  );
}
