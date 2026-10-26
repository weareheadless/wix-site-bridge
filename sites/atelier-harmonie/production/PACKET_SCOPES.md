# Atelier packet page scopes

Wix exposes `pageFilter` as read-only to the Custom Embeds API, so the bridge cannot apply these page filters. In Wix Custom Code, set the page scope for each entry below; keep its ID, position, category and load-once setting unchanged. Shared navbar/footer packets and both startup controllers stay on all pages.

| Embed ID | Entry | Component | Intended pages |
| --- | --- | --- | --- |
| `3a7f985a-d818-4646-acef-0e4fa5069221` | Atelier production early-packet-about-1.html | about | /a-propos |
| `68db761f-4115-448c-9d8b-4306b1b84ec4` | Atelier production early-packet-contact-1.html | contact | /tapisserie-restauration |
| `8f960fea-1796-4738-bde8-62b6dbabaf8a` | Atelier production early-packet-cookies-1.html | cookies | /politique-de-cookies |
| `a15c64a9-afab-425b-963a-dcfe10a88c8b` | Atelier production early-packet-deco-1.html | deco | /objets-deco |
| `1af5b53c-30ec-4516-a034-d9bd64f47819` | Atelier production early-packet-fabrics-1.html | fabrics | /les-tissus |
| `f2c2ee7f-53fa-473b-8a5f-c57028025b43` | Atelier production early-packet-fabrics-2.html | fabrics | /les-tissus |
| `bc560b09-ea35-47ed-a623-65edf44f96c9` | Atelier production early-packet-footer-1.html | footer | All pages |
| `2ee1ebe8-02e8-43e8-b45f-13a88f908888` | Atelier production early-packet-generalterms-1.html | generalterms | /conditions-generales |
| `78d528e2-1ba8-4547-9ad8-32ad138c2e86` | Atelier production early-packet-generalterms-2.html | generalterms | /conditions-generales |
| `115c3eb7-791d-4128-a46d-1f2c52d6e344` | Atelier production early-packet-giftguide-1.html | giftguide | /gift-card |
| `1340430c-7161-4222-a40a-bed40d93d610` | Atelier production early-packet-giftintro-1.html | giftintro | /gift-card |
| `f51d200b-5a72-42af-9888-343a96ad77c4` | Atelier production early-packet-home-1.html | home | / and /copy-of-accueil |
| `6a817d01-dde1-4c27-b881-0cd2334b1055` | Atelier production early-packet-home-2.html | home | / and /copy-of-accueil |
| `de3fd457-5a06-4565-9aa4-62e3774ff478` | Atelier production early-packet-home-3.html | home | / and /copy-of-accueil |
| `44549894-ece3-466e-90ef-0375f9a3a02d` | Atelier production early-packet-journalbottom-1.html | journalbottom | /blog |
| `0800721b-4b36-479f-97ef-b50ae2044743` | Atelier production early-packet-journaltop-1.html | journaltop | /blog |
| `c3341e82-ffc0-4d73-a3be-cc8de6915376` | Atelier production early-packet-lamps-1.html | lamps | /lampes |
| `e5c3306c-5c12-4e47-a964-769f447fba92` | Atelier production early-packet-navbar-1.html | navbar | All pages |
| `f72d84b1-cb9f-4521-8e5d-9a05851988f1` | Atelier production early-packet-privacy-1.html | privacy | /politique-de-confidentialite |
| `deabf405-88b2-46ec-8c22-3eb9dba37167` | Atelier production early-packet-privacy-2.html | privacy | /politique-de-confidentialite |
| `d1343538-27ba-4069-8c5b-4d20db25e22a` | Atelier production early-packet-product-1.html | product | /product-page/* |
| `d6615a9d-f7a2-46d1-b5b2-efc6651d4cc6` | Atelier production early-packet-product-2.html | product | /product-page/* |
| `48172cc5-b758-4a53-86bd-f9536dbb16c6` | Atelier production early-packet-productfaq-1.html | productfaq | /product-page/* |
| `017a8d7c-20df-4bcf-82c7-f04406a1f0c5` | Atelier production early-packet-quotebottom-1.html | quotebottom | /devis |
| `21798ef3-5ae2-4583-9a20-4d3fb13bfb1d` | Atelier production early-packet-quotetop-1.html | quotetop | /devis |
| `da2e0e39-6ae0-40f8-ae59-6174aaed74fd` | Atelier production early-packet-restoration-1.html | restoration | /tapisserie-restauration |
| `0824f76d-abf7-482b-80b0-e8337a786d75` | Atelier production early-packet-seats-1.html | seats | /sieges |
| `79fcc94b-358e-4454-aff7-1c6192156fe5` | Atelier production early-packet-shop-1.html | shop | /shop |
| `f380bf40-1eaf-45b0-b6d3-75112c1dfe9c` | Atelier production early-packet-shop-2.html | shop | /shop |
| `2df3654a-bafe-4fdc-bb9f-a6e9dbec1147` | Atelier production early-packet-terms-1.html | terms | /conditions-generales-de-vente |
| `72053d34-0095-46a1-a93f-1e16c0407434` | Atelier production early-packet-terms-2.html | terms | /conditions-generales-de-vente |
| `06f65980-3e16-4dd1-8ca4-43e560020173` | Atelier production early-packet-terms-3.html | terms | /conditions-generales-de-vente |
| `e4194673-654e-4e14-93f9-d1fb45198336` | Atelier production early-packet-workshops-1.html | workshops | /les-ateliers |

Special non-packet entry: `41e2873b-2a99-4747-b1b6-156878469855` (lamp categories) should load on `/lampes/*` only.
