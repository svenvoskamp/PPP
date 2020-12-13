import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import * as Nexus from "nexusui";
import { useHistory, useLocation } from "react-router-dom";
import { OBJLoader } from "./OBJLoader.js";
import { MTLLoader } from "./MTLLoader";
import { FirstPersonControls } from "./FirstPersonControls.js";
import { useObserver } from "mobx-react-lite";
import Pin from "../../models/Pin.js";
import { SampleLibrary } from "./loader";
import style from "./create.module.css";
import * as Tone from "tone";
import { gsap } from "gsap";
import { useStores } from "../../hooks/index";
import Animal from "../../models/Animal";
import * as firebase from "firebase/app";
import "firebase/storage";

const Create = () => {
  const { pinStore } = useStores();
  const mount = useRef(null);
  const history = useHistory();
  const location = useLocation();
  const animalsRef = useRef(null);
  const bigRef = useRef(null);
  const mediumRef = useRef(null);
  const smallRef = useRef(null);
  const toDatabaseRef = useRef(null);
  const refTagline = useRef(null);
  let startRecord = true;
  let bigCount = 0;
  let smallCount = 0;
  let mediumCount = 0;
  let count = 4;
  const refCounter = useRef(null);

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
    type,
    piano,
    keyboardUI,
    octave,
    keyTones,
    moveControls,
    listener,
    audioLoader,
    animalBuffer,
    animalBuffer2,
    animalBuffer3,
    playSounds,
    recordingURL,
    recording;

  let animals = [];
  let audios = [];
  let intervals = [];
  let canPlay = false;
  let ambience;
  let ambienceElement;
  const clock = new THREE.Clock();
  let recorder = new Tone.Recorder();
  audioLoader = new THREE.AudioLoader();
  if (location.state.type === "sea") {
    type = "whale";
  } else if (
    location.state.type === "northPole" ||
    location.state.type === "southPole"
  ) {
    type = "polarBear";
  } else {
    type = "lion";
  }
  listener = new THREE.AudioListener();
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
    camera.position.y = 10;

    camera.add(listener);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
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

    const d = 1000;

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
      if (
        location.state.type === "northPole" ||
        location.state.type === "southPole"
      ) {
        color.setHSL(
          Math.random() * 0.1 + 0.5,
          0.1,
          Math.random() * 0.25 + 0.75
        );
        colorsFloor.push(color.r, color.g, color.b);
      } else if (location.state.type === "sea") {
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

    const loadAudio = () => {
      audioLoader.load(`../../assets/audio/${type}.wav`, (buffer) => {
        animalBuffer = buffer;
      });
      if (type === "lion" || type === "polarBear") {
        audioLoader.load(`../../assets/audio/${type}2.wav`, (buffer) => {
          animalBuffer2 = buffer;
        });
      }
      if (type === "polarBear") {
        audioLoader.load(`../../assets/audio/${type}3.wav`, (buffer) => {
          animalBuffer3 = buffer;
        });
      }
    };

    loadAudio();

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

  useEffect(() => {
    const samples = SampleLibrary.load({
      instruments: ["piano"],
      baseUrl: "../../assets/samples/",
    });

    octave = 4;

    keyTones = {
      a: 0,
      A: 0,
      w: 1,
      s: 2,
      e: 3,
      d: 4,
      f: 5,
      t: 6,
      g: 7,
      y: 8,
      h: 9,
      u: 10,
      j: 11,
      k: 12,
    };

    const loadFox = (type, note) => {
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
            animal.position.y = 1;
            animal.position.z = Math.floor(Math.random() * -600 - 50);
            animal.rotation.y = Math.floor(Math.random() * 100);
            animal.castShadow = true;
            animal.children[0].castShadow = true;

            let coin;
            if (Math.floor(Math.random() >= 0.5)) {
              coin = `+`;
            } else {
              coin = `-`;
            }
            let sum = coin + 200;
            animal.position.x = Math.floor(Math.random() * sum);
            if (note >= 0 && note <= 36) {
              if (mount.current != undefined) {

                animal.scale.set(1, 1, 1);
              }
            }
            if (note >= 37 && note <= 72) {
              if (mount.current != undefined) {

                animal.scale.set(0.6, 0.6, 0.6);
              }
            }
            if (note >= 73) {
              if (mount.current != undefined) {

                animal.scale.set(0.3, 0.3, 0.3);
              }
            }
            animal.name = type;

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

            if (scene != undefined) {
              animal.add(animalSound);
              scene.add(animal);
            }
          });
        }
      );
    };

    const createAnim = () => {
      if (mount.current != undefined) {
      gsap.to(camera.position, {
        duration: 2,
        y: 200,
        onComplete: function () {
          gsap.to("#keyboard", { opacity: 1, duration: 2 });
          canPlay = true;
          gsap.to(".flex__first", { opacity: 1, duration: 2 });
        },
      });
    }
    };

    const loadPiano = () => {
      if (mount.current != undefined) {
        piano = samples["piano"];
        piano.volume.value = -12;
        piano.release = 0.5;
        piano.toDestination();
        keyboardUI = new Nexus.Piano("keyboard", {
          size: [1300, 250],
          lowNote: 0,
          highNote: 96,
        });

        keyboardUI.on("change", (note) => {
          if (canPlay === true) {
            if (keyboardUI != null) {
              if (mount.current != undefined) {
                if (note.state === true) {
                  if (note.note >= 0 && note.note <= 36) {
                    bigCount = bigCount + 1;
                    bigRef.current.innerHTML = `${bigCount}`;
                  }
                  if (note.note >= 37 && note.note <= 72) {
                    mediumCount = mediumCount + 1;
                    mediumRef.current.innerHTML = `${mediumCount}`;
                  }
                  if (note.note >= 73) {
                    smallCount = smallCount + 1;
                    smallRef.current.innerHTML = `${smallCount}`;
                  }
                  if (startRecord === true) {
                    startRecording();
                  }
                  piano.triggerAttack(
                    Tone.Frequency(note.note, "midi").toNote()
                  );
                  loadFox(type, note.note);
                } else if (note.state === false) {
                  piano.triggerRelease(
                    Tone.Frequency(note.note, "midi").toNote()
                  );
                }
              }
            }
          }
        });

        const stopRecording = async () => {
          if (mount.current != undefined) {
            recording = await recorder.stop();
            recordingURL = URL.createObjectURL(recording);
            gsap.to("#keyboard", { opacity: 0, duration: 2 });
            gsap.to(".flex__first", {
              opacity: 0,
              duration: 2,
              onComplete: function () {
                if (mount.current != undefined) {
                  animalsRef.current.remove();
                  goToScene();
                }
              },
            });
            if (mount.current != undefined) {
              keyboardUI.destroy();
              keyboardUI = null;
            }
          }
        };

        function startRecording() {
          setInterval(function () {
            if (mount.current != undefined) {
              if (count > 0) {
                count = count - 1;
                refCounter.current.innerHTML = `${count}`;
              }
            }
          }, 1000);
          piano.connect(recorder);
          recorder.start();
          startRecord = false;
          setTimeout(stopRecording, 4000);
        }
        document.addEventListener("keydown", (e) => {
          if (keyboardUI != null) {
            const keys = Object.keys(keyTones);
            if (mount.current != undefined) {
              if (
                e.key === 0 ||
                e.key === 1 ||
                e.key === 2 ||
                e.key === 3 ||
                e.key === 4 ||
                e.key === 5 ||
                e.key === 6 ||
                e.key === 7
              ) {
                octave = e.key;
              } else if (keys.includes(e.key)) {
                const amount = octave * 12;
                const keyIndex = keyTones[e.key] + amount;

                if (
                  keyIndex !== undefined &&
                  keyboardUI.keys[keyIndex]._state.state
                ) {
                  keyboardUI.toggleIndex(keyIndex, false);
                } else {
                  keyboardUI.toggleIndex(keyIndex, null);
                }
              }
            }
          }
        });

        document.addEventListener("keyup", (e) => {
          if (keyboardUI != null) {
            const keys = Object.keys(keyTones);
            if (mount.current != undefined) {
              if (
                e.key == 0 ||
                e.key == 1 ||
                e.key == 2 ||
                e.key == 3 ||
                e.key == 4 ||
                e.key == 5 ||
                e.key == 6 ||
                e.key == 7
              ) {
                octave = e.key;
              } else if (keys.includes(e.key)) {
                const amount = octave * 12;
                const keyIndex = keyTones[e.key] + amount;
                if (
                  keyIndex !== undefined &&
                  keyboardUI.keys[keyIndex]._state.state
                ) {
                  keyboardUI.toggleIndex(keyIndex, false);
                } else {
                  keyboardUI.toggleIndex(keyIndex, null);
                }
              }
            }
          }
        });
      }
    };
    Tone.loaded().then(loadPiano).then(createAnim);

    return () => {
      if (keyboardUI != null) {
        keyboardUI.destroy();
      }
      intervals.forEach((interval) => {
        clearInterval(interval);
      });
    };
  }, []);

  const handleBack = (e) => {
    e.preventDefault();
    history.push({
      pathname: `/world`,
      state: {
        name: location.state.name,
      },
    });
  };
  const goToScene = () => {
    gsap.to(camera.position, {
      duration: 2,
      y: 10,
      onComplete: function () {
        if (mount.current != undefined) {
          moveControls = new FirstPersonControls(camera, renderer.domElement);
          moveControls.movementSpeed = 50;
          moveControls.lookSpeed = 0.03;
          moveControls.heightMax = 0;
          moveControls.lookVertical = false;
          toDatabaseRef.current.classList.remove("hidden");
          toDatabaseRef.current.classList.add("button__submit");
          refCounter.current.innerHTML = `Thank you for your sound <span style="color:#FF6541;"> ${location.state.name} </span>`;
          refTagline.current.innerHTML = `You've created <span style="color:#FF6541;">${bigCount} </span> big ${type}s, <span style="color:#FF6541;">${mediumCount} </span> medium ${type}s and <span style="color:#FF6541;">${smallCount}</span> small ${type}s. Take a look in the environment that you've created with your sound!`;
          gsap.to(".flex__first", { opacity: 1, duration: 2 });
          gsap.to(".button__submit", { opacity: 1, duration: 2 });
          gsap.to(".controls", { opacity: 1, duration: 2 });
        }
      },
    });
  };

  const toDatabase = async (e) => {
    e.preventDefault();

 //   let localHost = recordingURL.replace("http://localhost:3000/", "");
 //   let netlify = localHost.replace("https://thirsty-villani-85de29.netlify.app/", "");
    let firebaseURL = recordingURL.replace("https://wwfxdevinexppp.web.app/", "");


    const audioRef = await firebase.storage().ref("audio/" + firebaseURL);
    const pinAudio = audioRef.name;
    await audioRef.put(recording);
    //
    let pinAnimals = [];
    animals.forEach((animal) => {
      const createdAnimal = new Animal({
        type: animal.name,
        scaleX: animal.scale.x,
        scaleY: animal.scale.y,
        scaleZ: animal.scale.z,
        posX: animal.position.x,
        posY: animal.position.y,
        posZ: animal.position.z,
        rotY: animal.rotation.y
      });
      pinAnimals.push(createdAnimal);
    });
    const pinAnim = pinAnimals.map((obj) => {
      return Object.assign({}, obj);
    });
    const pin = new Pin({
      x: location.state.x,
      y: location.state.y,
      z: location.state.z,
      audio: pinAudio,
      animals: pinAnim,
      name: location.state.name,
    });
    await pinStore.createPin(pin);
    moveControls.dispose();
    history.push({
      pathname: "/world",
      state: {
        name: location.state.name,
      },
    });
  };

  return useObserver(() => (
    <>
      <div ref={mount} className="c"></div>
      <button className="button__back" onClick={handleBack}>
        back
      </button>
      <div className="flex__first">
        <p ref={refCounter} className={style.title}>
          Welcome <span className={style.span}>{location.state.name}</span>,
          Save The <span className={style.span}>{type}s</span>
        </p>

        <p ref={refTagline} className={style.tagline}>
          Play the piano for 4 seconds with your mouse or keyboard. Attract
          animals with your sound and send them to a save environment
        </p>
        {type === "polarBear" && (
          <div ref={animalsRef} className={style.animals__flex}>
            <div className={style.animal}>
              <img src="../../assets/images/polarbearbig.png"></img>

              <p ref={bigRef} className={style.animal__count}>
                0
              </p>
            </div>
            <div className={style.animal}>
              <img
                className={style.medium}
                src="../../assets/images/polarbearmedium.png"
              ></img>

              <p ref={mediumRef} className={style.animal__count}>
                0
              </p>
            </div>
            <div className={style.animal}>
              <img
                classNameName={style.small}
                src="../../assets/images/polarbearsmall.png"
              ></img>

              <p ref={smallRef} className={style.animal__count}>
                0
              </p>
            </div>
          </div>
        )}
        {type === "lion" && (
          <div ref={animalsRef} className={style.animals__flex}>
            <div className={style.animal}>
              <img src="../../assets/images/lionbig.png"></img>

              <p ref={bigRef} className={style.animal__count}>
                0
              </p>
            </div>
            <div className={style.animal}>
              <img
                className={style.medium}
                src="../../assets/images/lionmedium.png"
              ></img>

              <p ref={mediumRef} className={style.animal__count}>
                0
              </p>
            </div>
            <div className={style.animal}>
              <img
                className={style.small}
                src="../../assets/images/lionsmall.png"
              ></img>

              <p ref={smallRef} className={style.animal__count}>
                0
              </p>
            </div>
          </div>
        )}
        {type === "whale" && (
          <div ref={animalsRef} className={style.animals__flex}>
            <div class={style.animal}>
              <img src="../../assets/images/whalebig.png"></img>

              <p ref={bigRef} className={style.animal__count}>
                0
              </p>
            </div>
            <div class={style.animal}>
              <img
                className={style.medium}
                src="../../assets/images/whalemedium.png"
              ></img>

              <p ref={mediumRef} className={style.animal__count}>
                0
              </p>
            </div>
            <div class={style.animal}>
              <img
                className={style.small}
                src="../../assets/images/whalesmall.png"
              ></img>
              <p ref={smallRef} className={style.animal__count}>
                0
              </p>
            </div>
          </div>
        )}
      </div>
      <button ref={toDatabaseRef} className="hidden" onClick={toDatabase}>
        Submit scene
      </button>
      <img
        className="controls"
        src="../../assets/images/controls.png"
        alt="controls"
      ></img>
      <div className={style.flex__keyboard}>
        <div id="keyboard"></div>
      </div>
    </>
  ));
};

export default Create;
