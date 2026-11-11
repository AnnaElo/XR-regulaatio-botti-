# XR-regulaatio-botti-
XR-toteutuksille sekä sovelluksille luotu AI-avusteinen botti, joka suosittelee kehittäjälle keskeisiä, avoimia standardeja sekä EU-regulaation piirissä olevien säädösten implementointia. 

## Rakenne

| Polku | Sisältö |
| --- | --- |
| `sources/` | Tietopohja (YAML, fi/en) |
| `prompts/system-prompt.md` | Botin ohje |
| `docs/` | Linjaukset ja kysymyspolku |
| `public/index.html` | Käyttöliittymä |
| `worker/` | Cloudflare Worker: `POST /api/chat` kutsuu Claude API:a |
| `tests/cases.yaml` | Testitapaukset |

## Julkaisu Cloudflareen

1. Cloudflaressa: *Workers & Pages → Create → Import a repository* ja valitse tämä repo. Asetukset luetaan tiedostosta `wrangler.jsonc`.
2. Workerin *Settings → Variables and Secrets*: lisää salaisuus `ANTHROPIC_API_KEY`.
3. Jokainen muutos main-haaraan julkaistaan automaattisesti. Tietopohja kootaan YAML-tiedostoista julkaisun yhteydessä.

Kulut rajataan Claude Consolen kuukausirajalla. Worker sallii enintään 10 kysymystä minuutissa IP-osoitetta kohden, eikä se tallenna kysymyksiä.

## Testaus

```bash
npm install
ANTHROPIC_API_KEY=... npm run test:bot          # kaikki tapaukset
ANTHROPIC_API_KEY=... npm run test:bot -- lyhyt-kysymys
```

Raportti kirjoitetaan kansioon `tests/results/`. Paikallinen kehityspalvelin: avain tiedostoon `.dev.vars` ja `npm run dev`.
