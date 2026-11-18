# Candour Communications — Official Website Redesign

> **Real Conversations. Stronger Communities.**  
> Full-service integrated marketing and PR consultancy headquartered in Delhi NCR & Gurgaon, with national reach across 30+ regional markets. Partner agency of BBN — The World’s B2B Agency.

🌐 **Live GitHub Pages URL:** [https://sanjam1552.github.io/candour_website/](https://sanjam1552.github.io/candour_website/)

---

## 🎨 Design & Architectural Highlights

- **Editorial Typography & Visual Tone:** Crafted in *Playfair Display* and *Plus Jakarta Sans*, balanced with Obsidian, Ivory, Magenta, and Tangerine accents.
- **Continuous 3D Silk Ribbon:** GPU-accelerated Three.js procedural silk ribbon using Bishop parallel transport frames, flowing smoothly alongside content.
- **Interactive 3D Accolades Showcase:** Procedural Three.js 3D trophies (15th e4m PRCCA, BW Excel, ET BrandEquity Kaleido) with orbit parallax, studio lighting, and honours bento ledger.
- **Survey-of-India Pan-India Footprint Console:** Cartographically accurate official Republic of India vector map featuring undivided frontiers, internal state meshes, 30+ affiliate regions, and live signal arcs radiating from Delhi HQ.
- **Interactive Client Portfolio & Dossiers:** Dynamic sector-filtered brand showcase spanning 60 enterprise leaders (Databricks, CyberArk, VTEX, Lenovo, Cloudera, Zoom, and more) with smooth GSAP transition states.
- **High-Resolution Press Lightbox:** Inspect media activations and national coverage with keyboard navigation and zoom controls.

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Actions deployment to GitHub Pages
├── assets/
│   ├── agency/               # Team and culture imagery
│   ├── awards/               # Award seals, emblems, and ceremony photos
│   ├── brand/                # Candour and BBN logos & wordmarks
│   ├── campaigns/            # High-res campaign press clippings and creative
│   ├── logos/                # Client brand marks (60 enterprise partners)
│   ├── partners/             # Global affiliate partner agency network logos
│   └── testimonials/         # Leadership & client headshots
├── .gitignore
├── .nojekyll                 # Bypasses Jekyll processing on GitHub Pages
├── app.js                    # Interactive logic, Three.js stages, GSAP & Lenis smooth scroll
├── index.html                # Semantic HTML5 site structure
├── README.md
└── styles.css                # Custom properties, bento grids, and responsive layouts
```

---

## 🚀 Deployment

The site is configured for continuous deployment on **GitHub Pages**:
- **Automatic:** Every push to `main` triggers `.github/workflows/deploy.yml` which builds and publishes the site directly to GitHub Pages.
- **Manual / Branch Fallback:** Can also be served directly from the root of the `main` branch via repository settings: `Settings -> Pages -> Deploy from a branch -> / (root)`.
