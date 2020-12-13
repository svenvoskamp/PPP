import React, { useRef, useEffect } from "react";

import * as THREE from "three";
import { OBJLoader } from "./OBJLoader.js";
import { MTLLoader } from "./MTLLoader";
import { observer } from "mobx-react-lite";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useStores } from "../../hooks/index";
import { FirstPersonControls } from "./FirstPersonControls.js";
import style from "./pin.module.css";

import { gsap } from "gsap";

const Pin = observer(() => {
  const mount = useRef(null);
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams();
  const { pinStore } = useStores();
  const pin = pinStore.getPinById(id);
  let ambienceElement;
  let ambience;

  if (pin === undefined) {
    history.push("./world");
  } else {
    let pinAnimals = pin.animals;
    let type = pinAnimals[Object.keys(pinAnimals)[0]].type;

    let listener = new THREE.AudioListener();
  if (type === "polarBear") {
    ambienceElement = new Audio("../../assets/audio/winter.wav");
  }
  if (type === "lion") {
    ambienceElement = new Audio("../../assets/audio/sahara.wav");
  }
  if (type === "whale") {
    ambienceElement = new Audio("../../assets/audio/ocean.wav");
  }
  ambienceElement.play();

  ambience = new THREE.Audio(listener);
  ambience.setMediaElementSource(ambienceElement);
  ambience.setLoop(true);
  if (type === "whale") {
    ambience.setVolume(0.03);
    }else {
      ambience.setVolume(0.1);
    }
  ambience.play();



    const sceneRef = useRef(null);
    const pRef = useRef(null);

    const clock = new THREE.Clock();

    let scene,
      camera,
      renderer,
      frameId,
      texture,
      animal,
      skyGeo,
      skyMat,
      floorGeometry,
      floorMat,
      audioLoader,
      animalBuffer,
      moveControls,
      animalBuffer2,
      animalBuffer3;

    let intervals = [];
    let playSounds = [];
    let animals = [];
    let audios = [];


    useEffect(() => {



      const vertex = new THREE.Vector3();
      const color = new THREE.Color();
      let width = mount.current.clientWidth;
      let height = mount.current.clientHeight;
      scene = new THREE.Scene();
      scene.background = new THREE.Color().setHSL(0.6, 0, 1);
      scene.fog = new THREE.Fog(scene.background, 1, 5000);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;
      mount.current.classList.add(`default`);

      camera = new THREE.PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        1,
        5000
      );
      camera.position.y = 200;

      camera.add(listener);

      const hemisphereLight = new THREE.HemisphereLight(
        0xffffff,
        0xffffff,
        0.6
      );
      hemisphereLight.color.setHSL(0.6, 1, 0.6);
      hemisphereLight.groundColor.setHSL(0.095, 1, 0.75);
      hemisphereLight.position.set(0, 50, 0);
      scene.add(hemisphereLight);

      const shadowLight = new THREE.DirectionalLight(0xffffff, 1);
      shadowLight.color.setHSL(0.1, 1, 0.95);
      shadowLight.position.set(-1, 2, 1);
      shadowLight.position.multiplyScalar(30);
      scene.add(shadowLight);

      shadowLight.castShadow = true;

      shadowLight.shadow.mapSize.width = 2048;
      shadowLight.shadow.mapSize.height = 2048;

      const d = 400;

      shadowLight.shadow.camera.left = -d;
      shadowLight.shadow.camera.right = d;
      shadowLight.shadow.camera.top = d;
      shadowLight.shadow.camera.bottom = -d;

      shadowLight.shadow.camera.far = 3500;
      shadowLight.shadow.bias = -0.0001;

      const fragmentShader = `
      uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;

        varying vec3 worldPosition;

        void main() {
          float h = normalize( worldPosition + offset ).y;
          gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 1.0 );
        }`;

      const vertexShader = `varying vec3 worldPosition;

      void main() {

        vec4 mPosition = modelMatrix * vec4( position, 1.0 );

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        worldPosition = mPosition.xyz;

      }
      `;

      const uniforms = {
        topColor: { type: "c", value: new THREE.Color(0x0077ff) },
        bottomColor: { type: "c", value: new THREE.Color(0xffffff) },
        offset: { type: "f", value: 33 },
        exponent: { type: "f", value: 0.6 },
      };
      uniforms.topColor.value.copy(hemisphereLight.color);
      scene.fog.color.copy(uniforms.bottomColor.value);

      skyGeo = new THREE.SphereGeometry(4000, 32, 15);
      skyMat = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        side: THREE.BackSide,
      });

      const sky = new THREE.Mesh(skyGeo, skyMat);
      sky.position.x = 0;
      sky.position.y = 1000;
      sky.position.z = 0;
      scene.add(sky);
      floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
      floorGeometry.rotateX(-Math.PI / 2);
      // vertex displacement

      let position = floorGeometry.attributes.position;

      for (let i = 0, l = position.count; i < l; i++) {
        vertex.fromBufferAttribute(position, i);

        vertex.x += Math.random() * 20 - 10;
        vertex.y += 1;
        vertex.z += Math.random() * 20 - 10;

        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }

      floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

      position = floorGeometry.attributes.position;
      const colorsFloor = [];

      for (let i = 0, l = position.count; i < l; i++) {
        if (type === "polarBear") {
          color.setHSL(
            Math.random() * 0.1 + 0.5,
            0.1,
            Math.random() * 0.25 + 0.75
          );
          colorsFloor.push(color.r, color.g, color.b);
        } else if (type === "whale") {
          color.setHSL(
            Math.random() * 0.1 + 0.5,
            0.75,
            Math.random() * 0.2 + 0.3
          );
          colorsFloor.push(color.r, color.g, color.b);
        } else {
          color.setHSL(
            Math.random() * 0.1 + 0.3,
            0.5,
            Math.random() * 0.05 + 0.15
          );
          colorsFloor.push(color.r, color.g, color.b);
        }
      }

      floorGeometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colorsFloor, 3)
      );

      floorMat = new THREE.MeshPhongMaterial({ vertexColors: true });

      const floor = new THREE.Mesh(floorGeometry, floorMat);
      floor.position.y = 0;
      floor.receiveShadow = true;

      scene.add(floor);

      const loadFox = (type, pinAnimal) => {
        const manager = new THREE.LoadingManager();
        manager.onProgress = function (item, loaded, total) {};

        const mtlLoader = new MTLLoader(manager);
        texture = mtlLoader.load(
          `../../assets/textures/${type}.mtl`,
          function (materials) {
            materials.preload();
            const loader = new OBJLoader(manager);
            loader.setMaterials(materials);
            loader.load(`../../assets/models/${type}.obj`, function (obj) {
              animal = obj;
              animals.push(animal);
              animal.position.y = pinAnimal.posY;
              animal.position.z = pinAnimal.posZ;
              animal.position.x = pinAnimal.posX;
              animal.rotation.y = pinAnimal.rotY;
              animal.castShadow = true;
              animal.children[0].castShadow = true;
              animal.name = type;
              animal.scale.set(
                pinAnimal.scaleX,
                pinAnimal.scaleY,
                pinAnimal.scaleZ
              );

              const animalSound = new THREE.PositionalAudio(listener);
              if (animal.scale.x === 0.3) {

                if (type === "lion") {
                  animalSound.setBuffer(animalBuffer2);

                } else {
                  animalSound.setBuffer(animalBuffer);
                }
                if (type === "polarBear") {
                  animalSound.setVolume(5);
                }
                animalSound.setLoop(false);
                animalSound.setRefDistance(3);
                animalSound.setRolloffFactor(2);
                const randomly = () => Math.random() * 100000;
                const number = randomly();
                playSounds = setInterval(() => {
                  animalSound.play();
                }, Math.random() * number);
                intervals.push(playSounds);
                audios.push(animalSound);
              } else if (animal.scale.x === 0.6) {

                if (type === "polarBear") {
                  animalSound.setBuffer(animalBuffer2);
                } else {
                  animalSound.setBuffer(animalBuffer);

                }
                if (type === "polarBear") {
                  animalSound.setVolume(5);
                }
                animalSound.setLoop(false);
                animalSound.setRefDistance(3);
                animalSound.setRolloffFactor(2);
                const randomly = () => Math.random() * 100000;
                const number = randomly();
                playSounds = setInterval(() => {
                  animalSound.play();
                }, Math.random() * number);
                intervals.push(playSounds);
                audios.push(animalSound);
              } else {

                if (type === "polarBear") {
                  animalSound.setBuffer(animalBuffer3);
                } else {
                  animalSound.setBuffer(animalBuffer);

                }
                if (type === "polarBear") {
                  animalSound.setVolume(5);
                }
                animalSound.setLoop(false);
                animalSound.setRefDistance(3);
                animalSound.setRolloffFactor(2);
                const randomly = () => Math.random() * 100000;
                const number = randomly();
                playSounds = setInterval(() => {
                  animalSound.play();
                }, Math.random() * number);
                intervals.push(playSounds);
                audios.push(animalSound);
              }


              animal.add(animalSound);

              if (scene != undefined) {

                scene.add(animal);
              }
            });
          }
        );
      };

      const loadAnimals = () => {
        const manager = new THREE.LoadingManager();
        audioLoader = new THREE.AudioLoader(manager);
        audioLoader.load(`../../assets/audio/${type}.wav`, (buffer) => {
          animalBuffer = buffer;

        });
        if(type === "lion" || type === "polarBear"){
          audioLoader.load(`../../assets/audio/${type}2.wav`, (buffer) => {
            animalBuffer2 = buffer;
          });
        } if(type === "polarBear"){
        audioLoader.load(`../../assets/audio/${type}3.wav`, (buffer) => {
          animalBuffer3 = buffer;
        });
      }
        manager.onLoad = function ( ) {
          pinAnimals.forEach((pinAnimal) => {
            loadFox(type, pinAnimal);
          });
        };
      };

      loadAnimals();

      const goDown = () => {
        gsap.to(camera.position, {
          duration: 3,
          y: 10,
          onComplete: function () {
            if (mount.current != undefined) {
            moveControls = new FirstPersonControls(camera, renderer.domElement);
            moveControls.movementSpeed = 50;
            moveControls.lookSpeed = 0.03;
            moveControls.heightMax = 0;
            moveControls.lookVertical = false;
            gsap.to(".flex__pin", { opacity: 1, duration: 2 });
            gsap.to(".controls", { opacity: 1, duration: 2 });
            }
          },
        });
      };

      goDown();

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
        if (moveControls != undefined) {
          moveControls.update(clock.getDelta());
        }
        renderScene();
        frameId = window.requestAnimationFrame(animate);
      };

      mount.current.appendChild(renderer.domElement);
      window.addEventListener("resize", handleResize);
      frameId = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener("resize", handleResize);
        mount.current.removeChild(renderer.domElement);
        disposeHierarchy(floor, disposeNode);
        scene.children.forEach((child) => {
          scene.remove(child);
        });
        animals.forEach((animal) => {
          scene.remove(animal);
          disposeHierarchy(animal, disposeNode);
        });


        intervals.forEach((interval) => {
          clearInterval(interval);
        });

        ambience.stop();
        ambienceElement.pause();

        animals = null;
        renderer.renderLists.dispose();
        renderer.dispose();
        renderer = null;
        scene = null;
        camera = null;
        listener = null;
      };
    }, []);

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
            node.material.forEach((material) => {
              if (material.map) material.map.dispose();
              if (material.lightMap) material.lightMap.dispose();
              if (material.bumpMap) material.bumpMap.dispose();
              if (material.normalMap) material.normalMap.dispose();
              if (material.specularMap) material.specularMap.dispose();
              if (material.envMap) material.envMap.dispose();
              if (material.alphaMap) material.alphaMap.dispose();
              if (material.aoMap) material.aoMap.dispose();
              if (material.displacementMap) material.displacementMap.dispose();
              if (material.emissiveMap) material.emissiveMap.dispose();
              if (material.gradientMap) material.gradientMap.dispose();
              if (material.metalnessMap) material.metalnessMap.dispose();
              if (material.roughnessMap) material.roughnessMap.dispose();

              material.dispose(); // disposes any programs associated with the material
            });
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
  }

  const handleBack = (e) => {
    e.preventDefault();
    history.push({
      pathname: `/world`,
      state: {
        name: location.state.name,
      },
    });
  };

  return (
    <>
      <div ref={mount} className="c"></div>
      <button className="button__back" onClick={handleBack}>
        back
      </button>
      <div class = "flex__pin">
      {pin &&
      <p  className={style.title}>
          Welcome to the environment of <span className = {style.span}>{pin.name}</span>
        </p>
      }


      </div>
      <img
        className="controls"
        src="../../assets/images/controls.png"
        alt="controls"
      ></img>
    </>
  );
});

export default Pin;
