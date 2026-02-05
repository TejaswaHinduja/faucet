import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm,SubmitHandler } from "react-hook-form"
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { MINT_SIZE, TOKEN_2022_PROGRAM_ID, createInitializeMint2Instruction, createMint, getMinimumBalanceForRentExemptMint } from "@solana/spl-token"
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";




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
        const {connection}=useConnection();
        const wallet=useWallet();

        const Lamport=await getMinimumBalanceForRentExemptMint(connection)
        const transaction=new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey:wallet.publicKey

            })
        )

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