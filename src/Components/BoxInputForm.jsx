import { Button, Label, TextInput } from "flowbite-react";
import { useForm } from "react-hook-form";

export default function BoxInputForm({handleSubmission}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => {
    handleSubmission(data)
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <p className="text-gray-500 text-sm">
        <span className="font-semibold">Note: </span>The width and height shout
        be between 10 to 70 (inclusive) and a multiple of 5
      </p>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="bWidth" value="Enter basket width" />
        </div>
        <TextInput
          {...register("bWidth", {
            required: true,
            pattern: /^(?:[1-6][0-9]|70|10)$/,
            validate: (e) => e % 5 == 0,
          })}
          id="bWidth"
          placeholder="10"
          type="text"
        />
        {errors.bWidth && errors.bWidth.type == "required" && (
          <p className="italic text-sm text-red-500">
          This field is required
          </p>
        )}

        {errors.bWidth && errors.bWidth.type == "pattern" && (
          <p className="italic text-sm text-red-500"> Not a valid number</p>
        )}
        {errors.bWidth && errors.bWidth.type == "validate" && (
          <p className="italic text-sm text-red-500"> Not a multiple of 5</p>
        )}
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="bHeight" value="Enter basket width" />
        </div>
        <TextInput
          {...register("bHeight", {
            required: true,
            pattern: /^(?:[1-6][0-9]|70|10)$/,
            validate: (e) => e % 5 == 0,
          })}
          id="bHeight"
          placeholder="5"
          type="text"
        />
        {errors.bHeight && errors.bHeight.type == "required" && (
          <p className="italic text-sm text-red-500">
            This field is required
          </p>
        )}

        {errors.bHeight && errors.bHeight.type == "pattern" && (
          <p className="italic text-sm text-red-500"> Not a valid number</p>
        )}
        {errors.bHeight && errors.bHeight.type == "validate" && (
          <p className="italic text-sm text-red-500"> Not a multiple of 5</p>
        )}
      </div>

      <Button type="submit">Submit</Button>
    </form>
  );
}
