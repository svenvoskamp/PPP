
import "firebase/firestore";
import {pinConverter} from "../models/Pin";



class PinService {
  constructor(firebase) {
    this.db = firebase.firestore();
  }

  getPins = async onChange => {
    await this.db
    .collection('pins')
    .withConverter(pinConverter)
    .onSnapshot(async snapshot => {
      snapshot.docChanges().forEach(async change => {
        if(change.type === "added") {
          const pinObj = change.doc.data();
          onChange(pinObj);
        }
      })
    })
  }

  createPin = async pin => {
    const pinRef = await this.db.collection("pins").doc();
    await pinRef.withConverter(pinConverter).set(Object.assign({}, pin))
    return pinRef;
  };
}

export default PinService;
