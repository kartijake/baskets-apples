import { Button, Modal } from "flowbite-react";
import BoxInputForm from "./BoxInputForm";

export default function ModalSkeleton({
  openModal,
  setOpenModal,
  SubmissionHandler,
  setInstance,

}) {
  const props = { openModal, setOpenModal,setInstance };

  return (
    <>
      <Modal
        show={props.openModal === true}
        position="top-right"
        size="sm"
        onClose={() => {props.setOpenModal(false)
          props.setInstance([])
        }}
      >
        <Modal.Header></Modal.Header>
        <Modal.Body>
          <BoxInputForm handleSubmission={SubmissionHandler} />
        </Modal.Body>
      </Modal>
    </>
  );
}
