import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <div className="container mx-auto p-4">
      <ReactSwagger spec={spec as Record<string, unknown>} />
    </div>
  );
}
