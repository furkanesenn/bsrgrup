// const card = document.querySelector(".perspective");
// const inner = card;

// card.addEventListener("mousemove", (e) => {
//   const rect = card.getBoundingClientRect();
//   const x = e.clientX - rect.left;
//   const y = e.clientY - rect.top;

//   const offsetX = (x - rect.width / 2) / (rect.width / 2);
//   const offsetY = (y - rect.height / 2) / (rect.height / 2);

//   const rotateX = -offsetY * 10; // vertical tilt
//   const rotateY = offsetX * 10; // horizontal tilt

//   inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
// });

// card.addEventListener("mouseleave", () => {
//   inner.style.transform = `rotateX(0deg) rotateY(0deg)`;
// });

// Popup functionality

const popup = document.querySelector(".form-popup");

const openPopup = () => {
  popup.classList.add("active");
};

const closePopup = () => {
  popup.classList.remove("active");
};

document.addEventListener("DOMContentLoaded", () => {
  const popupTrigger = document.querySelectorAll(".popup-trigger");
  if (popupTrigger) {
    popupTrigger.forEach((trigger) => {
      trigger.addEventListener("click", openPopup);
    });
  }

  const closeButton = popup.querySelector(".close-button");
  if (closeButton) {
    closeButton.addEventListener("click", closePopup);
  }
});

// Custom cursor functionality

const cursor = document.querySelector(".custom-cursor");

document.addEventListener("mousemove", (e) => {
  cursor.style.top = e.clientY + "px";
  cursor.style.left = e.clientX + "px";
});

document.addEventListener("mousedown", () => {
  cursor.classList.add("active");
});

document.addEventListener("mouseup", () => {
  cursor.classList.remove("active");
});

// Context menu functionality  const contextMenu = document.getElementById('contextMenu');

const createMenu = async (e) => {
  const target = e.target;
  const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
  const selection = window.getSelection();
  const hasSelection = selection && selection.toString().trim().length > 0;

  // Only show when right-clicking on an element
  if (target === document.body || target === document.documentElement) {
    contextMenu.style.display = "none";
    return;
  }

  e.preventDefault();
  contextMenu.innerHTML = ""; // reset menu

  const menuItems = [];

  if (isInput || hasSelection) {
    menuItems.push(
      {
        label: "📋 Copy",
        action: async () => {
          if (isInput) {
            const sel = target.value.substring(
              target.selectionStart,
              target.selectionEnd
            );
            await navigator.clipboard.writeText(sel);
          } else {
            await navigator.clipboard.writeText(selection.toString());
          }
        },
      },
      {
        label: "📥 Paste",
        action: async () => {
          const text = await navigator.clipboard.readText();
          if (isInput) {
            const start = target.selectionStart;
            const end = target.selectionEnd;
            target.setRangeText(text, start, end, "end");
          } else {
            document.execCommand("insertText", false, text);
          }
        },
      }
    );
  } else {
    menuItems.push(
      {
        label: "🔙 Back",
        action: () => history.back(),
      },
      {
        label: "🔄 Refresh",
        action: () => location.reload(),
      }
    );
  }

  // Build menu items
  for (const item of menuItems) {
    const li = document.createElement("li");
    li.textContent = item.label;
    li.className = "custom-context-menu__item";
    li.onclick = () => {
      item.action();
      contextMenu.style.display = "none";
    };
    contextMenu.appendChild(li);
  }

  // Position near mouse cursor
  const menuWidth = 200;
  const menuHeight = menuItems.length * 42;
  let x = e.clientX;
  let y = e.clientY;

  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
  if (y + menuHeight > window.innerHeight)
    y = window.innerHeight - menuHeight - 10;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.style.display = "block";
};

// Listeners
document.addEventListener("contextmenu", createMenu);

["click", "scroll"].forEach((evt) =>
  document.addEventListener(evt, () => {
    contextMenu.style.display = "none";
  })
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") contextMenu.style.display = "none";
});
// Three.js 3D Abstracts

