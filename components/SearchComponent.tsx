import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {Search} from "lucide-react"
import {Button} from "@/components/ui/button";

const SearchComponent = () => {
  return (
    <div>
      <div className={"flex flex-col gap-7 justify-center items-center h-[100vh]"}>
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          Stocks
        </h1>
        <div className={"flex gap-2 w-1/2"}>
          <InputGroup>
            <InputGroupInput placeholder="Search..."/>
            <InputGroupAddon>
              <Search/>
            </InputGroupAddon>
          </InputGroup>
          <Button >Search</Button>
        </div>
      </div>
    </div>
  );
};

export default SearchComponent;