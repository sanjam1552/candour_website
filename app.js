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

    // Shared Cached Document Geometry (Eliminates Per-Frame getBoundingClientRect & scrollHeight Reflows)
    const layoutMetrics = {
        vw: window.innerWidth,
        vh: Math.max(1, window.innerHeight),
        maxScroll: 1,
        lightStages: [],
        awards: null,
        contact: null,
        navRanges: []
    };
    const rawLightStageEls = [
        document.getElementById('lightStageOne'),
        document.getElementById('lightStageTwo')
    ].filter(Boolean);
    const rawAwardsEl = document.getElementById('awards');
    const rawContactEl = document.getElementById('contact');
    const rawNavLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
    const rawNavTargets = rawNavLinks
        .map((link) => {
            const el = document.querySelector(link.getAttribute('href'));
            return el ? { link, el } : null;
        })
        .filter(Boolean);

    function measureDocBox(el, sy) {
        const r = el.getBoundingClientRect();
        return { top: r.top + sy, bottom: r.bottom + sy };
    }

    function refreshLayoutMetrics() {
        const sy = window.scrollY || window.pageYOffset || 0;
        layoutMetrics.vw = Math.max(1, window.innerWidth);
        layoutMetrics.vh = Math.max(1, window.innerHeight);
        layoutMetrics.maxScroll = Math.max(1, document.documentElement.scrollHeight - layoutMetrics.vh);
        layoutMetrics.lightStages = rawLightStageEls.map((el) => measureDocBox(el, sy));
        layoutMetrics.awards = rawAwardsEl ? measureDocBox(rawAwardsEl, sy) : null;
        layoutMetrics.contact = rawContactEl ? measureDocBox(rawContactEl, sy) : null;
        layoutMetrics.navRanges = rawNavTargets.map((item) => {
            const box = measureDocBox(item.el, sy);
            return { link: item.link, top: box.top, bottom: box.bottom };
        });
    }

    let metricsRafPending = false;
    function scheduleMetricsRefresh() {
        if (metricsRafPending) return;
        metricsRafPending = true;
        requestAnimationFrame(() => {
            metricsRafPending = false;
            refreshLayoutMetrics();
        });
    }

    refreshLayoutMetrics();
    window.addEventListener('load', scheduleMetricsRefresh, { once: true });
    window.addEventListener('resize', scheduleMetricsRefresh, { passive: true });
    if (window.ScrollTrigger) {
        ScrollTrigger.addEventListener('refresh', scheduleMetricsRefresh);
    }
    if (window.ResizeObserver && document.body) {
        let lastObservedBodyH = 0;
        const bodyRO = new ResizeObserver((entries) => {
            const h = entries[0] ? Math.round(entries[0].contentRect.height) : 0;
            if (Math.abs(h - lastObservedBodyH) > 2) {
                lastObservedBodyH = h;
                scheduleMetricsRefresh();
            }
        });
        bodyRO.observe(document.body);
    }

    if (ribbonCanvas && window.THREE && window.gsap) {
        const renderer = new THREE.WebGLRenderer({
            canvas: ribbonCanvas,
            alpha: true,
            antialias: true,
            stencil: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(layoutMetrics.vw, layoutMetrics.vh);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, layoutMetrics.vw / layoutMetrics.vh, 0.1, 100);
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

        const RIBBON_LENGTH_SEGS = 96;
        const RIBBON_WIDTH_SEGS = 12;
        const vCosLUT = new Float32Array(RIBBON_WIDTH_SEGS + 1);
        const vSinLUT = new Float32Array(RIBBON_WIDTH_SEGS + 1);
        for (let j = 0; j <= RIBBON_WIDTH_SEGS; j++) {
            const vPi = (j / RIBBON_WIDTH_SEGS) * Math.PI;
            vSinLUT[j] = Math.sin(vPi);
            vCosLUT[j] = Math.cos(vPi) * Math.PI;
        }

        function createPreallocatedRibbonGeometry() {
            const vertCount = (RIBBON_LENGTH_SEGS + 1) * (RIBBON_WIDTH_SEGS + 1);
            const positions = new Float32Array(vertCount * 3);
            const normals = new Float32Array(vertCount * 3);
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
            const normAttr = new THREE.BufferAttribute(normals, 3);
            normAttr.setUsage(THREE.DynamicDrawUsage);
            geo.setAttribute('position', posAttr);
            geo.setAttribute('normal', normAttr);
            geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            return geo;
        }

        // Zero-allocation Parallel Transport (Bishop) + Analytical Catmull-Rom Evaluator
        const ptPoints = Array.from({ length: RIBBON_LENGTH_SEGS + 1 }, () => new THREE.Vector3());
        const ptTangents = Array.from({ length: RIBBON_LENGTH_SEGS + 1 }, () => new THREE.Vector3());
        const ptNormals = Array.from({ length: RIBBON_LENGTH_SEGS + 1 }, () => new THREE.Vector3());
        const ptBinormals = Array.from({ length: RIBBON_LENGTH_SEGS + 1 }, () => new THREE.Vector3());
        const ptRefZ = new THREE.Vector3(0, 0, 1);
        const ptQuat = new THREE.Quaternion();

        function sampleCatmullRomZeroAlloc(pts, u, outPt, outTan) {
            const maxSeg = pts.length - 1;
            const scaled = u * maxSeg;
            const seg = scaled >= maxSeg ? maxSeg - 1 : scaled | 0;
            const t = scaled - seg;
            const t2 = t * t;

            const p1 = pts[seg];
            const p2 = pts[seg + 1];
            const p0x = seg === 0 ? 2 * p1.x - p2.x : pts[seg - 1].x;
            const p0y = seg === 0 ? 2 * p1.y - p2.y : pts[seg - 1].y;
            const p0z = seg === 0 ? 2 * p1.z - p2.z : pts[seg - 1].z;

            const next2 = seg + 2;
            const p3x = next2 > maxSeg ? 2 * p2.x - p1.x : pts[next2].x;
            const p3y = next2 > maxSeg ? 2 * p2.y - p1.y : pts[next2].y;
            const p3z = next2 > maxSeg ? 2 * p2.z - p1.z : pts[next2].z;

            const c1x = 0.5 * (p2.x - p0x);
            const c1y = 0.5 * (p2.y - p0y);
            const c1z = 0.5 * (p2.z - p0z);

            const c2x = p0x - 2.5 * p1.x + 2.0 * p2.x - 0.5 * p3x;
            const c2y = p0y - 2.5 * p1.y + 2.0 * p2.y - 0.5 * p3y;
            const c2z = p0z - 2.5 * p1.z + 2.0 * p2.z - 0.5 * p3z;

            const c3x = -0.5 * p0x + 1.5 * p1.x - 1.5 * p2.x + 0.5 * p3x;
            const c3y = -0.5 * p0y + 1.5 * p1.y - 1.5 * p2.y + 0.5 * p3y;
            const c3z = -0.5 * p0z + 1.5 * p1.z - 1.5 * p2.z + 0.5 * p3z;

            outPt.set(
                p1.x + t * (c1x + t * (c2x + t * c3x)),
                p1.y + t * (c1y + t * (c2y + t * c3y)),
                p1.z + t * (c1z + t * (c2z + t * c3z))
            );
            outTan.set(
                c1x + 2.0 * t * c2x + 3.0 * t2 * c3x,
                c1y + 2.0 * t * c2y + 3.0 * t2 * c3y,
                c1z + 2.0 * t * c2z + 3.0 * t2 * c3z
            ).normalize();
        }

        function updateRibbonBufferInPlace(geo, pts, width, twistTurns, twistPhase) {
            for (let i = 0; i <= RIBBON_LENGTH_SEGS; i++) {
                sampleCatmullRomZeroAlloc(pts, i / RIBBON_LENGTH_SEGS, ptPoints[i], ptTangents[i]);
            }

            ptBinormals[0].crossVectors(ptTangents[0], ptRefZ).normalize();
            ptNormals[0].crossVectors(ptBinormals[0], ptTangents[0]).normalize();

            for (let i = 1; i <= RIBBON_LENGTH_SEGS; i++) {
                ptQuat.setFromUnitVectors(ptTangents[i - 1], ptTangents[i]);
                ptNormals[i].copy(ptNormals[i - 1]).applyQuaternion(ptQuat);
                ptNormals[i].addScaledVector(ptTangents[i], -ptNormals[i].dot(ptTangents[i])).normalize();
                ptBinormals[i].crossVectors(ptTangents[i], ptNormals[i]).normalize();
            }

            const posAttr = geo.attributes.position;
            const normAttr = geo.attributes.normal;
            const positions = posAttr.array;
            const normals = normAttr.array;
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
                const spanW = 2.0 * localW;
                const archAmp = 0.26 * Math.cos(u * Math.PI * 3.0 + twistPhase);

                for (let j = 0; j <= RIBBON_WIDTH_SEGS; j++) {
                    const v = j / RIBBON_WIDTH_SEGS;
                    const across = (v - 0.5) * spanW;
                    const foldArch = vSinLUT[j] * archAmp;

                    positions[pIdx] = P.x + rNx * across + rBx * foldArch;
                    positions[pIdx + 1] = P.y + rNy * across + rBy * foldArch;
                    positions[pIdx + 2] = P.z + rNz * across + rBz * foldArch;

                    // Exact analytical surface normal (eliminates expensive CPU triangle normal pass)
                    const dArchDv = vCosLUT[j] * archAmp;
                    let nx = rBx * spanW - rNx * dArchDv;
                    let ny = rBy * spanW - rNy * dArchDv;
                    let nz = rBz * spanW - rNz * dArchDv;
                    const invLen = 1.0 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0);
                    normals[pIdx] = nx * invLen;
                    normals[pIdx + 1] = ny * invLen;
                    normals[pIdx + 2] = nz * invLen;
                    pIdx += 3;
                }
            }

            posAttr.needsUpdate = true;
            normAttr.needsUpdate = true;
        }

        function getRightCorridorX() {
            const aspect = layoutMetrics.vw / layoutMetrics.vh;
            const halfVisibleW = Math.tan((40 * Math.PI) / 360) * 15 * aspect;
            return layoutMetrics.vw < 900 ? halfVisibleW * 0.90 : halfVisibleW * 0.79;
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
            return { spec, pts, mesh, idx };
        });

        function smoothRange(edge0, edge1, x) {
            const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        }

        let targetDarkMix = 1.0;
        let targetAwardsRetreat = 0.0;
        let targetConvergence = 0.0;

        function syncRibbonTargetsZeroReflow() {
            const sy = lenis ? lenis.scroll : (window.scrollY || 0);
            const vh = layoutMetrics.vh;
            ribbonState.scrollProgress = Math.min(1, Math.max(0, sy / layoutMetrics.maxScroll));

            let lightWeight = 0.0;
            const ls = layoutMetrics.lightStages;
            for (let i = 0; i < ls.length; i++) {
                const top = ls[i].top - sy;
                const bottom = ls[i].bottom - sy;
                const enter = smoothRange(vh * 0.82, vh * 0.28, top);
                const exit = 1.0 - smoothRange(vh * 0.72, vh * 0.18, bottom);
                lightWeight = Math.max(lightWeight, enter * exit);
            }
            targetDarkMix = 1.0 - lightWeight;

            if (layoutMetrics.awards) {
                const awTop = layoutMetrics.awards.top - sy;
                const awBottom = layoutMetrics.awards.bottom - sy;
                const awEnter = smoothRange(vh * 0.85, vh * 0.25, awTop);
                const awExit = 1.0 - smoothRange(vh * 0.75, vh * 0.15, awBottom);
                targetAwardsRetreat = awEnter * awExit;
            }

            if (layoutMetrics.contact) {
                const cTop = layoutMetrics.contact.top - sy;
                targetConvergence = smoothRange(vh * 0.90, vh * 0.25, cTop);
            }
        }

        let smoothScrollProg = -1;
        let targetRibbonPtrX = 0;
        let targetRibbonPtrY = 0;
        let smoothRibbonPtrX = 0;
        let smoothRibbonPtrY = 0;

        if (!prefersReducedMotion) {
            window.addEventListener('pointermove', (e) => {
                targetRibbonPtrX = (e.clientX / layoutMetrics.vw - 0.5) * 2.0;
                targetRibbonPtrY = (e.clientY / layoutMetrics.vh - 0.5) * 2.0;
            }, { passive: true });
        }

        function updateRibbonGeometry() {
            const rightX = getRightCorridorX();
            const scrollPhase = smoothScrollProg * Math.PI * 7.0;
            const journeyExcursion = Math.sin(smoothScrollProg * Math.PI * 3.0) * 0.52;

            for (let s = 0; s < strands.length; s++) {
                const { spec, pts, idx, mesh } = strands[s];
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
                    pts,
                    spec.width,
                    dynamicTwist,
                    scrollPhase * 0.68 + idx * 1.2 + smoothRibbonPtrX * 0.24
                );
            }

            camera.position.x = smoothRibbonPtrX * 0.16;
            camera.position.y = Math.sin(smoothScrollProg * Math.PI * 2.0) * 0.24 - smoothRibbonPtrY * 0.14;
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
        }

        function tickRibbon() {
            syncRibbonTargetsZeroReflow();

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

        // Unify Ribbon updates directly onto gsap.ticker (eliminates competing RAF loops)
        gsap.ticker.add(tickRibbon);

        window.addEventListener('resize', () => {
            camera.aspect = layoutMetrics.vw / layoutMetrics.vh;
            camera.updateProjectionMatrix();
            renderer.setSize(layoutMetrics.vw, layoutMetrics.vh);
            updateRibbonGeometry();
        }, { passive: true });
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
            antialias: true,
            stencil: false,
            powerPreference: 'high-performance'
        });
        if (THREE.sRGBEncoding !== undefined) {
            awRenderer.outputEncoding = THREE.sRGBEncoding;
        }
        awRenderer.physicallyCorrectLights = true;
        awRenderer.shadowMap.enabled = true;
        awRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        awRenderer.shadowMap.autoUpdate = false;
        awRenderer.shadowMap.needsUpdate = true;
        awRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        awRenderer.toneMappingExposure = 1.01;

        const stageEl = document.getElementById('awardsPinnedStage');
        const setAwardsSize = () => {
            const w = stageEl ? stageEl.clientWidth : window.innerWidth;
            const h = stageEl ? stageEl.clientHeight : window.innerHeight;
            awRenderer.setSize(w, h);
            awRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
            return { w, h };
        };
        const initDim = setAwardsSize();

        const awScene = new THREE.Scene();
        // Heroic low-angle product-commercial camera (matches trophies-reference.jpg perspective!)
        const awCamera = new THREE.PerspectiveCamera(29, initDim.w / initDim.h, 0.1, 100);
        awCamera.position.set(0.35, 0.18, 12.15);

        // Calibrated Luxury Product Studio Rig (Warm Key + Front Metallic Specular Fill + Dual Rim)
        const hemi = new THREE.HemisphereLight(0xfff9f4, 0x120c1c, 0.85);
        awScene.add(hemi);

        // Warm-Ivory Studio Key Softbox from Upper-Left-Front
        const keySpot = new THREE.SpotLight(0xfff5e8, 56.0, 34, Math.PI / 3.2, 0.85, 1.35);
        keySpot.position.set(-2.2, 7.8, 9.4);
        keySpot.target.position.set(3.0, -0.3, 0);
        keySpot.castShadow = true;
        keySpot.shadow.mapSize.width = 1024;
        keySpot.shadow.mapSize.height = 1024;
        keySpot.shadow.bias = -0.00025;
        keySpot.shadow.radius = 3.2;
        awScene.add(keySpot);
        awScene.add(keySpot.target);

        // Controlled Off-Axis Beauty Fill (avoids flat mirror glare hotspot on angled gold monoliths!)
        const frontBeautyLight = new THREE.DirectionalLight(0xfff8ee, 0.62);
        frontBeautyLight.position.set(-2.5, 4.8, 10.2);
        awScene.add(frontBeautyLight);

        // Crisp Cool-Platinum Side Fill from Right for Faceted Crystal Separation
        const fillLight = new THREE.DirectionalLight(0xeef3ff, 0.88);
        fillLight.position.set(7.8, 4.4, 6.2);
        awScene.add(fillLight);

        // Subtle Candour Magenta & Warm Amber Back-Rim Kickers
        const rimMagenta = new THREE.PointLight(0xe60099, 14.0, 18, 1.6);
        rimMagenta.position.set(-1.8, 2.6, -4.4);
        awScene.add(rimMagenta);

        const rimWarm = new THREE.PointLight(0xff8c2b, 18.0, 20, 1.6);
        rimWarm.position.set(7.2, 2.8, -3.2);
        awScene.add(rimWarm);

        // High-Contrast Product Photography Softbox HDRI (with +Z u=0.75 Camera-Front Softbox!)
        function makeStudioEnvTexture() {
            const c = document.createElement('canvas');
            c.width = 1024;
            c.height = 512;
            const ctx = c.getContext('2d');

            const g = ctx.createLinearGradient(0, 0, 0, 512);
            g.addColorStop(0.0, '#120d1d');
            g.addColorStop(0.22, '#2a2238');
            g.addColorStop(0.48, '#1e1829');
            g.addColorStop(0.56, '#0b0812');
            g.addColorStop(0.84, '#1f161c');
            g.addColorStop(1.0, '#07050b');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 1024, 512);

            const drawSoftbox = (cx, cy, rw, rh, innerCol, outerCol) => {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(rw, rh);
                const rg = ctx.createRadialGradient(0, 0, 0.10, 0, 0, 1.0);
                rg.addColorStop(0.0, innerCol);
                rg.addColorStop(0.58, outerCol);
                rg.addColorStop(1.0, 'rgba(0,0,0,0)');
                ctx.fillStyle = rg;
                ctx.fillRect(-1, -1, 2, 2);
                ctx.restore();
            };

            // Crucial: In Three.js EquirectangularReflectionMapping, +Z (toward camera) is u = 0.75 (x = 768)!
            // Placing a large warm studio diffusion scrim around x = 768 makes front-facing gold, copper & silver glow!
            drawSoftbox(768, 210, 220, 135, 'rgba(255, 251, 242, 1.0)', 'rgba(255, 234, 198, 0.74)');
            drawSoftbox(640, 130, 150, 75, 'rgba(255, 253, 248, 0.98)', 'rgba(245, 232, 215, 0.58)');
            drawSoftbox(895, 165, 130, 95, 'rgba(255, 246, 230, 0.96)', 'rgba(255, 206, 150, 0.52)');
            drawSoftbox(256, 120, 160, 68, 'rgba(255, 250, 240, 0.92)', 'rgba(230, 224, 245, 0.45)');
            drawSoftbox(512, 82, 210, 48, 'rgba(255, 252, 248, 0.95)', 'rgba(230, 228, 242, 0.48)');

            // Crisp studio horizon reflection band for realistic metallic sheen
            const glint = ctx.createLinearGradient(0, 168, 0, 244);
            glint.addColorStop(0, 'rgba(255, 252, 244, 0)');
            glint.addColorStop(0.45, 'rgba(255, 248, 234, 0.62)');
            glint.addColorStop(1, 'rgba(255, 248, 234, 0)');
            ctx.fillStyle = glint;
            ctx.fillRect(0, 168, 1024, 76);

            const rawEnvTex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding !== undefined) rawEnvTex.encoding = THREE.sRGBEncoding;
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

        function makeEngravedTexture(drawFn, w = 1024, h = 1536, isColor = true) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const ctx = c.getContext('2d');
            drawFn(ctx, w, h);
            const tex = new THREE.CanvasTexture(c);
            if (isColor && THREE.sRGBEncoding !== undefined) {
                tex.encoding = THREE.sRGBEncoding;
            }
            tex.anisotropy = Math.min(8, awRenderer.capabilities.getMaxAnisotropy());
            return tex;
        }

        // Procedural Micro-Brushed Anisotropic Metal & Porous Travertine Bump Maps
        function makeBrushedBumpMap(vertical = false) {
            return makeEngravedTexture((ctx, w, h) => {
                ctx.fillStyle = '#808080';
                ctx.fillRect(0, 0, w, h);
                const lines = 420;
                for (let i = 0; i < lines; i++) {
                    const lum = 96 + ((i * 37) % 64);
                    ctx.strokeStyle = `rgb(${lum},${lum},${lum})`;
                    ctx.lineWidth = 1 + (i % 2) * 0.6;
                    ctx.beginPath();
                    if (vertical) {
                        const x = (i / lines) * w;
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, h);
                    } else {
                        const y = (i / lines) * h;
                        ctx.moveTo(0, y);
                        ctx.lineTo(w, y);
                    }
                    ctx.stroke();
                }
            }, 512, 512, false);
        }
        const brushedHBump = makeBrushedBumpMap(false);
        const brushedVBump = makeBrushedBumpMap(true);

        function addBrushedGrain(ctx, w, h, vertical = false, alpha = 0.045) {
            ctx.save();
            const count = vertical ? 320 : 260;
            for (let i = 0; i < count; i++) {
                const isLight = i % 2 === 0;
                ctx.strokeStyle = isLight
                    ? `rgba(255, 255, 255, ${alpha})`
                    : `rgba(20, 14, 8, ${alpha * 0.55})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (vertical) {
                    const x = (i / count) * w + Math.sin(i * 13.7) * 1.5;
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                } else {
                    const y = (i / count) * h + Math.cos(i * 11.3) * 1.5;
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        // Deep Multi-Layered Grounding Contact Shadow Decal (tight dark core + soft diffused penumbra)
        const contactShadowTex = makeEngravedTexture((ctx, w, h) => {
            ctx.clearRect(0, 0, w, h);
            // Soft outer penumbra
            const outer = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.49);
            outer.addColorStop(0.0, 'rgba(18, 10, 14, 0.78)');
            outer.addColorStop(0.42, 'rgba(24, 14, 18, 0.42)');
            outer.addColorStop(0.76, 'rgba(24, 14, 18, 0.12)');
            outer.addColorStop(1.0, 'rgba(24, 14, 18, 0.0)');
            ctx.fillStyle = outer;
            ctx.fillRect(0, 0, w, h);

            // Crisp dark rectangular footprint ambient occlusion right beneath the trophy base
            const padX = w * 0.16;
            const padY = h * 0.24;
            ctx.filter = 'blur(8px)';
            ctx.fillStyle = 'rgba(8, 4, 8, 0.72)';
            ctx.fillRect(padX, padY, w - padX * 2, h - padY * 2);
            ctx.filter = 'none';
        }, 256, 256, false);

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
            m.position.y = -1.406;
            return m;
        }

        // Right-Aligned Exhibition Offset — generous breathing room clear of the left readout card!
        const getGalleryOffsetX = () => (window.innerWidth < 1140 ? 0.0 : 3.04);
        let galleryOffsetX = getGalleryOffsetX();

        // Seamless Carved Matte Travertine Limestone Plinth (zero horizontal rings & zero UV wrap seam!)
        const stoneBumpTex = makeEngravedTexture((ctx, w, h) => {
            ctx.fillStyle = '#828282';
            ctx.fillRect(0, 0, w, h);
            for (let p = 0; p < 2200; p++) {
                const px = (Math.sin(p * 78.233) * 0.5 + 0.5) * w;
                const py = (Math.cos(p * 45.164) * 0.5 + 0.5) * h;
                const r = 0.7 + (p % 4) * 0.65;
                ctx.fillStyle = p % 3 === 0 ? '#585858' : '#9c9c9c';
                ctx.beginPath();
                ctx.arc(px, py, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }, 512, 512, false);

        const stoneSideTex = makeEngravedTexture((ctx, w, h) => {
            // Periodic seamless wrap gradient (0.0 and 1.0 match identically so cylinder has ZERO seam!)
            const g = ctx.createLinearGradient(0, 0, w, 0);
            g.addColorStop(0.0, '#c8b2a4');
            g.addColorStop(0.25, '#dfd0c5');
            g.addColorStop(0.50, '#b59c8e');
            g.addColorStop(0.75, '#e2d4ca');
            g.addColorStop(1.0, '#c8b2a4');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);

            const vg = ctx.createLinearGradient(0, 0, 0, h);
            vg.addColorStop(0.0, 'rgba(255, 250, 246, 0.24)');
            vg.addColorStop(0.22, 'rgba(0, 0, 0, 0.0)');
            vg.addColorStop(1.0, 'rgba(18, 10, 14, 0.42)');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, w, h);

            // Fine organic sandstone mineral speckles (matching matte stone drum in trophies-reference.jpg!)
            for (let p = 0; p < 2400; p++) {
                const px = (Math.sin(p * 91.713) * 0.5 + 0.5) * w;
                const py = (Math.cos(p * 53.317) * 0.5 + 0.5) * h;
                ctx.fillStyle = p % 2 === 0 ? 'rgba(84, 60, 50, 0.14)' : 'rgba(255, 250, 246, 0.14)';
                ctx.fillRect(px, py, 1.8 + (p % 3), 1.4);
            }
        }, 1024, 256);

        const stoneTopTex = makeEngravedTexture((ctx, w, h) => {
            const rg = ctx.createRadialGradient(w * 0.48, h * 0.48, w * 0.05, w / 2, h / 2, w * 0.5);
            rg.addColorStop(0.0, '#ebe0d7');
            rg.addColorStop(0.68, '#dccbc0');
            rg.addColorStop(0.95, '#c7b2a5');
            rg.addColorStop(1.0, '#b8a092');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, w, h);

            for (let p = 0; p < 1600; p++) {
                const px = (Math.sin(p * 63.19) * 0.5 + 0.5) * w;
                const py = (Math.cos(p * 39.81) * 0.5 + 0.5) * h;
                ctx.fillStyle = p % 2 === 0 ? 'rgba(92, 68, 58, 0.08)' : 'rgba(255, 252, 248, 0.12)';
                ctx.fillRect(px, py, 1.8, 1.8);
            }
        }, 512, 512);

        const stoneSideMat = new THREE.MeshStandardMaterial({
            map: stoneSideTex,
            bumpMap: stoneBumpTex,
            bumpScale: 0.008,
            roughness: 0.82,
            metalness: 0.02,
            envMapIntensity: 0.45
        });
        const stoneTopMat = new THREE.MeshStandardMaterial({
            map: stoneTopTex,
            bumpMap: stoneBumpTex,
            bumpScale: 0.005,
            roughness: 0.72,
            metalness: 0.03,
            envMapIntensity: 0.52
        });

        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(3.62, 3.70, 0.74, 96),
            [stoneSideMat, stoneTopMat, stoneSideMat]
        );
        pedestal.position.set(galleryOffsetX, -1.78, 0);
        pedestal.receiveShadow = true;
        awScene.add(pedestal);

        const pedRing = new THREE.Mesh(
            new THREE.TorusGeometry(3.62, 0.011, 16, 112),
            new THREE.MeshStandardMaterial({
                color: 0xdba06b,
                metalness: 0.85,
                roughness: 0.25,
                envMapIntensity: 1.1
            })
        );
        pedRing.rotation.x = Math.PI / 2;
        pedRing.position.set(galleryOffsetX, -1.412, 0);
        awScene.add(pedRing);

        // ---- TROPHY 1: 15th e4m IPRCCA (Anodized Satin-Silver Monolith + Die-Cut Crowd Crest + Mirror-Copper "15") ----
        function buildIPRCCA3DTrophy() {
            const group = new THREE.Group();

            const silverBodyMat = new THREE.MeshStandardMaterial({
                color: 0xd8dce6,
                bumpMap: brushedHBump,
                bumpScale: 0.0035,
                metalness: 0.86,
                roughness: 0.24,
                envMapIntensity: 1.35
            });

            // 1A. Stepped Architectural Brushed-Silver Backing Monolith behind "1" and "5"
            const backShape = new THREE.Shape();
            backShape.moveTo(-0.70, -1.36);
            backShape.lineTo(0.70, -1.36);
            backShape.lineTo(0.70, 0.38);
            backShape.lineTo(0.63, 0.38);
            backShape.lineTo(0.63, 1.33);
            backShape.lineTo(0.50, 1.33);
            backShape.lineTo(0.50, 1.45);
            backShape.lineTo(0.085, 1.45);
            // Deep central vertical channel notch between "1" and "5" (visible in trophies-reference.jpg)
            backShape.lineTo(0.085, 0.18);
            backShape.lineTo(-0.085, 0.18);
            backShape.lineTo(-0.085, 1.45);
            backShape.lineTo(-0.50, 1.45);
            backShape.lineTo(-0.50, 1.33);
            backShape.lineTo(-0.63, 1.33);
            backShape.lineTo(-0.63, 0.38);
            backShape.lineTo(-0.70, 0.38);
            backShape.closePath();

            const backPlate = new THREE.Mesh(
                new THREE.ExtrudeGeometry(backShape, {
                    depth: 0.22,
                    bevelEnabled: true,
                    bevelSegments: 4,
                    steps: 1,
                    bevelSize: 0.016,
                    bevelThickness: 0.016
                }),
                silverBodyMat
            );
            backPlate.position.z = -0.20;
            backPlate.castShadow = true;
            backPlate.receiveShadow = true;
            group.add(backPlate);

            // Soft Ambient-Occlusion Shadow Plate behind the 3D "15" numerals on the silver backing
            const numShadowTex = makeEngravedTexture((ctx, w, h) => {
                ctx.clearRect(0, 0, w, h);
                ctx.filter = 'blur(12px)';
                ctx.fillStyle = 'rgba(12, 10, 18, 0.55)';
                // Left "1" shadow + Right "5" shadow
                ctx.fillRect(62, 34, 72, 186);
                ctx.fillRect(150, 34, 96, 186);
                ctx.filter = 'none';
            }, 288, 256, false);
            const numShadowPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(1.28, 1.04),
                new THREE.MeshBasicMaterial({ map: numShadowTex, transparent: true, depthWrite: false })
            );
            numShadowPlane.position.set(0.02, 0.84, 0.038);
            group.add(numShadowPlane);

            // 1B. Raised Lower Front Brushed-Aluminium Plaque (with physically shaded laser-cut crowd silhouette & deep engraved ink)
            const frontTex = makeEngravedTexture((ctx, w, h) => {
                // Realistic diagonal brushed anodized-aluminium sheen + subtle bottom AO
                const bg = ctx.createLinearGradient(0, 0, w * 0.85, h);
                bg.addColorStop(0.0, '#f4f5f9');
                bg.addColorStop(0.28, '#e5e7ef');
                bg.addColorStop(0.62, '#d2d5e0');
                bg.addColorStop(0.88, '#c2c6d4');
                bg.addColorStop(1.0, '#b2b6c5');
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, w, h);
                addBrushedGrain(ctx, w, h, false, 0.048);

                // Crisp left & top specular chamfer edge catchlights
                ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
                ctx.fillRect(0, 0, w, 6);
                ctx.fillRect(0, 0, 8, h);
                ctx.fillStyle = 'rgba(30, 32, 44, 0.22)';
                ctx.fillRect(w - 7, 0, 7, h);
                ctx.fillRect(0, h - 10, w, 10);

                // Recessed dark top channel above the die-cut crowd silhouette crest (exact trophies-reference.jpg detail!)
                const drawCrowdCrest = (offsetY, strokeCol, lineW) => {
                    ctx.strokeStyle = strokeCol;
                    ctx.lineWidth = lineW;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    const heads = 13;
                    for (let i = 0; i < heads; i++) {
                        const cx = 66 + i * ((w - 132) / (heads - 1));
                        const cy = 94 + (i % 3 === 0 ? -12 : (i % 2 === 0 ? 6 : -3)) + offsetY;
                        ctx.beginPath();
                        ctx.arc(cx, cy, 15.5, Math.PI * 1.12, Math.PI * -0.12, false);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(cx - 34, 168 + offsetY);
                        ctx.quadraticCurveTo(cx - 28, cy + 22, cx - 11, cy + 19);
                        ctx.moveTo(cx + 11, cy + 19);
                        ctx.quadraticCurveTo(cx + 28, cy + 22, cx + 34, 168 + offsetY);
                        ctx.stroke();
                    }
                };
                // Subtle upper shadow tint so top of plaque reads as laser-cut silhouette relief
                const topShade = ctx.createLinearGradient(0, 0, 0, 155);
                topShade.addColorStop(0, 'rgba(38, 40, 54, 0.22)');
                topShade.addColorStop(0.65, 'rgba(38, 40, 54, 0.06)');
                topShade.addColorStop(1, 'rgba(38, 40, 54, 0)');
                ctx.fillStyle = topShade;
                ctx.fillRect(0, 0, w, 155);

                // Etched dark shadow groove + bright lower metallic catchlight on crowd frieze
                drawCrowdCrest(3, 'rgba(255, 255, 255, 0.68)', 4.2);
                drawCrowdCrest(0, 'rgba(42, 45, 58, 0.78)', 4.0);

                // "15 th" + crimson "e4m"
                ctx.textAlign = 'center';
                ctx.fillStyle = '#20232e';
                ctx.font = '600 56px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('15 th', w / 2 - 76, 276);
                ctx.fillStyle = '#d41920';
                ctx.font = '800 60px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('e4m', w / 2 + 88, 276);

                // Deep Cobalt-Blue Twin Vertical Bars + Bold "PRCCA"
                ctx.fillStyle = '#005eb8';
                ctx.fillRect(152, 308, 14, 110);
                ctx.fillRect(176, 308, 14, 110);
                ctx.textAlign = 'left';
                ctx.font = '900 134px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('PRCCA', 202, 414);

                // Crisp Blue Rules + Subtitle
                ctx.fillRect(152, 432, w - 304, 7);
                ctx.textAlign = 'center';
                ctx.fillStyle = '#14161f';
                ctx.font = '800 29px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('INDIA PR & CORPORATE', w / 2, 472);
                ctx.fillText('COMMUNICATIONS AWARDS 2024', w / 2, 506);
                ctx.fillStyle = '#005eb8';
                ctx.fillRect(152, 520, w - 304, 4.5);

                // High-Contrast Laser-Engraved Campaign & Winner Text
                ctx.fillStyle = '#0e1017';
                ctx.font = '700 39px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Redefining the Future of Data & AI', w / 2, 636);

                ctx.fillStyle = '#141620';
                ctx.font = '700 41px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Databricks', w / 2, 748);
                ctx.fillText('Candour Communications', w / 2, 804);
                ctx.fillStyle = '#222533';
                ctx.font = '700 37px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Technology', w / 2, 860);
            }, 1024, 1024);

            const frontPlaqueMat = new THREE.MeshStandardMaterial({
                map: frontTex,
                bumpMap: brushedHBump,
                bumpScale: 0.0018,
                metalness: 0.38,
                roughness: 0.30,
                envMapIntensity: 1.15
            });

            const frontPlaque = new THREE.Mesh(
                new THREE.BoxGeometry(1.44, 1.72, 0.22),
                [silverBodyMat, silverBodyMat, silverBodyMat, silverBodyMat, frontPlaqueMat, silverBodyMat]
            );
            frontPlaque.position.set(0, -0.50, 0.08);
            frontPlaque.castShadow = true;
            frontPlaque.receiveShadow = true;
            group.add(frontPlaque);

            // Slim Dark Shadow-Line Base Footplate
            const silverFoot = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.05, 0.50), silverBodyMat);
            silverFoot.position.set(0, -1.375, -0.01);
            silverFoot.castShadow = true;
            group.add(silverFoot);

            // 1C. Glowing Burnished Copper-Bronze "1" & "5" Numerals (matches bright warm copper in trophies-reference.jpg!)
            const copperFaceTex = makeEngravedTexture((ctx, w, h) => {
                const g = ctx.createLinearGradient(0, h, w * 0.7, 0);
                g.addColorStop(0.0, '#9c3e08');
                g.addColorStop(0.35, '#da6a19');
                g.addColorStop(0.68, '#f59338');
                g.addColorStop(0.88, '#ffc16e');
                g.addColorStop(1.0, '#e37722');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, w, h);
                addBrushedGrain(ctx, w, h, false, 0.04);
            }, 256, 256);

            const copperMat = new THREE.MeshPhysicalMaterial({
                color: 0xf48832,
                map: copperFaceTex,
                metalness: 0.78,
                roughness: 0.19,
                clearcoat: 0.45,
                clearcoatRoughness: 0.14,
                envMapIntensity: 1.65
            });
            const numExtrude = {
                depth: 0.21,
                bevelEnabled: true,
                bevelSegments: 8,
                steps: 1,
                bevelSize: 0.024,
                bevelThickness: 0.024
            };

            const oneShape = new THREE.Shape();
            oneShape.moveTo(-0.41, 0);
            oneShape.lineTo(-0.19, 0);
            oneShape.lineTo(-0.19, 0.94);
            oneShape.lineTo(-0.56, 0.94);
            oneShape.lineTo(-0.56, 0.75);
            oneShape.lineTo(-0.41, 0.75);
            oneShape.closePath();

            const oneMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(oneShape, numExtrude), copperMat);
            oneMesh.position.set(0.0, 0.37, 0.0);
            oneMesh.castShadow = true;
            group.add(oneMesh);

            const fiveShape = new THREE.Shape();
            fiveShape.moveTo(0.14, 0.94);
            fiveShape.lineTo(0.60, 0.94);
            fiveShape.lineTo(0.60, 0.75);
            fiveShape.lineTo(0.31, 0.75);
            fiveShape.lineTo(0.30, 0.57);
            fiveShape.bezierCurveTo(0.52, 0.59, 0.63, 0.46, 0.63, 0.27);
            fiveShape.bezierCurveTo(0.63, 0.07, 0.49, -0.02, 0.33, -0.02);
            fiveShape.bezierCurveTo(0.18, -0.02, 0.10, 0.05, 0.08, 0.17);
            fiveShape.lineTo(0.26, 0.21);
            fiveShape.bezierCurveTo(0.27, 0.14, 0.31, 0.12, 0.36, 0.12);
            fiveShape.bezierCurveTo(0.43, 0.12, 0.46, 0.18, 0.46, 0.27);
            fiveShape.bezierCurveTo(0.46, 0.36, 0.41, 0.41, 0.33, 0.41);
            fiveShape.bezierCurveTo(0.26, 0.41, 0.20, 0.39, 0.15, 0.36);
            fiveShape.closePath();

            const fiveMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(fiveShape, numExtrude), copperMat);
            fiveMesh.position.set(-0.02, 0.37, 0.0);
            fiveMesh.castShadow = true;
            group.add(fiveMesh);

            group.add(createContactShadow(1.92, 1.02));
            return group;
        }

        // ---- TROPHIES 2 & 3: Tapered 48th BW Marketing World 24k Satin-Gold EXCEL Obelisks ----
        function buildTaperedTrapezoidGeometry(bottomW, topW, height, depth) {
            const geo = new THREE.BoxGeometry(bottomW, height, depth, 4, 8, 2);
            const pos = geo.attributes.position;
            const halfH = height / 2;
            const ratio = topW / bottomW;
            for (let i = 0; i < pos.count; i++) {
                const y = pos.getY(i);
                const t = (y + halfH) / height;
                const scaleX = 1.0 + (ratio - 1.0) * t;
                const scaleZ = 1.0 - 0.14 * t;
                pos.setX(i, pos.getX(i) * scaleX);
                pos.setZ(i, pos.getZ(i) * scaleZ);
            }
            geo.computeVertexNormals();
            return geo;
        }

        function buildGoldExcel3DTrophy(clientLine1, clientLine2, baseCategory) {
            const group = new THREE.Group();

            const goldFaceTex = makeEngravedTexture((ctx, w, h) => {
                // Authentic 24k Satin-Gold Diagonal Specular Sheen (matches warm rich gold in trophies-reference.jpg!)
                const g = ctx.createLinearGradient(0, 0, w * 0.9, h);
                g.addColorStop(0.0, '#ffe985');
                g.addColorStop(0.22, '#f8c94b');
                g.addColorStop(0.54, '#e3a524');
                g.addColorStop(0.82, '#f3be3d');
                g.addColorStop(1.0, '#d6951a');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, w, h);
                addBrushedGrain(ctx, w, h, true, 0.052);

                // Crisp Polished Bevel Rim Highlights along Left, Top & Right Chamfers
                const leftBevel = ctx.createLinearGradient(0, 0, 48, 0);
                leftBevel.addColorStop(0, 'rgba(255, 252, 220, 0.92)');
                leftBevel.addColorStop(0.45, 'rgba(255, 244, 180, 0.35)');
                leftBevel.addColorStop(1, 'rgba(255, 244, 180, 0.0)');
                ctx.fillStyle = leftBevel;
                ctx.fillRect(0, 0, 48, h);

                const rightShade = ctx.createLinearGradient(w - 36, 0, w, 0);
                rightShade.addColorStop(0, 'rgba(120, 74, 4, 0.0)');
                rightShade.addColorStop(1, 'rgba(110, 66, 4, 0.28)');
                ctx.fillStyle = rightShade;
                ctx.fillRect(w - 36, 0, 36, h);

                ctx.fillStyle = 'rgba(255, 252, 224, 0.78)';
                ctx.fillRect(0, 0, w, 8);

                // Crisp Jet-Black Engraved Header
                ctx.textAlign = 'center';
                ctx.fillStyle = '#140e02';
                ctx.font = '700 37px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('48th EXCEL AWARDS', w / 2, 206);
                ctx.font = '900 52px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('BW MARKETING', w / 2, 264);
                ctx.font = '400 66px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('WORLD.', w / 2, 332);

                // Embossed 3D-Effect Silver-White Diagonal "X" Emblem (with subtle drop shadow on gold)
                ctx.save();
                ctx.shadowColor = 'rgba(72, 44, 0, 0.36)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 5;
                ctx.strokeStyle = '#fcfbf7';
                ctx.lineWidth = 36;
                ctx.lineCap = 'square';
                ctx.beginPath();
                ctx.moveTo(w / 2 - 118, 320);
                ctx.lineTo(w / 2 + 118, 536);
                ctx.moveTo(w / 2 + 118, 320);
                ctx.lineTo(w / 2 - 118, 536);
                ctx.stroke();
                ctx.restore();

                // "EX   CEL" flanking the giant raised X
                ctx.fillStyle = '#120c02';
                ctx.font = '400 132px "Plus Jakarta Sans", sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('EX', w / 2 - 58, 476);
                ctx.textAlign = 'left';
                ctx.fillText('CEL', w / 2 + 48, 476);

                ctx.textAlign = 'center';
                ctx.fillStyle = '#140e02';
                ctx.font = '500 50px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('AWARDS', w / 2 - 96, 568);
                ctx.fillStyle = '#c4141c';
                ctx.font = '700 50px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('2026', w / 2 + 128, 568);

                // Deep Crimson Enamel Ribbon Band
                ctx.fillStyle = '#d8161f';
                ctx.fillRect(144, 606, w - 288, 136);
                ctx.fillStyle = '#ffffff';
                ctx.font = '800 31px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('CELEBRATING EXCELLENCE', w / 2, 650);
                ctx.fillText('IN COMMUNICATION', w / 2, 688);
                ctx.fillText('& ENGAGEMENT', w / 2, 724);

                // Razor-Sharp Jet-Black Engraved Client & Agency Names
                ctx.fillStyle = '#110b02';
                ctx.font = '700 46px "Plus Jakarta Sans", sans-serif';
                if (clientLine2) {
                    ctx.fillText(clientLine1, w / 2, 926);
                    ctx.fillText(clientLine2, w / 2, 982);
                } else {
                    ctx.fillText(clientLine1, w / 2, 954);
                }

                ctx.font = '700 46px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Candour', w / 2, 1138);
                ctx.fillText('Communications', w / 2, 1194);
            }, 1024, 1536);

            // Darker Burnished Satin-Brass Side Return (matches visible angled darker brass side in trophies-reference.jpg!)
            const goldSideMat = new THREE.MeshStandardMaterial({
                color: 0xd9a126,
                bumpMap: brushedVBump,
                bumpScale: 0.0038,
                metalness: 0.86,
                roughness: 0.24,
                envMapIntensity: 1.45
            });
            const goldFrontMat = new THREE.MeshStandardMaterial({
                map: goldFaceTex,
                bumpMap: brushedVBump,
                bumpScale: 0.0022,
                metalness: 0.54,
                roughness: 0.26,
                envMapIntensity: 1.35
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

            // Recessed Gold Collar + True Deep Piano-Black Stepped Obsidian Plinth
            const collar = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.04, 0.36), goldSideMat);
            collar.position.y = -1.05;
            group.add(collar);

            const blackMat = new THREE.MeshPhysicalMaterial({
                color: 0x07070a,
                roughness: 0.18,
                metalness: 0.16,
                clearcoat: 0.72,
                clearcoatRoughness: 0.16,
                envMapIntensity: 0.95
            });

            const upperStep = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 0.48), blackMat);
            upperStep.position.y = -1.09;
            upperStep.castShadow = true;
            group.add(upperStep);

            const plinthTex = makeEngravedTexture((ctx, w, h) => {
                const bg = ctx.createLinearGradient(0, 0, 0, h);
                bg.addColorStop(0.0, '#14131a');
                bg.addColorStop(0.14, '#0b0a0f');
                bg.addColorStop(1.0, '#050508');
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, w, h);
                // Crisp subtle top bevel glint on black plinth
                ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
                ctx.fillRect(0, 0, w, 4);
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = '700 45px "Plus Jakarta Sans", sans-serif';
                ctx.fillText(baseCategory, w / 2, h / 2 + 16);
            }, 1024, 240);

            const plinthFrontMat = new THREE.MeshPhysicalMaterial({
                map: plinthTex,
                roughness: 0.20,
                metalness: 0.14,
                clearcoat: 0.65,
                clearcoatRoughness: 0.18,
                envMapIntensity: 0.85
            });

            const base = new THREE.Mesh(
                new THREE.BoxGeometry(1.52, 0.30, 0.56),
                [blackMat, blackMat, blackMat, blackMat, plinthFrontMat, blackMat]
            );
            base.position.y = -1.25;
            base.castShadow = true;
            base.receiveShadow = true;
            group.add(base);

            group.add(createContactShadow(1.92, 1.02));
            return group;
        }

        // ---- TROPHY 4: ET BrandEquity Kaleido Multi-Faceted Jewel-Crystal "K" Sculpture ----
        function buildKaleidoAcrylic3DTrophy() {
            const group = new THREE.Group();
            const kSculpture = new THREE.Group();

            // 4A. Sleek Brushed Gunmetal-Titanium Architectural "K" Backing Chassis (matches dark metallic right V-return in trophies-reference.jpg!)
            const chassisMat = new THREE.MeshStandardMaterial({
                color: 0x8d8b96,
                bumpMap: brushedVBump,
                bumpScale: 0.0035,
                metalness: 0.90,
                roughness: 0.22,
                envMapIntensity: 1.45
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
                    depth: 0.22,
                    bevelEnabled: true,
                    bevelSegments: 4,
                    steps: 1,
                    bevelSize: 0.014,
                    bevelThickness: 0.014
                }),
                chassisMat
            );
            chassis.position.z = -0.23;
            chassis.castShadow = true;
            chassis.receiveShadow = true;
            kSculpture.add(chassis);

            // 4B. Deep Jewel-Saturated 12-Prism 3D Pyramidal Acrylic Crystal Mosaic (zero pastel washout!)
            function addJewelPrismFacet(p0, p1, p2, apexZ, hex) {
                let a = p0, b = p1, c = p2;
                const signedArea2 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
                if (signedArea2 < 0) {
                    const tmp = b;
                    b = c;
                    c = tmp;
                }

                const zBack = -0.01;
                const zEdge = 0.048;
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

                const A = [a[0], a[1], zEdge];
                const B = [b[0], b[1], zEdge];
                const C = [c[0], c[1], zEdge];
                const P = [cx, cy, apexZ];
                pushTri(A, B, P);
                pushTri(B, C, P);
                pushTri(C, A, P);

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
                    emissiveIntensity: 0.04,
                    metalness: 0.08,
                    roughness: 0.15,
                    clearcoat: 0.92,
                    clearcoatRoughness: 0.08,
                    reflectivity: 1.0,
                    envMapIntensity: 1.15,
                    flatShading: true
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                return mesh;
            }

            const TL = [-0.58, 1.84], TM = [0.02, 1.84], TR = [0.58, 1.84];
            const UL = [-0.58, 1.20], UC = [-0.26, 1.46], KN = [0.06, 0.92];
            const LL = [-0.58, 0.58], MC = [-0.26, 0.86];
            const BL = [-0.58, 0.0],  BM = [0.02, 0.0],  LR = [0.31, 0.0], BR = [0.60, 0.0];

            // Exact Rich Jewel-Saturated Palette from trophies-reference.jpg + Pronounced 3D Pyramid Relief
            const facets = [
                { tri: [TL, UC, TM], z: 0.165, col: 0x7410c2 }, // Royal Violet
                { tri: [TL, UL, UC], z: 0.145, col: 0x41086e }, // Deep Indigo-Plum
                { tri: [TM, UC, KN], z: 0.178, col: 0xeb0070 }, // Electric Fuchsia-Magenta
                { tri: [TM, KN, TR], z: 0.155, col: 0xec1e26 }, // Crimson-Scarlet Upper Wing
                { tri: [UL, MC, UC], z: 0.152, col: 0x850b4c }, // Deep Wine-Berry
                { tri: [UC, MC, KN], z: 0.186, col: 0xcc0828 }, // Ruby-Red Heart
                { tri: [UL, LL, MC], z: 0.148, col: 0xe0115f }, // Vivid Cerise
                { tri: [LL, BL, MC], z: 0.158, col: 0xf55a00 }, // Blazing Tangerine
                { tri: [BL, BM, MC], z: 0.150, col: 0xfbb600 }, // Rich Sunburst Gold
                { tri: [MC, BM, KN], z: 0.172, col: 0xf46200 }, // Fiery Marigold-Orange
                { tri: [BM, LR, KN], z: 0.160, col: 0xea0a5b }, // Hot Rose-Magenta
                { tri: [LR, BR, KN], z: 0.148, col: 0xd91522 }  // Cardinal Red Lower Wing
            ];
            facets.forEach((f) => {
                kSculpture.add(addJewelPrismFacet(f.tri[0], f.tri[1], f.tri[2], f.z, f.col));
            });

            kSculpture.position.y = -0.44;
            group.add(kSculpture);

            // 4C. Heavy Brushed Champagne-Platinum Aluminium Base Block
            const baseTex = makeEngravedTexture((ctx, w, h) => {
                const g = ctx.createLinearGradient(0, 0, w * 0.9, h);
                g.addColorStop(0.0, '#f3eee8');
                g.addColorStop(0.45, '#e4ddd4');
                g.addColorStop(0.85, '#d2c9be');
                g.addColorStop(1.0, '#c2b8ac');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, w, h);
                addBrushedGrain(ctx, w, h, false, 0.052);

                // Top & Left Specular Metal Bevel Catchlights + Bottom Grounding Vignette
                ctx.fillStyle = 'rgba(255, 253, 248, 0.78)';
                ctx.fillRect(0, 0, w, 6);
                ctx.fillRect(0, 0, 7, h);
                ctx.fillStyle = 'rgba(36, 28, 24, 0.22)';
                ctx.fillRect(w - 8, 0, 8, h);
                ctx.fillRect(0, h - 9, w, 9);

                // Vivid Red "ET" Square + Crisp Black BRANDEQUITY.com Header
                ctx.fillStyle = '#d41920';
                ctx.fillRect(182, 80, 74, 64);
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = '800 41px Georgia, serif';
                ctx.fillText('ET', 219, 127);

                ctx.textAlign = 'left';
                ctx.fillStyle = '#110e16';
                ctx.font = '700 44px Georgia, serif';
                ctx.fillText('BRANDEQUITY', 268, 127);
                ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('.com', 612, 127);
                ctx.fillRect(268, 138, 412, 4.5);

                ctx.textAlign = 'center';
                ctx.fillStyle = '#0d0b12';
                ctx.font = '800 55px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('Specialist Agency', w / 2, 258);
                ctx.fillText('of the Year', w / 2, 322);

                ctx.fillStyle = '#181420';
                ctx.font = '600 44px "Plus Jakarta Sans", sans-serif';
                ctx.fillText('ET Brand Equity', w / 2, 420);
                ctx.fillText('Kaleido 2026', w / 2, 476);
            }, 900, 560);

            const baseSilver = new THREE.MeshStandardMaterial({
                color: 0xd2c9bf,
                bumpMap: brushedHBump,
                bumpScale: 0.003,
                metalness: 0.68,
                roughness: 0.26,
                envMapIntensity: 1.25
            });
            const baseFront = new THREE.MeshStandardMaterial({
                map: baseTex,
                bumpMap: brushedHBump,
                bumpScale: 0.0018,
                metalness: 0.36,
                roughness: 0.29,
                envMapIntensity: 1.15
            });
            const kBase = new THREE.Mesh(
                new THREE.BoxGeometry(1.48, 0.96, 0.46),
                [baseSilver, baseSilver, baseSilver, baseSilver, baseFront, baseSilver]
            );
            kBase.position.y = -0.92;
            kBase.castShadow = true;
            kBase.receiveShadow = true;
            group.add(kBase);

            group.add(createContactShadow(1.92, 1.02));
            return group;
        }

        const trophies = [
            buildIPRCCA3DTrophy(),
            buildGoldExcel3DTrophy('Legrand Data', 'Center Solutions', 'Integrated PR Marketing Campaign'),
            buildGoldExcel3DTrophy('NIIT University', '', 'Education'),
            buildKaleidoAcrylic3DTrophy()
        ];

        // Balanced Exhibition Spacing on the Compact Right-Aligned Travertine Plinth
        const getFinalSlots = (offsetX) => [
            { x: offsetX - 2.24, y: 0.0, z: -0.14, rotY: 0.18 },
            { x: offsetX - 0.74, y: 0.0, z: 0.15, rotY: 0.07 },
            { x: offsetX + 0.74, y: 0.0, z: 0.15, rotY: -0.07 },
            { x: offsetX + 2.24, y: 0.0, z: -0.14, rotY: -0.18 }
        ];
        let finalSlots = getFinalSlots(galleryOffsetX);

        trophies.forEach((t) => {
            t.position.set(galleryOffsetX + 9.4, 0.16, 1.2);
            t.rotation.set(0.05, -Math.PI * 1.12, 0.03);
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
        let isAwardsVisible = true;
        let cachedStageRect = stageEl ? stageEl.getBoundingClientRect() : { left: 0, top: 0, width: 1, height: 1 };

        if (stageEl && window.IntersectionObserver) {
            const awIO = new IntersectionObserver((entries) => {
                isAwardsVisible = Boolean(entries[0] && entries[0].isIntersecting);
            }, { rootMargin: '200px 0px' });
            awIO.observe(stageEl);
        }

        const renderAwardsFrame = (refreshShadow = true) => {
            if (refreshShadow) awRenderer.shadowMap.needsUpdate = true;
            keySpot.position.x = -2.4 + pointerNormX * 2.1;
            keySpot.position.y = 7.6 - pointerNormY * 0.95;
            awCamera.position.x = galleryOffsetX * 0.24 + pointerNormX * 0.32;
            awCamera.lookAt(galleryOffsetX * 0.56 + pointerNormX * 0.14, -0.06 + pointerNormY * 0.08, 0);
            awRenderer.render(awScene, awCamera);
        };

        const tickAwardsPointer = () => {
            if (!isAwardsVisible) {
                awPtrRafPending = false;
                return;
            }
            const dx = targetAwPtrX - pointerNormX;
            const dy = targetAwPtrY - pointerNormY;
            if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
                pointerNormX += dx * 0.12;
                pointerNormY += dy * 0.12;
                renderAwardsFrame(false);
                requestAnimationFrame(tickAwardsPointer);
            } else {
                awPtrRafPending = false;
            }
        };

        if (stageEl && !prefersReducedMotion) {
            stageEl.addEventListener('pointerenter', () => {
                cachedStageRect = stageEl.getBoundingClientRect();
            }, { passive: true });
            stageEl.addEventListener('pointermove', (e) => {
                if (!isAwardsVisible) return;
                targetAwPtrX = ((e.clientX - cachedStageRect.left) / Math.max(1, cachedStageRect.width) - 0.5) * 2;
                targetAwPtrY = ((e.clientY - cachedStageRect.top) / Math.max(1, cachedStageRect.height) - 0.5) * 2;
                if (!awPtrRafPending) {
                    awPtrRafPending = true;
                    requestAnimationFrame(tickAwardsPointer);
                }
            }, { passive: true });
        }

        gsap.fromTo(
            trophies[0].position,
            { x: galleryOffsetX + 9.4 },
            {
                x: galleryOffsetX + 3.4,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#awardsPinnedStage',
                    start: 'top 85%',
                    end: 'top top',
                    scrub: true,
                    onUpdate: () => renderAwardsFrame(true)
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
                    renderAwardsFrame(true);
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
                renderAwardsFrame(true);
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
                z: 11.55,
                y: 0.16,
                duration: 0.7,
                ease: 'sine.inOut'
            },
            2.9
        );

        renderAwardsFrame(true);

        window.addEventListener('resize', () => {
            const { w, h } = setAwardsSize();
            galleryOffsetX = getGalleryOffsetX();
            pedestal.position.x = galleryOffsetX;
            pedRing.position.x = galleryOffsetX;
            if (stageEl) cachedStageRect = stageEl.getBoundingClientRect();
            awCamera.aspect = w / h;
            awCamera.updateProjectionMatrix();
            renderAwardsFrame(true);
        }, { passive: true });
    }

    // ------------------------------------------------------------------------
    // 4. HEADER ADAPTATION, ACTIVE SECTION SPY & TOP PROGRESS HAIRLINE
    //    (Zero Layout Reads During Scroll — Powered by Cached layoutMetrics)
    // ------------------------------------------------------------------------
    const header = document.getElementById('editorialHeader');
    const progressLine = document.getElementById('scrollHairlineProgress');
    let lastActiveNavLink = null;
    let lastHeaderCondensed = false;
    let lastHairlineScale = -1;

    function updateHeaderAndSpyZeroReflow(sy) {
        const scale = Math.min(1, Math.max(0, sy / layoutMetrics.maxScroll));
        if (progressLine && Math.abs(scale - lastHairlineScale) > 0.0004) {
            lastHairlineScale = scale;
            progressLine.style.transform = `scaleX(${scale.toFixed(4)})`;
        }

        const condensed = sy > 48;
        if (header && condensed !== lastHeaderCondensed) {
            lastHeaderCondensed = condensed;
            header.classList.toggle('is-condensed', condensed);
        }

        const probeDocY = sy + layoutMetrics.vh * 0.34;
        const minBottomDocY = sy + 80;
        let activeLink = null;
        const ranges = layoutMetrics.navRanges;
        for (let i = 0; i < ranges.length; i++) {
            if (ranges[i].top <= probeDocY && ranges[i].bottom >= minBottomDocY) {
                activeLink = ranges[i].link;
            }
        }
        if (activeLink !== lastActiveNavLink) {
            if (lastActiveNavLink) lastActiveNavLink.classList.remove('is-active');
            if (activeLink) activeLink.classList.add('is-active');
            lastActiveNavLink = activeLink;
        }
    }

    window.addEventListener('scroll', () => {
        updateHeaderAndSpyZeroReflow(window.scrollY || 0);
    }, { passive: true });
    updateHeaderAndSpyZeroReflow(window.scrollY || 0);

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
        // Gentle magnetic pull on primary buttons & header CTA (cached rect on pointerenter — zero reflow on move)
        document.querySelectorAll('.btn-primary-editorial, .header-cta').forEach((btn) => {
            let btnRect = null;
            btn.addEventListener('pointerenter', () => {
                btnRect = btn.getBoundingClientRect();
            }, { passive: true });
            btn.addEventListener('pointermove', (e) => {
                if (!btnRect) btnRect = btn.getBoundingClientRect();
                const mx = ((e.clientX - btnRect.left) / Math.max(1, btnRect.width) - 0.5) * 11;
                const my = ((e.clientY - btnRect.top) / Math.max(1, btnRect.height) - 0.5) * 9;
                btn.style.transform = `translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0)`;
            }, { passive: true });
            btn.addEventListener('pointerleave', () => {
                btnRect = null;
                btn.style.transform = '';
            }, { passive: true });
        });

        // Contextual Editorial Cursor Pill over inspectable visuals, linked logos & blog cards (RAF-coalesced hit test)
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
            let latestPtrTarget = null;
            let hitCheckQueued = false;

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

            const evaluatePointerLabel = () => {
                hitCheckQueued = false;
                const labeled = latestPtrTarget && latestPtrTarget.closest ? latestPtrTarget.closest('[data-cursor-label]') : null;
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
            };

            window.addEventListener('pointermove', (e) => {
                targetPillX = e.clientX;
                targetPillY = e.clientY;
                latestPtrTarget = e.target;
                if (!hitCheckQueued) {
                    hitCheckQueued = true;
                    requestAnimationFrame(evaluatePointerLabel);
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
                    start: 'top 87%',
                    once: true
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
