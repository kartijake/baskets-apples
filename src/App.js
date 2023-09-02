import React from "react";
import * as THREE from "three";

import { useEffect, useRef, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import ModalSkeleton from "./Components/Modal";
import toast from "react-hot-toast";

const Basket = ({ width, height }, props) => {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({ ...props });
  return new THREE.Mesh(geometry, material);
};

const Apple = ({ radius }, props) => {
  console.log("init");
  const circleGeometry = new THREE.CircleGeometry(radius, 128);
  const circleMaterial = new THREE.MeshBasicMaterial({ ...props });
  return new THREE.Mesh(circleGeometry, circleMaterial);
};

export default function App() {
  const refContainer = useRef(null);
  const [openModal, setOpenModal] = useState(false);
  const [instance, setInstance] = useState([]);
  const [BasketsApple, setBasketsApple] = useState([]);
  const BasketAppleRef = useRef(BasketsApple);
  const [type, setType] = useState("basket");
  const typeRef = useRef(type);
  const [baskets, setBaskets] = useState([]);
  const basketsRef = useRef(baskets);
  const [scene, setScene] = useState(new THREE.Scene());
  let TableSize = { width: 20, height: 20 };
  let AppleRadius=0.5
  const mousePosition = new THREE.Vector2();
  const [raycaster, setRaycaster] = useState(new THREE.Raycaster());
  const rayCasterRef = useRef(raycaster);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer();
  const Table = Basket(TableSize, {
    color: 0xfffffff,
    side: THREE.DoubleSide,
    visible: false,
  });
  Table.rotateX(-Math.PI / 2);
  scene.add(Table);
  const grid = new THREE.GridHelper(TableSize.width, TableSize.height);
  scene.add(grid);

  const Init = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    refContainer && refContainer.current.appendChild(renderer.domElement);
    const orbit = new OrbitControls(camera, renderer.domElement);
    camera.position.set(10, 15, -22);
    orbit.update();
    renderer.setAnimationLoop(setAnimation);
  };

  useEffect(() => {
    Init();
  }, [scene]);

  const setAnimation = () => {
    renderer.render(scene, camera);
  };

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    typeRef.current = type;
    rayCasterRef.current = raycaster;
  }, [type]);

  // useEffect(() => {
  //   rayCasterRef.current = raycaster;
  // }, [type]);

  useEffect(() => {
    basketsRef.current = baskets;
    BasketAppleRef.current = BasketsApple;
  }, [baskets, BasketsApple]);

  useEffect(() => {
    return () => {
      refContainer.current.removeChild(renderer.domElement);
    };
  }, []);
  useEffect(() => {
    if (!openModal) {
      window.addEventListener("mousedown", HandleClick);
    }
    return () => {
      window.removeEventListener("mousedown", HandleClick);
    };
  }, []);

  const HandleClick = (e) => {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    let raycaster = rayCasterRef.current;

    raycaster.setFromCamera(mousePosition, camera);

    const currentBaskets = basketsRef.current;
    let basketsIntersections = raycaster.intersectObjects(currentBaskets);

    if (typeRef.current === "apple" && basketsIntersections.length > 0) {
      addApple(basketsIntersections[0].object);
    }

    if (typeRef.current === "basket") {
      let intersects = raycaster.intersectObject(Table);

      if (basketsIntersections.length > 0) {
        return toast("Already a basket exists");
      }

      if (intersects.length > 0) {
        setOpenModal(true);
        setInstance(intersects[0]);
      }
    }
  };

  const CreateBasket = (data) => {
    const intersect = instance;
    const highlightPos = new THREE.Vector3()
      .copy(intersect.point)
      .floor()
      .addScalar(0.5);

    let w = parseInt(data.bWidth),
      h = parseInt(data.bHeight);

    if (
      highlightPos.x + w / 2 > TableSize.width / 2 ||
      highlightPos.x - w / 2 < -TableSize.width / 2 ||
      highlightPos.z + h / 2 > TableSize.height / 2 ||
      highlightPos.z - h / 2 < -TableSize.height / 2
    ) {
      toast("The select position for the values is out of bounds");
      setOpenModal(false);
      setInstance([]);
      return;
    }
    let newBasket = Basket(
      { width: w, height: h },
      {
        color: 0xff0000,
        side: THREE.DoubleSide,
      }
    );
    newBasket.rotateX(-Math.PI / 2);
    newBasket.position.set(highlightPos.x, 0, highlightPos.z);
    const newBasketBoundingBox = new THREE.Box3().setFromObject(newBasket);
    const collidesWithExistingBasket = baskets.some((existingBasket) =>
      newBasketBoundingBox.intersectsBox(
        new THREE.Box3().setFromObject(existingBasket)
      )
    );

    if (collidesWithExistingBasket) {
      toast("Basket collides with existing basket");
      setOpenModal(false);
      setInstance([]);
      return;
    }

    scene.add(newBasket);
    setBaskets((prevBaskets) => [...prevBaskets, newBasket]);
    setBasketsApple((prevBaskets) => [
      ...prevBaskets,
      {
        geometry: newBasket.geometry,
        position: newBasket.position,
        apples: [],
        offsetX: 0,
        offsetZ: 0,
      },
    ]);
    setOpenModal(false);

    setInstance([]);
  };

  const addApple = (instance) => {
    console.log("clicked");
    let appleRadius = AppleRadius;
    const apple = Apple(
      { radius: appleRadius },
      { color: 0x0000ff, side: THREE.DoubleSide }
    );

    let clickedBasket = instance;
    const basketGeometry = clickedBasket.geometry;

    const basketIndex = BasketAppleRef.current.findIndex(
      (basketData) =>
        basketData.geometry === clickedBasket.geometry &&
        basketData.position.equals(clickedBasket.position)
    );

    if (basketIndex !== -1) {
      let offsetX = BasketAppleRef.current[basketIndex].offsetX;
      let offsetZ = BasketAppleRef.current[basketIndex].offsetZ;

      BasketAppleRef.current[basketIndex].offsetX = offsetX + appleRadius * 2;
      const basketHeight = basketGeometry.parameters.height;
      const basketWidth = basketGeometry.parameters.width;

      if (offsetX + appleRadius * 2 >= basketWidth) {
        if (
          BasketAppleRef.current[basketIndex].offsetZ + appleRadius * 2 >=
          basketHeight
        ) {
          return toast("Basket full");
        }
        BasketAppleRef.current[basketIndex].offsetX = 0;
        BasketAppleRef.current[basketIndex].offsetZ = offsetZ + appleRadius * 2;
      }

      apple.position.set(
        clickedBasket.position.x + basketWidth / 2 - appleRadius - offsetX,
        0.1,
        clickedBasket.position.z + basketHeight / 2 - appleRadius - offsetZ
      );

      apple.rotateX(-Math.PI / 2);
      apple.name = "apple";
      let list = BasketAppleRef.current[basketIndex].apples;
      BasketAppleRef.current[basketIndex].apples = [...list, apple];
      scene.add(apple);
    }
  };

  const sortBasketsByAppleCount = () => {
    // Sort the BasketAppleRef.current array based on apple counts in descending order
    BasketAppleRef.current.sort((basketDataA, basketDataB) => {
      const appleCountA = basketDataA.apples.length;
      const appleCountB = basketDataB.apples.length;

      return appleCountB - appleCountA; // Sort in descending order
    });
  };

  const arrangeBasketsTopLeft = () => {
    const rowSpacing = 1; // Adjust as needed
    const colSpacing = 1; // Adjust as needed

    if (BasketAppleRef.current.length === 0) {
      // Handle the case when there are no baskets
      return;
    }

    const tablePosition = Table.position.clone();
    const tableWidth = TableSize.width;
    const tableHeight = TableSize.height;

    let currentX = tablePosition.x - tableWidth / 2;
    let currentZ = tablePosition.z + tableHeight / 2;
    let rowMaxHeight = 0;

    BasketAppleRef.current.forEach((basketData, index) => {
      const basket = basketData;
      const basketWidth = basket.geometry.parameters.width;
      const basketHeight = basket.geometry.parameters.height;

      if (currentX + basketWidth > tablePosition.x + tableWidth / 2) {
        currentX = tablePosition.x - tableWidth / 2;
        currentZ -= rowMaxHeight + rowSpacing;
        rowMaxHeight = 0;
      }

      basket.position.set(
        -(currentX + basketWidth / 2),
        0,
        currentZ - basketHeight / 2
      );
      currentX += basketWidth + colSpacing;
      //
      rowMaxHeight = Math.max(rowMaxHeight, basketHeight);
    });
  };

  const addApplesToBaskets = () => {
    // Iterate through the sorted list of baskets
    BasketAppleRef.current.forEach((basketData) => {
      const basket = basketData;
      const apples = basketData.apples;

      
      const appleRadius = AppleRadius
      const yOffset = 0.1; 

      let offsetX = 0;
      let offsetZ = 0;
      console.log(basket.geometry.parameters.height);
      let BasketWidth = basket.geometry.parameters.width;
      let BasketHeight = basket.geometry.parameters.height;
      // console.log(basket)
      for (let i = 0; i < apples.length; i++) {
        const apple = apples[i];

        if (offsetX + appleRadius * 2 > BasketWidth) {
          if (offsetZ + appleRadius * 2 >= BasketHeight) {
            return;
          }
          offsetX = 0;
          offsetZ = offsetZ + appleRadius * 2;
        }
        
        apple.position.set(
          basket.position.x + BasketWidth / 2 - appleRadius - offsetX,
          yOffset,
          basket.position.z + BasketHeight / 2 - appleRadius - offsetZ
        );
        scene.add(apple);
        offsetX=offsetX+ (appleRadius*2) 
        // console.log(apple)
        // // Calculate the position of the apple inside the basket
        // const xOffset =
        //   -basket.geometry.parameters.width / 2 + i * (appleRadius * 2); // Adjust spacing as needed

        // // Set the position of the apple inside the basket
        // apple.position.set(
        //   basket.position.x + xOffset + 0.5,
        //   yOffset,
        //   basket.position.z + 2.0
        // );

        // Add the apple to the scene
      }
    });
  };

  // Combine these functions to sort, arrange, and add apples to the baskets
  const sortArrangeAndAddApples = () => {
    sortBasketsByAppleCount();
    arrangeBasketsTopLeft();
    addApplesToBaskets();
  };

  // Call sortArrangeAndAddApples whenever you want to perform these tasks

  // Call drawApplesInsideBaskets to draw apples inside the baskets

  return (
    <div>
      <div ref={refContainer}></div>
      <ModalSkeleton
        SubmissionHandler={CreateBasket}
        openModal={openModal}
        setOpenModal={setOpenModal}
        setInstance={setInstance}
      />
      <div className="fixed h-[80vh] top-0 left-0 bg-white shadow-md px-5"> 

      <button onClick={() => setType("apple")}>add apple</button>
      <button onClick={() => setType("basket")}>add Basket</button>
      <button onClick={() => sortArrangeAndAddApples()}>Sort Baskets</button>
      </div>
    </div>
  );
}
