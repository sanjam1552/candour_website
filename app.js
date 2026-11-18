/* ============================================================================
   CANDOUR COMMUNICATIONS — 3D WEBGL & EDITORIAL INTERACTION ENGINE
   Preserves the Restored Editorial Design Language + Upgraded 3D Craft:
   1. Signature Right-Side 3D Translucent Silk Ribbon (Three.js + Custom GLSL)
      - Flows organically down the right corridor in response to scroll
      - Adapts seamlessly between dark & light editorial stages
   2. Museum-Grade 3D Physical Awards Exhibition (Three.js + Studio PBR)
      - Rebuilt from Page 8 of the Candour Credentials Presentation:
        * 15th e4m IPRCCA Stepped Satin-Silver Monolith + Bevelled Copper "15"
        * Twin Tapered 48th BW Marketing World EXCEL 24k Gold Monoliths
        * ET BrandEquity Kaleido Multi-Faceted Jewel-Crystal "K" Sculpture
      - Grounded with soft contact shadows, high-DPI brushed-metal engravings,
        sequential right-to-left scroll entrance, and subtle pointer sheen
   3. Interactive Editorial Modules:
      - Services Sticky Campaign Visual Switcher (6 live Candour services)
      - Client Logo Wall Sector Filter (54+ genuine brand logos)
      - Case Studies Practice Filter (5 live candour.co.in categories)
   ============================================================================ */

