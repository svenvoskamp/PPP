import {decorate, observable, action, configure} from 'mobx';
import PinService from "../services/PinService";


configure({
  enforceActions: 'observed'
});

class PinStore {
  constructor(rootStore) {
    this.rootStore = rootStore;
    this.pinService = new PinService(this.rootStore.firebase);
    this.pins = [];
  }

  addPin(pin) {
      this.pins.push(pin);
    }

  getPinById = id => this.pins.find(pin => pin.id === id);

  empty() {
    this.pins = [];
  }

  getPins = async () => {
    this.pinService.getPins(this.onPinChange);
  }

  onPinChange = pin => {
    const result = this.getPinById(pin.id);
    if(result === undefined){
      this.addPin(pin);
    }
  }

  createPin = async pin => {
    await this.pinService.createPin(pin);
    return pin;
  }

}

decorate (PinStore, {
  pins: observable,
  addPin: action,
  empty: action
});

export default PinStore;
