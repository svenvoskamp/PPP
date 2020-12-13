import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import style from "./home.module.css";

const Home = () => {
  const history = useHistory();
  const errorRef = useRef(null);
  const [name, setName] = useState("");
  const showWorld = () => {
    if(name !== ""){
    history.push({
      pathname: `/world`,
      state: {
        name: name
      }
    })
    } else {
      errorRef.current.innerHTML = `Please enter a name`;
    }
  };





  return (
    <>
      <div className={style.background}>
        <div className={style.img__flex}>
          <img
            className={style.img}
            src="../../assets/images/logo.png"
            alt="logo"
          ></img>
        </div>
        <div className={style.title__flex}>
          <h1 className={style.title}>Save The Animals</h1>
          <p className={style.tagline}>
            Create sound and bring the animals back to live
          </p>
        </div>
        <div className={style.headphones__flex}>
          <img src="../../assets/images/headphones.svg" alt="headphones"></img>
          <p className={style.headphones__tag}>
            Turn on your headphones for the best experience
          </p>

        </div>
        <div className={style.start__flex}>
          <p className={style.button__tag}>Enter your name:</p>
          <p ref = {errorRef} className={style.error}>
          </p>
          <div className={style.buttons__flex}>

            <input value = {name} onChange={e => setName(e.currentTarget.value)} type="text" className={style.input__name} />
            <button className={style.button__start} onClick={showWorld}>
              Start
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