(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    // ------------------------------------------------------------------------
    // 1. LENIS SMOOTH SCROLLING
    // ------------------------------------------------------------------------
    let lenis = null;
    if (!prefersReducedMotion && window.Lenis && window.gsap) {
        lenis = new Lenis({
            duration: 1.16,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true
        });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            if (lenis) {
                lenis.scrollTo(target, { offset: -64 });
            } else {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ------------------------------------------------------------------------
    // 2. SIGNATURE RIGHT-SIDE 3D SILK RIBBON SYSTEM (THREE.JS + GLSL)
    // ------------------------------------------------------------------------
    const ribbonCanvas = document.getElementById('signature-ribbon-canvas');
    const ribbonState = {
        scrollProgress: 0,
        darkModeMix: 1.0,
        awardsRetreat: 0.0,
        convergenceMix: 0.0
    };

    if (ribbonCanvas && window.THREE && window.gsap) {
        const renderer = new THREE.WebGLRenderer({
            canvas: ribbonCanvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.85));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 15);

        const silkVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying float vSilkWave;

            void main() {
                vUv = uv;
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                vViewPos = -mvPos.xyz;
                vNormal = normalize(normalMatrix * normal);
                vSilkWave = sin(uv.x * 20.0 + uv.y * 6.0);
                gl_Position = projectionMatrix * mvPos;
            }
        `;

        const silkFragmentShader = `
            uniform vec3 uColMagenta;
            uniform vec3 uColPink;
            uniform vec3 uColOrange;
            uniform vec3 uColViolet;
            uniform float uDarkMix;
            uniform float uBaseOpacity;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying float vSilkWave;

            void main() {
                vec3 N = normalize(vNormal);
                if (!gl_FrontFacing) N = -N;
                vec3 V = normalize(vViewPos);

                float ndotv = abs(dot(N, V));
                float fresnel = pow(1.0 - ndotv, 2.3);

                float t = clamp(vUv.x * 0.84 + vUv.y * 0.18 + vSilkWave * 0.045, 0.0, 1.0);
                vec3 c1 = mix(uColViolet, uColMagenta, smoothstep(0.0, 0.34, t));
                vec3 c2 = mix(c1, uColPink, smoothstep(0.28, 0.66, t));
                vec3 baseCol = mix(c2, uColOrange, smoothstep(0.58, 1.0, t));

                vec3 L1 = normalize(vec3(0.55, 0.68, 0.85));
                vec3 H1 = normalize(L1 + V);
                float spec1 = pow(max(dot(N, H1), 0.0), 38.0);

                vec3 L2 = normalize(vec3(-0.42, -0.32, 0.72));
                vec3 H2 = normalize(L2 + V);
                float spec2 = pow(max(dot(N, H2), 0.0), 22.0);

                float softEdge = smoothstep(0.0, 0.065, vUv.y) * smoothstep(1.0, 0.935, vUv.y);
                float rimLine = pow(abs(vUv.y - 0.5) * 2.0, 3.2);

                vec3 lightTreatment = mix(vec3(1.0, 0.96, 0.98), baseCol, 0.78) + vec3(1.0) * (spec1 * 0.44 + fresnel * 0.36);
                vec3 darkTreatment = baseCol * 1.20 + vec3(1.0, 0.86, 0.93) * (fresnel * 0.75 + spec1 * 0.64 + spec2 * 0.24 + rimLine * 0.40);
                vec3 color = mix(lightTreatment, darkTreatment, uDarkMix);

                float alphaLight = (0.19 + fresnel * 0.38 + rimLine * 0.22 + spec1 * 0.18) * uBaseOpacity;
                float alphaDark  = (0.33 + fresnel * 0.56 + rimLine * 0.30 + spec1 * 0.26) * uBaseOpacity;
                float alpha = mix(alphaLight, alphaDark, uDarkMix) * softEdge;

                gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.88));
            }
        `;

        const RIBBON_LENGTH_SEGS = 124;
        const RIBBON_WIDTH_SEGS = 22;

        function createPreallocatedRibbonGeometry() {
            const vertCount = (RIBBON_LENGTH_SEGS + 1) * (RIBBON_WIDTH_SEGS + 1);
            const positions = new Float32Array(vertCount * 3);
            const uvs = new Float32Array(vertCount * 2);
            const indices = [];

            let uvIdx = 0;
            for (let i = 0; i <= RIBBON_LENGTH_SEGS; i++) {
                const u = i / RIBBON_LENGTH_SEGS;
                for (let j = 0; j <= RIBBON_WIDTH_SEGS; j++) {
                    uvs[uvIdx++] = u;
                    uvs[uvIdx++] = j / RIBBON_WIDTH_SEGS;
                }
            }

            const stride = RIBBON_WIDTH_SEGS + 1;
            for (let i = 0; i < RIBBON_LENGTH_SEGS; i++) {
                for (let j = 0; j < RIBBON_WIDTH_SEGS; j++) {
                    const a = i * stride + j;
                    const b = (i + 1) * stride + j;
                    const c = (i + 1) * stride + (j + 1);
                    const d = i * stride + (j + 1);
                    indices.push(a, b, d, b, c, d);
                }
            }

            const geo = new THREE.BufferGeometry();
            geo.setIndex(indices);
            const posAttr = new THREE.BufferAttribute(positions, 3);
            posAttr.setUsage(THREE.DynamicDrawUsage);
            geo.setAttribute('position', posAttr);
            geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            return geo;
        }

        // Reusable Parallel Transport (Bishop) frame buffers — eliminates Three.js
        // computeFrenetFrames() axis-threshold flips that caused periodic scroll jumps
        const ptPoints = Array.from({ length: RIBBON_LENGTH_SEGS + 1 }, () => new THREE.Vector3());
        const ptTangents = Array.from({ length: RIBBON_LENGTH_SEGS + 1 }, () => new THREE.Vector3());
        const ptNormals = Array.from({ length: RIBBON_LENGTH_SEGS + 1 }, () => new THREE.Vector3());
        const ptBinormals = Array.from({ length: RIBBON_LENGTH_SEGS + 1 }, () => new THREE.Vector3());
        const ptRefZ = new THREE.Vector3(0, 0, 1);
        const ptQuat = new THREE.Quaternion();

        function updateRibbonBufferInPlace(geo, curve, width, twistTurns, twistPhase) {
            for (let i = 0; i <= RIBBON_LENGTH_SEGS; i++) {
                const u = i / RIBBON_LENGTH_SEGS;
                curve.getPoint(u, ptPoints[i]);
                curve.getTangent(u, ptTangents[i]);
                ptTangents[i].normalize();
            }

            // Seed frame at i = 0 from fixed +Z reference (never collinear with downward tangent)
            ptBinormals[0].crossVectors(ptTangents[0], ptRefZ).normalize();
            ptNormals[0].crossVectors(ptBinormals[0], ptTangents[0]).normalize();

            // Parallel-transport frame smoothly down the curve without torsion discontinuities
            for (let i = 1; i <= RIBBON_LENGTH_SEGS; i++) {
                ptQuat.setFromUnitVectors(ptTangents[i - 1], ptTangents[i]);
                ptNormals[i].copy(ptNormals[i - 1]).applyQuaternion(ptQuat);
                // Gram-Schmidt re-orthonormalization for numerical stability
                ptNormals[i].addScaledVector(ptTangents[i], -ptNormals[i].dot(ptTangents[i])).normalize();
                ptBinormals[i].crossVectors(ptTangents[i], ptNormals[i]).normalize();
            }

            const posAttr = geo.attributes.position;
            const positions = posAttr.array;
            let pIdx = 0;

            for (let i = 0; i <= RIBBON_LENGTH_SEGS; i++) {
                const u = i / RIBBON_LENGTH_SEGS;
                const P = ptPoints[i];
                const N = ptNormals[i];
                const B = ptBinormals[i];

                const angle = u * Math.PI * twistTurns + twistPhase;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                const rNx = N.x * cosA + B.x * sinA;
                const rNy = N.y * cosA + B.y * sinA;
                const rNz = N.z * cosA + B.z * sinA;

                const rBx = -N.x * sinA + B.x * cosA;
                const rBy = -N.y * sinA + B.y * cosA;
                const rBz = -N.z * sinA + B.z * cosA;

                const localW = width * (0.58 + 0.52 * Math.sin(u * Math.PI));

                for (let j = 0; j <= RIBBON_WIDTH_SEGS; j++) {
                    const v = j / RIBBON_WIDTH_SEGS;
                    const across = (v - 0.5) * 2.0 * localW;
                    const foldArch = Math.sin(v * Math.PI) * 0.26 * Math.cos(u * Math.PI * 3.0 + twistPhase);

                    positions[pIdx++] = P.x + rNx * across + rBx * foldArch;
                    positions[pIdx++] = P.y + rNy * across + rBy * foldArch;
                    positions[pIdx++] = P.z + rNz * across + rBz * foldArch;
                }
            }

            posAttr.needsUpdate = true;
            geo.computeVertexNormals();
        }

        function getRightCorridorX() {
            const aspect = window.innerWidth / window.innerHeight;
            const halfVisibleW = Math.tan((40 * Math.PI) / 360) * 15 * aspect;
            return window.innerWidth < 900 ? halfVisibleW * 0.90 : halfVisibleW * 0.79;
        }

        const strandSpecs = [
            {
                width: 1.48,
                twist: 2.5,
                opacity: 0.88,
                zBase: 0.35,
                xSpread: 1.04,
                magenta: '#e60099',
                pink: '#ff2a85',
                orange: '#ff7315',
                violet: '#7b1fa2'
            },
            {
                width: 1.06,
                twist: 3.1,
                opacity: 0.68,
                zBase: -0.9,
                xSpread: 1.26,
                magenta: '#ff00aa',
                pink: '#ff5e62',
                orange: '#ffaa2b',
                violet: '#5e17eb'
            },
            {
                width: 0.74,
                twist: 2.0,
                opacity: 0.52,
                zBase: -2.0,
                xSpread: 0.82,
                magenta: '#ff6a1a',
                pink: '#e60099',
                orange: '#ffc34d',
                violet: '#9c27b0'
            }
        ];

        const controlCount = 8;
        const strands = strandSpecs.map((spec, idx) => {
            const pts = Array.from({ length: controlCount }, () => new THREE.Vector3());
            const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
            const mat = new THREE.ShaderMaterial({
                vertexShader: silkVertexShader,
                fragmentShader: silkFragmentShader,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                uniforms: {
                    uColMagenta: { value: new THREE.Color(spec.magenta) },
                    uColPink: { value: new THREE.Color(spec.pink) },
                    uColOrange: { value: new THREE.Color(spec.orange) },
                    uColViolet: { value: new THREE.Color(spec.violet) },
                    uDarkMix: { value: 1.0 },
                    uBaseOpacity: { value: spec.opacity }
                }
            });
            const mesh = new THREE.Mesh(createPreallocatedRibbonGeometry(), mat);
            mesh.frustumCulled = false;
            scene.add(mesh);
            return { spec, pts, curve, mesh, idx };
        });

        const lightStageEls = [
            document.getElementById('lightStageOne'),
            document.getElementById('lightStageTwo')
        ].filter(Boolean);
        const awardsSectionEl = document.getElementById('awards');
        const contactSectionEl = document.getElementById('contact');

        function smoothRange(edge0, edge1, x) {
            const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        }

        let targetDarkMix = 1.0;
        let targetAwardsRetreat = 0.0;
        let targetConvergence = 0.0;

        function syncRibbonTargetsFromDOM() {
            const vh = Math.max(1, window.innerHeight);
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
            ribbonState.scrollProgress = Math.min(1, Math.max(0, (window.scrollY || 0) / maxScroll));

            let lightWeight = 0.0;
            for (let i = 0; i < lightStageEls.length; i++) {
                const r = lightStageEls[i].getBoundingClientRect();
                const enter = smoothRange(vh * 0.82, vh * 0.28, r.top);
                const exit = 1.0 - smoothRange(vh * 0.72, vh * 0.18, r.bottom);
                lightWeight = Math.max(lightWeight, enter * exit);
            }
            targetDarkMix = 1.0 - lightWeight;

            if (awardsSectionEl) {
                const ar = awardsSectionEl.getBoundingClientRect();
                const awEnter = smoothRange(vh * 0.85, vh * 0.25, ar.top);
                const awExit = 1.0 - smoothRange(vh * 0.75, vh * 0.15, ar.bottom);
                targetAwardsRetreat = awEnter * awExit;
            }

            if (contactSectionEl) {
                const cr = contactSectionEl.getBoundingClientRect();
                targetConvergence = smoothRange(vh * 0.90, vh * 0.25, cr.top);
            }
        }

        let smoothScrollProg = -1;
        let targetRibbonPtrX = 0;
        let targetRibbonPtrY = 0;
        let smoothRibbonPtrX = 0;
        let smoothRibbonPtrY = 0;

        if (!prefersReducedMotion) {
            window.addEventListener('pointermove', (e) => {
                targetRibbonPtrX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2.0;
                targetRibbonPtrY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2.0;
            }, { passive: true });
        }

        function updateRibbonGeometry() {
            const rightX = getRightCorridorX();
            const scrollPhase = smoothScrollProg * Math.PI * 7.0;
            const journeyExcursion = Math.sin(smoothScrollProg * Math.PI * 3.0) * 0.52;

            strands.forEach((strand) => {
                const { spec, pts, curve, idx, mesh } = strand;
                mesh.material.uniforms.uDarkMix.value = ribbonState.darkModeMix;
                mesh.material.uniforms.uBaseOpacity.value =
                    spec.opacity * (1.0 - ribbonState.awardsRetreat * 0.35);

                for (let i = 0; i < controlCount; i++) {
                    const vNorm = i / (controlCount - 1);
                    const y = 7.8 - vNorm * 15.6;

                    const organicS = Math.sin(vNorm * Math.PI * 2.35 - scrollPhase + idx * 1.15) * spec.xSpread;
                    const foldZ = Math.cos(vNorm * Math.PI * 2.0 - scrollPhase * 0.8 + idx * 1.7) * 1.15;

                    const heroSweep = Math.max(0, 1.0 - smoothScrollProg * 7.5) * Math.sin(vNorm * Math.PI) * -0.95;
                    const finaleSweep = ribbonState.convergenceMix * Math.sin(vNorm * Math.PI * 1.5) * -1.85;
                    const awardsShift = ribbonState.awardsRetreat * 1.45;

                    // Subtle tactile silk ripple driven by cursor position
                    const bellMask = Math.sin(vNorm * Math.PI);
                    const cursorRippleX = smoothRibbonPtrX * 0.36 * bellMask * (1.0 - idx * 0.16);
                    const cursorRippleZ = -smoothRibbonPtrY * 0.32 * Math.sin(vNorm * Math.PI * 2.0 + idx * 0.7);

                    const x = rightX + organicS + journeyExcursion * 0.4 + heroSweep + finaleSweep + awardsShift + cursorRippleX;
                    const z = spec.zBase + foldZ - ribbonState.awardsRetreat * 1.2 + cursorRippleZ;

                    pts[i].set(x, y, z);
                }

                const dynamicTwist = spec.twist + Math.sin(scrollPhase * 0.4 + idx) * 0.55 + smoothRibbonPtrY * 0.14;
                updateRibbonBufferInPlace(
                    mesh.geometry,
                    curve,
                    spec.width,
                    dynamicTwist,
                    scrollPhase * 0.68 + idx * 1.2 + smoothRibbonPtrX * 0.24
                );
            });

            camera.position.x = smoothRibbonPtrX * 0.16;
            camera.position.y = Math.sin(smoothScrollProg * Math.PI * 2.0) * 0.24 - smoothRibbonPtrY * 0.14;
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
        }

        function renderRibbonLoop() {
            requestAnimationFrame(renderRibbonLoop);
            syncRibbonTargetsFromDOM();

            if (smoothScrollProg < 0) {
                smoothScrollProg = ribbonState.scrollProgress;
                ribbonState.darkModeMix = targetDarkMix;
                ribbonState.awardsRetreat = targetAwardsRetreat;
                ribbonState.convergenceMix = targetConvergence;
                updateRibbonGeometry();
                return;
            }

            const dProg = ribbonState.scrollProgress - smoothScrollProg;
            const dDark = targetDarkMix - ribbonState.darkModeMix;
            const dRetreat = targetAwardsRetreat - ribbonState.awardsRetreat;
            const dConv = targetConvergence - ribbonState.convergenceMix;
            const dPtrX = targetRibbonPtrX - smoothRibbonPtrX;
            const dPtrY = targetRibbonPtrY - smoothRibbonPtrY;

            if (
                Math.abs(dProg) > 0.00003 ||
                Math.abs(dDark) > 0.0005 ||
                Math.abs(dRetreat) > 0.0005 ||
                Math.abs(dConv) > 0.0005 ||
                Math.abs(dPtrX) > 0.0008 ||
                Math.abs(dPtrY) > 0.0008
            ) {
                smoothScrollProg += dProg * 0.12;
                ribbonState.darkModeMix += dDark * 0.10;
                ribbonState.awardsRetreat += dRetreat * 0.10;
                ribbonState.convergenceMix += dConv * 0.10;
                smoothRibbonPtrX += dPtrX * 0.075;
                smoothRibbonPtrY += dPtrY * 0.075;
                updateRibbonGeometry();
            }
        }

        renderRibbonLoop();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateRibbonGeometry();
        });
    }

    // ------------------------------------------------------------------------
    // 3. MUSEUM-GRADE 3D PHYSICAL AWARDS GALLERY (THREE.JS)
    //    Rebuilt to match Page 8 of Candour's Credentials Deck in silhouette,
    //    bevelled stepped/tapered geometry, PBR materials, and plaque detail.
    // ------------------------------------------------------------------------
    const awardsCanvas = document.getElementById('awards-3d-canvas');
    const trophyCatalog = [
        {
            step: '01 / 04 — PHYSICAL TROPHY EXHIBITION',
            title: '15th e4m IPRCCA Awards',
            meta: 'India PR & Corporate Communications Awards — Stepped satin-silver architectural monolith crowned with sculpted 3D mirror-copper "15" numerals (Databricks — Technology).'
        },
        {
            step: '02 / 04 — PHYSICAL TROPHY EXHIBITION',
            title: '48th BW Marketing World EXCEL Awards',
            meta: 'Integrated PR Marketing Campaign — Tapered brushed-gold monolith on a stepped obsidian plinth honouring Candour Communications & Legrand Data Center Solutions.'
        },
        {
            step: '03 / 04 — PHYSICAL TROPHY EXHIBITION',
            title: '48th BW Marketing World EXCEL Awards — Education',
            meta: 'Celebrating Excellence in Communication & Engagement — Tapered brushed-gold monolith on a stepped obsidian plinth honouring NIIT University & Candour Communications.'
        },
        {
            step: '04 / 04 — PHYSICAL TROPHY EXHIBITION',
            title: 'ET BrandEquity Kaleido Awards',
            meta: 'Specialist Agency of the Year — Multi-faceted jewel-toned crystal & silver "K" sculpture mounted on a brushed champagne-aluminium plinth.'
        }
    ];

    if (awardsCanvas && window.THREE && window.gsap) {
        const awRenderer = new THREE.WebGLRenderer({
            canvas: awardsCanvas,
            alpha: true,
            antialias: true
        });
        awRenderer.shadowMap.enabled = true;
        awRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        awRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        awRenderer.toneMappingExposure = 1.22;

        const stageEl = document.getElementById('awardsPinnedStage');
        const setAwardsSize = () => {
            const w = stageEl ? stageEl.clientWidth : window.innerWidth;
            const h = stageEl ? stageEl.clientHeight : window.innerHeight;
            awRenderer.setSize(w, h);
            awRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            return { w, h };
        };
        const initDim = setAwardsSize();

        const awScene = new THREE.Scene();
        const awCamera = new THREE.PerspectiveCamera(33, initDim.w / initDim.h, 0.1, 100);
        awCamera.position.set(0, 1.15, 11.7);

        // Multi-Light Studio Gallery Rig
        const hemi = new THREE.HemisphereLight(0xfff8fc, 0x24192c, 0.85);
        awScene.add(hemi);

        const keySpot = new THREE.SpotLight(0xfff8ee, 2.85);
        keySpot.position.set(5.4, 10.2, 8.4);
        keySpot.angle = Math.PI / 3.6;
        keySpot.penumbra = 0.72;
        keySpot.castShadow = true;
        keySpot.shadow.mapSize.width = 2048;
        keySpot.shadow.mapSize.height = 2048;
        keySpot.shadow.bias = -0.0003;
        awScene.add(keySpot);

        const fillLight = new THREE.DirectionalLight(0xf6eeff, 0.95);
        fillLight.position.set(-6.0, 4.5, 6.5);
        awScene.add(fillLight);

        const rimMagenta = new THREE.PointLight(0xe60099, 1.55, 22);
        rimMagenta.position.set(-5.4, 3.8, -3.8);
        awScene.add(rimMagenta);

        const rimWarm = new THREE.PointLight(0xff9436, 1.65, 22);
        rimWarm.position.set(7.4, 3.2, 4.2);
        awScene.add(rimWarm);

        // High-definition Studio Softbox Reflection Environment Map
        function makeStudioEnvTexture() {
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 256;
            const ctx = c.getContext('2d');

            const g = ctx.createLinearGradient(0, 0, 0, 256);
            g.addColorStop(0.0, '#1e152a');
            g.addColorStop(0.22, '#fffaf4');
            g.addColorStop(0.42, '#ded6e6');
            g.addColorStop(0.54, '#1b1424');
            g.addColorStop(0.76, '#ffbd78');
            g.addColorStop(1.0, '#0c0912');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 512, 256);

            // Studio overhead & side vertical softbox strips for crisp metallic reflections
            const strips = [
                { x: 54, y: 18, w: 130, h: 44, a: 0.96 },
                { x: 240, y: 24, w: 165, h: 36, a: 0.92 },
                { x: 430, y: 30, w: 62, h: 120, a: 0.85 },
                { x: 110, y: 140, w: 95, h: 30, a: 0.55 }
            ];
            strips.forEach((s) => {
                ctx.fillStyle = `rgba(255, 252, 246, ${s.a})`;
                ctx.fillRect(s.x, s.y, s.w, s.h);
            });

            const rawEnvTex = new THREE.CanvasTexture(c);
            rawEnvTex.mapping = THREE.EquirectangularReflectionMapping;
            if (THREE.PMREMGenerator) {
                const pmremGen = new THREE.PMREMGenerator(awRenderer);
                pmremGen.compileEquirectangularShader();
                const envRT = pmremGen.fromEquirectangular(rawEnvTex);
                rawEnvTex.dispose();
                pmremGen.dispose();
                return envRT.texture;
            }
            return rawEnvTex;
        }
        awScene.environment = makeStudioEnvTexture();

        function makeEngravedTexture(drawFn, w = 1024, h = 1536) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const ctx = c.getContext('2d');
            drawFn(ctx, w, h);
            const tex = new THREE.CanvasTexture(c);
            tex.anisotropy = Math.min(8, awRenderer.capabilities.getMaxAnisotropy());
            return tex;
        }

        function addBrushedGrain(ctx, w, h, vertical = false, alpha = 0.035) {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            const count = vertical ? 220 : 180;
            for (let i = 0; i < count; i++) {
                ctx.beginPath();
                if (vertical) {
                    const x = (i / count) * w + (Math.sin(i * 13.7) * 2);
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                } else {
                    const y = (i / count) * h + (Math.cos(i * 11.3) * 2);
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        // Soft Contact Shadow Decal Texture for grounding each trophy on the travertine pedestal
        const contactShadowTex = makeEngravedTexture((ctx, w, h) => {
            const g = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w * 0.48);
            g.addColorStop(0.0, 'rgba(18, 10, 22, 0.58)');
            g.addColorStop(0.48, 'rgba(18, 10, 22, 0.24)');
            g.addColorStop(1.0, 'rgba(18, 10, 22, 0.0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        }, 256, 256);

        function createContactShadow(width, depth) {
            const m = new THREE.Mesh(
                new THREE.PlaneGeometry(width, depth),
                new THREE.MeshBasicMaterial({
                    map: contactShadowTex,
                    transparent: true,
                    depthWrite: false
                })
            );
            m.rotation.x = -Math.PI / 2;
            m.position.y = -1.408;
            return m;
        }

        // Warm Champagne-Travertine Drum Pedestal (matching Page 8 of Credentials Deck)
        const getGalleryOffsetX = () => (window.innerWidth < 1080 ? 0.0 : 2.15);
        let galleryOffsetX = getGalleryOffsetX();

        const stoneTex = makeEngravedTexture((ctx, w, h) => {
            const g = ctx.createLinearGradient(0, 0, w, h);
            g.addColorStop(0, '#e3d0c7');
            g.addColorStop(0.5, '#d2bcb2');
            g.addColorStop(1, '#bca297');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            // Travertine mineral pores & warm stone strata
            ctx.strokeStyle = 'rgba(112, 82, 76, 0.18)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 28; i++) {
                ctx.beginPath();
                const y = i * (h / 28) + 10;
                ctx.moveTo(0, y);
                ctx.bezierCurveTo(w * 0.32, y - 9, w * 0.68, y + 14, w, y + 4);
                ctx.stroke();
            }
        }, 512, 512);

        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(4.52, 4.64, 0.78, 84),
            new THREE.MeshStandardMaterial({
                map: stoneTex,
                roughness: 0.68,
                metalness: 0.03
            })
        );
        pedestal.position.set(galleryOffsetX, -1.80, 0);
        pedestal.receiveShadow = true;
        awScene.add(pedestal);

        const pedRing = new THREE.Mesh(
            new THREE.TorusGeometry(4.52, 0.015, 16, 108),
            new THREE.MeshStandardMaterial({ color: 0xffa466, metalness: 0.82, roughness: 0.22 })
        );
        pedRing.rotation.x = Math.PI / 2;
        pedRing.position.set(galleryOffsetX, -1.41, 0);
        awScene.add(pedRing);

        // ---- TROPHY 1: 15th e4m IPRCCA (Stepped Satin-Silver Crown + Raised Plaque + 3D Copper "15") ----
        function buildIPRCCA3DTrophy() {
            const group = new THREE.Group();

            const silverBodyMat = new THREE.MeshStandardMaterial({
                color: 0xe6e7ef,
                metalness: 0.80,
                roughness: 0.23
            });

            // 1A. Full-height stepped architectural silver backing monolith behind "1" and "5" (exact Page 8 silhouette!)
            const backShape = new THREE.Shape();
            backShape.moveTo(-0.71, -1.36);
            backShape.lineTo(0.71, -1.36);
            backShape.lineTo(0.71, 0.38);
            backShape.lineTo(0.63, 0.38);
            backShape.lineTo(0.63, 1.32);
            backShape.lineTo(0.50, 1.32);
            backShape.lineTo(0.50, 1.44);
            backShape.lineTo(0.09, 1.44);
            // Central stepped notch between "1" and "5" visible in Page 8
            backShape.lineTo(0.09, 0.22);
            backShape.lineTo(-0.09, 0.22);
            backShape.lineTo(-0.09, 1.44);
            backShape.lineTo(-0.50, 1.44);
            backShape.lineTo(-0.50, 1.32);
            backShape.lineTo(-0.63, 1.32);
            backShape.lineTo(-0.63, 0.38);
            backShape.lineTo(-0.71, 0.38);
            backShape.closePath();

            const backPlate = new THREE.Mesh(
                new THREE.ExtrudeGeometry(backShape, {
                    depth: 0.24,
                    bevelEnabled: true,
                    bevelSegments: 3,
                    steps: 1,
                    bevelSize: 0.014,
                    bevelThickness: 0.014
                }),
                silverBodyMat
            );
            backPlate.position.z = -0.22;
            backPlate.castShadow = true;
            backPlate.receiveShadow = true;
            group.add(backPlate);

            // 1B. Raised Lower Front Brushed-Silver Plaque (with crowd silhouette frieze & exact IPRCCA typography)
            const frontTex = makeEngravedTexture((ctx, w, h) => {
                const bg = ctx.createLinearGradient(0, 0, w, h);
                bg.addColorStop(0.0, '#f8f8fb');
                bg.addColorStop(0.52, '#e8e9f0');
                bg.addColorStop(1.0, '#cfd2dc');
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, w, h);
                addBrushedGrain(ctx, w, h, false, 0.05);

                // Engraved crowd-of-people contour frieze across upper plaque crest (matching Page 8)
                ctx.strokeStyle = 'rgba(72, 76, 90, 0.55)';
                ctx.lineWidth = 3.2;
                ctx.beginPath();
                const heads = 13;
                for (let i = 0; i < heads; i++) {
                    const cx = 78 + i * ((w - 156) / (heads - 1));
                    const cy = 96 + (i % 2 === 0 ? -10 : 8);
                    // Shoulders
                    ctx.moveTo(cx - 32, 168);
                    ctx.quadraticCurveTo(cx - 26, cy + 26, cx - 10, cy + 22);
                    ctx.moveTo(cx + 10, cy + 22);
                    ctx.quadraticCurveTo(cx + 26, cy + 26, cx + 32, 168);
                }
                ctx.stroke();
                for (let i = 0; i < heads; i++) {
                    const cx = 78 + i * ((w - 156) / (heads - 1));
                    const cy = 96 + (i % 2 === 0 ? -10 : 8);
                    ctx.beginPath();
                    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // "15 th" + red "e4m"
                ctx.textAlign = 'center';
                ctx.fillStyle = '#333642';
                ctx.font = '600 54px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('15 th', w / 2 - 74, 272);
                ctx.fillStyle = '#d62027';
                ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('e4m', w / 2 + 86, 272);

                // Twin blue vertical bars + bold blue "PRCCA"
                ctx.fillStyle = '#0068bd';
                ctx.fillRect(156, 306, 13, 108);
                ctx.fillRect(178, 306, 13, 108);
                ctx.textAlign = 'left';
                ctx.font = '900 132px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('PRCCA', 202, 410);

                // Blue underline + subtitle
                ctx.fillRect(156, 428, w - 312, 7);
                ctx.textAlign = 'center';
                ctx.fillStyle = '#191b24';
                ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('INDIA PR & CORPORATE', w / 2, 468);
                ctx.fillText('COMMUNICATIONS AWARDS 2024', w / 2, 502);
                ctx.fillStyle = '#0068bd';
                ctx.fillRect(156, 516, w - 312, 4);

                // Campaign & Winner Engraving
                ctx.fillStyle = '#12131a';
                ctx.font = '700 38px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Redefining the Future of Data & AI', w / 2, 628);

                ctx.fillStyle = '#1f2029';
                ctx.font = '700 39px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Databricks', w / 2, 742);
                ctx.fillText('Candour Communications', w / 2, 796);
                ctx.fillStyle = '#383a47';
                ctx.font = '700 35px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Technology', w / 2, 852);
            }, 1024, 1024);

            const frontPlaqueMat = new THREE.MeshStandardMaterial({
                map: frontTex,
                metalness: 0.48,
                roughness: 0.25
            });

            const frontPlaque = new THREE.Mesh(
                new THREE.BoxGeometry(1.44, 1.72, 0.22),
                [silverBodyMat, silverBodyMat, silverBodyMat, silverBodyMat, frontPlaqueMat, silverBodyMat]
            );
            frontPlaque.position.set(0, -0.50, 0.08);
            frontPlaque.castShadow = true;
            frontPlaque.receiveShadow = true;
            group.add(frontPlaque);

            // Slim bevelled silver footplate
            const silverFoot = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.06, 0.52), silverBodyMat);
            silverFoot.position.set(0, -1.37, -0.02);
            silverFoot.castShadow = true;
            group.add(silverFoot);

            // 1C. Sculpted Bevelled Mirror-Copper "1" & "5" Numerals sitting on top of the front plaque
            const copperMat = new THREE.MeshStandardMaterial({
                color: 0xd9691e,
                metalness: 0.92,
                roughness: 0.14
            });
            const numExtrude = {
                depth: 0.20,
                bevelEnabled: true,
                bevelSegments: 5,
                steps: 1,
                bevelSize: 0.020,
                bevelThickness: 0.020
            };

            const oneShape = new THREE.Shape();
            oneShape.moveTo(-0.41, 0);
            oneShape.lineTo(-0.19, 0);
            oneShape.lineTo(-0.19, 0.92);
            oneShape.lineTo(-0.56, 0.92);
            oneShape.lineTo(-0.56, 0.73);
            oneShape.lineTo(-0.41, 0.73);
            oneShape.closePath();

            const oneMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(oneShape, numExtrude), copperMat);
            oneMesh.position.set(0.0, 0.37, -0.02);
            oneMesh.castShadow = true;
            group.add(oneMesh);

            const fiveShape = new THREE.Shape();
            fiveShape.moveTo(0.14, 0.92);
            fiveShape.lineTo(0.60, 0.92);
            fiveShape.lineTo(0.60, 0.73);
            fiveShape.lineTo(0.31, 0.73);
            fiveShape.lineTo(0.30, 0.56);
            fiveShape.bezierCurveTo(0.52, 0.58, 0.63, 0.45, 0.63, 0.27);
            fiveShape.bezierCurveTo(0.63, 0.07, 0.49, -0.02, 0.33, -0.02);
            fiveShape.bezierCurveTo(0.18, -0.02, 0.10, 0.05, 0.08, 0.17);
            fiveShape.lineTo(0.26, 0.21);
            fiveShape.bezierCurveTo(0.27, 0.14, 0.31, 0.12, 0.36, 0.12);
            fiveShape.bezierCurveTo(0.43, 0.12, 0.46, 0.18, 0.46, 0.27);
            fiveShape.bezierCurveTo(0.46, 0.36, 0.41, 0.41, 0.33, 0.41);
            fiveShape.bezierCurveTo(0.26, 0.41, 0.20, 0.39, 0.15, 0.36);
            fiveShape.closePath();

            const fiveMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(fiveShape, numExtrude), copperMat);
            fiveMesh.position.set(-0.02, 0.37, -0.02);
            fiveMesh.castShadow = true;
            group.add(fiveMesh);

            group.add(createContactShadow(1.88, 0.96));
            return group;
        }

        // ---- TROPHIES 2 & 3: Tapered 48th BW Marketing World Gold EXCEL Monoliths ----
        function buildTaperedTrapezoidGeometry(bottomW, topW, height, depth) {
            // Builds a bevelled-look tapered prism with clean planar UVs on the front face
            const geo = new THREE.BoxGeometry(bottomW, height, depth, 2, 4, 2);
            const pos = geo.attributes.position;
            const halfH = height / 2;
            const ratio = topW / bottomW;
            for (let i = 0; i < pos.count; i++) {
                const y = pos.getY(i);
                const t = (y + halfH) / height; // 0 at bottom, 1 at top
                const scaleX = 1.0 + (ratio - 1.0) * t;
                const scaleZ = 1.0 - 0.12 * t;
                pos.setX(i, pos.getX(i) * scaleX);
                pos.setZ(i, pos.getZ(i) * scaleZ);
            }
            geo.computeVertexNormals();
            return geo;
        }

        function buildGoldExcel3DTrophy(clientLine1, clientLine2, baseCategory) {
            const group = new THREE.Group();

            const goldFaceTex = makeEngravedTexture((ctx, w, h) => {
                // Rich vertical brushed 24k gold sheen matching Page 8
                const g = ctx.createLinearGradient(0, 0, w, h);
                g.addColorStop(0.0, '#fff099');
                g.addColorStop(0.28, '#f7cc4f');
                g.addColorStop(0.65, '#e7ae28');
                g.addColorStop(1.0, '#ffd968');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, w, h);
                addBrushedGrain(ctx, w, h, true, 0.055);

                // Subtle bright left bevel highlight line (seen on Page 8 gold monoliths)
                const edgeGlow = ctx.createLinearGradient(0, 0, 56, 0);
                edgeGlow.addColorStop(0, 'rgba(255, 253, 228, 0.85)');
                edgeGlow.addColorStop(1, 'rgba(255, 253, 228, 0.0)');
                ctx.fillStyle = edgeGlow;
                ctx.fillRect(0, 0, 56, h);

                ctx.textAlign = 'center';
                ctx.fillStyle = '#1c1506';
                ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('48th EXCEL AWARDS', w / 2, 206);
                ctx.font = '900 50px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('BW MARKETING', w / 2, 262);
                ctx.font = '300 64px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('WORLD.', w / 2, 328);

                // Signature Oversized White/Silver Diagonal "X" Emblem behind EX CEL (exact Page 8 detail!)
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
                ctx.lineWidth = 34;
                ctx.lineCap = 'square';
                ctx.beginPath();
                ctx.moveTo(w / 2 - 118, 318);
                ctx.lineTo(w / 2 + 118, 534);
                ctx.moveTo(w / 2 + 118, 318);
                ctx.lineTo(w / 2 - 118, 534);
                ctx.stroke();
                ctx.restore();

                // "EX   CEL" flanking the giant white X
                ctx.fillStyle = '#181205';
                ctx.font = '300 132px "Plus Jakarta Sans", sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('EX', w / 2 - 58, 474);
                ctx.textAlign = 'left';
                ctx.fillText('CEL', w / 2 + 48, 474);

                ctx.textAlign = 'center';
                ctx.fillStyle = '#1c1506';
                ctx.font = '400 50px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('AWARDS', w / 2 - 96, 566);
                ctx.fillStyle = '#c81922';
                ctx.font = '600 50px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('2026', w / 2 + 128, 566);

                // Crimson Enamel Ribbon Band
                ctx.fillStyle = '#df1d26';
                ctx.fillRect(148, 604, w - 296, 134);
                ctx.fillStyle = '#ffffff';
                ctx.font = '800 31px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('CELEBRATING EXCELLENCE', w / 2, 648);
                ctx.fillText('IN COMMUNICATION', w / 2, 686);
                ctx.fillText('& ENGAGEMENT', w / 2, 722);

                // Engraved Client & Agency Names
                ctx.fillStyle = '#171104';
                ctx.font = '700 44px "Plus Jakarta Sans", sans-serif';
                if (clientLine2) {
                    ctx.fillText(clientLine1, w / 2, 926);
                    ctx.fillText(clientLine2, w / 2, 980);
                } else {
                    ctx.fillText(clientLine1, w / 2, 954);
                }

                ctx.font = '700 44px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Candour', w / 2, 1138);
                ctx.fillText('Communications', w / 2, 1192);
            }, 1024, 1536);

            const goldSideMat = new THREE.MeshStandardMaterial({
                color: 0xf5be36,
                metalness: 0.92,
                roughness: 0.18
            });
            const goldFrontMat = new THREE.MeshStandardMaterial({
                map: goldFaceTex,
                metalness: 0.76,
                roughness: 0.21
            });

            const taperedGeo = buildTaperedTrapezoidGeometry(1.26, 1.15, 2.54, 0.30);
            const pillar = new THREE.Mesh(
                taperedGeo,
                [goldSideMat, goldSideMat, goldSideMat, goldSideMat, goldFrontMat, goldSideMat]
            );
            pillar.position.y = 0.23;
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            group.add(pillar);

            // Gold Transition Collar + Two-Tier Stepped Satin-Obsidian Plinth
            const collar = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.045, 0.38), goldSideMat);
            collar.position.y = -1.05;
            group.add(collar);

            const blackMat = new THREE.MeshStandardMaterial({
                color: 0x15141a,
                roughness: 0.24,
                metalness: 0.30
            });

            const upperStep = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 0.48), blackMat);
            upperStep.position.y = -1.09;
            upperStep.castShadow = true;
            group.add(upperStep);

            const plinthTex = makeEngravedTexture((ctx, w, h) => {
                const bg = ctx.createLinearGradient(0, 0, 0, h);
                bg.addColorStop(0, '#222029');
                bg.addColorStop(1, '#121117');
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, w, h);
                ctx.strokeStyle = 'rgba(255,255,255,0.16)';
                ctx.lineWidth = 3;
                ctx.strokeRect(18, 18, w - 36, h - 36);
                ctx.fillStyle = '#f6f3ee';
                ctx.textAlign = 'center';
                ctx.font = '700 44px "Plus Jakarta Sans", sans-serif';
                ctx.fillText(baseCategory, w / 2, h / 2 + 15);
            }, 1024, 240);

            const plinthFrontMat = new THREE.MeshStandardMaterial({
                map: plinthTex,
                roughness: 0.28,
                metalness: 0.22
            });

            const base = new THREE.Mesh(
                new THREE.BoxGeometry(1.52, 0.30, 0.56),
                [blackMat, blackMat, blackMat, blackMat, plinthFrontMat, blackMat]
            );
            base.position.y = -1.25;
            base.castShadow = true;
            base.receiveShadow = true;
            group.add(base);

            group.add(createContactShadow(1.86, 0.96));
            return group;
        }

        // ---- TROPHY 4: ET BrandEquity Kaleido Multi-Faceted Jewel-Crystal "K" Sculpture ----
        function buildKaleidoAcrylic3DTrophy() {
            const group = new THREE.Group();
            const kSculpture = new THREE.Group();

            // 4A. Brushed Silver/Platinum Architectural "K" Backing Chassis (positioned strictly behind z=0 so it frames the metallic right side-returns without occluding facets)
            const chassisMat = new THREE.MeshStandardMaterial({
                color: 0xdad6e2,
                metalness: 0.88,
                roughness: 0.18
            });
            const kOutline = new THREE.Shape();
            kOutline.moveTo(-0.58, 0.0);
            kOutline.lineTo(0.60, 0.0);
            kOutline.lineTo(0.06, 0.92);
            kOutline.lineTo(0.58, 1.84);
            kOutline.lineTo(-0.58, 1.84);
            kOutline.closePath();

            const chassis = new THREE.Mesh(
                new THREE.ExtrudeGeometry(kOutline, {
                    depth: 0.20,
                    bevelEnabled: true,
                    bevelSegments: 3,
                    steps: 1,
                    bevelSize: 0.012,
                    bevelThickness: 0.012
                }),
                chassisMat
            );
            chassis.position.z = -0.225;
            chassis.castShadow = true;
            chassis.receiveShadow = true;
            kSculpture.add(chassis);

            // 4B. Watertight 12-Prism 3D Pyramidal Jewel-Toned Acrylic Mosaic (exact Page 8 Kaleido "K" geometry & CCW +Z outward normals!)
            function addJewelPrismFacet(p0, p1, p2, apexZ, hex) {
                // Guarantee strict Counter-Clockwise (CCW) 2D vertex order so normals always face +Z toward the camera
                let a = p0, b = p1, c = p2;
                const signedArea2 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
                if (signedArea2 < 0) {
                    const tmp = b;
                    b = c;
                    c = tmp;
                }

                const zBack = 0.0;
                const zEdge = 0.052;
                const cx = (a[0] + b[0] + c[0]) / 3;
                const cy = (a[1] + b[1] + c[1]) / 3;

                const positions = [];
                const pushTri = (v1, v2, v3) => {
                    positions.push(
                        v1[0], v1[1], v1[2],
                        v2[0], v2[1], v2[2],
                        v3[0], v3[1], v3[2]
                    );
                };

                // 3 angled crystal front pyramid faces (CCW around +Z)
                const A = [a[0], a[1], zEdge];
                const B = [b[0], b[1], zEdge];
                const C = [c[0], c[1], zEdge];
                const P = [cx, cy, apexZ];
                pushTri(A, B, P);
                pushTri(B, C, P);
                pushTri(C, A, P);

                // Side depth skirts from zBack (0.0) to zEdge (0.052) so right V-notch & outer edges show solid jewel acrylic thickness
                const Ab = [a[0], a[1], zBack];
                const Bb = [b[0], b[1], zBack];
                const Cb = [c[0], c[1], zBack];
                pushTri(Ab, Bb, B);
                pushTri(Ab, B, A);
                pushTri(Bb, Cb, C);
                pushTri(Bb, C, B);
                pushTri(Cb, Ab, A);
                pushTri(Cb, A, C);

                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                geo.computeVertexNormals();

                const mat = new THREE.MeshPhysicalMaterial({
                    color: hex,
                    emissive: hex,
                    emissiveIntensity: 0.24,
                    metalness: 0.06,
                    roughness: 0.13,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.06,
                    reflectivity: 1.0
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                return mesh;
            }

            // Exact 10-vertex manifold triangulation of the Kaleido "K" matching Page 8 of the Credentials Deck
            const TL = [-0.58, 1.84], TM = [0.02, 1.84], TR = [0.58, 1.84];
            const UL = [-0.58, 1.20], UC = [-0.26, 1.46], KN = [0.06, 0.92];
            const LL = [-0.58, 0.58], MC = [-0.26, 0.86];
            const BL = [-0.58, 0.0],  BM = [0.02, 0.0],  LR = [0.31, 0.0], BR = [0.60, 0.0];

            const facets = [
                // Upper-left electric violet & deep royal purple
                { tri: [TL, UC, TM], z: 0.128, col: 0x7c12eb },
                { tri: [TL, UL, UC], z: 0.118, col: 0x4b0d7a },
                // Upper-right hot fuchsia-magenta & vivid coral-scarlet wing
                { tri: [TM, UC, KN], z: 0.136, col: 0xf5007e },
                { tri: [TM, KN, TR], z: 0.126, col: 0xff2b22 },
                // Central wine-plum & deep ruby-crimson heart facets
                { tri: [UL, MC, UC], z: 0.124, col: 0x8e0e52 },
                { tri: [UC, MC, KN], z: 0.142, col: 0xd90b2c },
                // Mid-to-lower left cerise-pink, blazing tangerine & sunburst gold
                { tri: [UL, LL, MC], z: 0.122, col: 0xe6146e },
                { tri: [LL, BL, MC], z: 0.126, col: 0xff6a00 },
                { tri: [BL, BM, MC], z: 0.122, col: 0xffbe00 },
                // Lower-center warm amber & lower-right rose-magenta + flame-red wing
                { tri: [MC, BM, KN], z: 0.134, col: 0xff9100 },
                { tri: [BM, LR, KN], z: 0.128, col: 0xff0f6b },
                { tri: [LR, BR, KN], z: 0.122, col: 0xe6192b }
            ];
            facets.forEach((f) => {
                kSculpture.add(addJewelPrismFacet(f.tri[0], f.tri[1], f.tri[2], f.z, f.col));
            });

            kSculpture.position.y = -0.44;
            group.add(kSculpture);

            // 4C. Brushed Champagne-Silver Base Block with high-contrast Red "ET" Square + BRANDEQUITY.com Header
            const baseTex = makeEngravedTexture((ctx, w, h) => {
                const g = ctx.createLinearGradient(0, 0, w, h);
                g.addColorStop(0.0, '#f3efeb');
                g.addColorStop(0.55, '#e5dfd8');
                g.addColorStop(1.0, '#cfc7be');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, w, h);
                addBrushedGrain(ctx, w, h, false, 0.05);

                // Red "ET" badge + underlined BRANDEQUITY.com
                ctx.fillStyle = '#d91f26';
                ctx.fillRect(184, 82, 72, 62);
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = '800 40px Georgia, serif';
                ctx.fillText('ET', 220, 128);

                ctx.textAlign = 'left';
                ctx.fillStyle = '#14111a';
                ctx.font = '700 44px Georgia, serif';
                ctx.fillText('BRANDEQUITY', 268, 128);
                ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('.com', 612, 128);
                ctx.fillRect(268, 138, 412, 4);

                ctx.textAlign = 'center';
                ctx.fillStyle = '#110e16';
                ctx.font = '800 54px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Specialist Agency', w / 2, 258);
                ctx.fillText('of the Year', w / 2, 322);

                ctx.fillStyle = '#1e1928';
                ctx.font = '600 44px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('ET Brand Equity', w / 2, 422);
                ctx.fillText('Kaleido 2026', w / 2, 478);
            }, 900, 560);

            const baseSilver = new THREE.MeshStandardMaterial({
                color: 0xe2dcd4,
                metalness: 0.62,
                roughness: 0.28
            });
            const baseFront = new THREE.MeshStandardMaterial({
                map: baseTex,
                metalness: 0.22,
                roughness: 0.32
            });
            const kBase = new THREE.Mesh(
                new THREE.BoxGeometry(1.48, 0.96, 0.46),
                [baseSilver, baseSilver, baseSilver, baseSilver, baseFront, baseSilver]
            );
            kBase.position.y = -0.92;
            kBase.castShadow = true;
            kBase.receiveShadow = true;
            group.add(kBase);

            group.add(createContactShadow(1.86, 0.96));
            return group;
        }

        const trophies = [
            buildIPRCCA3DTrophy(),
            buildGoldExcel3DTrophy('Legrand Data', 'Center Solutions', 'Integrated PR Marketing Campaign'),
            buildGoldExcel3DTrophy('NIIT University', '', 'Education'),
            buildKaleidoAcrylic3DTrophy()
        ];

        const getFinalSlots = (offsetX) => [
            { x: offsetX - 2.48, y: 0.0, z: -0.18, rotY: 0.20 },
            { x: offsetX - 0.82, y: 0.0, z: 0.18, rotY: 0.07 },
            { x: offsetX + 0.82, y: 0.0, z: 0.18, rotY: -0.07 },
            { x: offsetX + 2.48, y: 0.0, z: -0.18, rotY: -0.20 }
        ];
        let finalSlots = getFinalSlots(galleryOffsetX);

        trophies.forEach((t) => {
            t.position.set(galleryOffsetX + 9.6, 0.16, 1.4);
            t.rotation.set(0.06, -Math.PI * 1.12, 0.04);
            awScene.add(t);
        });

        const stepEl = document.getElementById('trophyStepCounter');
        const titleEl = document.getElementById('trophyActiveTitle');
        const metaEl = document.getElementById('trophyActiveMeta');
        const dotEls = document.querySelectorAll('.trophy-dot');
        let lastActiveIdx = -1;

        function setReadout(idx) {
            if (idx === lastActiveIdx || !trophyCatalog[idx]) return;
            lastActiveIdx = idx;
            const info = trophyCatalog[idx];
            if (stepEl) stepEl.textContent = info.step;
            if (titleEl) titleEl.textContent = info.title;
            if (metaEl) metaEl.textContent = info.meta;
            dotEls.forEach((d, i) => d.classList.toggle('is-current', i === idx));
        }
        setReadout(0);

        let pointerNormX = 0;
        let pointerNormY = 0;
        let targetAwPtrX = 0;
        let targetAwPtrY = 0;
        let awPtrRafPending = false;

        const renderAwardsFrame = () => {
            keySpot.position.x = 5.4 + pointerNormX * 1.85;
            keySpot.position.y = 10.2 - pointerNormY * 1.05;
            awCamera.position.x = galleryOffsetX * 0.18 + pointerNormX * 0.34;
            awCamera.lookAt(galleryOffsetX * 0.45 + pointerNormX * 0.16, -0.18 + pointerNormY * 0.10, 0);
            awRenderer.render(awScene, awCamera);
        };

        const tickAwardsPointer = () => {
            const dx = targetAwPtrX - pointerNormX;
            const dy = targetAwPtrY - pointerNormY;
            if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
                pointerNormX += dx * 0.12;
                pointerNormY += dy * 0.12;
                renderAwardsFrame();
                requestAnimationFrame(tickAwardsPointer);
            } else {
                awPtrRafPending = false;
            }
        };

        if (stageEl && !prefersReducedMotion) {
            stageEl.addEventListener('pointermove', (e) => {
                const rect = stageEl.getBoundingClientRect();
                targetAwPtrX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
                targetAwPtrY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
                if (!awPtrRafPending) {
                    awPtrRafPending = true;
                    requestAnimationFrame(tickAwardsPointer);
                }
            }, { passive: true });
        }

        gsap.fromTo(
            trophies[0].position,
            { x: galleryOffsetX + 9.6 },
            {
                x: galleryOffsetX + 3.6,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#awardsPinnedStage',
                    start: 'top 85%',
                    end: 'top top',
                    scrub: true,
                    onUpdate: renderAwardsFrame
                }
            }
        );

        const awardsMasterTL = gsap.timeline({
            scrollTrigger: {
                trigger: '#awardsPinnedStage',
                start: 'top top',
                end: '+=270%',
                pin: true,
                scrub: 1,
                onUpdate: (self) => {
                    const idx = Math.min(3, Math.floor(self.progress * 4));
                    setReadout(idx);
                    renderAwardsFrame();
                }
            }
        });

        // Clickable Trophy Dots — jump smoothly to the selected trophy's exhibition beat
        dotEls.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                setReadout(idx);
                const st = awardsMasterTL.scrollTrigger;
                if (st) {
                    const stepFractions = [0.16, 0.42, 0.68, 0.94];
                    const targetScrollY = st.start + (st.end - st.start) * stepFractions[idx];
                    if (lenis) {
                        lenis.scrollTo(targetScrollY);
                    } else {
                        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                    }
                }
                renderAwardsFrame();
            });
        });

        trophies.forEach((trophy, idx) => {
            const slot = finalSlots[idx];
            const startAt = idx * 0.78;

            awardsMasterTL.to(
                trophy.position,
                {
                    x: slot.x,
                    y: slot.y,
                    z: slot.z,
                    duration: 1.05,
                    ease: 'power3.out'
                },
                startAt
            );

            awardsMasterTL.to(
                trophy.rotation,
                {
                    x: 0,
                    y: slot.rotY,
                    z: 0,
                    duration: 1.05,
                    ease: 'power2.out'
                },
                startAt
            );
        });

        awardsMasterTL.to(
            awCamera.position,
            {
                z: 11.05,
                y: 1.12,
                duration: 0.7,
                ease: 'sine.inOut'
            },
            2.9
        );

        renderAwardsFrame();

        window.addEventListener('resize', () => {
            const { w, h } = setAwardsSize();
            awCamera.aspect = w / h;
            awCamera.updateProjectionMatrix();
            renderAwardsFrame();
        });
    }

    // ------------------------------------------------------------------------
    // 4. HEADER ADAPTATION, ACTIVE SECTION SPY & TOP PROGRESS HAIRLINE
    // ------------------------------------------------------------------------
    const header = document.getElementById('editorialHeader');
    const progressLine = document.getElementById('scrollHairlineProgress');
    const navLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
    const navTargets = navLinks
        .map((link) => {
            const el = document.querySelector(link.getAttribute('href'));
            return el ? { link, el } : null;
        })
        .filter(Boolean);

    function updateActiveNavSpy() {
        const probeY = window.innerHeight * 0.34;
        let activeLink = null;
        for (let i = 0; i < navTargets.length; i++) {
            const rect = navTargets[i].el.getBoundingClientRect();
            if (rect.top <= probeY && rect.bottom >= 80) {
                activeLink = navTargets[i].link;
            }
        }
        navLinks.forEach((l) => l.classList.toggle('is-active', l === activeLink));
    }

    window.addEventListener('scroll', () => {
        const y = window.scrollY || 0;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        if (progressLine) {
            progressLine.style.width = ((y / max) * 100).toFixed(2) + '%';
        }
        if (header) {
            header.classList.toggle('is-condensed', y > 48);
        }
        updateActiveNavSpy();
    }, { passive: true });
    updateActiveNavSpy();

    if (window.ScrollTrigger) {
        ['#lightStageOne', '#lightStageTwo'].forEach((sel) => {
            if (!document.querySelector(sel)) return;
            ScrollTrigger.create({
                trigger: sel,
                start: 'top 64px',
                end: 'bottom 64px',
                onToggle: (self) => {
                    if (header) header.classList.toggle('on-light', self.isActive);
                }
            });
        });
    }

    // ------------------------------------------------------------------------
    // 5. SERVICES STICKY CAMPAIGN PREVIEW SWITCHER (SCROLL + HOVER + CLICK)
    // ------------------------------------------------------------------------
    const serviceChapters = Array.from(document.querySelectorAll('.offering-chapter[data-preview-img]'));
    const servicePreviewImg = document.getElementById('servicePreviewImg');
    const servicePreviewBadge = document.getElementById('servicePreviewBadge');
    const servicePreviewTitle = document.getElementById('servicePreviewTitle');
    const servicePreviewCaption = document.getElementById('servicePreviewCaption');
    const serviceProgressFill = document.getElementById('serviceProgressFill');

    function activateServiceChapter(chapter) {
        if (!chapter) return;
        const chapterIdx = serviceChapters.indexOf(chapter);
        serviceChapters.forEach((c) => c.classList.toggle('is-active', c === chapter));

        if (serviceProgressFill && chapterIdx >= 0 && serviceChapters.length > 0) {
            const pct = (((chapterIdx + 1) / serviceChapters.length) * 100).toFixed(2);
            serviceProgressFill.style.width = pct + '%';
        }

        const nextImg = chapter.getAttribute('data-preview-img');
        const nextBadge = chapter.getAttribute('data-preview-badge');
        const nextTitle = chapter.getAttribute('data-preview-title');
        const nextCaption = chapter.getAttribute('data-preview-caption');

        if (servicePreviewImg && nextImg && servicePreviewImg.getAttribute('src') !== nextImg) {
            servicePreviewImg.style.opacity = '0.32';
            setTimeout(() => {
                servicePreviewImg.setAttribute('src', nextImg);
                servicePreviewImg.setAttribute('alt', nextTitle || 'Candour campaign execution');
                servicePreviewImg.style.opacity = '1';
            }, 130);
        }
        if (servicePreviewBadge && nextBadge) servicePreviewBadge.textContent = nextBadge;
        if (servicePreviewTitle && nextTitle) servicePreviewTitle.textContent = nextTitle;
        if (servicePreviewCaption && nextCaption) servicePreviewCaption.textContent = nextCaption;
    }

    serviceChapters.forEach((chapter) => {
        chapter.addEventListener('mouseenter', () => activateServiceChapter(chapter));
        chapter.addEventListener('focusin', () => activateServiceChapter(chapter));
        chapter.addEventListener('click', () => activateServiceChapter(chapter));

        if (window.ScrollTrigger) {
            ScrollTrigger.create({
                trigger: chapter,
                start: 'top 56%',
                end: 'bottom 44%',
                onEnter: () => activateServiceChapter(chapter),
                onEnterBack: () => activateServiceChapter(chapter)
            });
        }
    });

    // ------------------------------------------------------------------------
    // 6. INTERACTIVE PAN-INDIA FOOTPRINT & REGIONAL MEDIA CONSOLE (#about)
    // ------------------------------------------------------------------------
    const footprintConsole = document.getElementById('indiaFootprintConsole');
    const hubBadgeEl = document.getElementById('hubActiveBadge');
    const hubTitleEl = document.getElementById('hubActiveTitle');
    const hubDescEl = document.getElementById('hubActiveDesc');
    const hubButtons = document.querySelectorAll('.hub-selector-btn[data-hub]');
    const mapNodes = document.querySelectorAll('.map-hub-node[data-hub]');
    const mapArcs = document.querySelectorAll('.india-signal-arcs path[data-arc]');
    const cityCardChips = document.querySelectorAll('.city-node-chip[data-hub]');

    const hubDirectory = {
        delhi: {
            badge: 'HEADQUARTERS & NCR OFFICE',
            title: 'Delhi HQ & Gurgaon',
            desc: 'National headquarters leading integrated marketing strategy, corporate & policy PR counsel, national print/broadcast media desks, and multi-city partner summits.'
        },
        mumbai: {
            badge: 'WESTERN REGION OFFICE',
            title: 'Mumbai',
            desc: 'Dedicated western India office anchoring BFSI, conglomerate, financial press, broadcast studios, digital commerce, and enterprise leadership mandates.'
        },
        bangalore: {
            badge: 'SOUTHERN TECH HUB OFFICE',
            title: 'Bangalore',
            desc: 'Core technology, SaaS, cloud, cybersecurity, AI, and employer-branding hub executing CXO profiling, developer boot camps, and enterprise media outreach.'
        },
        chennai: {
            badge: 'SOUTHERN REGION OFFICE',
            title: 'Chennai',
            desc: 'Full-service southern office supporting enterprise IT, product engineering, manufacturing, healthcare, and regional Tamil & southern media relations.'
        },
        pune: {
            badge: 'REMOTELY SERVICED HUB',
            title: 'Pune',
            desc: 'Seamless PR, employer branding, and industry media execution for enterprise technology, R&D centres, automotive, and higher-education mandates.'
        },
        hyderabad: {
            badge: 'REMOTELY SERVICED HUB',
            title: 'Hyderabad',
            desc: 'High-impact technology, pharmaceuticals, public-health, and GCC communications—including flagship on-ground leadership launches and regional press.'
        },
        kolkata: {
            badge: 'REMOTELY SERVICED HUB',
            title: 'Kolkata',
            desc: 'Eastern India media relations, regional language storytelling, retail/MSME ecosystem outreach, and on-ground event coordination.'
        },
        network: {
            badge: 'PAN-INDIA AFFILIATE NETWORK',
            title: '30+ Cities & Regions Across India',
            desc: 'Established affiliate network facilitating seamless on-ground activations, regional-language media campaigns, and grassroots reach across 30+ Indian cities and regions.'
        }
    };

    function selectIndiaHub(hubKey) {
        const data = hubDirectory[hubKey];
        if (!data) return;

        hubButtons.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-hub') === hubKey));
        cityCardChips.forEach((c) => c.classList.toggle('is-selected', c.getAttribute('data-hub') === hubKey));
        mapNodes.forEach((n) => {
            const match = hubKey === 'network' || n.getAttribute('data-hub') === hubKey;
            n.classList.toggle('is-active', match);
        });
        mapArcs.forEach((a) => {
            const match = hubKey === 'delhi' || hubKey === 'network' || a.getAttribute('data-arc') === hubKey;
            a.classList.toggle('is-highlighted', match);
        });

        if (footprintConsole) {
            footprintConsole.classList.toggle('is-network-mode', hubKey === 'network');
        }
        if (hubBadgeEl) hubBadgeEl.textContent = data.badge;
        if (hubTitleEl) hubTitleEl.textContent = data.title;
        if (hubDescEl) hubDescEl.textContent = data.desc;
    }

    hubButtons.forEach((btn) => {
        btn.addEventListener('click', () => selectIndiaHub(btn.getAttribute('data-hub')));
    });

    mapNodes.forEach((node) => {
        const key = node.getAttribute('data-hub');
        node.addEventListener('click', () => selectIndiaHub(key));
        node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectIndiaHub(key);
            }
        });
    });

    cityCardChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            selectIndiaHub(chip.getAttribute('data-hub'));
            if (footprintConsole) {
                if (lenis) {
                    lenis.scrollTo(footprintConsole, { offset: -96 });
                } else {
                    footprintConsole.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });

    // ------------------------------------------------------------------------
    // 7. PORTFOLIO BRAND WALL FILTERING + CLIENT → CASE STUDY JUMP
    // ------------------------------------------------------------------------
    const filterButtons = document.querySelectorAll('#portfolio .portfolio-filter-nav .filter-tab');
    const brandTiles = Array.from(document.querySelectorAll('#portfolio .brand-mark-tile'));
    const brandCountLabel = document.getElementById('portfolioCountLabel');
    const workTabs = document.querySelectorAll('#work .work-filter-nav .filter-tab');
    const workItems = Array.from(document.querySelectorAll('#work [data-work-category]'));
    const workTallyEl = document.getElementById('workActiveTally');
    const workArchiveHeader = document.getElementById('workArchiveHeader');
    const workArchiveGrid = document.getElementById('workArchiveGrid');

    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            filterButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-filter');
            const shownTiles = [];

            brandTiles.forEach((tile) => {
                const tileCat = tile.getAttribute('data-category') || '';
                const show = cat === 'all' || tileCat.split(' ').includes(cat);
                tile.style.display = show ? 'flex' : 'none';
                if (show) shownTiles.push(tile);
            });

            if (!prefersReducedMotion && window.gsap && shownTiles.length) {
                gsap.fromTo(
                    shownTiles,
                    { opacity: 0, y: 10, scale: 0.97 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.36, stagger: 0.012, ease: 'power2.out', overwrite: true }
                );
            }

            if (brandCountLabel) {
                brandCountLabel.textContent = `${shownTiles.length} Brand Relationships`;
            }
            if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
    });

    // 8. CASE STUDIES & SELECTED WORK PRACTICE FILTERING
    function applyWorkFilter(selected) {
        workTabs.forEach((t) => t.classList.toggle('active', t.getAttribute('data-work-filter') === selected));
        const shownWork = [];
        let shownArchiveCount = 0;

        workItems.forEach((item) => {
            const cats = (item.getAttribute('data-work-category') || '').split(' ');
            const match = selected === 'all' || cats.includes(selected);
            item.style.display = match ? '' : 'none';
            if (match) {
                shownWork.push(item);
                if (item.classList.contains('archive-project-card')) {
                    shownArchiveCount += 1;
                }
            }
        });

        if (workArchiveHeader) workArchiveHeader.style.display = shownArchiveCount > 0 ? '' : 'none';
        if (workArchiveGrid) workArchiveGrid.style.display = shownArchiveCount > 0 ? '' : 'none';

        if (workTallyEl) {
            const noun = shownWork.length === 1 ? 'Verified Mandate' : 'Verified Mandates';
            workTallyEl.textContent = `Showing ${shownWork.length} ${noun}`;
        }

        if (!prefersReducedMotion && window.gsap && shownWork.length) {
            gsap.fromTo(
                shownWork,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', overwrite: true }
            );
        }

        if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    workTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            applyWorkFilter(tab.getAttribute('data-work-filter'));
        });
    });

    // Clicking a verified Client Logo jumps directly to its Case Dossier / Mandate
    document.querySelectorAll('.brand-mark-tile[data-case-target]').forEach((tile) => {
        tile.setAttribute('tabindex', '0');
        tile.setAttribute('role', 'button');
        const goToMandate = () => {
            const targetSel = tile.getAttribute('data-case-target');
            const targetEl = targetSel ? document.querySelector(targetSel) : null;
            if (!targetEl) return;

            if (targetEl.hasAttribute('data-work-category') && targetEl.style.display === 'none') {
                applyWorkFilter('all');
            }

            if (lenis) {
                lenis.scrollTo(targetEl, { offset: -88 });
            } else {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            targetEl.classList.remove('dossier-highlight-pulse');
            void targetEl.offsetWidth;
            targetEl.classList.add('dossier-highlight-pulse');
        };

        tile.addEventListener('click', goToMandate);
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToMandate();
            }
        });
    });

    // ------------------------------------------------------------------------
    // 9. HIGH-RESOLUTION PRESS & CAMPAIGN LIGHTBOX MODAL
    // ------------------------------------------------------------------------
    const lightboxEl = document.getElementById('campaignLightbox');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxKicker = document.getElementById('lightboxKicker');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const lightboxStage = document.getElementById('lightboxStage');
    const lightboxZoomBtn = document.getElementById('lightboxZoomBtn');
    const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
    const lightboxNextBtn = document.getElementById('lightboxNextBtn');
    const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');

    const gallerySelector = [
        '.approach-visual-stack img',
        '.dossier-cinema-frame img',
        '.archive-card-img img'
    ].join(', ');

    const galleryImgs = Array.from(document.querySelectorAll(gallerySelector));
    const lightboxItems = galleryImgs.map((img) => {
        img.classList.add('js-lightbox-trigger');
        img.setAttribute('data-cursor-label', 'Inspect ↗');

        const dossier = img.closest('.case-dossier');
        const archiveCard = img.closest('.archive-project-card');
        const employerCard = img.closest('.employer-case-card');

        let kicker = 'Earned Media & Campaign Proof';
        let title = img.getAttribute('alt') || 'Candour Campaign Execution';
        let caption = img.getAttribute('alt') || '';

        if (employerCard) {
            kicker = '06 · Employer Branding Campaign';
            const h4 = employerCard.querySelector('h4');
            const outcomeP = employerCard.querySelector('.story-step.is-outcome p');
            if (h4) title = h4.textContent.trim();
            if (outcomeP) caption = outcomeP.textContent.trim();
        } else if (dossier) {
            const metaSpan = dossier.querySelector('.dossier-index-cluster');
            const h3 = dossier.querySelector('.dossier-headline');
            const outcomeP = dossier.querySelector('.story-step.is-outcome p');
            if (metaSpan) kicker = metaSpan.textContent.replace(/\s+/g, ' ').trim();
            if (h3) title = h3.textContent.trim();
            if (outcomeP) caption = outcomeP.textContent.trim();
        } else if (archiveCard) {
            kicker = 'Selected Portfolio Mandate';
            const h4 = archiveCard.querySelector('h4');
            const p = archiveCard.querySelector('p');
            if (h4) title = h4.textContent.trim();
            if (p) caption = p.textContent.trim();
        }

        return { img, getSrc: () => img.getAttribute('src'), kicker, title, caption };
    });

    let currentLbIndex = 0;

    function setLightboxZoom(zoomed) {
        if (!lightboxStage || !lightboxZoomBtn) return;
        lightboxStage.classList.toggle('is-zoomed', zoomed);
        lightboxZoomBtn.textContent = zoomed ? 'Zoom −' : 'Zoom +';
    }

    function renderLightboxSlide(index) {
        if (!lightboxItems.length || !lightboxImg) return;
        currentLbIndex = (index + lightboxItems.length) % lightboxItems.length;
        const item = lightboxItems[currentLbIndex];
        setLightboxZoom(false);
        lightboxImg.setAttribute('src', item.getSrc());
        lightboxImg.setAttribute('alt', item.title);
        if (lightboxKicker) lightboxKicker.textContent = item.kicker;
        if (lightboxTitle) lightboxTitle.textContent = item.title;
        if (lightboxCaption) lightboxCaption.textContent = item.caption;
        if (lightboxCounter) {
            const cur = String(currentLbIndex + 1).padStart(2, '0');
            const tot = String(lightboxItems.length).padStart(2, '0');
            lightboxCounter.textContent = `${cur} / ${tot}`;
        }
    }

    function openLightboxAt(index) {
        if (!lightboxEl || !lightboxItems.length) return;
        renderLightboxSlide(index);
        lightboxEl.classList.add('is-open');
        lightboxEl.setAttribute('aria-hidden', 'false');
        if (lenis) lenis.stop();
    }

    function openCustomLightbox(src, kicker, title, caption) {
        if (!lightboxEl || !lightboxImg) return;
        const matchIdx = lightboxItems.findIndex((it) => it.getSrc() === src);
        if (matchIdx >= 0) {
            openLightboxAt(matchIdx);
            return;
        }
        setLightboxZoom(false);
        lightboxImg.setAttribute('src', src);
        lightboxImg.setAttribute('alt', title);
        if (lightboxKicker) lightboxKicker.textContent = kicker;
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxCaption) lightboxCaption.textContent = caption;
        if (lightboxCounter) lightboxCounter.textContent = '01 / 01';
        lightboxEl.classList.add('is-open');
        lightboxEl.setAttribute('aria-hidden', 'false');
        if (lenis) lenis.stop();
    }

    function closeLightbox() {
        if (!lightboxEl) return;
        lightboxEl.classList.remove('is-open');
        lightboxEl.setAttribute('aria-hidden', 'true');
        setLightboxZoom(false);
        if (lenis) lenis.start();
    }

    galleryImgs.forEach((img, idx) => {
        img.addEventListener('click', () => openLightboxAt(idx));
    });

    const serviceShowcaseFrame = document.querySelector('.service-showcase-frame');
    if (serviceShowcaseFrame && servicePreviewImg) {
        serviceShowcaseFrame.addEventListener('click', () => {
            openCustomLightbox(
                servicePreviewImg.getAttribute('src'),
                servicePreviewBadge ? servicePreviewBadge.textContent : 'Candour Service Execution',
                servicePreviewTitle ? servicePreviewTitle.textContent : 'Candour Campaign',
                servicePreviewCaption ? servicePreviewCaption.textContent : ''
            );
        });
    }

    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', () => renderLightboxSlide(currentLbIndex - 1));
    if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', () => renderLightboxSlide(currentLbIndex + 1));
    if (lightboxZoomBtn && lightboxStage) {
        lightboxZoomBtn.addEventListener('click', () => {
            setLightboxZoom(!lightboxStage.classList.contains('is-zoomed'));
        });
        lightboxStage.addEventListener('click', () => {
            setLightboxZoom(!lightboxStage.classList.contains('is-zoomed'));
        });
    }

    window.addEventListener('keydown', (e) => {
        if (!lightboxEl || !lightboxEl.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') renderLightboxSlide(currentLbIndex - 1);
        if (e.key === 'ArrowRight') renderLightboxSlide(currentLbIndex + 1);
    });

    // ------------------------------------------------------------------------
    // 10. MAGNETIC EDITORIAL CTAS & CONTEXTUAL CURSOR PILL
    // ------------------------------------------------------------------------
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const cursorPill = document.getElementById('editorialCursorPill');

    if (finePointer && !prefersReducedMotion) {
        // Gentle magnetic pull on primary buttons & header CTA
        document.querySelectorAll('.btn-primary-editorial, .header-cta').forEach((btn) => {
            btn.addEventListener('pointermove', (e) => {
                const r = btn.getBoundingClientRect();
                const mx = ((e.clientX - r.left) / r.width - 0.5) * 11;
                const my = ((e.clientY - r.top) / r.height - 0.5) * 9;
                btn.style.transform = `translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0)`;
            });
            btn.addEventListener('pointerleave', () => {
                btn.style.transform = '';
            });
        });

        // Contextual Editorial Cursor Pill over inspectable visuals, linked logos & blog cards
        if (cursorPill) {
            document.querySelectorAll('.brand-mark-tile[data-case-target]').forEach((el) => {
                el.setAttribute('data-cursor-label', 'View Mandate ↓');
            });
            document.querySelectorAll('.blog-card-editorial').forEach((el) => {
                el.setAttribute('data-cursor-label', 'Read Article ↗');
            });

            let pillX = -200;
            let pillY = -200;
            let targetPillX = -200;
            let targetPillY = -200;
            let pillVisible = false;
            let pillRaf = false;

            const stepCursorPill = () => {
                pillX += (targetPillX - pillX) * 0.22;
                pillY += (targetPillY - pillY) * 0.22;
                cursorPill.style.transform = `translate3d(${(pillX + 16).toFixed(1)}px, ${(pillY + 16).toFixed(1)}px, 0)`;
                if (pillVisible || Math.abs(targetPillX - pillX) > 0.4) {
                    requestAnimationFrame(stepCursorPill);
                } else {
                    pillRaf = false;
                }
            };

            window.addEventListener('pointermove', (e) => {
                targetPillX = e.clientX;
                targetPillY = e.clientY;
                const labeled = e.target && e.target.closest ? e.target.closest('[data-cursor-label]') : null;
                if (labeled && (!lightboxEl || !lightboxEl.classList.contains('is-open'))) {
                    const label = labeled.getAttribute('data-cursor-label');
                    if (cursorPill.textContent !== label) cursorPill.textContent = label;
                    if (!pillVisible) {
                        pillVisible = true;
                        cursorPill.classList.add('is-visible');
                    }
                    if (!pillRaf) {
                        pillRaf = true;
                        requestAnimationFrame(stepCursorPill);
                    }
                } else if (pillVisible) {
                    pillVisible = false;
                    cursorPill.classList.remove('is-visible');
                }
            }, { passive: true });
        }
    }

    // ------------------------------------------------------------------------
    // 11. CINEMATIC ENTRANCE & EDITORIAL SCROLL REVEALS
    // ------------------------------------------------------------------------
    if (!prefersReducedMotion && window.gsap) {
        const heroTL = gsap.timeline({ defaults: { ease: 'power4.out' } });
        heroTL
            .from('.hero-identity-lockup', { y: 20, opacity: 0, duration: 0.9 })
            .from('.hero-headline .line-reveal', { yPercent: 112, duration: 1.12, stagger: 0.12 }, '-=0.55')
            .from('.hero-subline', { y: 22, opacity: 0, duration: 0.85 }, '-=0.7')
            .from('.hero-actions', { y: 18, opacity: 0, duration: 0.78 }, '-=0.6')
            .from('.hero-footer-bar', { opacity: 0, duration: 0.95 }, '-=0.5');

        document.querySelectorAll('[data-count-to]').forEach((counterEl) => {
            const targetVal = parseInt(counterEl.getAttribute('data-count-to'), 10);
            const suffix = counterEl.getAttribute('data-suffix') || '';
            const state = { val: 0 };
            gsap.to(state, {
                val: targetVal,
                duration: 1.6,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: counterEl,
                    start: 'top 86%',
                    once: true
                },
                onUpdate: () => {
                    counterEl.textContent = Math.round(state.val) + suffix;
                }
            });
        });

        gsap.utils.toArray('.reveal-up').forEach((el) => {
            gsap.from(el, {
                y: 34,
                opacity: 0,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 87%'
                }
            });
        });
    }

    // ------------------------------------------------------------------------
    // 12. DIRECT ENQUIRY SUBMISSION TO CANDOUR LEADERSHIP
    // ------------------------------------------------------------------------
    const enquiryForm = document.getElementById('candourEnquiryForm');
    if (enquiryForm) {
        enquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameEl = document.getElementById('enqName');
            const emailEl = document.getElementById('enqEmail');
            const msgEl = document.getElementById('enqMsg');
            const name = nameEl ? nameEl.value.trim() : '';
            const email = emailEl ? emailEl.value.trim() : '';
            const msg = msgEl ? msgEl.value.trim() : '';
            const subject = encodeURIComponent(`Website Enquiry — ${name || 'Candour Communications'}`);
            const body = encodeURIComponent(
                `Hello Lovina & Gayan,\n\nName: ${name}\nEmail: ${email}\nMessage: ${msg}\n`
            );
            window.location.href = `mailto:lovina@candour.co.in,gayan@candour.co.in?subject=${subject}&body=${body}`;
        });
    }
})();
