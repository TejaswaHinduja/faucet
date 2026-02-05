import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm,SubmitHandler } from "react-hook-form"


type FormData={
    tokenName:string,
    tokenSymbol:string,
    imageUrl:string,
    initialSupply:Number
}

export function Token(){
    const {register,handleSubmit}=useForm<FormData>();
    const onSubmit:SubmitHandler<FormData>=(data)=>{console.log(data)}


    async function handleTrans(){


    }
    return <div>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Input placeholder="Enter Token name" {...register("tokenName")}/>
        <Input placeholder="Enter Token Symbol" {...register("tokenSymbol")}></Input>
        <Input placeholder="Initial Supply" {...register("imageUrl")}></Input>
        <Input placeholder="Image URL" {...register("initialSupply")}></Input>
        <Button type="submit">Submit </Button>
        </form>
    
        <Button onClick={handleTrans}>Handle Transaction</Button>

    </div>
}