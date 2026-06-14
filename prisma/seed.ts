import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const photos = [
  { seed: "alpine",    labels: { en: "Alpine Lake",       fr: "Lac alpin",          es: "Lago alpino",        zh: "高山湖泊",   ja: "高山湖" } },
  { seed: "canyon",    labels: { en: "Red Canyon",        fr: "Canyon rouge",       es: "Cañón rojo",         zh: "红色峡谷",   ja: "赤い渓谷" } },
  { seed: "forest",    labels: { en: "Ancient Forest",    fr: "Forêt ancienne",     es: "Bosque antiguo",     zh: "古老森林",   ja: "古代の森" } },
  { seed: "coast",     labels: { en: "Rocky Coast",       fr: "Côte rocheuse",      es: "Costa rocosa",       zh: "岩石海岸",   ja: "岩礁の海岸" } },
  { seed: "desert",    labels: { en: "Sand Dunes",        fr: "Dunes de sable",     es: "Dunas de arena",     zh: "沙丘",       ja: "砂丘" } },
  { seed: "waterfall", labels: { en: "Hidden Waterfall",  fr: "Cascade cachée",     es: "Cascada oculta",     zh: "隐秘瀑布",   ja: "隠れた滝" } },
  { seed: "glacier",   labels: { en: "Blue Glacier",      fr: "Glacier bleu",       es: "Glaciar azul",       zh: "蓝色冰川",   ja: "青い氷河" } },
  { seed: "savanna",   labels: { en: "Golden Savanna",    fr: "Savane dorée",       es: "Sabana dorada",      zh: "金色草原",   ja: "黄金のサバンナ" } },
  { seed: "volcano",   labels: { en: "Active Volcano",    fr: "Volcan actif",       es: "Volcán activo",      zh: "活火山",     ja: "活火山" } },
  { seed: "fjord",     labels: { en: "Norwegian Fjord",   fr: "Fjord norvégien",    es: "Fiordo noruego",     zh: "挪威峡湾",   ja: "ノルウェーのフィヨルド" } },
  { seed: "meadow",    labels: { en: "Alpine Meadow",     fr: "Prairie alpine",     es: "Prado alpino",       zh: "高山草甸",   ja: "高山の牧草地" } },
  { seed: "reef",      labels: { en: "Coral Reef",        fr: "Récif corallien",    es: "Arrecife de coral",  zh: "珊瑚礁",     ja: "サンゴ礁" } },
  { seed: "tundra",    labels: { en: "Arctic Tundra",     fr: "Toundra arctique",   es: "Tundra ártica",      zh: "北极苔原",   ja: "北極ツンドラ" } },
  { seed: "bayou",     labels: { en: "Southern Bayou",    fr: "Bayou du Sud",       es: "Bayou sureño",       zh: "南方沼泽",   ja: "南部のバイユー" } },
  { seed: "mesa",      labels: { en: "Red Mesa",          fr: "Mesa rouge",         es: "Mesa roja",          zh: "红色台地",   ja: "赤いメサ" } },
  { seed: "mangrove",  labels: { en: "Mangrove Swamp",    fr: "Mangrove",           es: "Manglar",            zh: "红树林",     ja: "マングローブ林" } },
];

async function main() {
  console.log("Seeding photos…");
  await prisma.photo.deleteMany();
  for (const p of photos) {
    await prisma.photo.create({ data: { url: `https://picsum.photos/seed/${p.seed}/800/800`, labels: p.labels } });
  }
  console.log(`✓ Inserted ${photos.length} photos`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
