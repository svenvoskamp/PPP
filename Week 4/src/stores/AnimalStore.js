import {decorate, observable, configure} from 'mobx';


configure({
  enforceActions: 'observed'
});

class AnimalStore {
  constructor(rootStore) {
    this.rootStore = rootStore;
    this.animals = [];
  }

  getAnimalsByPinId(animals, pinId){
    const currentAnimals = animals.find(animal => animal.pindId = pinId);
    return currentAnimals;
  }

}

decorate (AnimalStore, {
  activities: observable
});

export default AnimalStore;
