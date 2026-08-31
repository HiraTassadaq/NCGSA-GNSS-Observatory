import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  propagateEcef,
  computeOrbitPath,
  geodeticToEcef,
  ephemerisComplete,
} from "../../lib/gpsOrbit";
import { CONSTELLATION_COLOR } from "../../lib/satellites";
import "../../dashboard/Stylesheet/septentrio.css";
const EARTH_RADIUS_SCENE = 2;
const WGS84_A = 6378137.0;
const SCALE = EARTH_RADIUS_SCENE / WGS84_A;

const ROTATION_OFFSET_RAD = 0;

function ecefToScene(ecef) {
  const x = ecef.x * SCALE;
  const y = ecef.z * SCALE;
  const z = -ecef.y * SCALE;

  const cosA = Math.cos(ROTATION_OFFSET_RAD);
  const sinA = Math.sin(ROTATION_OFFSET_RAD);

  return {
    x: x * cosA - z * sinA,
    y,
    z: x * sinA + z * cosA,
  };
}

function cssVar(name, fallback) {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return val || fallback;
}

const EARTH_TEXTURE_URL =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";

export default function Globe3D({
  ephemerisBySvid,
  gpsTimeAnchor,
  receiverPosition,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef(null);

  const totalEphemeris = Object.keys(
    ephemerisBySvid || {}
  ).length;

  const completeEphemeris = Object.values(
    ephemerisBySvid || {}
  ).filter(ephemerisComplete).length;

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.01,
      1000
    );

    camera.position.set(0, 2, 6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3;
    controls.maxDistance = 15;

    /* =========================
       EARTH
    ========================= */

    const loader = new THREE.TextureLoader();

    const earthGeo = new THREE.SphereGeometry(
      EARTH_RADIUS_SCENE,
      48,
      32
    );

    const earthMat = new THREE.MeshBasicMaterial({
      color: 0x223344,
    });

    const earth = new THREE.Mesh(
      earthGeo,
      earthMat
    );

    scene.add(earth);

    loader.load(
      EARTH_TEXTURE_URL,
      (tex) => {
        earthMat.map = tex;
        earthMat.color.set(0xffffff);
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {
        console.warn(
          "Earth texture failed to load."
        );
      }
    );

    /* =========================
       EARTH GRID
    ========================= */

    const grid = new THREE.LineSegments(
      new THREE.WireframeGeometry(
        new THREE.SphereGeometry(
          EARTH_RADIUS_SCENE * 1.001,
          24,
          16
        )
      ),
      new THREE.LineBasicMaterial({
        color: 0x2c3a4d,
        transparent: true,
        opacity: 0.25,
      })
    );

    scene.add(grid);

    /* =========================
       GROUPS
    ========================= */

    const satGroup = new THREE.Group();
    const orbitGroup = new THREE.Group();

    scene.add(satGroup);
    scene.add(orbitGroup);

    /* =========================
       RECEIVER
    ========================= */

    const receiverGeo =
      new THREE.SphereGeometry(
        0.03,
        12,
        12
      );

    const receiverMat =
      new THREE.MeshBasicMaterial({
        color: 0xff5c9e,
      });

    const receiverMarker = new THREE.Mesh(
      receiverGeo,
      receiverMat
    );

    receiverMarker.visible = false;

    scene.add(receiverMarker);

    stateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      satGroup,
      orbitGroup,
      receiverMarker,
      satMeshes: {},
      orbitPathCache: {},
    };

    let raf;

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;

      if (!w || !h) return;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    const resizeObserver =
      new ResizeObserver(onResize);

    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(raf);

      resizeObserver.disconnect();

      controls.dispose();
      renderer.dispose();

      if (
        renderer.domElement &&
        mount.contains(renderer.domElement)
      ) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  /* =========================
     RECEIVER POSITION
  ========================= */

  useEffect(() => {
    const ctx = stateRef.current;

    if (!ctx || !receiverPosition) return;

    const ecef = geodeticToEcef(
      receiverPosition.lat,
      receiverPosition.lon,
      receiverPosition.height || 0
    );

    const p = ecefToScene(ecef);

    ctx.receiverMarker.position.set(
      p.x,
      p.y,
      p.z
    );

    ctx.receiverMarker.visible = true;
  }, [receiverPosition]);

  /* =========================
     ORBIT PATHS
  ========================= */

  useEffect(() => {
    const ctx = stateRef.current;

    if (!ctx) return;

    const {
      orbitGroup,
      orbitPathCache,
    } = ctx;

    Object.entries(
      ephemerisBySvid || {}
    ).forEach(([svid, eph]) => {
      if (!ephemerisComplete(eph)) return;

      const toe = eph.t_oe ?? eph.Toe;

      if (
        orbitPathCache[svid]?.lastToe === toe
      ) {
        return;
      }

      if (orbitPathCache[svid]?.line) {
        orbitGroup.remove(
          orbitPathCache[svid].line
        );
      }

      const points = computeOrbitPath(eph).map(
        (ecef) => {
          const p = ecefToScene(ecef);

          return new THREE.Vector3(
            p.x,
            p.y,
            p.z
          );
        }
      );

      const geo =
        new THREE.BufferGeometry().setFromPoints(
          points
        );

      const mat =
        new THREE.LineBasicMaterial({
          color: new THREE.Color(
            cssVar(
              "--gps",
              "#33e39b"
            )
          ),
          transparent: true,
          opacity: 0.35,
        });

      const line = new THREE.Line(
        geo,
        mat
      );

      orbitGroup.add(line);

      orbitPathCache[svid] = {
        lastToe: toe,
        line,
      };
    });
  }, [ephemerisBySvid]);

  /* =========================
     SATELLITE POSITIONS
  ========================= */

  useEffect(() => {
    const ctx = stateRef.current;
    if (!ctx || !gpsTimeAnchor) return;

    const updateSatellitePositions = () => {
      const currentGpsSeconds =
        gpsTimeAnchor.gpsSeconds +
        (Date.now() - gpsTimeAnchor.wallClockMs) / 1000;

      Object.entries(ephemerisBySvid || {}).forEach(([svid, eph]) => {
        if (!ephemerisComplete(eph)) return;

        const ecef = propagateEcef(eph, currentGpsSeconds);
        const p = ecefToScene(ecef);

        let mesh = ctx.satMeshes[svid];

        if (!mesh) {
          const geo = new THREE.SphereGeometry(0.035, 10, 10);
          const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(cssVar("--gps", "#33e39b")),
          });

          mesh = new THREE.Mesh(geo, mat);
          ctx.satGroup.add(mesh);
          ctx.satMeshes[svid] = mesh;
        }

        mesh.position.set(p.x, p.y, p.z);
      });
    };

    updateSatellitePositions();
    const interval = setInterval(updateSatellitePositions, 1000);

    return () => clearInterval(interval);
  }, [ephemerisBySvid, gpsTimeAnchor]);

  return (
    <div className="globe3d">

      {/* THREE.JS CANVAS */}
      <div
        ref={mountRef}
        className="globe3d-canvas"
      />

      {/* TOP HUD */}
      <div className="globe3d-hud">

        <div className="globe3d-hud-left">

          <span className="globe3d-indicator" />

          <span className="globe3d-label">
            ORBITAL VIEW
          </span>

          <span className="globe3d-divider">
            /
          </span>

          <span className="globe3d-subtitle">
            GPS CONSTELLATION
          </span>

        </div>

        <div className="globe3d-status">

          <span
            className={
              completeEphemeris > 0
                ? "globe3d-status-dot online"
                : "globe3d-status-dot warning"
            }
          />

          <span>
            {completeEphemeris}/
            {totalEphemeris}
          </span>

          <span className="globe3d-status-muted">
            EPHEMERIS
          </span>

        </div>

      </div>

      {/* BOTTOM HUD */}
      <div className="globe3d-controls">

        <div className="globe3d-control">
          <span className="globe3d-control-key">
            DRAG
          </span>
          <span>
            ORBIT
          </span>
        </div>

        <div className="globe3d-control">
          <span className="globe3d-control-key">
            SCROLL
          </span>
          <span>
            ZOOM
          </span>
        </div>

        <div className="globe3d-clock">
          <span className="globe3d-clock-dot" />
          GPS CLOCK
          <strong>
            {gpsTimeAnchor
              ? "SYNCED"
              : "NOT SYNCED"}
          </strong>
        </div>

      </div>

    </div>
  );
}