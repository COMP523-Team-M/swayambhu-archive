import { Upload } from "@/app/dashboard/page";
import PlusSign from "./PlusSign";
import UploadItem from "./UploadItem";

interface Props {
  uploadList: Upload[];
}

export default function UploadList({ uploadList }: Props) {
  return (
    <>
      <div className="flex max-h-max min-h-96 w-80 flex-col rounded-3xl border-2 p-8 shadow-xl">
        <h2 className="mb-4 flex justify-between border-b-2 p-2 text-2xl font-bold">
          <span>Uploads</span>
          <PlusSign />
        </h2>
        {uploadList.map((entry, index) => {
          return <UploadItem item={entry} key={index} />;
        })}
      </div>
    </>
  );
}
