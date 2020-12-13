import { createContext } from "react";
import RootStore from "../stores";

const stores = new RootStore();

window.store = stores;

export const storesContext = createContext(stores);

