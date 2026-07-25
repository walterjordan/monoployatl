/**
 * Generate property deed art for ATL Ghetto Monopoly via Vertex AI
 * (gemini-2.5-flash-image), using the active gcloud identity for auth.
 *
 * Style contract (matches the existing hand-picked art): photorealistic street
 * photography with the neighborhood name visible on real-world signage or a
 * mural, landmark-forward, no celebrity likenesses, PG.
 *
 * Usage: node scripts/generate_property_art.mjs [slug ...]
 *   With no args, generates every missing image. Pass slugs to redo specific ones.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'gen-lang-client-0901205519';
const MODEL = 'gemini-2.5-flash-image';
const LOCATIONS = ['global', 'us-central1'];

const STYLE =
  'Photorealistic street photography, Atlanta Georgia, natural light, shot on a 35mm lens, ' +
  'rich color, editorial quality. Any people appear small or from behind, no recognizable faces. ' +
  'Landscape orientation.';

const JOBS = [
  { slug: 'ben_hill', prompt: `Weathered brick neighborhood entrance sign with white letters reading "BEN HILL" surrounded by crepe myrtle trees and a green lawn in southwest Atlanta, blue sky. ${STYLE}` },
  { slug: 'camp_creek', prompt: `Large suburban retail marketplace entrance sign reading "CAMP CREEK" at a busy shopping plaza with palm-ish landscaping and cars passing, late afternoon sun. ${STYLE}` },
  { slug: 'swats', prompt: `Bold colorful graffiti mural on a brick wall reading "SWATS" in huge wildstyle letters, southwest Atlanta corner store setting, chain-link fence in front. ${STYLE}` },
  { slug: 'edgewood', prompt: `IMPORTANT: every sign in the image must be spelled EXACTLY "EDGEWOOD AVE" with no missing or repeated letters. Neon-lit nightlife strip at dusk with a green street sign in the foreground reading "EDGEWOOD AVE", brick storefronts and string lights, people blurred in motion down the block. ${STYLE}` },
  { slug: 'cabbagetown', prompt: `Painted mural archway on an old cotton-mill brick wall reading "CABBAGETOWN" with colorful shotgun houses lining the narrow street beyond, overcast soft light. ${STYLE}` },
  { slug: 'old_4th_ward', prompt: `IMPORTANT: every sign in the image must be spelled EXACTLY "OLD FOURTH WARD" with no missing or repeated letters. Large rooftop mural reading "OLD FOURTH WARD" overlooking a city park with a modern skyline behind it, joggers small in the distance on a paved trail, golden hour. ${STYLE}` },
  { slug: 'mechanicsville', prompt: `Historic Atlanta neighborhood gateway marker of stacked brick and a metal plaque reading "MECHANICSVILLE", railroad tracks and downtown skyline faint in the background. ${STYLE}` },
  { slug: 'pittsburgh', prompt: `IMPORTANT: every sign in the image must be spelled EXACTLY "PITTSBURGH" with no missing or repeated letters. Hand-painted community welcome mural on cinderblock reading "PITTSBURGH" with a rising sun motif, Atlanta southside street with utility poles and a church steeple behind. ${STYLE}` },
  { slug: 'peoplestown', prompt: `Colorful community garden fence mural reading "PEOPLESTOWN" with sunflowers in front and Atlanta row houses behind, bright morning light. ${STYLE}` },
  { slug: 'simpson_road', prompt: `Green metal street sign at an intersection reading "SIMPSON RD NW" with an old-school corner store with hand-painted window ads behind it, warm evening light. ${STYLE}` },
  { slug: 'college_park', prompt: `Historic small-town main street with a tall white water tower painted "COLLEGE PARK" rising above brick storefronts and a barbershop pole, planes tiny in the sky. ${STYLE}` },
  { slug: 'riverdale', prompt: `City limit welcome monument sign reading "RIVERDALE" in brushed metal letters on brick, landscaped flowers at its base, wide suburban boulevard behind, clear sky. ${STYLE}` },
  { slug: 'eav', prompt: `Giant painted letters "EAV" on the side of a music venue brick wall in East Atlanta Village, vintage marquee and dive-bar signs down the block, moody late dusk with neon glow. ${STYLE}` },
  { slug: 'gresham_road', prompt: `Green street sign reading "GRESHAM RD SE" in front of a wing spot strip mall with hand-lettered specials in the window, gold sunset light, southeast Atlanta. ${STYLE}` },
  { slug: 'glenwood', prompt: `Park entrance arch with metal letters reading "GLENWOOD" over a tree-lined path, kids' bikes leaned on the fence, deep green summer foliage. ${STYLE}` },
  { slug: 'zone_6', prompt: `Massive graffiti mural on a concrete underpass wall reading "ZONE 6" in chrome-and-flame wildstyle letters, East Atlanta, a boxy old-school Chevrolet parked in front, dramatic low sun. ${STYLE}` },
  { slug: 'kirkwood', prompt: `Historic stone gateway pillars with an iron arch spelling "KIRKWOOD" over a leafy neighborhood street of craftsman bungalows, dappled morning light. ${STYLE}` },
  { slug: 'west_end', prompt: `Historic commercial district corner building with a wide horizontal painted wall sign in large capital letters reading exactly "WEST END" (spelled W-E-S-T space E-N-D, no vertical signs anywhere), mural-covered brick walls and a fruit stand below, an old green trolley passing, vibrant midday. ${STYLE}` },
  { slug: 'lenox_station', prompt: `Rapid transit rail platform with a large station pylon sign reading "LENOX" and a sleek train arriving, glass high-rises of Buckhead visible above the platform, cool blue hour. ${STYLE}` },
  { slug: 'ga_power', prompt: `Electric utility substation at sunset with towering transmission pylons and a large prominent metal sign in the foreground reading exactly "GA POWER" in big clear letters, dramatic orange sky, power lines receding to the horizon. ${STYLE}` },
  { slug: 'clayton_water', prompt: `Pale blue municipal water tower painted "CLAYTON WATER" above pine trees, chain-link perimeter with a small pump station, big Georgia summer clouds. ${STYLE}` },
];

const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();

async function generate(job, location) {
  const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
  const url = `https://${host}/v1/projects/${PROJECT}/locations/${location}/publishers/google/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: job.prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '4:3' } },
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error(`No image in response: ${JSON.stringify(data).slice(0, 300)}`);
  return Buffer.from(part.inlineData.data, 'base64');
}

const only = process.argv.slice(2);
const queue = JOBS.filter((j) => (only.length ? only.includes(j.slug) : true));
let ok = 0;
for (const job of queue) {
  const out = path.join(ROOT, 'public', `${job.slug}.png`);
  if (!only.length && existsSync(out)) {
    console.log(`skip ${job.slug} (exists)`);
    continue;
  }
  let done = false;
  for (const loc of LOCATIONS) {
    for (let attempt = 1; attempt <= 2 && !done; attempt++) {
      try {
        const buf = await generate(job, loc);
        writeFileSync(out, buf);
        console.log(`OK   ${job.slug} (${loc}, ${Math.round(buf.length / 1024)} KB)`);
        ok++;
        done = true;
      } catch (e) {
        console.log(`FAIL ${job.slug} (${loc}, try ${attempt}): ${e.message}`);
      }
    }
    if (done) break;
  }
}
console.log(`\n${ok}/${queue.length} generated.`);