let scene, camera, renderer;
let group, particleGroup, tailGroup;
let ribbons = []; // Store ribbon geometry references
let tail; // Store tail reference
let drawTime = 0;
const clock = new THREE.Clock();
let hoverTime = 0;
let mouse = new THREE.Vector2();
let targetRotationX = 0;
let targetRotationZ = 0;
let isHovering = false;
let raycaster = new THREE.Raycaster();

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 6.5, 0);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("hero-canvas"),
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const light = new THREE.DirectionalLight(0xffffff, 1.4);
  light.position.set(3, 6, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  group = new THREE.Group();
  scene.add(group);
  group.position.x = 0;

  // Create a complex circular ribbon structure
  for (let i = 0; i < 12; i++) {
    const ribbon = createCircularRibbon(i * 0.07, i);
    ribbon.geometry.setDrawRange(0, 0); // Initially hidden
    ribbons.push(ribbon.geometry); // Store geometry instead of mesh
    group.add(ribbon);
  }

  // Add decorative wave paths to enhance visual density
  for (let j = 0; j < 3; j++) {
    const wave = createWaveRibbon(j * 0.1 - 0.15, j);
    group.add(wave);
  }

  // Create orbiting glow rings
  createOrbitingRings();

  // Create tail through and around the ring
  createTail();

  // Create particles
  createParticles();

  // Add invisible hover collider around group
  const boundingSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 16, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  boundingSphere.name = "hoverCollider";
  group.add(boundingSphere);

  window.addEventListener("resize", onWindowResize);

  const canvas = renderer.domElement;

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  });

  // canvas.addEventListener("mouseleave", () => {
  //   isHovering = false;
  // });
}

function createCircularRibbon(radiusOffset, index) {
  const points = [];
  const radius = 1.2 + radiusOffset;
  const turns = 3;
  for (let i = 0; i <= 300; i++) {
    const angle = (i / 300) * Math.PI * 2 * turns;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle * 2) * 0.2;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }

  const path = new THREE.CurvePath();
  for (let i = 0; i < points.length - 1; i++) {
    path.add(new THREE.LineCurve3(points[i], points[i + 1]));
  }

  const geometry = new THREE.TubeGeometry(path, 300, 0.02, 8, false); // Slightly thicker
  geometry.setDrawRange(0, 0);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const hue = (index * 0.05 + 0.6) % 1;
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setHSL(hue, 0.6, 0.7),
    metalness: 0.2,
    roughness: 0.05,
    transmission: 0.95,
    opacity: 0.4,
    transparent: true,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "ribbon"; // Important for hover detection
  return mesh;
}

function createWaveRibbon(yOffset, seed) {
  const points = [];
  const length = 2.5;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const angle = t * Math.PI * 2 * 3;
    const x = Math.cos(angle + seed) * length * (1 - t);
    const y = yOffset + Math.sin(t * 10 + seed) * 0.2;
    const z = Math.sin(angle + seed) * length * t;
    points.push(new THREE.Vector3(x, y, z));
  }

  const path = new THREE.CurvePath();
  for (let i = 0; i < points.length - 1; i++) {
    path.add(new THREE.LineCurve3(points[i], points[i + 1]));
  }

  const geometry = new THREE.TubeGeometry(path, 200, 0.008, 6, false);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xccccff,
    transmission: 0.8,
    opacity: 0.25,
    roughness: 0.2,
    transparent: true,
  });

  return new THREE.Mesh(geometry, material);
}

