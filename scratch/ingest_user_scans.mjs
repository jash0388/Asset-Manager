import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync("/Users/jashwanthsingh/.gemini/antigravity-ide/scratch/student-and-parents-portal/.env", "utf8");
let url = "", key = "";
envFile.split("\n").forEach(line => {
  if (line.startsWith("SUPABASE_URL=")) url = line.split("=")[1].trim();
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) key = line.split("=")[1].trim();
});

const supabase = createClient(url, key);

const rawScans = [
  {
    "clientScanId": "1785987720824-69zki9",
    "uniqueId": "25N81A6784",
    "scannedAt": "2026-08-06T03:42:00.824Z",
    "attempts": 729,
    "hash": "bf3a8fca5dcaf4fb3794ddedf6779305737fcbbd15000b5cf9e143395637f18e",
    "prevHash": "GENESIS_HASH_00000000000000000000000000000000000000000000000000000000",
    "seqNo": 1171,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987723002-pkm6i5",
    "uniqueId": "25N81A6785",
    "scannedAt": "2026-08-06T03:42:03.002Z",
    "attempts": 729,
    "hash": "2c859f9a09c3abc3bcaef51b8caefe9e6186bfbf43060d52e9a59eab0b9b8b1b",
    "prevHash": "bf3a8fca5dcaf4fb3794ddedf6779305737fcbbd15000b5cf9e143395637f18e",
    "seqNo": 1172,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987726765-o9cvdm",
    "uniqueId": "25N81A6794",
    "scannedAt": "2026-08-06T03:42:06.765Z",
    "attempts": 729,
    "hash": "8306955be899feee47776498878c3bcd68aa1499569e901dd3a65fadb70fbb5b",
    "prevHash": "2c859f9a09c3abc3bcaef51b8caefe9e6186bfbf43060d52e9a59eab0b9b8b1b",
    "seqNo": 1173,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987728518-i2mc9z",
    "uniqueId": "25N81A6793",
    "scannedAt": "2026-08-06T03:42:08.518Z",
    "attempts": 729,
    "hash": "66f07278432ffc1e7ba1473bb4bfb9787c711b259ef90eb7d1137dc7490ce47f",
    "prevHash": "8306955be899feee47776498878c3bcd68aa1499569e901dd3a65fadb70fbb5b",
    "seqNo": 1174,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987731420-2thv5n",
    "uniqueId": "25N81A67A1",
    "scannedAt": "2026-08-06T03:42:11.420Z",
    "attempts": 729,
    "hash": "22a0d5895e3c646245649107de155bb154c26969cc756b54e9b7dec7ee65604e",
    "prevHash": "66f07278432ffc1e7ba1473bb4bfb9787c711b259ef90eb7d1137dc7490ce47f",
    "seqNo": 1175,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987733514-td3muo",
    "uniqueId": "25N81A67A6",
    "scannedAt": "2026-08-06T03:42:13.514Z",
    "attempts": 729,
    "hash": "fc2f2386e4fa40e4fd488d229508ee03ecebf92e1355c12e9f897f9cfc1d63e4",
    "prevHash": "22a0d5895e3c646245649107de155bb154c26969cc756b54e9b7dec7ee65604e",
    "seqNo": 1176,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987735681-qts9zp",
    "uniqueId": "25N81A6781",
    "scannedAt": "2026-08-06T03:42:15.681Z",
    "attempts": 729,
    "hash": "215395f2a388889f1dd69b291ded1147d0d601749c8e661ea3869865d9ff7509",
    "prevHash": "fc2f2386e4fa40e4fd488d229508ee03ecebf92e1355c12e9f897f9cfc1d63e4",
    "seqNo": 1177,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987737094-oe4bm2",
    "uniqueId": "25N81A6795",
    "scannedAt": "2026-08-06T03:42:17.094Z",
    "attempts": 729,
    "hash": "52e08a1bcf97f18519e3f32bccaab603dabf4bdf51ad6fad2d13edd0195ae776",
    "prevHash": "215395f2a388889f1dd69b291ded1147d0d601749c8e661ea3869865d9ff7509",
    "seqNo": 1178,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987740422-gh533e",
    "uniqueId": "25N81A6783",
    "scannedAt": "2026-08-06T03:42:20.422Z",
    "attempts": 729,
    "hash": "1ded91e0bcbb7a4886f7bd7939a0810063495da050ba9e2b58a4dbc12b55a4c3",
    "prevHash": "52e08a1bcf97f18519e3f32bccaab603dabf4bdf51ad6fad2d13edd0195ae776",
    "seqNo": 1179,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987742462-bm9d41",
    "uniqueId": "25N81A67A5",
    "scannedAt": "2026-08-06T03:42:22.462Z",
    "attempts": 729,
    "hash": "0d04d87059433f805ef1466c05ad9627b08a9af354e994581cfb51a56a0801ef",
    "prevHash": "1ded91e0bcbb7a4886f7bd7939a0810063495da050ba9e2b58a4dbc12b55a4c3",
    "seqNo": 1180,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987744767-o7bxq0",
    "uniqueId": "25N81A67A8",
    "scannedAt": "2026-08-06T03:42:24.767Z",
    "attempts": 728,
    "hash": "1660d5f9f2bb9671b0ed017d9588730573ef552002387fb31975c17390fe432f",
    "prevHash": "0d04d87059433f805ef1466c05ad9627b08a9af354e994581cfb51a56a0801ef",
    "seqNo": 1181,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987748743-fm2z3i",
    "uniqueId": "25N81A6780",
    "scannedAt": "2026-08-06T03:42:28.743Z",
    "attempts": 727,
    "hash": "355b2cd79ff94e4c0114841e949ec6ac575b1d75294224bb277a46fea1f2c68a",
    "prevHash": "1660d5f9f2bb9671b0ed017d9588730573ef552002387fb31975c17390fe432f",
    "seqNo": 1182,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987751954-n0tku7",
    "uniqueId": "25N81A6788",
    "scannedAt": "2026-08-06T03:42:31.954Z",
    "attempts": 726,
    "hash": "28edba02d0d3ca478d75364db0d407567d1ac83f87053c110ed63d8c965b7ea3",
    "prevHash": "355b2cd79ff94e4c0114841e949ec6ac575b1d75294224bb277a46fea1f2c68a",
    "seqNo": 1183,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987756277-6ypb96",
    "uniqueId": "25N81A6786",
    "scannedAt": "2026-08-06T03:42:36.277Z",
    "attempts": 724,
    "hash": "1b1aeb4908f8fa54214241292220967c432d1d84a8024713c2e25f61a835607f",
    "prevHash": "28edba02d0d3ca478d75364db0d407567d1ac83f87053c110ed63d8c965b7ea3",
    "seqNo": 1185,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987759079-wcfzte",
    "uniqueId": "25N81A67A3",
    "scannedAt": "2026-08-06T03:42:39.079Z",
    "attempts": 723,
    "hash": "51a2a5a10858d5ca724e492d59f47ea791f57626670cf5903f3bd4dff2eb1507",
    "prevHash": "1b1aeb4908f8fa54214241292220967c432d1d84a8024713c2e25f61a835607f",
    "seqNo": 1186,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987764971-h8vl9x",
    "uniqueId": "25N81A6792",
    "scannedAt": "2026-08-06T03:42:44.971Z",
    "attempts": 721,
    "hash": "dc9b434f3dc879c5c8c7e339e8836c91fd356f5a8ec88fddcad2fc3f1e2a6c3e",
    "prevHash": "51a2a5a10858d5ca724e492d59f47ea791f57626670cf5903f3bd4dff2eb1507",
    "seqNo": 1187,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987769581-ihjjtl",
    "uniqueId": "25N81A67A0",
    "scannedAt": "2026-08-06T03:42:49.581Z",
    "attempts": 719,
    "hash": "725af43eae4a86bc686ff8abfee05bae44f6c45de711407b7b1238f3f3a875d8",
    "prevHash": "dc9b434f3dc879c5c8c7e339e8836c91fd356f5a8ec88fddcad2fc3f1e2a6c3e",
    "seqNo": 1188,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987770836-qarc19",
    "uniqueId": "25N81A6799",
    "scannedAt": "2026-08-06T03:42:50.836Z",
    "attempts": 718,
    "hash": "f01dbe18c374ba79f84e14dea2ec3759c49a1661c9c4c08ecc0bb4d1125ac45c",
    "prevHash": "725af43eae4a86bc686ff8abfee05bae44f6c45de711407b7b1238f3f3a875d8",
    "seqNo": 1189,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987773572-t1h0q1",
    "uniqueId": "25N81A6798",
    "scannedAt": "2026-08-06T03:42:53.572Z",
    "attempts": 716,
    "hash": "f1cbf90429a2278fd455b69818c2fe831cdc751d3b98e53683950c452f6d98f2",
    "prevHash": "f01dbe18c374ba79f84e14dea2ec3759c49a1661c9c4c08ecc0bb4d1125ac45c",
    "seqNo": 1190,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987778042-pg4cr4",
    "uniqueId": "25N81A67A2",
    "scannedAt": "2026-08-06T03:42:58.042Z",
    "attempts": 715,
    "hash": "c3bc160efd45258e47d12b4c431f4f40a18effed573c390c37cf696cc57570e6",
    "prevHash": "f1cbf90429a2278fd455b69818c2fe831cdc751d3b98e53683950c452f6d98f2",
    "seqNo": 1191,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987782475-t7ihnb",
    "uniqueId": "25N81A6787",
    "scannedAt": "2026-08-06T03:43:02.475Z",
    "attempts": 714,
    "hash": "688b54a56fba262a5381c513f030f35e142f4b7843ece963ce16000084c8b0ef",
    "prevHash": "c3bc160efd45258e47d12b4c431f4f40a18effed573c390c37cf696cc57570e6",
    "seqNo": 1192,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987784011-62nnva",
    "uniqueId": "25N81A6782",
    "scannedAt": "2026-08-06T03:43:04.011Z",
    "attempts": 714,
    "hash": "f78dc5d8a509db73e3affd41f388be43b99cbde07fdf3e0e81483c4289df872b",
    "prevHash": "688b54a56fba262a5381c513f030f35e142f4b7843ece963ce16000084c8b0ef",
    "seqNo": 1193,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987788809-kjfo6d",
    "uniqueId": "25N81A6769",
    "scannedAt": "2026-08-06T03:43:08.809Z",
    "attempts": 714,
    "hash": "a12cfb869cfac5a8cc710f0665dc3d025aba6cfb8365e3e96262899465c65a48",
    "prevHash": "f78dc5d8a509db73e3affd41f388be43b99cbde07fdf3e0e81483c4289df872b",
    "seqNo": 1194,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987791911-t2fknv",
    "uniqueId": "25N81A6761",
    "scannedAt": "2026-08-06T03:43:11.911Z",
    "attempts": 714,
    "hash": "40a05a9daf9e1ce3ff3766eb74fa20a6f393d1bc78bbdf59d2adc818298b0147",
    "prevHash": "a12cfb869cfac5a8cc710f0665dc3d025aba6cfb8365e3e96262899465c65a48",
    "seqNo": 1195,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987824261-fpbu6s",
    "uniqueId": "25N81A67B2",
    "scannedAt": "2026-08-06T03:43:44.261Z",
    "attempts": 711,
    "hash": "dc0e58792ed6fcd367eb90affdbc8c3d04a19c735cc89813457851d935050e60",
    "prevHash": "40a05a9daf9e1ce3ff3766eb74fa20a6f393d1bc78bbdf59d2adc818298b0147",
    "seqNo": 1210,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987826376-547t8a",
    "uniqueId": "25N81A6770",
    "scannedAt": "2026-08-06T03:43:46.376Z",
    "attempts": 710,
    "hash": "88db39a3e5c7322508848477b72337ab235cb3fff02a7c8f555a39ac94395304",
    "prevHash": "dc0e58792ed6fcd367eb90affdbc8c3d04a19c735cc89813457851d935050e60",
    "seqNo": 1211,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987850816-skxvqm",
    "uniqueId": "25N81A6796",
    "scannedAt": "2026-08-06T03:44:10.816Z",
    "attempts": 708,
    "hash": "829e01b29f2f39fd109b176fda3e893e1cab6b804a5e2eecabee85b588f7cc60",
    "prevHash": "88db39a3e5c7322508848477b72337ab235cb3fff02a7c8f555a39ac94395304",
    "seqNo": 1213,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987870340-h2ngan",
    "uniqueId": "25N81A67F6",
    "scannedAt": "2026-08-06T03:44:30.340Z",
    "attempts": 704,
    "hash": "ce1d6aa746acec53ee1a520ef7cd8b2887f133a246c37b94b4b69560664dd203",
    "prevHash": "829e01b29f2f39fd109b176fda3e893e1cab6b804a5e2eecabee85b588f7cc60",
    "seqNo": 1214,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987871555-4e6fjf",
    "uniqueId": "25N81A67F2",
    "scannedAt": "2026-08-06T03:44:31.555Z",
    "attempts": 704,
    "hash": "cfe141179b55bc6dc9dc18ebcc7a9e71cba85368e52396416cf1146e3b931c9b",
    "prevHash": "ce1d6aa746acec53ee1a520ef7cd8b2887f133a246c37b94b4b69560664dd203",
    "seqNo": 1215,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987872861-k5cbm5",
    "uniqueId": "25N81A67F8",
    "scannedAt": "2026-08-06T03:44:32.861Z",
    "attempts": 704,
    "hash": "c32a044bb9d297e615ec4edc3ef93e9c042acd2223129d63fa4ff633c6c182cb",
    "prevHash": "cfe141179b55bc6dc9dc18ebcc7a9e71cba85368e52396416cf1146e3b931c9b",
    "seqNo": 1216,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987874816-qfbl0j",
    "uniqueId": "25N81A67F0",
    "scannedAt": "2026-08-06T03:44:34.816Z",
    "attempts": 704,
    "hash": "85876e73430ff5685c9a33ddc1fb1b9a6e46bd530c05a784d5ba1399c16bf106",
    "prevHash": "c32a044bb9d297e615ec4edc3ef93e9c042acd2223129d63fa4ff633c6c182cb",
    "seqNo": 1217,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987876127-1ar1w1",
    "uniqueId": "25N81A67F3",
    "scannedAt": "2026-08-06T03:44:36.127Z",
    "attempts": 704,
    "hash": "bd106de1dc0aedcb4c4117ba7ba3e8bd8a1a01b90df26b2586f725f8dbdeaf3b",
    "prevHash": "85876e73430ff5685c9a33ddc1fb1b9a6e46bd530c05a784d5ba1399c16bf106",
    "seqNo": 1218,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987878528-sxwki2",
    "uniqueId": "25N81A67E9",
    "scannedAt": "2026-08-06T03:44:38.528Z",
    "attempts": 704,
    "hash": "74d605e0494c9569ff24309b0bb7f302e2e592e7d196fbc4f10ca7168a458df6",
    "prevHash": "bd106de1dc0aedcb4c4117ba7ba3e8bd8a1a01b90df26b2586f725f8dbdeaf3b",
    "seqNo": 1219,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987879835-wy6wjj",
    "uniqueId": "25N81A67D9",
    "scannedAt": "2026-08-06T03:44:39.835Z",
    "attempts": 704,
    "hash": "39352b0e3646f686e68383727b74d36123f46d8632fec25e42ffb5a11d8dd9cf",
    "prevHash": "74d605e0494c9569ff24309b0bb7f302e2e592e7d196fbc4f10ca7168a458df6",
    "seqNo": 1220,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987891971-6d4bxo",
    "uniqueId": "25N81A67E6",
    "scannedAt": "2026-08-06T03:44:51.971Z",
    "attempts": 703,
    "hash": "401ec060ce8e4d49ad056da17e99e301dc6ab06061c623f1e1e1596e78b958f9",
    "prevHash": "39352b0e3646f686e68383727b74d36123f46d8632fec25e42ffb5a11d8dd9cf",
    "seqNo": 1226,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987896066-8j86g0",
    "uniqueId": "25N81A67E3",
    "scannedAt": "2026-08-06T03:44:56.066Z",
    "attempts": 702,
    "hash": "c326a73075ee4416ecef51cf0a4f0b606b5c8a8b3a2b381b055ab27f4ded0f69",
    "prevHash": "401ec060ce8e4d49ad056da17e99e301dc6ab06061c623f1e1e1596e78b958f9",
    "seqNo": 1227,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987899648-c0b52u",
    "uniqueId": "25N81A67F1",
    "scannedAt": "2026-08-06T03:44:59.648Z",
    "attempts": 700,
    "hash": "89985adc229919ab7ce9c41928e06bd80e3121d8da1d3011370c1b3131d7ac22",
    "prevHash": "c326a73075ee4416ecef51cf0a4f0b606b5c8a8b3a2b381b055ab27f4ded0f69",
    "seqNo": 1230,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987902823-wa0in5",
    "uniqueId": "25N81A67E7",
    "scannedAt": "2026-08-06T03:45:02.823Z",
    "attempts": 699,
    "hash": "5f7a15e71199980887cc8ab55a45e161ece0171c1bdb7c099185cf2e4addedcf",
    "prevHash": "89985adc229919ab7ce9c41928e06bd80e3121d8da1d3011370c1b3131d7ac22",
    "seqNo": 1231,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987904399-55unch",
    "uniqueId": "25N81A67F7",
    "scannedAt": "2026-08-06T03:45:04.399Z",
    "attempts": 699,
    "hash": "f98d8e002331cb92e3b548f141b3bf1d4fceb97d4361a1c207579ddc4d179422",
    "prevHash": "5f7a15e71199980887cc8ab55a45e161ece0171c1bdb7c099185cf2e4addedcf",
    "seqNo": 1232,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987911796-hgphm1",
    "uniqueId": "25N81A67C5",
    "scannedAt": "2026-08-06T03:45:11.796Z",
    "attempts": 698,
    "hash": "55db57945c779adcf6bbda180207dfa7cf83787ceb42d20cb5fa940d2589be48",
    "prevHash": "f98d8e002331cb92e3b548f141b3bf1d4fceb97d4361a1c207579ddc4d179422",
    "seqNo": 1233,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987912784-cmozrz",
    "uniqueId": "25N81A67B6",
    "scannedAt": "2026-08-06T03:45:12.784Z",
    "attempts": 698,
    "hash": "d9258ff610dfbae2b76901897adadd6a26c0470c70f7185bf0c07e5ad7f64e32",
    "prevHash": "55db57945c779adcf6bbda180207dfa7cf83787ceb42d20cb5fa940d2589be48",
    "seqNo": 1234,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987914559-simbh6",
    "uniqueId": "25N81A67D2",
    "scannedAt": "2026-08-06T03:45:14.559Z",
    "attempts": 698,
    "hash": "8b1106ca279fc2ae3f1098ca1df091740fa0b7a09e524e10e60d562de26503aa",
    "prevHash": "d9258ff610dfbae2b76901897adadd6a26c0470c70f7185bf0c07e5ad7f64e32",
    "seqNo": 1235,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987916737-zup4am",
    "uniqueId": "25N81A67C6",
    "scannedAt": "2026-08-06T03:45:16.737Z",
    "attempts": 698,
    "hash": "8f95bd87c311cdad505a1cc91debc283971594684652bc731f497eff61bdcdfa",
    "prevHash": "8b1106ca279fc2ae3f1098ca1df091740fa0b7a09e524e10e60d562de26503aa",
    "seqNo": 1236,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987917673-83kfgm",
    "uniqueId": "25N81A67D6",
    "scannedAt": "2026-08-06T03:45:17.673Z",
    "attempts": 698,
    "hash": "3fb47db855882ed4a5b9120a7e9ca6b416ec944b4d77d28965c4a601e23efb71",
    "prevHash": "8f95bd87c311cdad505a1cc91debc283971594684652bc731f497eff61bdcdfa",
    "seqNo": 1237,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987920278-3st2f0",
    "uniqueId": "25N81A67D0",
    "scannedAt": "2026-08-06T03:45:20.278Z",
    "attempts": 698,
    "hash": "2633de9ced6a6ae62b3b03caff78b17b750a801ee7e5288fd7bf21031cb0a548",
    "prevHash": "3fb47db855882ed4a5b9120a7e9ca6b416ec944b4d77d28965c4a601e23efb71",
    "seqNo": 1238,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987921577-9esffg",
    "uniqueId": "25N81A67C8",
    "scannedAt": "2026-08-06T03:45:21.577Z",
    "attempts": 697,
    "hash": "14d250ab0544a0a6823f30d7ad3705b9fbc1b6f1170b74bc7a7685e38eab1040",
    "prevHash": "2633de9ced6a6ae62b3b03caff78b17b750a801ee7e5288fd7bf21031cb0a548",
    "seqNo": 1239,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987923625-6sd4bb",
    "uniqueId": "25N81A67B8",
    "scannedAt": "2026-08-06T03:45:23.625Z",
    "attempts": 695,
    "hash": "18819c710c591779b23bc0fdd8ec62710400ef4ff4dce9bb5f187ddd7d70f6b4",
    "prevHash": "14d250ab0544a0a6823f30d7ad3705b9fbc1b6f1170b74bc7a7685e38eab1040",
    "seqNo": 1240,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987924621-h7ns38",
    "uniqueId": "25N81A67C7",
    "scannedAt": "2026-08-06T03:45:24.621Z",
    "attempts": 694,
    "hash": "0adad161541dbab289c96bd0a4bd3c3b5e4b1a606f8aba1fbcd298ba1ef1af68",
    "prevHash": "18819c710c591779b23bc0fdd8ec62710400ef4ff4dce9bb5f187ddd7d70f6b4",
    "seqNo": 1241,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987926737-7t2aip",
    "uniqueId": "25N81A67B4",
    "scannedAt": "2026-08-06T03:45:26.737Z",
    "attempts": 692,
    "hash": "0b610633aac28c3cdb8de1b2089db709a2fba207264e48223f720266b90b831e",
    "prevHash": "0adad161541dbab289c96bd0a4bd3c3b5e4b1a606f8aba1fbcd298ba1ef1af68",
    "seqNo": 1242,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987929412-0hyn3z",
    "uniqueId": "25N81A67C9",
    "scannedAt": "2026-08-06T03:45:29.412Z",
    "attempts": 691,
    "hash": "85b3070f81000890399d61d0af26220fe5d592003ca8cc0d70ee9a4ade3e3fb1",
    "prevHash": "0b610633aac28c3cdb8de1b2089db709a2fba207264e48223f720266b90b831e",
    "seqNo": 1243,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987931430-0ac37p",
    "uniqueId": "25N81A67B5",
    "scannedAt": "2026-08-06T03:45:31.430Z",
    "attempts": 690,
    "hash": "edd5e654a82adb86a7480581777a9ab21ba11b8f5dd53369aeb58f1c93b4a370",
    "prevHash": "85b3070f81000890399d61d0af26220fe5d592003ca8cc0d70ee9a4ade3e3fb1",
    "seqNo": 1245,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987933023-0in2op",
    "uniqueId": "25N81A67D4",
    "scannedAt": "2026-08-06T03:45:33.023Z",
    "attempts": 689,
    "hash": "4f85bd0b67004f93a2d86c4f4afa71611cf9900acac4447226fa5e48264755d9",
    "prevHash": "edd5e654a82adb86a7480581777a9ab21ba11b8f5dd53369aeb58f1c93b4a370",
    "seqNo": 1246,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987937315-rkjtzj",
    "uniqueId": "25N81A67C2",
    "scannedAt": "2026-08-06T03:45:37.315Z",
    "attempts": 688,
    "hash": "59432a4dd25410244508e8d994ac9a6001dbe2b83020bf7bb747d944cec4ee0c",
    "prevHash": "4f85bd0b67004f93a2d86c4f4afa71611cf9900acac4447226fa5e48264755d9",
    "seqNo": 1247,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987949306-34jro2",
    "uniqueId": "25N81A67C3",
    "scannedAt": "2026-08-06T03:45:49.306Z",
    "attempts": 686,
    "hash": "a34908b84d5e7985a6d2b80003eaff2870c5f062e333fc2bc624a07cb3125246",
    "prevHash": "59432a4dd25410244508e8d994ac9a6001dbe2b83020bf7bb747d944cec4ee0c",
    "seqNo": 1253,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987971590-o8fi05",
    "uniqueId": "25N81A6753",
    "scannedAt": "2026-08-06T03:46:11.590Z",
    "attempts": 679,
    "hash": "3304363075d1b2057b263ab4ca0cde80fd1b5b12f895917abd4f501606e7a65f",
    "prevHash": "a34908b84d5e7985a6d2b80003eaff2870c5f062e333fc2bc624a07cb3125246",
    "seqNo": 1254,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987973415-2mpiku",
    "uniqueId": "25N81A6755",
    "scannedAt": "2026-08-06T03:46:13.415Z",
    "attempts": 678,
    "hash": "3838cb8ae5268e04cefc8847b1a0b3461761c02d4fc6f43bb08c8ea1272e9b3c",
    "prevHash": "3304363075d1b2057b263ab4ca0cde80fd1b5b12f895917abd4f501606e7a65f",
    "seqNo": 1255,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987976643-8jzve9",
    "uniqueId": "25N81A6751",
    "scannedAt": "2026-08-06T03:46:16.643Z",
    "attempts": 677,
    "hash": "8f01d21967bd4fe606242a064ac7f7dff509cc5ed285d4df57779d1df7a60be7",
    "prevHash": "3838cb8ae5268e04cefc8847b1a0b3461761c02d4fc6f43bb08c8ea1272e9b3c",
    "seqNo": 1256,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987979075-atatv9",
    "uniqueId": "25N81A6733",
    "scannedAt": "2026-08-06T03:46:19.075Z",
    "attempts": 676,
    "hash": "229863d47c0d7fcc5dbd7c7768e630962716e7e907536ae7daee5b56fee23dca",
    "prevHash": "8f01d21967bd4fe606242a064ac7f7dff509cc5ed285d4df57779d1df7a60be7",
    "seqNo": 1257,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987981029-gt2ub4",
    "uniqueId": "25N81A6741",
    "scannedAt": "2026-08-06T03:46:21.029Z",
    "attempts": 675,
    "hash": "48fa95fd9cfac78b418e0dcb6aeaf761bece2d3f4a810b68160aefacf4fdae97",
    "prevHash": "229863d47c0d7fcc5dbd7c7768e630962716e7e907536ae7daee5b56fee23dca",
    "seqNo": 1258,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987982921-909vv9",
    "uniqueId": "25N81A6732",
    "scannedAt": "2026-08-06T03:46:22.921Z",
    "attempts": 674,
    "hash": "c8424fe37bf23606a9cde2259bb05657594ce9c14861555542406b22950fa843",
    "prevHash": "48fa95fd9cfac78b418e0dcb6aeaf761bece2d3f4a810b68160aefacf4fdae97",
    "seqNo": 1259,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987985456-oihjkd",
    "uniqueId": "25N81A6746",
    "scannedAt": "2026-08-06T03:46:25.456Z",
    "attempts": 673,
    "hash": "d72fffc1567b91bf7ec05027a5908811645488960a3d572a8b03fb1ffbea1003",
    "prevHash": "c8424fe37bf23606a9cde2259bb05657594ce9c14861555542406b22950fa843",
    "seqNo": 1260,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987987096-oowdof",
    "uniqueId": "25N81A6727",
    "scannedAt": "2026-08-06T03:46:27.096Z",
    "attempts": 672,
    "hash": "f74c30db8daf19b4b6a91bdb30b83ad1a1df6b2359d8b752b9a5e3423dfe101e",
    "prevHash": "d72fffc1567b91bf7ec05027a5908811645488960a3d572a8b03fb1ffbea1003",
    "seqNo": 1261,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987990317-u0sr9o",
    "uniqueId": "25N81A6739",
    "scannedAt": "2026-08-06T03:46:30.317Z",
    "attempts": 670,
    "hash": "e714afc1fc3c695d4093e3d2464ba4c4cdcd6db6dd2da8bfe262f305cd61bb49",
    "prevHash": "f74c30db8daf19b4b6a91bdb30b83ad1a1df6b2359d8b752b9a5e3423dfe101e",
    "seqNo": 1262,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987991273-g4uzjx",
    "uniqueId": "25N81A6735",
    "scannedAt": "2026-08-06T03:46:31.273Z",
    "attempts": 669,
    "hash": "1649479b351fceb7549683ebe8951b8d81039728f1c23b4dc5551b93d50739bb",
    "prevHash": "e714afc1fc3c695d4093e3d2464ba4c4cdcd6db6dd2da8bfe262f305cd61bb49",
    "seqNo": 1263,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987993227-bj208u",
    "uniqueId": "25N81A6744",
    "scannedAt": "2026-08-06T03:46:33.227Z",
    "attempts": 668,
    "hash": "afb8c58a78d7138a23ec3cc962b571b18c15f2a556522c6a758ef6e2a21e29a8",
    "prevHash": "1649479b351fceb7549683ebe8951b8d81039728f1c23b4dc5551b93d50739bb",
    "seqNo": 1264,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987995158-v96fig",
    "uniqueId": "25N81A6747",
    "scannedAt": "2026-08-06T03:46:35.158Z",
    "attempts": 666,
    "hash": "59c08fcfa4d091d713b5785abd82a547533235c98d38766f65548e6868079fdc",
    "prevHash": "afb8c58a78d7138a23ec3cc962b571b18c15f2a556522c6a758ef6e2a21e29a8",
    "seqNo": 1265,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987996309-q5dein",
    "uniqueId": "25N81A6734",
    "scannedAt": "2026-08-06T03:46:36.309Z",
    "attempts": 665,
    "hash": "4c1226693fedc00fec2ab1dc6e09c4e4739be53d2715a300efcc9d70a2365e1e",
    "prevHash": "59c08fcfa4d091d713b5785abd82a547533235c98d38766f65548e6868079fdc",
    "seqNo": 1266,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987997948-f0y9gz",
    "uniqueId": "25N81A6750",
    "scannedAt": "2026-08-06T03:46:37.948Z",
    "attempts": 664,
    "hash": "878c95af80bc1d28f645e731862092362ff8062c84ded822dfb7647587c1bae3",
    "prevHash": "4c1226693fedc00fec2ab1dc6e09c4e4739be53d2715a300efcc9d70a2365e1e",
    "seqNo": 1267,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785987999106-vwgqrf",
    "uniqueId": "25N81A6730",
    "scannedAt": "2026-08-06T03:46:39.106Z",
    "attempts": 663,
    "hash": "be79b4a9cb45041b170e5559470888d8464439ad8568cf7b3d1b2ab800a6bff3",
    "prevHash": "878c95af80bc1d28f645e731862092362ff8062c84ded822dfb7647587c1bae3",
    "seqNo": 1268,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988002876-9bzcjp",
    "uniqueId": "25N81A6728",
    "scannedAt": "2026-08-06T03:46:42.876Z",
    "attempts": 661,
    "hash": "3abcd4c6fb394412725a31d4fedbd5049a59174aa27953486f1ab31ef92500b7",
    "prevHash": "be79b4a9cb45041b170e5559470888d8464439ad8568cf7b3d1b2ab800a6bff3",
    "seqNo": 1269,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988004497-ml62qw",
    "uniqueId": "25N81A6748",
    "scannedAt": "2026-08-06T03:46:44.497Z",
    "attempts": 659,
    "hash": "abd01e4ca722d4d33dac7c81c0222b023ceac719e0f266891e9af285b2847e65",
    "prevHash": "3abcd4c6fb394412725a31d4fedbd5049a59174aa27953486f1ab31ef92500b7",
    "seqNo": 1270,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988008498-7og0rp",
    "uniqueId": "25N81A6745",
    "scannedAt": "2026-08-06T03:46:48.498Z",
    "attempts": 657,
    "hash": "97e3ea55d1977cabcdf59f224026410150fb913d40c055311e4010f27dcb3f40",
    "prevHash": "abd01e4ca722d4d33dac7c81c0222b023ceac719e0f266891e9af285b2847e65",
    "seqNo": 1271,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988015774-6qa6aj",
    "uniqueId": "25N81A6725",
    "scannedAt": "2026-08-06T03:46:55.774Z",
    "attempts": 654,
    "hash": "a1749cf37f1cd78861b96b79ceed13f282125979e47e9ff2ef0ac0ea5ab842de",
    "prevHash": "97e3ea55d1977cabcdf59f224026410150fb913d40c055311e4010f27dcb3f40",
    "seqNo": 1272,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988019529-3uhnmw",
    "uniqueId": "25N81A6722",
    "scannedAt": "2026-08-06T03:46:59.529Z",
    "attempts": 652,
    "hash": "033b7a38e21499fa4efa44fdf58d6804231ae6c8ba68cb70ed85d36eb105b838",
    "prevHash": "a1749cf37f1cd78861b96b79ceed13f282125979e47e9ff2ef0ac0ea5ab842de",
    "seqNo": 1273,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988023383-pu4190",
    "uniqueId": "25N81A6724",
    "scannedAt": "2026-08-06T03:47:03.383Z",
    "attempts": 650,
    "hash": "dc2968f3650ff093c1aad0e3f3ec11b2022cefef0b8c117703a57458b5fa4060",
    "prevHash": "033b7a38e21499fa4efa44fdf58d6804231ae6c8ba68cb70ed85d36eb105b838",
    "seqNo": 1274,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988025797-5t4j3z",
    "uniqueId": "25N81A6702",
    "scannedAt": "2026-08-06T03:47:05.797Z",
    "attempts": 648,
    "hash": "68cb7f0501f173c2f656a12a571b37b47b72484b2811ce67a0a10cb3889d02b6",
    "prevHash": "dc2968f3650ff093c1aad0e3f3ec11b2022cefef0b8c117703a57458b5fa4060",
    "seqNo": 1275,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988028204-caul58",
    "uniqueId": "25N81A6701",
    "scannedAt": "2026-08-06T03:47:08.204Z",
    "attempts": 646,
    "hash": "b93016383284eb3b0d68a0da040da9a8107b8d6e2fc5112bb7f4efe7e810a126",
    "prevHash": "68cb7f0501f173c2f656a12a571b37b47b72484b2811ce67a0a10cb3889d02b6",
    "seqNo": 1276,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988029163-fxzut9",
    "uniqueId": "25N81A6718",
    "scannedAt": "2026-08-06T03:47:09.163Z",
    "attempts": 645,
    "hash": "6cc81c0e8d886340503195060da0e87e867beca13dc3fea0e49a308ecd150b62",
    "prevHash": "b93016383284eb3b0d68a0da040da9a8107b8d6e2fc5112bb7f4efe7e810a126",
    "seqNo": 1277,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988030937-t5r186",
    "uniqueId": "25N81A6720",
    "scannedAt": "2026-08-06T03:47:10.937Z",
    "attempts": 644,
    "hash": "5bdc9608a3ea63f81bb836cea1544631ec534ceb02c6191742c14606c51f2a49",
    "prevHash": "6cc81c0e8d886340503195060da0e87e867beca13dc3fea0e49a308ecd150b62",
    "seqNo": 1278,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988032915-j73los",
    "uniqueId": "25N81A6704",
    "scannedAt": "2026-08-06T03:47:12.915Z",
    "attempts": 643,
    "hash": "85c8189fd36cbdd7b8b8665c8a992e3fc1538f162724bbb3dcac254c76b6f998",
    "prevHash": "5bdc9608a3ea63f81bb836cea1544631ec534ceb02c6191742c14606c51f2a49",
    "seqNo": 1279,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988033677-fjm6se",
    "uniqueId": "25N81A6705",
    "scannedAt": "2026-08-06T03:47:13.677Z",
    "attempts": 642,
    "hash": "514b4a36afca4a9678a348ee944837e2e1754e0b6ab412dc271f8ccd54b380f7",
    "prevHash": "85c8189fd36cbdd7b8b8665c8a992e3fc1538f162724bbb3dcac254c76b6f998",
    "seqNo": 1280,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988035937-628g8g",
    "uniqueId": "25N81A6707",
    "scannedAt": "2026-08-06T03:47:15.937Z",
    "attempts": 641,
    "hash": "04017700443885a4822d014c6e6bcffe30a70f833200e53a5cc6910e2f4f463c",
    "prevHash": "514b4a36afca4a9678a348ee944837e2e1754e0b6ab412dc271f8ccd54b380f7",
    "seqNo": 1281,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988043029-p9u7gp",
    "uniqueId": "25N81A6719",
    "scannedAt": "2026-08-06T03:47:23.029Z",
    "attempts": 639,
    "hash": "547251574bdca6f768cc9f23648a66d470f2d553b478e8aff3b1d6088406d761",
    "prevHash": "04017700443885a4822d014c6e6bcffe30a70f833200e53a5cc6910e2f4f463c",
    "seqNo": 1283,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988044891-k5rvx0",
    "uniqueId": "25N81A6711",
    "scannedAt": "2026-08-06T03:47:24.891Z",
    "attempts": 638,
    "hash": "8fd11066dd39cb8e9be564fc5578139211da188eed69aa1efe85fbfe35d2e9ca",
    "prevHash": "547251574bdca6f768cc9f23648a66d470f2d553b478e8aff3b1d6088406d761",
    "seqNo": 1284,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988047176-5v21m9",
    "uniqueId": "25N81A6710",
    "scannedAt": "2026-08-06T03:47:27.176Z",
    "attempts": 637,
    "hash": "1e1251c77707b241749811b3e257bbdc4b73be4ef002f64dbde0e2262dcbb1d0",
    "prevHash": "8fd11066dd39cb8e9be564fc5578139211da188eed69aa1efe85fbfe35d2e9ca",
    "seqNo": 1285,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988048468-pxojiz",
    "uniqueId": "25N81A6714",
    "scannedAt": "2026-08-06T03:47:28.468Z",
    "attempts": 636,
    "hash": "793592dd3ded019d5a0a7fbecaa6d438b3dcbd957fc70cfaf667922fe343b1fa",
    "prevHash": "1e1251c77707b241749811b3e257bbdc4b73be4ef002f64dbde0e2262dcbb1d0",
    "seqNo": 1286,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988051914-ni8394",
    "uniqueId": "25N81A6715",
    "scannedAt": "2026-08-06T03:47:31.914Z",
    "attempts": 635,
    "hash": "b1a4045e1c28d03557f2a1406a2297063c25ff6ac902445b8487459a0b5dda6e",
    "prevHash": "793592dd3ded019d5a0a7fbecaa6d438b3dcbd957fc70cfaf667922fe343b1fa",
    "seqNo": 1287,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988054897-ti62n0",
    "uniqueId": "25N81A6717",
    "scannedAt": "2026-08-06T03:47:34.897Z",
    "attempts": 634,
    "hash": "f32d3bb90087465e88e5356c3537fb5e7f1681fbffd1ac56129ab4adc00773f5",
    "prevHash": "b1a4045e1c28d03557f2a1406a2297063c25ff6ac902445b8487459a0b5dda6e",
    "seqNo": 1288,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988058948-hl8aff",
    "uniqueId": "25N81A6709",
    "scannedAt": "2026-08-06T03:47:38.948Z",
    "attempts": 632,
    "hash": "e5923be21c7ad0e517b2a588d431cfd74ec23fd13021363da41193d4cc20f85c",
    "prevHash": "f32d3bb90087465e88e5356c3537fb5e7f1681fbffd1ac56129ab4adc00773f5",
    "seqNo": 1289,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988060281-hwf87w",
    "uniqueId": "25N81A6712",
    "scannedAt": "2026-08-06T03:47:40.281Z",
    "attempts": 631,
    "hash": "b396ad0f60feab2f73176b5b8f6431df9f0d3903f961696f3fe57819159dcef1",
    "prevHash": "e5923be21c7ad0e517b2a588d431cfd74ec23fd13021363da41193d4cc20f85c",
    "seqNo": 1290,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988098124-2b35mf",
    "uniqueId": "24N81A6790",
    "scannedAt": "2026-08-06T03:48:18.124Z",
    "attempts": 623,
    "hash": "b46c3b25c3acbcf3fec1faa1488a00d2e6a89268c51441c78699e2b9171ff681",
    "prevHash": "b396ad0f60feab2f73176b5b8f6431df9f0d3903f961696f3fe57819159dcef1",
    "seqNo": 1291,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988105926-azapp5",
    "uniqueId": "24N81A6786",
    "scannedAt": "2026-08-06T03:48:25.926Z",
    "attempts": 623,
    "hash": "27aa961c91c7431fe0f0446a7a708f07f6ff6e71c1c6efb80d65db4287699cfd",
    "prevHash": "b46c3b25c3acbcf3fec1faa1488a00d2e6a89268c51441c78699e2b9171ff681",
    "seqNo": 1292,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988107886-omrdij",
    "uniqueId": "24N81A6791",
    "scannedAt": "2026-08-06T03:48:27.886Z",
    "attempts": 623,
    "hash": "a70128d2e9462aca6e6565f92830036268e7f34cafbdae9ac1a0f319a9460591",
    "prevHash": "27aa961c91c7431fe0f0446a7a708f07f6ff6e71c1c6efb80d65db4287699cfd",
    "seqNo": 1293,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988110818-097xxh",
    "uniqueId": "24N81A6787",
    "scannedAt": "2026-08-06T03:48:30.818Z",
    "attempts": 623,
    "hash": "97eafd1d676ded41453b641a6adf115e836bb517ae6c8eb8c7491fd097e8d447",
    "prevHash": "a70128d2e9462aca6e6565f92830036268e7f34cafbdae9ac1a0f319a9460591",
    "seqNo": 1294,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988114269-3gyjs8",
    "uniqueId": "24N81A6783",
    "scannedAt": "2026-08-06T03:48:34.269Z",
    "attempts": 623,
    "hash": "b035df5f5217e9c96535bf222dcd64327310bbdbf877240ebde159afe3981b50",
    "prevHash": "97eafd1d676ded41453b641a6adf115e836bb517ae6c8eb8c7491fd097e8d447",
    "seqNo": 1295,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988117063-8ic58p",
    "uniqueId": "24N81A6785",
    "scannedAt": "2026-08-06T03:48:37.063Z",
    "attempts": 623,
    "hash": "b9be373ae7107d78ba69c522907265a6e044ddc7aaad156b31ce22560d36b9c8",
    "prevHash": "b035df5f5217e9c96535bf222dcd64327310bbdbf877240ebde159afe3981b50",
    "seqNo": 1296,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988120012-9lez7m",
    "uniqueId": "24N81A6782",
    "scannedAt": "2026-08-06T03:48:40.012Z",
    "attempts": 623,
    "hash": "c8dc0f4c4b63edb36f4cfc161a3ed026cc165db7c0897673ed1789f702ef32d8",
    "prevHash": "b9be373ae7107d78ba69c522907265a6e044ddc7aaad156b31ce22560d36b9c8",
    "seqNo": 1297,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988127137-5gnt84",
    "uniqueId": "24N81A6780",
    "scannedAt": "2026-08-06T03:48:47.137Z",
    "attempts": 621,
    "hash": "7120c02faee9a88e4d0e2a68a9eab18f7aab53f738e80e191f50ef28c3955123",
    "prevHash": "c8dc0f4c4b63edb36f4cfc161a3ed026cc165db7c0897673ed1789f702ef32d8",
    "seqNo": 1299,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988144128-4gputd",
    "uniqueId": "24N81A6796",
    "scannedAt": "2026-08-06T03:49:04.128Z",
    "attempts": 615,
    "hash": "eb6dd37271dcdd5ce4d1d32788fa0d4a5d255549c0aff960f225b1c650e93c87",
    "prevHash": "7120c02faee9a88e4d0e2a68a9eab18f7aab53f738e80e191f50ef28c3955123",
    "seqNo": 1300,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988146568-xh7hol",
    "uniqueId": "24N81A6793",
    "scannedAt": "2026-08-06T03:49:06.568Z",
    "attempts": 614,
    "hash": "0be3aca474419e68d1ac24fb654bc665c3e7df2714494a768509bbeceb4166aa",
    "prevHash": "eb6dd37271dcdd5ce4d1d32788fa0d4a5d255549c0aff960f225b1c650e93c87",
    "seqNo": 1301,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988150519-fn7g6e",
    "uniqueId": "24N81A6779",
    "scannedAt": "2026-08-06T03:49:10.519Z",
    "attempts": 613,
    "hash": "e9c0307ae119a7948d3a482cb6291252a2e4d5b9ad8085a4a1b75cc65a4ae4ba",
    "prevHash": "0be3aca474419e68d1ac24fb654bc665c3e7df2714494a768509bbeceb4166aa",
    "seqNo": 1302,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988155807-45d5w8",
    "uniqueId": "24N81A67A0",
    "scannedAt": "2026-08-06T03:49:15.807Z",
    "attempts": 612,
    "hash": "8ff78a4fbb5bf2c6c3131bceadb4771f475250e34aa78bfad762838a21b3eaa5",
    "prevHash": "e9c0307ae119a7948d3a482cb6291252a2e4d5b9ad8085a4a1b75cc65a4ae4ba",
    "seqNo": 1303,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988158787-hk2vl8",
    "uniqueId": "24N81A6797",
    "scannedAt": "2026-08-06T03:49:18.787Z",
    "attempts": 611,
    "hash": "a8934731ef9811907b9c4e466ce8c84d5113172a24b3ae045b62429a0430ef8e",
    "prevHash": "8ff78a4fbb5bf2c6c3131bceadb4771f475250e34aa78bfad762838a21b3eaa5",
    "seqNo": 1304,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988163920-027jnh",
    "uniqueId": "24N81A6794",
    "scannedAt": "2026-08-06T03:49:23.920Z",
    "attempts": 609,
    "hash": "16bf46932c2b02a1490e9d7f7b80fbdc4c8b8d21830161d4a16c27c31647fe1b",
    "prevHash": "a8934731ef9811907b9c4e466ce8c84d5113172a24b3ae045b62429a0430ef8e",
    "seqNo": 1305,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988165236-mqb3a2",
    "uniqueId": "24N81A6799",
    "scannedAt": "2026-08-06T03:49:25.236Z",
    "attempts": 608,
    "hash": "13767f952d67527ff26fbb7dbe3edbc90b49efdb5935f158465e8d3c917626e9",
    "prevHash": "16bf46932c2b02a1490e9d7f7b80fbdc4c8b8d21830161d4a16c27c31647fe1b",
    "seqNo": 1306,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988179072-53ki8t",
    "uniqueId": "24N81A67A1",
    "scannedAt": "2026-08-06T03:49:39.072Z",
    "attempts": 603,
    "hash": "d9a785d3925a80f60404a80e02a583d4b0670ae639e7be2306d446d439d2ad05",
    "prevHash": "13767f952d67527ff26fbb7dbe3edbc90b49efdb5935f158465e8d3c917626e9",
    "seqNo": 1307,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": true
  },
  {
    "clientScanId": "1785988262967-uwf32j",
    "uniqueId": "24N81A67A2",
    "scannedAt": "2026-08-06T03:51:02.967Z",
    "attempts": 591,
    "hash": "90ef908fdb6e0b01a14c497c19ce328b1ff8cc5e5de307dd6f5d4811ebe1e31e",
    "prevHash": "d9a785d3925a80f60404a80e02a583d4b0670ae639e7be2306d446d439d2ad05",
    "seqNo": 1309,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988309533-7ooip7",
    "uniqueId": "24N81A6762",
    "scannedAt": "2026-08-06T03:51:49.533Z",
    "attempts": 582,
    "hash": "7906000fa8c866c2709bc5dfcdca695511c27c2ec936e55cdf9a81cafefc8776",
    "prevHash": "90ef908fdb6e0b01a14c497c19ce328b1ff8cc5e5de307dd6f5d4811ebe1e31e",
    "seqNo": 1311,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988313391-hzp3z4",
    "uniqueId": "24N81A6768",
    "scannedAt": "2026-08-06T03:51:53.392Z",
    "attempts": 582,
    "hash": "ae5faa53235a94179a159b9a84724290c3aa66b7f613ddf817b4239b63966f87",
    "prevHash": "7906000fa8c866c2709bc5dfcdca695511c27c2ec936e55cdf9a81cafefc8776",
    "seqNo": 1312,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988318884-xjot0h",
    "uniqueId": "24N81A6761",
    "scannedAt": "2026-08-06T03:51:58.884Z",
    "attempts": 580,
    "hash": "74000945fc928be62960f69a6f0123e19539e3eaa089d79ed9d4b84bb6a9683e",
    "prevHash": "ae5faa53235a94179a159b9a84724290c3aa66b7f613ddf817b4239b63966f87",
    "seqNo": 1313,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988320367-pw1rri",
    "uniqueId": "24N81A6759",
    "scannedAt": "2026-08-06T03:52:00.367Z",
    "attempts": 580,
    "hash": "4cb8b53ab684f7c38da0896430dc0bd1984fbef010c6e7679b77ba95095134bc",
    "prevHash": "74000945fc928be62960f69a6f0123e19539e3eaa089d79ed9d4b84bb6a9683e",
    "seqNo": 1314,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988357324-wyc27z",
    "uniqueId": "24N81A6774",
    "scannedAt": "2026-08-06T03:52:37.324Z",
    "attempts": 575,
    "hash": "87f346fe3f68401aaa35caace4c4c58c995bd5d49823caa8a2d841e517a43baf",
    "prevHash": "4cb8b53ab684f7c38da0896430dc0bd1984fbef010c6e7679b77ba95095134bc",
    "seqNo": 1320,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988361347-azoqkz",
    "uniqueId": "24N81A6753",
    "scannedAt": "2026-08-06T03:52:41.347Z",
    "attempts": 574,
    "hash": "97fde63658be121514262c5cffddbe78d351177afdbb96556f6d8abdb7af002b",
    "prevHash": "87f346fe3f68401aaa35caace4c4c58c995bd5d49823caa8a2d841e517a43baf",
    "seqNo": 1321,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988368153-pqngn1",
    "uniqueId": "24N81A6776",
    "scannedAt": "2026-08-06T03:52:48.153Z",
    "attempts": 572,
    "hash": "dc0a0feba1d7031604242b9bffd6aecd8078183f385dfe9a3e95c4791b6392e0",
    "prevHash": "97fde63658be121514262c5cffddbe78d351177afdbb96556f6d8abdb7af002b",
    "seqNo": 1322,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988383630-c527c4",
    "uniqueId": "24N81A6754",
    "scannedAt": "2026-08-06T03:53:03.630Z",
    "attempts": 569,
    "hash": "144a55bfec1bda49642c5f3662ded4b76fd13a578debce6ae83a706021e13a4f",
    "prevHash": "dc0a0feba1d7031604242b9bffd6aecd8078183f385dfe9a3e95c4791b6392e0",
    "seqNo": 1324,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988387512-jfdnpq",
    "uniqueId": "24N81A6775",
    "scannedAt": "2026-08-06T03:53:07.512Z",
    "attempts": 567,
    "hash": "bafd1e2ae983910c22802e2cb4d6143e09772f26211fbcff1c2a8f612225e2f4",
    "prevHash": "144a55bfec1bda49642c5f3662ded4b76fd13a578debce6ae83a706021e13a4f",
    "seqNo": 1325,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988389320-8wi4os",
    "uniqueId": "24N81A6773",
    "scannedAt": "2026-08-06T03:53:09.320Z",
    "attempts": 566,
    "hash": "ce20d900b486990532d2280bcd02af9de70a46aaf6a24c88202fc98a15dde1b9",
    "prevHash": "bafd1e2ae983910c22802e2cb4d6143e09772f26211fbcff1c2a8f612225e2f4",
    "seqNo": 1326,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988398392-cpnrv4",
    "uniqueId": "24N81A6771",
    "scannedAt": "2026-08-06T03:53:18.392Z",
    "attempts": 563,
    "hash": "76158c673a78a94a376f9f0671dd4c5a74a36b26af4f776bbf898c4c038f4bde",
    "prevHash": "ce20d900b486990532d2280bcd02af9de70a46aaf6a24c88202fc98a15dde1b9",
    "seqNo": 1328,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988400827-eui802",
    "uniqueId": "24N81A6770",
    "scannedAt": "2026-08-06T03:53:20.827Z",
    "attempts": 562,
    "hash": "e869fed565d37c8d5d0ac551d89799dcab7d2e78c1438ef3931ca80c62fa7924",
    "prevHash": "76158c673a78a94a376f9f0671dd4c5a74a36b26af4f776bbf898c4c038f4bde",
    "seqNo": 1329,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "1785988409058-nrkwjw",
    "uniqueId": "24N81A6778",
    "scannedAt": "2026-08-06T03:53:29.058Z",
    "attempts": 559,
    "hash": "bf4ea8d370150b36f55d1ee92cc35e40861ca06a5cb1a4fd0717558844456b94",
    "prevHash": "e869fed565d37c8d5d0ac551d89799dcab7d2e78c1438ef3931ca80c62fa7924",
    "seqNo": 1330,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  },
  {
    "clientScanId": "cs_1785989759373_hkgnih",
    "uniqueId": "24N81A6763",
    "scannedAt": "2026-08-06T04:15:59.373Z",
    "attempts": 105,
    "hash": "f477fc7d321e28da1288ff4b7135a0bb2fee37c83e77229a3850ecf1f8fda877",
    "prevHash": "bf4ea8d370150b36f55d1ee92cc35e40861ca06a5cb1a4fd0717558844456b94",
    "seqNo": 1331,
    "deviceId": "dev_tjvsbofdmrwy5qxw",
    "isLateEntry": false
  }
];

