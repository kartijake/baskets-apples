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
  const [baskets, setBaskets] = useState([]);
  const basketsRef = useRef(baskets);
  const [scene, setScene] = useState(new THREE.Scene());
  let TableSize = { width: 20, height: 20 };
  let AppleRadius = 0.5;
  
  // const [raycaster, setRaycaster] = useState(new THREE.Raycaster());
  // const rayCasterRef = useRef(raycaster);
  const [drag, setDrag] = useState("");
  const draggedRef = useRef(drag);
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
    // rayCasterRef.current = raycaster;
    basketsRef.current = baskets;
    BasketAppleRef.current = BasketsApple;
  }, [baskets, BasketsApple]);

  useEffect(() => {
    return () => {
      refContainer.current.removeChild(renderer.domElement);
    };
  }, []);

  // useEffect(() => {
  //   if (!openModal) {
  //     window.addEventListener("mousedown", HandleClick);
  //   }
  //   return () => {
  //     window.removeEventListener("mousedown", HandleClick);
  //   };
  // }, []);

  const HandleClick = (clientX, clientY, draggedData) => {
    const mousePosition = new THREE.Vector2();
    mousePosition.x = (clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(clientY / window.innerHeight) * 2 + 1;
    let raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(mousePosition, camera);

    const currentBaskets = basketsRef.current;
    console.log(mousePosition.x,mousePosition.y)
    let basketsIntersections = raycaster.intersectObjects(currentBaskets);
    if (draggedData === "apple" && basketsIntersections.length > 0) {
      addApple(basketsIntersections[0].object);
    }

    if (draggedData === "basket") {
      let intersects = raycaster.intersectObject(Table);
      console.log(intersects)
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
    console.log(instance)
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
    console.log(highlightPos)
    newBasket.rotateX(-Math.PI / 2);
    newBasket.position.set(highlightPos.x, 0.1, highlightPos.z);
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
    console.log("clicked",instance);
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
        0.2,
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
        0.1,
        currentZ - basketHeight / 2
      );
      currentX += basketWidth + colSpacing;
      //
      rowMaxHeight = Math.max(rowMaxHeight, basketHeight);
    });
  };

  const addApplesToBaskets = () => {
    BasketAppleRef.current.forEach((basketData) => {
      const basket = basketData;
      const apples = basketData.apples;

      const appleRadius = AppleRadius;
      const yOffset = 0.2;

      let offsetX = 0;
      let offsetZ = 0;
      console.log(basket.geometry.parameters.height);
      let BasketWidth = basket.geometry.parameters.width;
      let BasketHeight = basket.geometry.parameters.height;
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
        offsetX = offsetX + appleRadius * 2;
      }
    });
  };

  const sortArrangeAndAddApples = () => {
    sortBasketsByAppleCount();
    arrangeBasketsTopLeft();
    addApplesToBaskets();
  };

  // useEffect(() => {
  //   const target = document.getElementById("droptarget");

  //   target.addEventListener("dragover", (event) => {
  //     event.preventDefault();
  //   });

  //   target.addEventListener("drop", (event) => {
  //     event.preventDefault();
  //     console.log(event)
  //       // HandleClick(event);
  //   });
  // }, []);

  useEffect(() => {
    // Get a reference to your drop target element
    const dropTarget = document.getElementById("droptarget");

    // Add an event listener for the dragover event
    const handleDragOver = (e) => {
      e.preventDefault();
      // Add your custom styling or visual feedback
    };
    dropTarget.addEventListener("dragover", handleDragOver);

    // Add an event listener for the drop event
    const handleDrop = (e) => {
      e.preventDefault();
      const draggedData = e.dataTransfer.getData("text/plain");
      const clientX = e.clientX;
      const clientY = e.clientY;
      HandleClick(clientX, clientY, draggedData);
      // Add your custom logic or feedback
    };
    dropTarget.addEventListener("drop", handleDrop);

    // Clean up the event listeners when the component unmounts
    return () => {
      dropTarget.removeEventListener("dragover", handleDragOver);
      dropTarget.removeEventListener("drop", handleDrop);
    };
  }, [])
  return (
    <div>
      <div
        id="droptarget"
        // onDrop={(e) => {
        //   e.preventDefault();
        //   const draggedData = e.dataTransfer.getData("text/plain"); // Get the drag data
        //   console.log("Dropped data:", draggedData);
        //   console.log("Dropped data:", e.clientX);
        //   HandleClick(e.clientX, e.clientY, draggedData);
        // }}
        // onDragOver={(e) => {
        //   e.preventDefault();
        // }}
        ref={refContainer}
      ></div>
      <ModalSkeleton
        SubmissionHandler={CreateBasket}
        openModal={openModal}
        setOpenModal={setOpenModal}
        setInstance={setInstance}
      />
      <div className="fixed h-[80vh] top-10 left-5 rounded-md bg-white shadow-md px-5">
      
          <div>
        <div
          draggable="true"
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "basket"); // Set the drag data
          }}
          className="w-14 h-14 bg-red-600"
        > 
                 
        </div>
            <span className="text-gray-700 text-sm"> Drag Drop to add Basket</span>
          </div>
        <div
          draggable="true"
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "apple"); // Set the drag data
          }}
          className="w-7 h-7 rounded-full bg-blue-600"
        >
        </div>

  <button type="button" onClick={() => sortArrangeAndAddApples()} className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Sort Baskets</button>
      </div>
    </div>
  );
}