function createOrbitingRings() {
  for (let i = 0; i < 2; i++) {
    const geo = new THREE.RingGeometry(1.7 + i * 0.3, 1.7 + i * 0.305, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x99ccff,
      side: THREE.DoubleSide,
      opacity: 0.3,
      transparent: true,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = i * 0.5;
    group.add(ring);
  }
}

function createTail() {
  tailGroup = new THREE.Group();
  const points = [];
  const tailLength = 300;
  for (let i = 0; i <= tailLength; i++) {
    const t = i / tailLength;
    const angle = t * Math.PI * 2;
    const radius = 0.4 + Math.sin(t * 6) * 0.2;
    const x = Math.sin(angle * 0.5) * 2.2 * (1 - t);
    const y = Math.sin(angle * 2) * 0.5 * (1 - t);
    const z = Math.cos(angle) * 2.2 * t;
    points.push(new THREE.Vector3(x, y, z));
  }

  const path = new THREE.CurvePath();
  for (let i = 0; i < points.length - 1; i++) {
    path.add(new THREE.LineCurve3(points[i], points[i + 1]));
  }

  const geometry = new THREE.TubeGeometry(path, 300, 0.01, 6, false);
  geometry.setDrawRange(0, 0);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xff8888,
    transmission: 0.9,
    opacity: 0.3,
    roughness: 0.1,
    transparent: true,
  });

  tail = new THREE.Mesh(geometry, material);
  tailGroup.add(tail);
  group.add(tailGroup);
}

function createParticles() {
  particleGroup = new THREE.Group();
  const particleGeo = new THREE.SphereGeometry(0.01, 6, 6);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
  });

  for (let i = 0; i < 150; i++) {
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    );
    particle.userData = {
      speed: 0.001 + Math.random() * 0.002,
      angle: Math.random() * Math.PI * 2,
      radius: 1.5 + Math.random() * 2,
      axis: new THREE.Vector3(
        Math.random(),
        Math.random(),
        Math.random()
      ).normalize(),
    };
    particleGroup.add(particle);
  }

  scene.add(particleGroup);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  drawTime += delta * 1000;
  hoverTime += delta;

  const visibleSegments = Math.floor(drawTime);
  ribbons.forEach((geometry) => {
    geometry.setDrawRange(0, Math.min(visibleSegments, geometry.index.count));
  });
  if (tail) {
    tail.geometry.setDrawRange(
      0,
      Math.min(visibleSegments, tail.geometry.index.count)
    );
  }

  const floatY = Math.sin(hoverTime * 0.6) * 0.08;
  group.position.y = floatY;

  if (isHovering) {
    const targetX = mouse.y * 0.2;
    const targetZ = mouse.x * 0.2;
    group.rotation.x += (targetX - group.rotation.x) * 0.1;
    group.rotation.z += (targetZ - group.rotation.z) * 0.1;
    group.scale.set(1.03, 1.03, 1.03);
  } else {
    group.rotation.x += (0 - group.rotation.x) * 0.05;
    group.rotation.z += (0 - group.rotation.z) * 0.05;
    group.scale.set(1, 1, 1);
  }

  particleGroup.children.forEach((p) => {
    p.userData.angle += p.userData.speed;
    const r = p.userData.radius;
    const a = p.userData.angle;
    const axis = p.userData.axis;
    p.position.set(
      Math.cos(a) * r * axis.x,
      Math.sin(a) * r * axis.y,
      Math.cos(a * 0.5) * r * axis.z
    );
  });

  raycaster.setFromCamera(mouse, camera);
  const collider = group.getObjectByName("hoverCollider");
  const intersects = collider ? raycaster.intersectObject(collider, true) : [];
  isHovering = intersects.length > 0;
  const hoverTargets = [];
  group.traverse((obj) => {
    if (
      obj.isMesh &&
      obj.geometry &&
      obj.geometry.boundingSphere &&
      obj.material.opacity > 0.1
    ) {
      hoverTargets.push(obj);
    }
  });
  if (isHovering) {
    const targetX = mouse.y * 0.2;
    const targetZ = mouse.x * 0.2;
    group.rotation.x += (targetX - group.rotation.x) * 0.1;
    group.rotation.z += (targetZ - group.rotation.z) * 0.1;
    group.scale.set(1.03, 1.03, 1.03);
  } else {
    group.rotation.x += (0 - group.rotation.x) * 0.05;
    group.rotation.z += (0 - group.rotation.z) * 0.05;
    group.scale.set(1, 1, 1);
  }

  renderer.render(scene, camera);
}

// Add event listener for hamburger menu toggle
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});
