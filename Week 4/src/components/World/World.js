import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "./OrbitControls";
import { useStores } from "../../hooks/index";
import { useHistory, useLocation } from "react-router-dom";
import { useObserver, observer } from "mobx-react-lite";
import { autorun } from "mobx";
import * as firebase from "firebase/app";
import style from "./world.module.css";
import "firebase/storage";
import { gsap } from "gsap";

const World = observer(() => {
  const { pinStore } = useStores();
  const history = useHistory();
  const mount = useRef(null);
  const raycaster = useRef(null);
  const mouse = useRef(null);
  const controls = useRef(null);
  const location = useLocation();
  const name = location.state.name;
  const titleRef = useRef(null);

  let scene,
    camera,
    renderer,
    ambientLight,
    hemisphereLight,
    shadowLight,
    shadowLight2,
    distantStars,
    closeStars,
    frameId,
    earth,
    listener,
    audioLoader,
    sky,
    distanceStarsGeom,
    distanceStarsMat,
    closeStarsGeom,
    closeStarsMat,
    earthGeom,
    earthMat,
    northPoleGeom,
    northPoleMat,
    southPoleGeom,
    southPoleMat,
    contiGeom,
    contiMat,
    cloudGeom,
    cloudMat,
    pointerGeom,
    pointerMat,
    filter,
    ambienceElement;

  let timeOut = 0;
  let holdTime = 1000;
  let doAnim = false;
  let canClick = false;
  let pointers = [];
  let audios = [];
  let pins = [];
  let allObjects = [];
  let intervals = [];
  let click = true;
  let ambience;
  listener = new THREE.AudioListener();
  ambienceElement = new Audio("../../assets/audio/ambience.wav");
  ambienceElement.play();

  ambience = new THREE.Audio(listener);
  ambience.setMediaElementSource(ambienceElement);
  ambience.setLoop(true);
  ambience.setVolume(0.1);
  ambience.play();
  useEffect(() => {
    raycaster.current = new THREE.Raycaster();
    mouse.current = new THREE.Vector2();

    audioLoader = new THREE.AudioLoader();

    let width = mount.current.clientWidth;
    let height = mount.current.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.set(0, 0, 600);
    camera.add(listener);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setClearColor("#000000");
    renderer.setSize(width, height);

    controls.current = new OrbitControls(camera, renderer.domElement);
    controls.current.maxDistance = 700;
    controls.current.minDistance = 120;
    controls.current.zoomSpeed = 2;
    controls.current.enableRotate = false;
    controls.current.enablePan = false;
    controls.current.enalbeDamping = true;
    controls.current.enabled = false;
    controls.current.update();

    ambientLight = new THREE.AmbientLight(0xe5d5d5);
    ambientLight.intensity = 0.5;
    hemisphereLight = new THREE.HemisphereLight(0x2f586d, 0x0e4a6d, 0.7);
    shadowLight = new THREE.DirectionalLight(0xe5cc20, 0.8);
    shadowLight2 = new THREE.DirectionalLight(0x136d69, 3);
    shadowLight.position.set(200, -350, 0);
    shadowLight2.position.set(-200, 500, 10);
    shadowLight.castShadow = true;
    shadowLight2.castShadow = true;
    shadowLight.shadow.camera.left = -1400;
    shadowLight.shadow.camera.right = 1400;
    shadowLight.shadow.camera.top = 1400;
    shadowLight.shadow.camera.bottom = -1400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    scene.add(ambientLight, hemisphereLight, shadowLight, shadowLight2);

    document.addEventListener(`mousedown`, onMouseClick);
    document.addEventListener(`mousemove`, onMouseMove);

    let CreateDistantStars = function () {
      let particleCount = 10000;
      distanceStarsGeom = new THREE.Geometry();
      distanceStarsMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
      });

      for (let p = 0; p < particleCount; p++) {
        let pX = Math.random() * 3000 - 1500,
          pY = Math.random() * 3000 - 1500,
          pZ = Math.ceil(Math.random() * 700) - 400,
          particle = new THREE.Vector3(pX, pY, pZ);

        distanceStarsGeom.vertices.push(particle);
      }

      this.mesh = new THREE.Points(distanceStarsGeom, distanceStarsMat);
    };

    let CreateCloseStars = function () {
      this.mesh = new THREE.Object3D();
      closeStarsGeom = new THREE.SphereGeometry(2, 6, 6);
      closeStarsMat = new THREE.MeshPhongMaterial({
        shininess: 100,
        specular: 0xffffff,
        transparent: true,
      });

      let star;
      let startCount = 155;

      for (let i = 0; i < startCount; i++) {
        star = new THREE.Mesh(closeStarsGeom, closeStarsMat);
        star.position.x =
          Math.random() * (window.innerWidth + 1) - window.innerWidth / 2;
        star.position.y =
          Math.random() * (window.innerHeight + 1) - window.innerHeight / 2;
        star.position.z = Math.floor(Math.random() * (1200 - 1)) - 1500;
        star.scale.set(0.4, 0.4, 0.4);
        this.mesh.add(star);
      }
    };

    const createCosmos = () => {
      distantStars = new CreateDistantStars();
      closeStars = new CreateCloseStars();
      closeStars.mesh.position.set(0, 0, 0);
      distantStars.mesh.position.set(0, 0, 0);
      scene.add(distantStars.mesh, closeStars.mesh);
      allObjects.push(distantStars.mesh, closeStars.mesh);
      distanceStarsMat.dispose();
      distanceStarsGeom.dispose();
      closeStarsGeom.dispose();
      closeStarsMat.dispose();
    };

    const Earth = function () {
      this.mesh = new THREE.Object3D();


      earthGeom = new THREE.OctahedronGeometry(55, 3);
      earthMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0x004d6d,
        flatShading: true,
      });
      let earthSphere = new THREE.Mesh(earthGeom, earthMat);
      earthSphere.name = "sea";

      earthSphere.receiveShadow = true;


      northPoleGeom = new THREE.SphereGeometry(35, 5, 5);

      northPoleGeom.vertices[0].y -= 2;
      northPoleGeom.vertices[7].y += 5;
      northPoleGeom.vertices[8].y += 5;
      northPoleGeom.vertices[9].y += 5;
      northPoleGeom.vertices[10].y += 5;
      northPoleGeom.vertices[11].y += 5;

      northPoleMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0xf7f7f3,
        flatShading: true,
      });

      let northPole = new THREE.Mesh(northPoleGeom, northPoleMat);
      northPole.position.set(0, 24, 0);
      northPole.name = "northPole";


      southPoleGeom = new THREE.SphereGeometry(35, 5, 5);

      southPoleGeom.vertices[0].y -= 2;
      southPoleGeom.vertices[7].y += 5;
      southPoleGeom.vertices[8].y += 5;
      southPoleGeom.vertices[9].y += 5;
      southPoleGeom.vertices[10].y += 5;
      southPoleGeom.vertices[11].y += 5;

      southPoleGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI));

      southPoleMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0xf7f7f3,
        flatShading: true,
      });

      let southPole = new THREE.Mesh(southPoleGeom, southPoleMat);
      southPole.position.set(0, -24, 0);
      southPole.name = "southPole";


      contiGeom = new THREE.DodecahedronGeometry(25, 1);

      contiGeom.mergeVertices();

      let l = contiGeom.vertices.length;

      for (let i = 0; i < l; i++) {
        let v = contiGeom.vertices[i];

        if (i < l / 2) {
          v.y -= 5;
          v.z += 0.5 * 5;
          v.x += 0.5 * 5;
        } else {
          v.y += 7;
          v.z -= 0.5 * 5;
          v.x -= 0.5 * 5;
        }
      }

      contiGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI));

      contiMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0x129b40,
        flatShading: true,
      });

      let africa = new THREE.Mesh(contiGeom, contiMat);
      africa.position.set(0, -10, 33);
      africa.rotation.x = (Math.PI / 180) * 35;
      africa.name = "land";

      let europe = new THREE.Mesh(contiGeom, contiMat);
      europe.position.set(0, 20, 33);
      europe.rotation.x = (Math.PI / 180) * 40;
      europe.name = "land";

      let australia = new THREE.Mesh(contiGeom, contiMat);
      australia.position.set(28, -15, 0);
      australia.rotation.x = (Math.PI / 180) * 270;
      australia.rotation.y = (Math.PI / 180) * 50;
      australia.name = "land";

      let asia = new THREE.Mesh(contiGeom, contiMat);
      asia.position.set(28, 0, 20);
      asia.rotation.x = (Math.PI / 180) * 270;
      asia.name = "land";

      let northAmerica = new THREE.Mesh(contiGeom, contiMat);
      northAmerica.position.set(-28, 20, 0);
      northAmerica.rotation.x = (Math.PI / 180) * 30;
      northAmerica.name = "land";

      let southAmerica = new THREE.Mesh(contiGeom, contiMat);
      southAmerica.position.set(-28, -10, 0);
      southAmerica.rotation.x = (Math.PI / 180) * 50;
      southAmerica.name = "land";

      northPole.receiveShadow = true;
      southPole.receiveShadow = true;
      africa.receiveShadow = true;
      europe.receiveShadow = true;
      australia.receiveShadow = true;
      asia.receiveShadow = true;
      northAmerica.receiveShadow = true;

      southAmerica.receiveShadow = true;

      pointers.push(
        earthSphere,
        northPole,
        southPole,
        africa,
        asia,
        europe,
        australia,
        northAmerica,
        southAmerica
      );

      this.mesh.add(
        earthSphere,
        northPole,
        southPole,
        africa,
        europe,
        australia,
        asia,
        northAmerica,
        southAmerica
      );
    };

    const createEarth = () => {
      earth = new Earth();
      earth.mesh.position.set(0, 0, -150);
      controls.current.target = new THREE.Vector3(
        earth.mesh.position.x,
        earth.mesh.position.y,
        earth.mesh.position.z
      );
      scene.add(earth.mesh);
      allObjects.push(earth.mesh);
      earthGeom.dispose();
      earthMat.dispose();
      northPoleGeom.dispose();
      southPoleGeom.dispose();
      contiGeom.dispose();
      contiMat.dispose();
    };

    let Cloud = function () {
      this.mesh = new THREE.Object3D();

      cloudGeom = new THREE.DodecahedronGeometry(4, 0);
      cloudMat = new THREE.MeshPhongMaterial({
        color: 0xd0e3ee,
        shininess: 10,
        flatShading: true,
      });

      let nBlocs = 5 + Math.floor(Math.random() * 7);

      for (let i = 0; i < nBlocs; i++) {
        let m = new THREE.Mesh(cloudGeom, cloudMat);

        m.position.x = Math.sin(i) * 3;
        m.position.y = Math.random() * 1.1;
        m.position.z = Math.random() * 0.7;
        m.rotation.y = Math.random() * Math.PI * 1.5;
        m.rotation.z = Math.random() * Math.PI * 1.5;

        let s = 0.3 + Math.random() * 0.3;
        m.scale.set(s, s, s);

        m.castShadow = true;

        this.mesh.add(m);
      }
    };

    let Sky = function () {
      this.mesh = new THREE.Object3D();

      let Pivot = function () {
        this.mesh = new THREE.Object3D();
        this.mesh.position.set(0, 0, 0);
      };

      this.mesh.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));

      this.nClouds = 15;

      let stepAngle = (Math.PI * 2) / this.nClouds;

      for (let i = 0; i < this.nClouds; i++) {
        let p = new Pivot();

        let c = new Cloud();

        let a = stepAngle * i;
        let h = 62 + Math.random() * 5;

        c.mesh.position.y = Math.sin(a) * h;
        c.mesh.position.x = Math.cos(a) * h;

        c.mesh.rotation.z = a + Math.PI / 2;

        let s = Math.random() * 2;
        c.mesh.scale.set(s, s, s);

        p.mesh.add(c.mesh);

        p.mesh.rotation.x = (Math.PI / 180) * (Math.random() * 360);
        p.mesh.rotation.y = -(Math.PI / 180) * (Math.random() * 360);
        p.mesh.rotation.z = (Math.PI / 180) * (Math.random() * 360);

        this.mesh.add(p.mesh);
      }
    };

    const createSky = () => {
      sky = new Sky();
      sky.mesh.position.set(0, 0, 0);
      earth.mesh.add(sky.mesh);
      cloudGeom.dispose();
      cloudMat.dispose();
    };

    const renderScene = () => {
      if (renderer != null) {
        renderer.render(scene, camera);
      }
    };

    const handleResize = () => {
      width = mount.current.clientWidth;
      height = mount.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderScene();
    };

    const animate = () => {
      controls.current.update();

      closeStars.mesh.rotation.y += 0.00003;
      closeStars.mesh.children.forEach((star) => {
        star.material.opacity = Math.sin(Date.now() * 0.001) / 2 + 0.5;
      });
      if (
        camera.position.z <= -20 &&
        camera.position.z >= -299 &&
        doAnim === false &&
        canClick === true
      ) {
        gsap.to(".div__flex", {
          opacity: 0,
          duration: 1,

          onComplete: function () {
            doAnim = true;
          },
        });
        doAnim = true;
      }
      if (
        (camera.position.z >= -14 && doAnim === true && canClick === true) ||
        (camera.position.z <= -300 && doAnim === true && canClick === true)
      ) {
        gsap.to(".div__flex", {
          opacity: 1,
          duration: 1,
          onComplete: function () {
            doAnim = false;
          },
        });
      }
      distantStars.mesh.rotation.y += 0.00002;
      distantStars.mesh.rotation.x += 0.00003;
      distantStars.mesh.rotation.z += 0.00003;
      sky.mesh.rotation.y -= 0.0003;
      sky.mesh.rotation.z += 0.0003;
      renderScene();
      frameId = window.requestAnimationFrame(animate);
    };

    const cameraAnim = () => {
      gsap.to(camera.position, {
        duration: 2,
        z: 175,
        onComplete: function () {
          controls.current.enabled = true;
          controls.current.update();
          canClick = true;
          gsap.to(".div__flex", { opacity: 1, duration: 2 }, 2);
        },
      });
    };

    mount.current.appendChild(renderer.domElement);
    window.addEventListener("resize", handleResize);
    frameId = requestAnimationFrame(animate);

    createCosmos();
    createEarth();
    createSky();
    cameraAnim();

    return () => {
      window.removeEventListener("resize", handleResize);
      mount.current.removeChild(renderer.domElement);
      allObjects.forEach((object) => {
        scene.remove(object);
      });
      disposeHierarchy(earth.mesh, disposeNode);
      disposeHierarchy(distantStars.mesh, disposeNode);
      disposeHierarchy(closeStars.mesh, disposeNode);
      distanceStarsMat.dispose();
      distanceStarsGeom.dispose();
      closeStarsGeom.dispose();
      closeStarsMat.dispose();
      earthGeom.dispose();
      earthMat.dispose();
      northPoleGeom.dispose();
      southPoleGeom.dispose();
      contiGeom.dispose();
      contiMat.dispose();
      cloudGeom.dispose();
      cloudMat.dispose();
      /* pointerGeom.dispose();
      pointerMat.dispose(); */

      intervals.forEach((interval) => {
        clearInterval(interval);
      });

      pins.forEach((pin) => {
        if (pin.children[0]) {
          if (pin.children[0].isPlaying === true) {
            pin.children[0].stop();
          }
        }
      });
      ambience.stop();
      ambienceElement.pause();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer = null;
      audioLoader = null;
      pointers = null;
      audios = null;
      pins = null;
      allObjects = null;
      listener = null;
    };
  }, []);

  function onMouseMove(e) {
    controls.current.enabled = true;
    if (mount.current != undefined) {
      if (canClick === true) {
        e.preventDefault();
        if (mount.current.classList.contains("pointer")) {
          mount.current.classList.remove("pointer");
        }
        controls.current.enableRotate = true;
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.current.setFromCamera(mouse.current, camera);

        let intersects = raycaster.current.intersectObjects(pointers);

        if (intersects.length > 0) {
          controls.current.enabled = false;
          mount.current.classList.add("pointer");
          controls.current.enableRotate = false;

          if (intersects[0].object.name === "southPole") {
            titleRef.current.innerHTML = `Let's help the animals on <span style="color:#FF6541;">the SouthPole </span>`;
            pins.forEach((pin) => {
              if (pin.children[0]) {
                if (pin.children[0].isPlaying === true) {
                  pin.children[0].pause();
                }
              }
            });
          } else if (intersects[0].object.name === "northPole") {
            titleRef.current.innerHTML = `Let's help the animals on <span style="color:#FF6541;">the Northpole </span>`;
            pins.forEach((pin) => {
              if (pin.children[0]) {
                if (pin.children[0].isPlaying === true) {
                  pin.children[0].pause();
                }
              }
            });
          } else if (intersects[0].object.name === "sea") {
            titleRef.current.innerHTML = `Let's help the animals in <span style="color:#FF6541;">the sea </span>`;
            pins.forEach((pin) => {
              if (pin.children[0]) {
                if (pin.children[0].isPlaying === true) {
                  pin.children[0].pause();
                }
              }
            });
          } else if (intersects[0].object.name === "land") {
            titleRef.current.innerHTML = `Let's help the animals on <span style="color:#FF6541;">land </span>`;
            pins.forEach((pin) => {
              if (pin.children[0]) {
                if (pin.children[0].isPlaying === true) {
                  pin.children[0].pause();
                }
              }
            });
          } else if (
            intersects[0].object.name !== "sea" &&
            intersects[0].object.name !== "land" &&
            intersects[0].object.name !== "northPole" &&
            intersects[0].object.name !== "southPole"
          ) {

            pins.forEach((pin) => {
              if (pin.name === intersects[0].object.name) {

                titleRef.current.innerHTML = `Explore the environment created by <span style="color:#FF6541;">${pin.currentData}</span>`;
                if (pin.children[0]) {
                  if (pin.children[0].isPlaying === true) {
                  } else {
                    pin.children[0].play();
                  }
                }
              } else {
                if (pin.children[0]) {
                  if (pin.children[0].isPlaying === true) {
                    pin.children[0].pause();
                  }
                }
              }
            });
          }
        } else {
          titleRef.current.innerHTML = `<span style="color:#FF6541;"> ${name}</span>, Let's help the animals`;
        }
      }
    }
  }
  const makeReverb = async () => {
    const createReverb = async () => {
      const convolver = new ConvolverNode(listener.context);
      let response = await fetch(`../../assets/audio/star2.wav`);
      let arraybuffer = await response.arrayBuffer();
      convolver.buffer = await listener.context.decodeAudioData(arraybuffer);
      return convolver;
    };

    filter = await createReverb("silo.wav");
  };
  makeReverb();

  function onMouseClick(e) {
    if (click == true && canClick == true) {
      controls.current.enabled = false;
      e.preventDefault();

      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      let intersects = raycaster.current.intersectObjects(pointers);

      timeOut = setTimeout(function () {
        if (intersects.length > 0) {
          click = false;
          if (
            intersects[0].object.name != "sea" &&
            intersects[0].object.name != "land" &&
            intersects[0].object.name != "northPole" &&
            intersects[0].object.name != "southPole"
          ) {
            history.push({
              pathname: `/${intersects[0].object.name}`,
              state: {
                // location state
                type: intersects[0].object.name,
                x: intersects[0].point.x,
                y: intersects[0].point.y,
                z: intersects[0].point.z,
                name: location.state.name,
              },
            });
          } else {
            history.push({
              pathname: "/create",
              state: {
                // location state
                type: intersects[0].object.name,
                x: intersects[0].point.x,
                y: intersects[0].point.y,
                z: intersects[0].point.z,
                name: location.state.name,
              },
            });
          }
        }
      }, holdTime);
    }
  }

  document.addEventListener("mouseleave", function () {
    clearTimeout(timeOut);
  });
  document.addEventListener("mouseup", function () {
    clearTimeout(timeOut);
  });

  React.useEffect(
    () =>
      autorun(() => {
        const createPins = () => {
          pinStore.pins.map((pin) => {
            pointerGeom = new THREE.DodecahedronGeometry(1, 0);
            pointerMat = new THREE.MeshPhongMaterial({
              color: 16643437,
              shininess: 10,
              flatShading: true,
            });

            const pointer = new THREE.Mesh(pointerGeom, pointerMat);
            pointer.position.x = pin.x;
            pointer.position.y = pin.y;
            pointer.position.z = pin.z;
            pointer.name = pin.id;
            pointer.currentData = pin.name;

            scene.add(pointer);

            const audio = new THREE.PositionalAudio(listener);
            const storageRef = firebase.storage().ref();
            storageRef
              .child("audio/" + pin.audio)
              .getDownloadURL()
              .then(function (url) {
                if (audioLoader) {
                  audioLoader.load(url, (buffer) => {
                    audio.setBuffer(buffer);
                    audio.setLoop(true);
                    audio.setRefDistance(10);
                    audio.setVolume(0.5);
                    audio.setFilter(filter);
                    pointer.add(audio);
                  });
                }
              });

            pins.push(pointer);
            allObjects.push(pointer);
            pointers.push(pointer);
            if (pointerGeom != undefined) {
              pointerGeom.dispose();
              pointerMat.dispose();
            }
          });
        };
        createPins();

        return () => {};
      }),
    [] // note empty dependencies
  );

  function disposeNode(node) {
    if (node instanceof THREE.Mesh) {
      if (node.geometry) {
        node.geometry.dispose();
      }

      if (node.material) {
        if (node.material instanceof THREE.MeshFaceMaterial) {
          node.forEach(node.material.materials, function (idx, mtrl) {
            if (mtrl.map) mtrl.map.dispose();
            if (mtrl.lightMap) mtrl.lightMap.dispose();
            if (mtrl.bumpMap) mtrl.bumpMap.dispose();
            if (mtrl.normalMap) mtrl.normalMap.dispose();
            if (mtrl.specularMap) mtrl.specularMap.dispose();
            if (mtrl.envMap) mtrl.envMap.dispose();
            if (mtrl.alphaMap) mtrl.alphaMap.dispose();
            if (mtrl.aoMap) mtrl.aoMap.dispose();
            if (mtrl.displacementMap) mtrl.displacementMap.dispose();
            if (mtrl.emissiveMap) mtrl.emissiveMap.dispose();
            if (mtrl.gradientMap) mtrl.gradientMap.dispose();
            if (mtrl.metalnessMap) mtrl.metalnessMap.dispose();
            if (mtrl.roughnessMap) mtrl.roughnessMap.dispose();

            mtrl.dispose(); // disposes any programs associated with the material
          });
        } else {
          if (node.material.map) node.material.map.dispose();
          if (node.material.lightMap) node.material.lightMap.dispose();
          if (node.material.bumpMap) node.material.bumpMap.dispose();
          if (node.material.normalMap) node.material.normalMap.dispose();
          if (node.material.specularMap) node.material.specularMap.dispose();
          if (node.material.envMap) node.material.envMap.dispose();
          if (node.material.alphaMap) node.material.alphaMap.dispose();
          if (node.material.aoMap) node.material.aoMap.dispose();
          if (node.material.displacementMap)
            node.material.displacementMap.dispose();
          if (node.material.emissiveMap) node.material.emissiveMap.dispose();
          if (node.material.gradientMap) node.material.gradientMap.dispose();
          if (node.material.metalnessMap) node.material.metalnessMap.dispose();
          if (node.material.roughnessMap) node.material.roughnessMap.dispose();

          node.material.dispose(); // disposes any programs associated with the material
        }
      }
    }
  } // disposeNode

  function disposeHierarchy(node, callback) {
    for (var i = node.children.length - 1; i >= 0; i--) {
      var child = node.children[i];
      disposeHierarchy(child, callback);
      callback(child);
    }
  }

  return useObserver(() => (
    <>
      <div className="div__flex">
        <p ref={titleRef} className={style.title}>
          <span className={style.span}>{name}</span>, let's help the animals
        </p>
        <p className={style.tagline}>
          Click and hold for 1 second on a place on the earth to help the
          animals
        </p>
      </div>
      <div ref={mount} className="c">
        {" "}
      </div>{" "}
    </>
  ));
});

export default World;
