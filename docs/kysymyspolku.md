# Kysymyspolku ja päättely

Botti selvittää ensin käyttäjän tilanteen ja vertaa sitä tietopohjan `applies_when`-ehtoihin. Taulukko näyttää, mitkä vastaukset nostavat mitkäkin lähteet esiin. Botin varsinainen ohje on tiedostossa [`prompts/system-prompt.md`](../prompts/system-prompt.md).

## Kysymykset

| # | Kysymys | Miksi kysytään |
| --- | --- | --- |
| 1 | Markkina-alue: Suomi, Eurooppa vai maailmanlaajuinen (myös Yhdysvallat)? | Rajaa sääntelyn `jurisdiction`-kentän mukaan. USA:ta ei vielä kateta. |
| 2 | Mitä rakennetaan: sovellus, laite, alusta tai virtuaalimaailma, web-kokemus, 3D- tai paikkatietosisältö? | Valitsee standardiryhmät ja tuotesäädökset (CRA, Data Act). |
| 3 | Kerätäänkö katse-, kasvo-, ääni-, liike- tai sijaintidataa tai muita henkilötietoja? Onko käyttäjissä lapsia? | GDPR, art. 9 ja vaikutustenarviointi. |
| 4 | Käytetäänkö tekoälyä: hahmot, chatbotit, generoitu sisältö, tunteentunnistus, ihmisten arviointi? | AI Actin velvoitteet ja riskiluokka. |
| 5 | Käyttöympäristö: kuluttajat, työpaikka, koulutus, terveydenhuolto, julkiset palvelut? | Tunteentunnistuksen kielto ja suuririskisyys, saavutettavuus. |
| 6 | Alustan ominaisuudet: käyttäjien sisältö, kirjautuminen tai digitaalinen identiteetti, maksut tai tokenit, verkkoon liitetyt laitteet? | DSA, eIDAS, MiCA, Data Act. |
| 7 | Organisaation koko ja vaihe: konsepti, prototyyppi vai markkinoilla? | Mikroyritysten vapautukset (EAA), NIS2:n kokorajat, aikataulut. |

Botti kysyy enintään kolme asiaa kerrallaan eikä kysy uudelleen sitä, minkä käyttäjä on jo kertonut.

## Mitä vastaukset nostavat esiin

| Vastaus | Säädökset | Standardit |
| --- | --- | --- |
| Henkilötietoja, myös testikäyttäjiltä | `gdpr` | |
| Katse-, kasvo- tai liikedata käyttäjän tunnistamiseen | `gdpr` (art. 9, 35) | |
| Tekoälyhahmo, chatbot tai generoitu sisältö | `aiact` (art. 50) | |
| Tunteentunnistus | `aiact` (art. 5, 50) | |
| Tekoäly arvioi ihmisiä koulutuksessa tai työssä | `aiact` (liite III) | |
| Käyttäjien tuottama tai jakama sisältö | `dsa` | |
| Verkkoon liitetty laite tai datapalvelu | `dataact` | |
| Digitaalinen tuote myydään EU:ssa | `cra` | |
| Kirjautuminen tai sähköinen tunnistaminen | `eidas` | `oidc`, `did`, `vc` |
| Kryptovarat tai tokenit | `mica` | |
| Kuluttajapalvelu, esim. verkkokaupan AR-sovitus | `eaa` | `design` |
| Organisaatio kuuluu NIS2-toimialoihin | `nis2` | |
| Natiivi XR-sovellus useille laitteille | | `openxr` |
| Selaimessa toimiva XR | | `webxr`, `design` |
| 3D-sisällön siirto ja jakelu | | `gltf`, `openusd` |
| Paikkatieto, kaupunkimallit, digitaaliset kaksoset | | `ogcfeat`, `ogctiles`, `3dtiles`, `citygml`, `geopose` |

Linjaukset `web40` ja `ep2024` ovat taustatietoa: botti mainitsee ne vain, jos käyttäjä kysyy EU:n strategiasta.

## Vastauksen rakenne

1. Yhteenveto
2. Todennäköisesti sovellettava sääntely: vaatimus, perustelu (mikä käyttäjän kertoma täsmäsi), artikla, voimaantulo, Suomen viranomainen, lähdelinkki
3. Suositellut avoimet standardit
4. Avoimet kysymykset
5. Huomautus: tekoälyn tuottama yleiskatsaus, ei oikeudellista neuvontaa

Testitapaukset vaiheen 4 testaukseen ovat tiedostossa [`tests/cases.yaml`](../tests/cases.yaml).