function getHostelDate(d = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);
  const hour = istTime.getUTCHours();
  if (hour < 6) {
    istTime.setUTCDate(istTime.getUTCDate() - 1);
  }
  return istTime.toISOString().slice(0, 10);
}

async function run() {
  console.log(`Ingesting ${rawScans.length} scans into Supabase...`);
  
  // 1. Fetch user map from qr_users
  const uniqueIds = Array.from(new Set(rawScans.map(s => s.uniqueId.trim().toUpperCase())));
  const { data: users, error: uErr } = await supabase
    .from("qr_users")
    .select("id, name, unique_id, role")
    .in("unique_id", uniqueIds);

  if (uErr) {
    console.error("Failed to query qr_users:", uErr);
    process.exit(1);
  }

  const userMap = new Map();
  users.forEach(u => userMap.set(u.unique_id.trim().toUpperCase(), u));

  console.log(`Found ${users.length} matching users out of ${uniqueIds.length} unique roll numbers.`);

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const s of rawScans) {
    const uid = s.uniqueId.trim().toUpperCase();
    const user = userMap.get(uid);
    if (!user) {
      console.warn(`User not found for roll number: ${s.uniqueId}`);
      skippedCount++;
      continue;
    }

    const scannedAt = new Date(s.scannedAt);
    const date = getHostelDate(scannedAt);
    const ts = scannedAt.toISOString();

    // Check existing attendance for date
    const { data: existingRecords } = await supabase
      .from("qr_attendance")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .order("last_scan_at", { ascending: false, nullsFirst: false })
      .limit(1);

    const existing = existingRecords?.[0];

    if (!existing) {
      // Entry scan
      let entryTime = ts;
      if (s.isLateEntry) {
        const d = new Date(ts);
        d.setSeconds(59);
        d.setMilliseconds(999);
        entryTime = d.toISOString();
      }
      const { error: insErr } = await supabase
        .from("qr_attendance")
        .insert({
          user_id: user.id,
          date,
          entry_time: entryTime,
          exit_time: null,
          scan_count: 1,
          last_scan_at: ts
        });
      if (insErr) console.error(`Error inserting entry for ${uid}:`, insErr);
      else insertedCount++;
    } else if (!existing.exit_time && new Date(existing.entry_time).getTime() < scannedAt.getTime()) {
      // Exit scan
      const { error: updErr } = await supabase
        .from("qr_attendance")
        .update({
          exit_time: ts,
          scan_count: (existing.scan_count || 1) + 1,
          last_scan_at: ts
        })
        .eq("id", existing.id);
      if (updErr) console.error(`Error updating exit for ${uid}:`, updErr);
      else updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`Ingestion Complete! Inserted: ${insertedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  process.exit(0);
}

run();
