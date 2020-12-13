import {decorate, configure } from "mobx";
import { v4 } from "uuid";

configure({
  enforceActions: "observed",
});

class Pin {
  constructor({ id = v4(), x, y, z, audio, animals = [], name }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.z = z;
    //  this.name = name;
    this.audio = audio;
    this.animals = animals;
    this.name = name;
  }

  linkAnimal(animal) {
    this.animals.includes(animal) && this.animals.push(animal);
  }
}

decorate(Pin, {});

const pinConverter = {
  toFirestore: function (pin) {
    return {
      x: pin.x,
      y: pin.y,
      z: pin.z,
      //    name: pin.name,
      audio: pin.audio,
      animals: pin.animals,
      name: pin.name
    };
  },
  fromFirestore: function (snapshot, options) {
    const data = snapshot.data(options);
    return new Pin({
      id: snapshot.id,
      x: data.x,
      y: data.y,
      z: data.z,
      //     name: data.name,
      audio: data.audio,
      animals: data.animals,
      name: data.name
    });
  },
};
export { pinConverter };
export default Pin;
