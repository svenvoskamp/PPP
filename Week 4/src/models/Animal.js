import {decorate, configure} from 'mobx';
import {v4} from 'uuid';

configure({
  enforceActions: 'observed'
});

class Animal {

  constructor({id = v4(), type, scaleX, scaleY, scaleZ, posX, posY, posZ, rotY}) {
    this.id = id;
    this.type = type;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.scaleY = scaleY;
    this.scaleZ = scaleZ;
    this.posX = posX;
    this.posY = posY;
    this.posZ = posZ;
    this.rotY = rotY;
  }
}

decorate(Animal, {
});

export default Animal;
